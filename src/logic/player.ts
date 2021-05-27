import { UserInstance } from '../models/user-model';
import { Entity } from './entity';

/**
 * Player class.
 * 
 * A player is an entity managed by an user.
 */
export class Player extends Entity {

  public readonly id: string;
  private readonly model: UserInstance;

  /**
   * Creates a new player.
   * 
   * @param model User model
   */
  public constructor(model: UserInstance) {
    super();
    this.id = model.id;
    this.model = model;
  }
}
