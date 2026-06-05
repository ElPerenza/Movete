import { Injectable } from "@nestjs/common";
import { OtpRealtimeService } from "./otp-realtime.service";
import { TrentinoTrasportiApiService } from "./trentino-trasporti-api.service";
import { TrentinoTrasportiGtfsRealtimeProvider } from "../gtfs-realtime-providers/trentino-trasporti-gtfs-realtime-provider";
import { SchedulerRegistry } from "@nestjs/schedule";

/**
 * Factory for constructing GTFS Realtime feed providers pulling data from the Trantino Trasporti API.
 */
@Injectable()
export class TrentinoTrasportiGtfsRealtimeFactory {
    
    constructor(
        private readonly realtimeService: OtpRealtimeService,
        private readonly ttApiService: TrentinoTrasportiApiService,
        private readonly schedulerRegistry: SchedulerRegistry
    ) {}

    /**
     * Return a GTFS Realtime provider for a specific OTP feed ID.
     * @param feedId the feed ID
     * @returns the GTFS Realtime provider
     */
    forFeed(feedId: string): TrentinoTrasportiGtfsRealtimeProvider {
        return new TrentinoTrasportiGtfsRealtimeProvider(
            this.realtimeService,
            this.ttApiService,
            this.schedulerRegistry,
            feedId
        );
    }
}