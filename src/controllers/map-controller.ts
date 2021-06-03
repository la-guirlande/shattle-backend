import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

/**
 * Maps controller class.
 * 
 * Root path : `/maps`
 */
export default class MapController extends Controller {

  /**
   * Creates a new maps controller.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container, '/maps');
    this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
    this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
  }

  /**
   * Lists all maps.
   * 
   * Path : `GET /maps`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listHandler(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).send({ maps: await this.db.maps.find() });
    } catch (err) {
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Gets a specific map.
   * 
   * Path : `GET /maps/:id`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async getHandler(req: Request, res: Response): Promise<Response> {
    try {
      const map = await this.db.maps.findById(req.params.id);
      if (map == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Map not found'
        }));
      }
      return res.status(200).send({ map });
    } catch (err) {
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Creates a map.
   * 
   * Path : `POST /maps`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async createHandler(req: Request, res: Response): Promise<Response> {
    try {
      const map = await this.db.maps.create(req.body);
      return res.status(201).send({ id: map.id });
    } catch (err) {
      this.logger.error(err);
      if (err.name === 'ValidationError') {
        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
      }
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }
}
