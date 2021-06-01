import Component from '../../component';
import { GameInstance, Status } from '../../models/game-model';
import ServiceContainer from '../../services/service-container';
import { Player } from '../entities/player';
import { Map } from '../maps/map';
import { Storable } from '../storable';

/**
 * Game class.
 * 
 * This class is the base of Shattle games.
 */
export class Game extends Component implements Storable {

  public readonly players: Player[];
  public readonly map: Map;
  private readonly model: GameInstance;

  /**
   * Creates a new game.
   * 
   * @param container Services container
   * @param model Game model
   * @param map Map
   * @param players Players
   */
  public constructor(container: ServiceContainer, model: GameInstance, map: Map, ...players: Player[]) {
    super(container);
    this.model = model;
    this.map = map;
    this.players = players;
  }

  /**
   * Starts the game.
   */
  public start(): void {
    this.model.status = Status.IN_PROGRESS;
  }

  /**
   * Stops the game.
   */
  public stop(): void {
    this.model.status = Status.FINISHED;
  }

  /**
   * Sets the next round.
   */
  public next(): void {}

  public async save(): Promise<void> {
    await this.model.save();
  }

  public get id(): string {
    return this.model.id;
  }

  public get code(): string {
    return this.model.code;
  }
}
