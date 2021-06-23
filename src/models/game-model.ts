import mongooseToJson from '@meanie/mongoose-to-json';
import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import { CharacterInstance } from './character-model';
import { MapInstance } from './map-model';
import Attributes from './model';
import { UserInstance } from './user-model';

/**
 * Game attributes.
 */
export interface GameAttributes extends Attributes {
  status?: Status;
  code?: string;
  map: MapInstance;
  players?: Player[];
  author?: Player;
  currentPlayer?: Player;
  history?: History[];
}

/**
 * Game instance.
 */
export interface GameInstance extends GameAttributes, Document {
  getPlayer: (user: UserInstance | string) => Player;
  addPlayer: (user: UserInstance) => Promise<void>;
}

/**
 * Game status enum.
 */
export enum Status {
  WAITING = 0,
  IN_PROGRESS = 1,
  FINISHED = 2
}

/**
 * Player.
 */
export interface Player {
  user: UserInstance;
  character: CharacterInstance;
}

/**
 * Game history.
 */
export interface History {
  player: Player;
  actions: Action[];
}

/**
 * Game history action.
 */
export interface Action {
  type: ActionType;
  to?: number;
  spell?: Spell;
  direction?: Direction;
}

/**
 * Action type.
 */
export enum ActionType {
  MOVE = 0,
  SPELL = 1
}

/**
 * Spell.
 */
export enum Spell {
  BASIC = 0
}

/**
 * Direction.
 */
export enum Direction {
  SELF = 0,
  NORTH = 1,
  EAST = 2,
  SOUTH = 3,
  WEST = 4
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
    map: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
      required: [true, 'Map is required']
    },
    players: {
      type: [{
        type: createPlayerSchema()
      }],
      validate: {
        validator: (players: Player[]) => players.length <= 5,
        message: 'Too many players (> 5)'
      }
    },
    history: {
      type: [{
        type: createHistorySchema()
      }]
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  schema.virtual('author').get(function(this: GameInstance) {
    return this.players[0];
  });
  schema.virtual('currentPlayer').get(function(this: GameInstance) {
    if (this.history.length === 0) {
      return this.players[0];
    }
    const lastPlayer = this.history[this.history.length - 1].player;
    const lastPlayerIndex = this.players.map(player => player.user.id).indexOf(lastPlayer.user.id);
    if (lastPlayer.user.id === this.players[this.players.length - 1].user.id) {
      return this.players[0];
    }
    return this.players[lastPlayerIndex + 1];
  });
  schema.method('getPlayer', function(this: GameInstance, user: UserInstance | string) {
    if (typeof user !== 'string') {
      user = user.id;
    }
    return this.players.find(player => player.user.id === user);
  });
  schema.method('addPlayer', async function(this: GameInstance, user: UserInstance) {
    this.players.push({
      user, character: await container.db.characters.findOne()
    });
    await this.save();
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

/**
 * Creates the game player subschema.
 * 
 * @param container Services container
 * @returns Game player subschema
 */
 function createPlayerSchema() {
  const schema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    character: {
      type: Schema.Types.ObjectId,
      ref: 'Character'
    }
  }, {
    _id: false,
    id: false,
    timestamps: false
  });
  return schema;
}

/**
 * Creates the game history subschema.
 * 
 * @param container Services container
 * @returns Game history subschema
 */
function createHistorySchema() {
  const schema = new Schema({
    player: {
      type: createPlayerSchema()
    },
    actions: {
      type: [{
        type: createActionSchema()
      }]
    }
  }, {
    timestamps: false
  });
  return schema;
}

/**
 * Creates the game history action subschema.
 * 
 * @param container Services container
 * @returns Game history action subschema
 */
function createActionSchema() {
  const schema = new Schema({
    type: {
      type: Schema.Types.Number,
      enum: [ActionType.MOVE, ActionType.SPELL],
      required: [true, 'Action type is required']
    },
    to: {
      type: Schema.Types.Number,
      default: null
    },
    spell: {
      type: Schema.Types.Number,
      enum: [Spell.BASIC],
      default: null
    },
    direction: {
      type: Schema.Types.Number,
      enum: [Direction.SELF, Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST],
      default: null
    }
  }, {
    timestamps: false
  });
  return schema;
}
