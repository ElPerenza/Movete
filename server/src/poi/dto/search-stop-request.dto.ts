import { IsIn } from "class-validator";
import { BoundingBox } from "../../common/bounding-box";
import { Type } from "class-transformer";

const types = ["STOP", "PARKING"] as const;
export type Type = (typeof types)[number];

const stopTypes = ["TRAIN", "BUS", "CABLE_CAR"] as const;
export type StopType = (typeof stopTypes)[number];

const parkingTypes = ["CAR", "BIKE", "CHARGING_SPOT"] as const;
export type ParkingType = (typeof parkingTypes)[number];

export class SearchStopRequestDto {

    @Type(() => BoundingBox)
    bbox: BoundingBox;

    @IsIn(stopTypes, { each: true })
    transportTypes: StopType[];
}
