import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';

/**
 * Characters controller class.
 * 
 * Root path : `/characters`
 */
export default class CharacterController extends Controller {

  /**
   * Creates a new characters controller.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container, '/characters');
    this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
    this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
  }

  /**
   * Lists all characters.
   * 
   * Path : `GET /characters`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listHandler(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).send({ characters: await this.db.characters.find() });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Gets a specific user.
   * 
   * Path : `GET /characters/:id`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async getHandler(req: Request, res: Response): Promise<Response> {
    try {
      const character = await this.db.characters.findById(req.params.id);
      if (character == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Character not found'
        }));
      }
      return res.status(200).send({ character });
    } catch (err) {
      this.logger.error(err);
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Creates a new character.
   * 
   * Path : `POST /characters`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async createHandler(req: Request, res: Response): Promise<Response> {
    try {
      const character = await this.db.characters.create({
        name: req.body.name,
        img: req.body.img
      });
      res.setHeader('Location', `${req.protocol}://${req.get('host')}${this.rootUri}/${character.id}`);
      return res.status(201).send({
        id: character.id,
        links: [{
          rel: 'Gets the created characters',
          action: 'GET',
          href: `${req.protocol}://${req.get('host')}${this.rootUri}/${character.id}`
        }] as Link[]
      });
    } catch (err) {
      this.logger.error(err);
      if (err.name === 'ValidationError') {
        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
      }
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }
}
