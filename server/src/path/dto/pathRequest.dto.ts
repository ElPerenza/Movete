import { IsIn, ValidateNested } from "class-validator";


const transportModes = ["air", "bus", "cableway", "coach", "funicolar", "lift", "metro", "monorail", "rail", "taxi", "tram", "trolleybus", "unknown", "water"] as const;
type TransportModes = (typeof transportModes)[number];

//TODO verify how to configure OTP to make it understaned that we can travel with bike on trains
const accessMode = ["car_pickup", "foot"] as const;
type AccessMode = (typeof accessMode)[number];

const egressMode = ["car_pickup", "foot"] as const;
type EgressMode = (typeof egressMode)[number];

const directMode = ["car", "bicycle"] as const;
type DirectMode = (typeof directMode)[number];

class Modes {
    @IsIn(accessMode, { each: true })
    accessMode: AccessMode;

    @IsIn(transportModes, { each: true })
    transportModes: TransportModes[];

    @IsIn(egressMode, { each: true })
    egressMode: EgressMode;

    @IsIn(directMode, { each: true })
    directMode: DirectMode;
}

class Coordinates {
    //this must be lat lon
    coordinates: [number, number];
}

export class PathRequestDto {
    from: Coordinates;
    to: Coordinates;
    dateTime: Date;
    @ValidateNested()
    modes: Modes;
    //this is false by default, if true use the dateTime as arriveTime and not departure time.
    arriveBy: boolean;
}