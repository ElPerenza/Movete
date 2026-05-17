import { IsIn, IsOptional, ValidateNested, IsNotEmptyObject } from "class-validator";
import { Type } from "class-transformer";

const transportModes = ["air", "bus", "cableway", "coach", "funicolar", "lift", "metro", "monorail", "rail", "taxi", "tram", "trolleybus", "unknown", "water"] as const;
type TransportModes = (typeof transportModes)[number];

//TODO verify how to configure OTP to make it understaned that we can travel with bike on trains
const accessMode = ["car_pickup", "walk"] as const;
type AccessMode = (typeof accessMode)[number];

const egressMode = ["car_pickup", "walk"] as const;
type EgressMode = (typeof egressMode)[number];

const directMode = ["walk", "car", "bicycle"] as const;
type DirectMode = (typeof directMode)[number];

class Modes {
    @IsOptional()
    @IsIn(accessMode, { each: true })
    accessMode: AccessMode;

    @IsOptional()
    @IsIn(transportModes, { each: true })
    transportModes: TransportModes[];

    @IsOptional()
    @IsIn(egressMode, { each: true })
    egressMode: EgressMode;

    @IsOptional()
    @IsIn(directMode, { each: true })
    directMode: DirectMode;
}

class Coordinates {
    latitude: number;
    longitude: number;
}

export class PathRequestDto {
    @IsNotEmptyObject()
    @Type(() => Coordinates)
    from: Coordinates;
    @IsNotEmptyObject()
    @Type(() => Coordinates)
    to: Coordinates;
    @IsNotEmptyObject()
    dateTime: Date;

    @Type(() => Modes)
    @ValidateNested()
    modes: Modes;
    //this is false by default, if true use the dateTime as arriveTime and not departure time.
    arriveBy: boolean;
}