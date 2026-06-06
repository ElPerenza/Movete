import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";


@Schema()
export class TripFeedback {

    @Prop({ required: true })
    tripId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true, min: 1, max: 10 })
    feedback: number;

    @Prop({required: false, default: Date.now })
    feedbackDate: Date;

    @Prop({ required: true, min: 1, max: 7 })
    day: number;
}

export type TripFeedbackDocument = HydratedDocument<TripFeedback>;

export const tripFeedbackSchema = SchemaFactory.createForClass(TripFeedback);
tripFeedbackSchema.index({ tripId: 1, userId: 1, day: 1 }, { unique: true });