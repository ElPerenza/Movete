export class StopTime {
  headsign: string;

  tripId: string;

  scheduledArrival: Date;

  scheduledDeparture: Date;

  arrivalDelay: number;

  departureDelay: number;

  realtime: boolean = false;
}
