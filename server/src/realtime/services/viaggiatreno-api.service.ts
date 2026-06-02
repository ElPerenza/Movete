import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ViaggiatrenoTrainStatusResponse } from "../types/viaggiatreno-api-types";
import { OtpRealtimeService } from "./otp-realtime.service";

@Injectable()
export class ViaggiatrenoApiService {

    private readonly API_URL: string;

    constructor(
        private readonly otpRealtimeService: OtpRealtimeService,
        configService: ConfigService
    ) {
        this.API_URL = configService.getOrThrow("VT_API_URL");
    }

    async getTripInfo(trainNumber: string, departureStationId: string, departureTime: Date): Promise<ViaggiatrenoTripInfo | undefined> {

        const response = await fetch(new URL(
            `andamentoTreno/${departureStationId}/${trainNumber}/${departureTime.getTime()}`, 
            this.API_URL
        ));

        if(!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        if(response.status === 204) {
            return undefined;
        }

        const responseBody: ViaggiatrenoTrainStatusResponse = await response.json();
        return {
            trainNumber: responseBody.numeroTreno,
            status: responseBody.provvedimento === 0 ? responseBody.tipoTreno === "PG" ? TripStatus.NORMAL : TripStatus.PARTIALLY_CANCELLED : responseBody.provvedimento,
            serviceDate: this.otpRealtimeService.formatAsYYYYMMDDD(responseBody.dataPartenzaTreno),
            lastRecordedLocation: responseBody.stazioneUltimoRilevamento === "--" ? undefined : responseBody.stazioneUltimoRilevamento,
            lastRecordingTime: responseBody.oraUltimoRilevamento,
            stops: responseBody.fermate.map(stop => {

                const departureDelay = stop.partenza_teorica && stop.partenzaReale ? this.timestampToSeconds(stop.partenzaReale - stop.partenza_teorica) : undefined;
                const arrivalDelay = stop.arrivo_teorico && stop.arrivoReale ? this.timestampToSeconds(stop.arrivoReale - stop.arrivo_teorico) : undefined;

                return {
                    stopId: stop.id,
                    status: stop.actualFermataType,
                    scheduledDeparture: this.timestampToSeconds(stop.partenza_teorica ?? stop.arrivo_teorico!),
                    scheduledArrival: this.timestampToSeconds(stop.arrivo_teorico ?? stop.partenza_teorica!),
                    departureDelay: departureDelay,
                    arrivalDelay: arrivalDelay
                };
            })
        };
    }

    private timestampToSeconds(millisTimestamp: number): number {
        return Math.floor(millisTimestamp / 1000);
    }
}

enum TripStatus {
    NORMAL = 0, CANCELLED = 1, PARTIALLY_CANCELLED = 2, DIVERTED = 3
}

enum StopStatus {
    NO_DATA = 0, REGULAR = 1, DIVERTED = 2, CANCELLED = 3
}

interface ViaggiatrenoTripInfo {
    trainNumber: number
    status: TripStatus
    serviceDate: string
    lastRecordedLocation?: string
    lastRecordingTime?: number
    stops: {
        stopId: string
        status: StopStatus
        scheduledDeparture: number
        departureDelay?: number
        scheduledArrival: number
        arrivalDelay?: number
    }[]
}