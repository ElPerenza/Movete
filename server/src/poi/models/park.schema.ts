import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Point } from "../../common/point";


export enum ParkType{
    CAR = "car",
    BIKE = "bike"
}

@Schema()
export class Park {

    otpId: string;

    trentinoApiId: string;

    @Prop({ required: true })
    name: string;

    @Prop(raw({
        type: { type: String, enum: ["Point"], default: "Point", required: true },
        coordinates: { type: [Number], required: true }
    }))
    location: Point;

    @Prop({ type: String, enum: ParkType, required: true })
    parkType: ParkType;

    maxCapacity: number;

}

export type ParkDocument = HydratedDocument<Park>;

export const ParkSchema = SchemaFactory.createForClass(Park);
ParkSchema.index({ location: "2dsphere" });