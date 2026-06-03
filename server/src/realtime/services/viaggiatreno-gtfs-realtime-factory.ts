import { Injectable } from "@nestjs/common";
import { OtpService } from "../../otp/services/otp.service";
import { ViaggiatrenoGtfsRealtimeProvider } from "../gtfs-realtime-providers/viaggiatreno-gtfs-realtime-provider";
import { ViaggiatrenoApiService } from "./viaggiatreno-api.service";
import { SchedulerRegistry } from "@nestjs/schedule";

@Injectable()
export class ViaggiatrenoGtfsRealtimeFactory {

    constructor(
        private readonly otpService: OtpService,
        private readonly vtApiService: ViaggiatrenoApiService,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {}

    /**
     * Return a GTFS Realtime provider for a specific OTP feed ID.
     * @param feedId the feed ID
     * @returns the GTFS Realtime provider
     */
    forFeed(feedId: string): ViaggiatrenoGtfsRealtimeProvider {
        return new ViaggiatrenoGtfsRealtimeProvider(
            this.otpService,
            this.vtApiService,
            this.schedulerRegistry,
            feedId
        );
    }
}