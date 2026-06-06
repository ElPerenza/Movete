/**
 * Status of a trip.
 */
export enum TripStatus {
    NORMAL = 0, CANCELLED = 1, PARTIALLY_CANCELLED = 2, DIVERTED = 3
}

/**
 * Status of a stoptime in a trip.
 * Diverted stops are stops not present in the schedule that were added on short notice.
 */
export enum StopStatus {
    NO_DATA = 0, REGULAR = 1, DIVERTED = 2, CANCELLED = 3
}

/**
 * Realtime data on a trip returned by Viaggiatreno.
 */
export interface ViaggiatrenoTripInfo {
    /** Trip number. */
    trainNumber: number
    status: TripStatus
    /** Active service date in YYYMMDD format. */
    serviceDate: string
    /** Name of the location the trip was last recorded at. */
    lastRecordedLocation?: string
    /** Last time realtime data about the trip was updated. UNIX timestamp milliseconds. */
    lastRecordingTime?: number
    stops: {
        stopId: string
        status: StopStatus
        /** Scheduled departure. `undefined` if this stop is the trip's destination. UNIX timestamp seconds. */
        scheduledDeparture: number
        /** Departure delay in seconds. `undefined` if no realtime data. */
        departureDelay?: number
        /** Scheduled arrival. `undefined` if this stop is the trip's origin. UNIX timestamp seconds. */
        scheduledArrival: number
        /** Arrival delay in seconds. `undefined` if no realtime data. */
        arrivalDelay?: number
    }[]
}
