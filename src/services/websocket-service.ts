import { Server, Socket } from 'socket.io';
import { Player } from '../logic/player';
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

      socket.on(Event.JOIN, async ({ code, userId }: JoinClientToServerEvent) => {
        const game = this.container.game.games.find(game => game.code === code);
        if (game == null) {
          socket.emit(Event.ERROR, {
            error: Error.GAME_NOT_FOUND,
            description: `Game not found with code ${code}`
          } as ErrorServerToClientEvent);
        }
        const user = await this.db.users.findById(userId);
        if (user == null) {
          socket.emit(Event.ERROR, {
            error: Error.USER_NOT_FOUND,
            description: `User not found with id ${userId}`
          } as ErrorServerToClientEvent);
        }
        if (!game.players.map(player => player.id).includes(userId, 1)) {
          game.players.push(new Player(user));
        }
        socket.emit(Event.JOIN, { gameId: game.id } as JoinServerToClientEvent);
      });
    });
  }
}

/**
 * Websocket events enum.
 */
enum Event {
  JOIN = 'join',
  ERROR = 'error'
}

/**
 * Websocket errors enum.
 */
enum Error {
  GAME_NOT_FOUND = 0,
  USER_NOT_FOUND = 0
}

/**
 * Event when player is joining a game.
 */
interface JoinClientToServerEvent {
  code: string;
  userId: string;
}

/**
 * Event when server accepts joining game.
 */
interface JoinServerToClientEvent {
  gameId: string;
}

/**
 * Event when an error occurs.
 */
interface ErrorServerToClientEvent {
  error: Error;
  description?: string;
}
