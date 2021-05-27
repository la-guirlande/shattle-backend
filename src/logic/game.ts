import Component from '../component';
import { GameInstance, Status } from '../models/game-model';
import ServiceContainer from '../services/service-container';
import { Player } from './player';

/**
 * Game class.
 * 
 * This class is the base of Shattle games.
 */
export class Game extends Component {

  public readonly id: string;
  public readonly code: string;
  public readonly players: Player[];
  private readonly model: GameInstance;

  /**
   * Creates a new game.
   * 
   * @param container Services container
   * @param model Game model
   * @param players Players
   */
  public constructor(container: ServiceContainer, model: GameInstance, ...players: Player[]) {
    super(container);
    this.id = model.id;
    this.code = model.code;
    this.model = model;
    this.players = players;
  }

  /**
   * Starts the game.
   */
  public async start(): Promise<void> {
    this.model.status = Status.IN_PROGRESS;
    await this.model.save();
  }

  /**
   * Stops the game.
   */
  public async stop(): Promise<void> {
    this.model.status = Status.FINISHED;
    await this.model.save();
  }

  /**
   * Sets the next round.
   */
  public next(): void {}
}
