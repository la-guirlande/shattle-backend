import { Request, Response } from 'express';
import _ from 'lodash';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

/**
 * Games controller class.
 * 
 * Root path : `/games`
 */
export default class GameController extends Controller {

  /**
   * Creates a new games controller.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container, '/games');
    this.registerEndpoint({ method: 'GET', uri: '/', handlers: this.listHandler });
    this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: this.getHandler });
    this.registerEndpoint({ method: 'POST', uri: '/', handlers: this.createHandler });
  }

  /**
   * Lists all games.
   * 
   * Path : `GET /games`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async listHandler(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).send({ games: await this.db.games.find() });
    } catch (err) {
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Gets a specific game.
   * 
   * Path : `GET /games/:id`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async getHandler(req: Request, res: Response): Promise<Response> {
    try {
      const game = await this.db.games.findById(req.params.id).populate('map').populate('players');
      if (game == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Game not found'
        }));
      }
      return res.status(200).send({ game });
    } catch (err) {
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }

  /**
   * Creates a new game.
   * 
   * Path : `POST /games`
   * 
   * @param req Express request
   * @param res Express response
   * @async
   */
  public async createHandler(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.db.users.findById(req.body.player);
      if (user == null) {
        return res.status(404).send(this.container.errors.formatErrors({
          error: 'not_found',
          error_description: 'Player not found'
        }));
      }
      const map = await this.db.maps.findOne().skip(_.random(0, await this.db.maps.countDocuments() - 1, false));
      const game = await this.db.games.create({ players: [user], map });
      this.container.game.createGame(game, map, user);
      return res.status(201).send({ id: game.id, code: game.code });
    } catch (err) {
      this.logger.error(err);
      if (err.name === 'ValidationError') {
        return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
      }
      return res.status(500).send(this.container.errors.formatServerError());
    }
  }
}
