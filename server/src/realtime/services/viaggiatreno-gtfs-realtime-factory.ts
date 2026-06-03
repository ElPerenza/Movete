import { Injectable } from "@nestjs/common";
import { OtpRealtimeService } from "./otp-realtime.service";
import { ViaggiatrenoGtfsRealtimeProvider } from "../gtfs-realtime-providers/viaggiatreno-gtfs-realtime-provider";
import { ViaggiatrenoApiService } from "./viaggiatreno-api.service";
import { SchedulerRegistry } from "@nestjs/schedule";

@Injectable()
export class ViaggiatrenoGtfsRealtimeFactory {

    constructor(
        private readonly realtimeService: OtpRealtimeService,
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
            this.realtimeService,
            this.vtApiService,
            this.schedulerRegistry,
            feedId
        );
    }
}