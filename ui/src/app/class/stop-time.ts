export interface Stoptime {
    stopName: string
    realtime: boolean
    scheduledArrival: string // ISO8601
    scheduledDeparture: string // ISO8601
    arrivalDelay: number
    departureDelay: number
}

export interface TripInformation {
    id: string
    headsign: string
    serviceDate: string // ISO8601
    routeShortName: string
}

export type StoptimeType = "ORIGIN" | "INTERMEDIATE" | "DESTINATION"

export interface StoptimeWithTripInfo {
    stoptime: Stoptime,
    tripInfo: TripInformation,
    stopType: StoptimeType
}