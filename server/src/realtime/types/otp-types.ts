/**
 * A OTP trip ID with its associated active dates in YYYYMMDD format.
 */
export interface TripDates {
    tripId: string
    activeDates: string[]
}

/**
 * A OTP trip ID with its origin departure and destination arrival times for a service date.
 */
export interface TripDepartureArrivalTimes {
    tripId: string
    /** Service date in YYYYMMDD format. */
    serviceDate: string
    /** Departure time in seconds since UNIX epoch. */
    departureTime: number
    /** Arrival time in seconds since UNIX epoch. */
    arrivalTime: number
}