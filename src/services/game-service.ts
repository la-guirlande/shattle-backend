import { Game } from '../logic/game';
import { Player } from '../logic/player';
import { GameInstance } from '../models/game-model';
import { UserInstance } from '../models/user-model';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Game service class.
 * 
 * This service manages Shattle games.
 */
export default class GameService extends Service {

  public readonly games: Game[];

  /**
   * Creates a new game service.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container);
    this.games = [];
  }

  /**
   * Creates a new game.
   * 
   * @param model Game model
   * @param user User who creates the game
   * @returns Created game
   */
  public createGame(model: GameInstance, user: UserInstance): Game {
    const game = new Game(this.container, model, new Player(user));
    this.games.push(game);
    return game;
  }
}
