import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Point } from "../../common/point";
import { Optional } from "@nestjs/common";


export enum ParkType{
    CAR = "car",
    BIKE = "bike"
}

@Schema()
export class Park {

    @Prop()
    otpId: string;

    @Prop()
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

    @Prop()
    maxCapacity: number;
    
    currentCapacity: number | null;

}

export type ParkDocument = HydratedDocument<Park>;

export const ParkSchema = SchemaFactory.createForClass(Park);
ParkSchema.index({ location: "2dsphere" });