import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";


@Schema()
export class StopFeedback {

    @Prop({ required: true })
    stopId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true, min: 1, max: 10 })
    feedback: number;

    @Prop({required: false, default: Date.now })
    feedbackDate: Date;
    
    @Prop({ required: true, min: 1, max: 7 })
    day: number;

    @Prop({ required: true, min: 6, max: 23 })
    hour: number;
}

export type StopFeedbackDocument = HydratedDocument<StopFeedback>;

export const stopFeedbackSchema = SchemaFactory.createForClass(StopFeedback);
stopFeedbackSchema.index({ tripId: 1, userId: 1, day:1, hour: 1 }, { unique: true });