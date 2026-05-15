/**
 * Trip response returned by the TT API.
 */
export interface TrentinoTrasportiTripResponse {
    cableway?: {
      routeId: 531
      descrizione: string
      type: "U",
      descrColor: "3ab100"
    }
    corsaPiuVicinaADataRiferimento: boolean
    delay?: number // se null no dati Realtime
    directionId: 0 | 1
    indiceCorsaInLista: number
    lastEventRecivedAt: string //DateTime
    lastSequenceDetection: number
    matricolaBus: number
    oraArrivoEffettivaAFermataSelezionata?: never
    oraArrivoProgrammataAFermataSelezionata?: never
    routeId: number
    stopLast: number // id
    stopNext: number // id
    stopTimes: {
        arrivalTime: string //Time
        departureTime: string //Time
        stopId: number
        stopSequence: number
        tripId: string
        type: "E" | "U"
    }[]
    totaleCorseInLista: number
    tripFlag?: string
    tripHeadsign: string
    type: "E" | "U"
    wheelchairAccessible: 0 | 1
}