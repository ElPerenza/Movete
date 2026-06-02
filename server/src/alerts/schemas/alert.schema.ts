import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Alert extends Document {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ type: String, required: true })
    stopId: string;

    // who created alert? (worker)
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ required: true })
    validFrom: Date;

    @Prop({ required: true })
    validUntil: Date;

    @Prop({ default: true })
    isActive: boolean;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
