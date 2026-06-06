/**
 * An OpenTripPlanner stop.
 */
export interface Stop {
    lat: number
    lon: number
    id: string
    name: string
    vehicleMode: VehicleMode
}

/**
 * Modes of transport that a stop can serve.
 */
export type VehicleMode = "BUS" | "RAIL" | "CABLE_CAR"

/**
 * An OpenTripPlanner stoptime.
 */
export interface Stoptime {
    stopName: string
    realtime: boolean
    scheduledArrival: Date
    scheduledDeparture: Date
    /** Arrival delay in seconds. If `realtime === false`, set to 0. */
    arrivalDelay: number
    /** Departure delay in seconds. If `realtime === false`, set to 0. */
    departureDelay: number
}

/**
 * Essential information about an OpenTripPlanner trip.
 */
export interface TripInformation {
    /** OTP trip ID. */
    id: string
    /** Trip headsign, to show trip route to users. */
    headsign: string
    /** Active service date. */
    serviceDate: Date
    /** Short name of the route the trip is running. */
    routeShortName: string
}

/**
 * Essential OTP trip information needed by GTFS realtime providers.
 * Contains data about origin/destination times and stop sequence numbers.
 */
export interface TripPathInformation {
    /** OTP trip ID. */
    tripId: string
    /** Active service date in YYYYMMDD format. */
    serviceDate: string
    /** Scheduled origin departure time in seconds since UNIX epoch. */
    departureTime: number
    /** Scheduled destination arrival time in seconds since UNIX epoch. */
    arrivalTime: number
    /** Stops encontered by this trip. */
    stops: {
        /** OTP stop ID. */
        id: string
        /** GTFS `stop_sequence` number */
        sequenceNumber: number
    }[]
}

/**
 * How a stoptime relates to its parent trip.
 */
export type StoptimeType = "ORIGIN" | "INTERMEDIATE" | "DESTINATION"

/**
 * An OpenTripPlanner stoptime linked to a specific trip.
 */
export interface StoptimeWithTripInfo {
    stoptime: Stoptime,
    tripInfo: TripInformation,
    stopType: StoptimeType
}