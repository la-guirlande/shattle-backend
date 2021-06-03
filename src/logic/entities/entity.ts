import ServiceContainer from '../../services/service-container';

/**
 * Entity class.
 */
export class Entity {

  public readonly id: string;

  /**
   * Creates a new entity.
   */
  public constructor(id: string = ServiceContainer.getInstance().crypto.generateRandomString(32)) {
    this.id = id;
  }
}
