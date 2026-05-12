import { Point } from "./point";

const stopTypes = ["TRAIN", "BUS", "CABLE_CAR"] as const;
export type StopType = (typeof stopTypes)[number];

export class Stop {
    id: string;

    name: string;

    location: Point;

    transportModes: StopType[];

    otpStops: string[];

    constructor(id: string, name: string, location: Point, transportMode: StopType[], otpStops: string[]){
        this.id = id;
        this.name = name;
        this.location = location;
        this.transportModes = transportMode;
        this.otpStops = otpStops;
    }
}