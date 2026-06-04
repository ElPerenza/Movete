import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OtpService } from "../../otp/services/otp.service";
import { ViaggiatrenoTripInfo, TripStatus } from "../types/viaggiatreno-api-types";

/**
 * Service to interface with Trenitalia's Viaggiatreno APIs.
 */
@Injectable()
export class ViaggiatrenoApiService {

    private readonly API_URL: string;

    constructor(
        private readonly otpService: OtpService,
        configService: ConfigService
    ) {
        this.API_URL = configService.getOrThrow("VT_API_URL");
    }

    /**
     * Retrieve realtime information about a given trip.
     * @param trainNumber the trip's number
     * @param departureStationId the trip's departure station (old ID format)
     * @param departureTime the trip's departure date. Any time is fine, only the date part is important
     * @returns the trip's information or `undefined` if no info was found
     */
    async getTripInfo(trainNumber: string, departureStationId: string, departureTime: Date): Promise<ViaggiatrenoTripInfo | undefined> {

        const response = await fetch(new URL(
            `andamentoTreno/${departureStationId}/${trainNumber}/${departureTime.getTime()}`, 
            this.API_URL
        ));

        if(!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        if(response.status === 204) {
            // if no trip was found with the given data the service returns 204
            return undefined;
        }

        const responseBody: ViaggiatrenoTrainStatusResponse = await response.json();
        return {

            trainNumber: responseBody.numeroTreno,
            status: responseBody.provvedimento === 0 ? responseBody.tipoTreno === "PG" ? TripStatus.NORMAL : TripStatus.PARTIALLY_CANCELLED : responseBody.provvedimento,
            serviceDate: this.otpService.formatAsYYYYMMDDD(responseBody.dataPartenzaTreno),
            lastRecordedLocation: responseBody.stazioneUltimoRilevamento === "--" ? undefined : responseBody.stazioneUltimoRilevamento,
            lastRecordingTime: responseBody.oraUltimoRilevamento,

            stops: responseBody.fermate.map(stop => {

                const departureDelay = stop.partenza_teorica && stop.partenzaReale ? this.timestampToSeconds(stop.partenzaReale - stop.partenza_teorica) : undefined;
                const arrivalDelay = stop.arrivo_teorico && stop.arrivoReale ? this.timestampToSeconds(stop.arrivoReale - stop.arrivo_teorico) : undefined;

                return {
                    stopId: stop.id,
                    status: stop.actualFermataType,
                    // arrival/departure can be undefined if this stop is the origin/destination one
                    scheduledDeparture: this.timestampToSeconds(stop.partenza_teorica ?? stop.arrivo_teorico!),
                    scheduledArrival: this.timestampToSeconds(stop.arrivo_teorico ?? stop.partenza_teorica!),
                    departureDelay: departureDelay,
                    arrivalDelay: arrivalDelay
                };
            })
        };
    }

    /**
     * Convert a stop ID from the new format (`8300*****`) to the old one (`S*****`).
     * @param id the ID to convert
     * @returnsthe converted ID
     */
    newToOldIdFormat(id: string): string {
        return "S" + id.slice(4);
    }

    private timestampToSeconds(millisTimestamp: number): number {
        return Math.floor(millisTimestamp / 1000);
    }
}

/**
 * See https://github.com/roughconsensusandrunningcode/TrainMonitor/wiki/Documentazione-API-FS#dettagli-viaggio-treno for documentation.
 */
interface ViaggiatrenoTrainStatusResponse {
    numeroTreno: number
    categoria: string
    tipoTreno: "PG" | "ST" | "PP" | "SI" | "SF" | "DV"
    provvedimento: 0 | 1 | 2 | 3
    origine: string
    idOrigine: string
    orarioPartenza: number
    destinazione: string
    idDestinazione: string
    orarioDestinazione: number 
    dataPartenzaTreno: number
    oraUltimoRilevamento?: number
    stazioneUltimoRilevamento: string
    fermate: ViaggiatrenoStop[]
}

interface ViaggiatrenoStop {
    id: string
    stazione: string
    actualFermataType: 0 | 1 | 2 | 3
    tipoFermata: "P" | "F" | "A"
    partenza_teorica?: number
    partenzaReale?: number
    arrivo_teorico?: number
    arrivoReale?: number
}
