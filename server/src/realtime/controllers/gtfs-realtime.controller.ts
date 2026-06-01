import { Controller, Get, Inject, NotFoundException, Param, StreamableFile } from "@nestjs/common";
import { GtfsRealtimeProvider } from "../gtfs-realtime-providers/gtfs-realtime-provider";
import { GTFS_RT_PROVIDERS } from "../provider-tokens";

@Controller("/gtfs-realtime")
export class GtfsRealtimeController {

    constructor(
        @Inject(GTFS_RT_PROVIDERS) private readonly providers: Map<string, GtfsRealtimeProvider>
    ) {}

    /**
     * Retrieve a GTFS Realtime Trip Updates feed for a specific OpenTripPlanneer feedId.
     * @param feedId the OTP feedId
     * @returns the realtime feed
     */
    @Get("/:feedId/trip-updates")
    getTripUpdatesFeed(@Param("feedId") feedId: string): StreamableFile {
        const provider = this.providers.get(feedId);
        if(!provider) {
            throw new NotFoundException(`No provider found for feed "${feedId}"`);
        }
        return new StreamableFile(provider.tripUpdatesFeed);
    }
}