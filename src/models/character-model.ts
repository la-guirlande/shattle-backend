import { Document, Model, Mongoose, Schema } from 'mongoose';
import mongooseToJson from '@meanie/mongoose-to-json';
import ServiceContainer from '../services/service-container';
import Attributes from './model';


/**
 * character attributes.
 */
export interface CharacterAttributes extends Attributes {
    img: string;
    name: string;
}

/**
 * character instance.
 */
export interface CharacterInstance extends CharacterAttributes, Document {
    
}

/**
 * Creates the character model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<CharacterInstance> {
    return mongoose.model('Character', createCharacterSchema(container), 'characters');
}

/**
 * Creates the character schema.
 * 
 * @param container Services container
 * @returns character schema
 */
function createCharacterSchema(container: ServiceContainer) {
    const schema = new Schema({
        name: {
            type: Schema.Types.String,
            required: [true, 'Name is required'],
            unique: [true, 'Name already exists']
        },
        img: {
            type: Schema.Types.String
        }
    }, {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

    schema.plugin(mongooseToJson);

    return schema;
}
 