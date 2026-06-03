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
    id: string
    headsign: string
    serviceDay: Date
    routeShortName: string
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