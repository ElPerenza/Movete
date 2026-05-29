/**
 * A OTP trip ID with its associated active dates in YYYYMMDD format.
 */
export interface TripDates {
    tripId: string
    activeDates: string[]
}

/**
 * Essential OTP trip information for a specific service date.
 */
export interface TripServiceDateInformation {
    /** OTP trip ID. */
    tripId: string
    /** Active service date in YYYYMMDD format. */
    serviceDate: string
    /** Scheduled departure time in seconds since UNIX epoch. */
    departureTime: number
    /** Scheduled arrival time in seconds since UNIX epoch. */
    arrivalTime: number
    /** List of GTFS `stop_sequence` numbers for the trip's stops, in order. */
    sequenceNumbers: number[]
}
