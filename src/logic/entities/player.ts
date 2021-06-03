import { UserInstance } from '../../models/user-model';
import { Entity } from './entity';
import { Storable } from '../storable';

/**
 * Player class.
 * 
 * A player is an entity managed by an user.
 */
export class Player extends Entity implements Storable {

  private readonly model: UserInstance;

  /**
   * Creates a new player.
   * 
   * @param model User model
   */
  public constructor(model: UserInstance) {
    super(model.id);
    this.model = model;
  }

  public async save(): Promise<void> {
    await this.model.save();
  }
}
