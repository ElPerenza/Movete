export interface StopTime {
    headsign: string | null;
    routeShortName: string | null;
    tripId: string;
    scheduledArrival: string; // ISO 8601
    scheduledDeparture: string; // ISO 8601
    arrivalDelay: number;
    departureDelay: number;
    realtime: boolean;
}
