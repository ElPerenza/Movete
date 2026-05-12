import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Point } from "../../common/point";
import { StopType } from "../poi.types.ts/stopType";


@Schema()
export class Stop {

    @Prop({ required: true })
    name: string;

    @Prop(raw({
        type: { type: String, enum: ["Point"], default: "Point", required: true },
        coordinates: { type: [Number], required: true }
    }))
    location: Point;

    @Prop({ type: [String], required: true })
    transportModes: StopType[];

    @Prop({ type: [String], required: true })
    otpStops: string[];
}

export type StopDocument = HydratedDocument<Stop>;

export const StopSchema = SchemaFactory.createForClass(Stop);
StopSchema.index({ location: "2dsphere" });
