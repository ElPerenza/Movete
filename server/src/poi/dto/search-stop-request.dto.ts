import { IsIn, ValidateNested } from "class-validator";
import { BoundingBox } from "../../common/bounding-box";
import { Type } from "class-transformer";
import { stopTypes, StopType } from "../poi.types.ts/stopType";

/**
 * TODO to use for parking

const types = ["STOP", "PARKING"] as const;
export type Type = (typeof types)[number];

const parkingTypes = ["CAR", "BIKE", "CHARGING_SPOT"] as const;
export type ParkingType = (typeof parkingTypes)[number];
 */

export class SearchStopRequestDto {

    @ValidateNested()
    @Type(() => BoundingBox)
    bbox: BoundingBox;

    @IsIn(stopTypes, { each: true })
    transportTypes: StopType[];
}
