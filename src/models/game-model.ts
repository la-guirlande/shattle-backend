import mongooseToJson from '@meanie/mongoose-to-json';
import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
import { UserInstance } from './user-model';

/**
 * Game attributes.
 */
export interface GameAttributes extends Attributes {
  status?: Status;
  code?: string;
  players: UserInstance[];
}

/**
 * Game instance.
 */
export interface GameInstance extends GameAttributes, Document {}

/**
 * Game status enum.
 */
export enum Status {
  WAITING = 0,
  IN_PROGRESS = 1,
  FINISHED = 2
}

/**
 * Creates the game model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<GameInstance> {
  return mongoose.model<GameInstance>('Game', createGameSchema(container), 'games');
}

/**
 * Creates the game schema.
 * 
 * @param container Services container
 * @returns Game schema
 */
function createGameSchema(container: ServiceContainer) {
  const schema = new Schema({
    status: {
      type: Schema.Types.Number,
      enum: [Status.WAITING, Status.IN_PROGRESS, Status.FINISHED],
      default: Status.WAITING
    },
    code: {
      type: Schema.Types.String,
      default: null
    },
    players: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      validate: {
        validator: (players: UserInstance[]) => players.length <= 5,
        message: 'Too many players (> 5)'
      }
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  schema.pre('save', async function(this: GameInstance, next) {
    if (this.isNew) {
      try {
        const usedCodes = (await container.db.games.find().where('code').ne(null)).map(game => game.code);
        let code: string;
        do {
          code = container.crypto.generateRandomNumeric(6);
        } while (usedCodes.includes(code));
        this.code = code;
      } catch (err) {
        return next(err);
      }
    }
    return next();
  });
  schema.plugin(mongooseToJson);
  return schema;
}
