import { Expose } from "class-transformer";

export class StopTime {

    //Direction or final destination of the trip, 
    //null if the transit agency does not provide this information
    @Expose()
    headsign: string | null;

    //Unique GTFS identifier for the specific trip
    @Expose()
    tripId: string;

    //Scheduled arrival time fo the vehicle at the stop
    @Expose()
    scheduledArrival: Date;

    //Scheduled departure time of the vehicle at the Stop
    @Expose()
    scheduledDeparture: Date;

    //Arrival delay in seconds. 
    //Defaults to 0 if no real-time tracking is available
    @Expose()
    arrivalDelay: number;

    //Departure delay in seconds. 
    //Defaults to 0 if no real-time tracking is available
    @Expose()
    departureDelay: number;

    //Indicates whether the timing data includes live real-time updates
    //Hardcoded to false 
    @Expose()
    realtime: boolean;
}
