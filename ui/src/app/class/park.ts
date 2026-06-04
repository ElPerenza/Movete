import { Point } from "./point";
export enum ParkType{
    CAR = "car",
    BIKE = "bike"
}

export class Park {
    id: string;
    otpId: string;
    trentinoApiId: string;
    name: string;
    location: Point;
    parkType: ParkType;
    maxCapacity: number;
    currentCapacity: number;

    constructor(id: string, otpId: string, trentinoApiId: string, name: string, location: Point, parkType: ParkType, maxCapacity: number, currentCapacity: number){
            this.id = id;
            this.otpId = otpId;
            this.trentinoApiId = trentinoApiId;
            this.name = name;
            this.location = location;
            this.parkType = parkType;
            this.maxCapacity = maxCapacity;
            this.currentCapacity = currentCapacity;
        }

}