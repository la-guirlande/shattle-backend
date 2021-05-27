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
  return mongoose.model<GameInstance>('Game', createGameSchema(), 'games');
}

/**
 * Creates the game schema.
 * 
 * @param container Services container
 * @returns Game schema
 */
function createGameSchema() {
  const schema = new Schema({
    status: {
      type: Schema.Types.Number,
      enum: [Status.WAITING, Status.IN_PROGRESS, Status.FINISHED],
      default: Status.WAITING
    },
    players: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      validate: {
        validator: (players: UserInstance[]) => players.length >= 2 && players.length <= 5,
        message: 'Player count must be between 2 and 5'
      }
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  schema.plugin(mongooseToJson);
  return schema;
}
