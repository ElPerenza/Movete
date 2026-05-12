export class StopTime {

    //Direction or final destination of the trip, 
    //null if the transit agency does not provide this information
    headsign: string | null;

    //Unique GTFS identifier for the specific trip
    tripId: string;

    //Scheduled arrival time fo the vehicle at the stop
    scheduledArrival: Date;

    //Scheduled departure time of the vehicle at the Stop
    scheduledDeparture: Date;

    //Arrival delay in seconds. 
    //Defaults to 0 if no real-time tracking is available
    arrivalDelay: number;

    //Departure delay in seconds. 
    //Defaults to 0 if no real-time tracking is available
    departureDelay: number;

    //Indicates whether the timing data includes live real-time updates
    //Hardcoded to false 
    realtime: boolean = false;
}
