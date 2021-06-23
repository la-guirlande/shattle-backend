import _ from 'lodash';
import { Server, Socket } from 'socket.io';
import { Action, ActionType, History, Status } from '../models/game-model';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Websocket service class.
 * 
 * This service is used to manage the websocket server.
 */
export default class WebsocketService extends Service {

  private srv: Server;

  /**
   * Creates a new websocket service.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container);
    this.srv = null;
  }

  /**
   * Starts the websocket server.
   * 
   * @param port Listening port
   */
  public start(port: number = 8000): void {
    if (!this.srv) {
      this.srv = new Server(port, {
          pingInterval: 60000,
          pingTimeout: 600000,
          cors: {
            origin: '*'
          }
      });
      this.createEvents();
    }
  }

  /**
   * Stops the websocket server.
   */
  public stop(): void {
    if (this.srv) {
      this.srv.close();
      this.srv = null;
    }
  }

  /**
   * Creates events.
   */
  private createEvents(): void {
    this.srv.on('connect', (socket: Socket) => {
      this.logger.info(`Websocket connected : ${socket.handshake.address}`);

      // When the socket disconnects
      socket.on('disconnect', () => {
          socket.rooms.forEach(socket.leave);
          this.logger.info(`Websocket disconnected : ${socket.handshake.address}`);
      });

      socket.on(Event.GAME_JOIN, async ({ code, accessToken }: GameJoinClientToServerEvent) => {
        try {
          const user = await this.container.auth.authenticate(accessToken);
          if (user == null) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: 'User not found'
            } as ErrorServerToClientEvent);
          }
          const game = await this.db.games.findOne({ code }).populate('map').populate('players.user').populate('players.character');
          if (game == null) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: `Game not found with code ${code}`
            } as ErrorServerToClientEvent);
          }
          if (!game.players.map(player => player.user.id).includes(user.id)) {
            await game.addPlayer(user);
          }
          socket.join(game.id);
          return this.srv.to(game.id).emit(Event.GAME_JOIN, { gameId: game.id, userId: user.id } as GameJoinServerToClientEvent);
        } catch (err) {
          return socket.emit(Event.ERROR, {
            error: Error.SERVER_ERROR,
            description: err
          } as ErrorServerToClientEvent);
        }
      });

      socket.on(Event.GAME_START, async ({ userId, gameId }: GameStartClientToServerEvent) => {
        try {
          if (!socket.rooms.has(gameId)) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: 'You are not playing in this game'
            } as ErrorServerToClientEvent);
          }
          const user = await this.db.users.findById(userId);
          if (user == null) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: 'User not found'
            } as ErrorServerToClientEvent);
          }
          const game = await this.db.games.findById(gameId).populate('map').populate('history.');
          if (game == null) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: 'Game not found'
            } as ErrorServerToClientEvent);
          }
          for (const player of game.players) {
            game.history.push({
              player,
              actions: [{
                type: ActionType.MOVE,
                to: game.map.mapTiles[_.random(0, game.map.mapTiles.length - 1)]
              }]
            });
          }
          game.status = Status.IN_PROGRESS;
          game.markModified('history');
          game.markModified('history.actions');
          await game.save();
          return this.srv.to(gameId).emit(Event.GAME_START, { gameId } as GameStartServerToClientEvent); // TODO Starts the game
        } catch (err) {
          this.logger.error('Error on websocket event', Event.GAME_START, ':', err);
          return socket.emit(Event.ERROR, {
            error: Error.SERVER_ERROR,
            description: err
          } as ErrorServerToClientEvent);
        }
      });

      socket.on(Event.PLAYER_ROUND, async ({ userId, gameId, actions }: PlayerRoundClientToServerEvent) => {
        try {
          if (!socket.rooms.has(gameId)) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: 'You are not playing in this game'
            } as ErrorServerToClientEvent);
          }
          const user = await this.db.users.findById(userId);
          if (user == null) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: 'User not found'
            } as ErrorServerToClientEvent);
          }
          const game = await this.db.games.findById(gameId).populate('history').populate('history.actions');
          if (game == null) {
            return socket.emit(Event.ERROR, {
              error: Error.SERVER_ERROR,
              description: 'Game not found'
            } as ErrorServerToClientEvent);
          }
          const history = { player: game.getPlayer(user), actions };
          game.history.push(history);
          await game.save();
          this.srv.to(gameId).emit(Event.PLAYER_ROUND, { history } as PlayerRoundServerToClientEvent);
        } catch (err) {
          return socket.emit(Event.ERROR, {
            error: Error.SERVER_ERROR,
            description: err
          } as ErrorServerToClientEvent);
        }
      });
    });
  }
}

/**
 * Websocket events enum.
 */
enum Event {
  GAME_JOIN = 'game.join',
  GAME_START = 'game.start',
  PLAYER_ROUND = 'player.action',
  ERROR = 'error'
}

/**
 * Websocket errors enum.
 */
// TODO Fill and use this enum
enum Error {
  SERVER_ERROR = 0,
  GAME_NOT_FOUND = 1,
  USER_NOT_FOUND = 2
}

/**
 * Event when player is joining a game.
 */
interface GameJoinClientToServerEvent {
  accessToken: string;
  code: string;
}

/**
 * Event when server accepts joining game.
 */
interface GameJoinServerToClientEvent {
  gameId: string;
  userId: string;
}

/**
 * Event when player is starting game.
 */
interface GameStartClientToServerEvent {
  userId: string;
  gameId: string;
}

/**
 * Event when server starts game.
 */
interface GameStartServerToClientEvent {
  gameId: string;
}

/**
 * Event when player is making a round.
 */
interface PlayerRoundClientToServerEvent {
  userId: string;
  gameId: string;
  actions: Action[];
}

/**
 * Event when a round is valid.
 */
interface PlayerRoundServerToClientEvent {
  history: History;
}

/**
 * Event when an error occurs.
 */
interface ErrorServerToClientEvent {
  error: Error;
  description?: string;
}
