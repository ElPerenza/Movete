/**
 * Trip response returned by the TT API.
 */
// TODO: consider if keeping all field definitions is worth it or if it's better to only narrow down to the actually useful ones.
export interface TrentinoTrasportiTripResponse {
    /** Contains cableway route description if a cableway trip has been selected. Not particularly useful. */
    cableway?: {
      routeId: 531
      descrizione: string
      type: "U",
      descrColor: "3ab100"
    }
    corsaPiuVicinaADataRiferimento: boolean
    /** 
     * The trip's last measured delay in minutes. Is null if trip hasn't yet started. 
     * Is 0 if trip already ended (and when the trip is on time of course). 
     */
    delay?: number // se null no dati Realtime
    /** The trip's direction in the route. */
    directionId: 0 | 1
    /** Only used in a stop times (not trip) query. Position of this object in the returned list. */
    indiceCorsaInLista: number
    /** ISO8601 string of the last time the vhicle transmitted realtime data. */
    lastEventRecivedAt: string
    /** Last stop the trip was at, as a stop sequence number (stops start at 1, 0 means not departed) */
    lastSequenceDetection: number
    /** The trip vehicle's serial number. */
    matricolaBus: number
    /** Only used in a stop times (not trip) query. ISO8601 string as time of arrival at selected stop. */
    oraArrivoEffettivaAFermataSelezionata?: never
    /** Only used in a stop times (not trip) query. ISO8601 string as scheduled time of arrival at selected stop. */
    oraArrivoProgrammataAFermataSelezionata?: never
    /** The route ID this trip  is running on. */
    routeId: number
    /** ID of the last stop the trip was at. 0 if not departed. */
    stopLast: number
    /** ID of the next stop the trip will pass. 0 if not departed. */
    stopNext: number
    /** List of arrival/departure times for all stops in the trip. */
    stopTimes: {
        /** HH:MM:SS string, scheduled arrival time. */
        arrivalTime: string
        /** HH:MM:SS string, scheduled departure time. */
        departureTime: string
        /** ID of the stop. */
        stopId: number
        /** Position of the stop in the trip, starts from 1. */
        stopSequence: number
        /** ID of the trip. */
        tripId: string
        /** E = extra-urban trip, U = urban trip */
        type: "E" | "U"
    }[]
    totaleCorseInLista: number
    tripFlag?: string
    /** The trip's headsign showing its destination. */
    tripHeadsign: string
    /** E = extra-urban trip, U = urban trip */
    type: "E" | "U"
    /** if this trip is wheelchair accessible. */
    wheelchairAccessible: 0 | 1
}