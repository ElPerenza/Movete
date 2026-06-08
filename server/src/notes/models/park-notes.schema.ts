import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

// timestamps: true tells Mongoose to add createdAt and updatedAt automatically
@Schema({ timestamps: true })
export class ParkNote {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Park', required: true })
    parkId: Types.ObjectId;

    @Prop({ required: true })
    content: string;
}

export type NoteDocument = HydratedDocument<ParkNote>;
export const NoteSchema = SchemaFactory.createForClass(ParkNote);