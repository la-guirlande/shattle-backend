// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongooseToJson = require('@meanie/mongoose-to-json');
import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

/**
 * Map attributes.
 */
export interface MapAttributes extends Attributes {
  name: string;
  config: ConfigAttributes;
  tilesets: TilesetAttributes[];
  maxPlayers: number;
  mapTiles: TileAttributes[];
  tilesetTiles: TileAttributes[];
}

/**
 * Map instance.
 */
export interface MapInstance extends MapAttributes, Document {}

/**
 * Map configuration attributes.
 */
export interface ConfigAttributes {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: ConfigLayerAttributes[];
  tilesets: ConfigTilesetAttributes[];
}

/**
 * Map tilesets attributes.
 */
export interface TilesetAttributes {
  name: string;
  data: string;
}

/**
 * Tile attributes.
 */
export interface TileAttributes {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Map configuration layer attributes.
 */
export interface ConfigLayerAttributes {
  name: string;
  type: 'tilelayer' | 'objectgroup';
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity: number;
  visible: boolean;
  data?: number[];
  objects?: GameObjectAttributes[];
}

/**
 * Map configuration tileset attributes.
 */
export interface ConfigTilesetAttributes {
  name: string;
  columns: number;
  firstgid: number;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  margin: number;
  spacing: number;
}

/**
 * Map configuration layer game object attributes.
 */
export interface GameObjectAttributes {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  point: boolean;
}

/**
 * Creates the map model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<MapInstance> {
  return mongoose.model<MapInstance>('Map', createMapSchema(), 'maps');
}

/**
 * Creates the map schema.
 * 
 * @param container Services container
 * @returns Map schema
 */
function createMapSchema() {
  const schema = new Schema({
    name: {
      type: Schema.Types.String,
      required: [true, 'Map name is required']
    },
    config: {
      type: createConfigSubschema(),
      required: [true, 'Map configuration is required']
    },
    tilesets: {
      type: [{
        type: createTilesetSubschema()
      }],
      validate: {
        validator: (tilesets: TilesetAttributes[]) => tilesets.length > 0,
        message: 'Map tilesets are required'
      }
    },
    maxPlayers: {
      type: Schema.Types.Number,
      required: [true, 'Max players is required'],
      min: [2, 'Max players must be >= 2'],
      max: [2, 'Max players must be <= 5']
    }
  }, {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  schema.virtual('mapTiles').get(function(this: MapInstance) {
    const { config } = this;
    const tiles: TileAttributes[] = [];
    let id = 1;
    for (let y = 0; y < config.height * config.tileheight; y += config.tileheight) {
      for (let x = 0; x < config.width * config.tilewidth; x += config.tilewidth) {
        tiles.push({ id: id++, x, y, width: config.tilewidth, height: config.tileheight });
      }
    }
    return tiles;
  });
  schema.virtual('tilesetTiles').get(function(this: MapInstance) {
    const tiles: TileAttributes[] = [];
    for (const tileset of this.config.tilesets) {
      let gid = tileset.firstgid;
      for (let y = 0; y < tileset.imageheight; y += tileset.tileheight) {
        for (let x = 0; x < tileset.imagewidth; x += tileset.tilewidth) {
          tiles.push({ id: gid++, x, y, width: tileset.tilewidth, height: tileset.tileheight });
        }
      }
    }
    return tiles;
  });
  schema.plugin(mongooseToJson);
  return schema;
}

/**
 * Creates the map configuration subschema.
 * 
 * @param container Services container
 * @returns Map configuration subschema
 */
function createConfigSubschema() {
  const schema = new Schema({
    width: {
      type: Schema.Types.Number,
      required: [true, 'Map width is required']
    },
    height: {
      type: Schema.Types.Number,
      required: [true, 'Map height is required']
    },
    tilewidth: {
      type: Schema.Types.Number,
      required: [true, 'Map tile width is required']
    },
    tileheight: {
      type: Schema.Types.Number,
      required: [true, 'Map tile height is required']
    },
    layers: {
      type: [{
        type: createConfigLayerSubschema()
      }],
      validate: {
        validator: (layers: ConfigLayerAttributes[]) => layers.length > 0,
        message: 'Map configuration layers are required'
      }
    },
    tilesets: {
      type: [{
        type: createConfigTilesetSubschema()
      }],
      validate: {
        validator: (tilesets: ConfigTilesetAttributes[]) => tilesets.length > 0,
        message: 'Map configuration tilesets are required'
      }
    }
  }, {
    _id: false,
    id: false,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  return schema;
}

/**
 * Creates the map tileset subschema.
 * 
 * @param container Services container
 * @returns Map tileset subschema
 */
function createTilesetSubschema() {
  const schema = new Schema({
    name: {
      type: Schema.Types.String,
      required: [true, 'Tileset name is required']
    },
    data: {
      type: Schema.Types.String,
      required: [true, 'Tileset data is required'],
      match: [/(data:image\/png+;base64[^"]+)/i, 'Invalid tileset data format']
    }
  }, {
    _id: false,
    id: false,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  return schema;
}

/**
 * Creates the map configuration layer subschema.
 * 
 * @param container Services container
 * @returns Map configuration layer subschema
 */
function createConfigLayerSubschema() {
  const schema = new Schema({
    name: {
      type: Schema.Types.String,
      required: [true, 'Layer name is required']
    },
    type: {
      type: Schema.Types.String,
      enum: ['tilelayer', 'objectgroup'],
      required: [true, 'Layer type is required']
    },
    x: {
      type: Schema.Types.Number,
      required: [true, 'Layer X is required']
    },
    y: {
      type: Schema.Types.Number,
      required: [true, 'Layer Y is required']
    },
    width: {
      type: Schema.Types.Number,
      default: null
    },
    height: {
      type: Schema.Types.Number,
      default: null
    },
    opacity: {
      type: Schema.Types.Number,
      required: [true, 'Layer opacity is required']
    },
    visible: {
      type: Schema.Types.Boolean,
      required: [true, 'Layer visibility is required']
    },
    data: {
      type: [{
        type: Schema.Types.Number
      }]
    },
    objects: {
      type: [{
        type: createGameObjectSubschema()
      }]
    }
  }, {
    _id: false,
    id: false,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  return schema;
}

/**
 * Creates the map configuration tileset subschema.
 * 
 * @param container Services container
 * @returns Map configuration tileset subschema
 */
function createConfigTilesetSubschema() {
  const schema = new Schema({
    name: {
      type: Schema.Types.String,
      required: [true, 'Tileset name is required']
    },
    columns: {
      type: Schema.Types.Number,
      required: [true, 'Tileset columns is required']
    },
    firstgid: {
      type: Schema.Types.Number,
      required: [true, 'Tileset first GID is required']
    },
    imagewidth: {
      type: Schema.Types.Number,
      required: [true, 'Tileset image width is required']
    },
    imageheight: {
      type: Schema.Types.Number,
      required: [true, 'Tileset image height is required']
    },
    tilewidth: {
      type: Schema.Types.Number,
      required: [true, 'Tileset tile width is required']
    },
    tileheight: {
      type: Schema.Types.Number,
      required: [true, 'Tileset tile height is required']
    },
    tilecount: {
      type: Schema.Types.Number,
      required: [true, 'Tileset tile count is required']
    },
    margin: {
      type: Schema.Types.Number,
      required: [true, 'Tileset margin is required']
    },
    spacing: {
      type: Schema.Types.Number,
      required: [true, 'Tileset spacing is required']
    }
  }, {
    _id: false,
    id: false,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  return schema;
}

/**
 * Creates the map configuration layer game object subschema.
 * 
 * @param container Services container
 * @returns Map configuration layer game object subschema
 */
function createGameObjectSubschema() {
  const schema = new Schema({
    name: {
      type: Schema.Types.String,
      required: [true, 'Game object name is required']
    },
    x: {
      type: Schema.Types.Number,
      required: [true, 'Game object X is required']
    },
    y: {
      type: Schema.Types.Number,
      required: [true, 'Game object Y is required']
    },
    width: {
      type: Schema.Types.Number,
      required: [true, 'Game object width is required']
    },
    height: {
      type: Schema.Types.Number,
      required: [true, 'Game object height is required']
    },
    rotation: {
      type: Schema.Types.Number,
      required: [true, 'Game object rotation is required']
    },
    visible: {
      type: Schema.Types.Boolean,
      required: [true, 'Game object visibility is required']
    },
    point: {
      type: Schema.Types.Boolean,
      required: [true, 'Game object point is required']
    }
  }, {
    _id: false,
    id: false,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  return schema;
}
