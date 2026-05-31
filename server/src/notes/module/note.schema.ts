import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

// timestamps: true tells Mongoose to add createdAt and updatedAt automatically
@Schema({ timestamps: true })
export class Note {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Stop', required: true })
    stopId: Types.ObjectId;

    @Prop({ required: true })
    content: string;
}

export type NoteDocument = HydratedDocument<Note>;
export const NoteSchema = SchemaFactory.createForClass(Note);
