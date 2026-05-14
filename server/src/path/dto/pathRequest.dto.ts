
export class PathRequestDto {
    from: Coordinates;
    to: Coordinates;
    dateTime: Date;
    modes: Modes;
    //this is false by default, if true use the dateTime as arriveTime and not departure time.
    arriveBy: boolean;
}

const transportModes = ["air", "bus", "cableway", "coach", "funicolar", "lift", "metro", "monorail", "rail", "taxi", "tram", "trolleybus", "unknown", "water"] as const;
type TransportModes = (typeof transportModes)[number];

//TODO verify how to configure OTP to make it understaned that we can travel with bike on trains
const accessMode = ["car_pickup", "foot"];
type AccessMode = (typeof accessMode)[number];

const egressMode = ["car_pickup", "foot"];
type EgressMode = (typeof egressMode)[number];

const directMode = ["car", "bicycle"]
type DirectMode = (typeof directMode)[number];

class Modes {
    accessMode: AccessMode;
    transportModes: TransportModes;
    egressMode: EgressMode;
    directMode: DirectMode;
}

class Coordinates {
    //this must be lat lon
    coordinates: [number, number];
}