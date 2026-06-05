import { Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { OtpService } from "../../otp/services/otp.service";
import { TripPathInformation } from "../../otp/types/otp-types";
import { FeedEntitySchema, FeedHeader_Incrementality, FeedMessageSchema } from "../../generated/gtfs-realtime_pb";
import { create, toBinary } from "@bufbuild/protobuf";
import { TrentinoTrasportiApiService } from "../services/trentino-trasporti-api.service";
import { GtfsRealtimeProvider } from "./gtfs-realtime-provider";

/**
 * A {@link GtfsRealtimeProvider} that sources data from the Trentino Trasporti API.
 * The provider must be tied to a specific feedId as it needs to know which trips are currently running to lessen the amount of requests made.
 */
export class TrentinoTrasportiGtfsRealtimeProvider implements GtfsRealtimeProvider {

    private readonly logger = new Logger(TrentinoTrasportiGtfsRealtimeProvider.name);

    /** "Padding" (in seconds) to add to the departure and arrival of a trip when checking if the trip should be currently running. */
    private readonly TRIP_SELECTION_PADDING = 600;

    // TODO: A lot of shared state between methods in this class. It works and isn't terribly complex, but I'd like a cleaner way of doing things in the future
    private runningToday?: TripPathInformation[];
    private readonly trackedTrips: Set<string> = new Set();
    private feed?: Uint8Array;

    constructor(
        private readonly otpService: OtpService,
        private readonly ttApiService: TrentinoTrasportiApiService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly feedId: string
    ) {

        // TODO: cron time for retrieving today's trips and interval for realtime updates should be settable from environmental variables.
        //       Also, should it be a global config for all raltime providers or on a per-provider basis? (probably the latter)

        // cron job and interval must be added dynamically as we're not using NestJS DI (no @Injectable)
        // cronjob time is tied to specific timezones isn't it... not a problem as long as the server is running in the same timezone as the buses.
        const job = new CronJob("0 0 2 * * *", async () => {
            try {
                this.runningToday = await this.getTripsRunningToday();
            } catch(err) {
                this.logger.error(err);
            }
        });
        this.schedulerRegistry.addCronJob(`${feedId}-update-trips-running-today`, job);
        job.start();

        // arrow function to make sure it's called with the correct "this" reference 
        // (https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#functions_are_called_with_the_global_this)
        const interval = setInterval(async () => {
            try {
                await this.updateFeed();
            } catch(err) {
                this.logger.error(err);
            }
        }, 60000);
        this.schedulerRegistry.addInterval(`${feedId}-create-feed`, interval);
    }

    get tripUpdatesFeed(): Uint8Array {
        if(!this.feed) {
            return this.createEmptyFeed();
        }
        return this.feed;
    }

    /**
     * Retrieve the arrival and departure times of trips running on the current date.
     * @returns the arrival and departure times of trips running today
     */
    private async getTripsRunningToday(): Promise<TripPathInformation[]> {
        const start = Date.now();
        // TODO: timezones? as long as server is running in Europe/Rome timezone it's fine
        const tripsRunningToday = await this.otpService.getTripPathsByFeed(this.feedId, new Date());
        this.logger.log(`[${this.feedId}] Retrieved today's trips departure/arrival times in ${Date.now() - start}ms. ${tripsRunningToday.length} trips total.`);
        return tripsRunningToday;
    }

    /**
     * Updates (or creates) the realtime feed referencing only trips that are currently running this instant.
     */
    private async updateFeed(): Promise<void> {
        const start = Date.now();

        if(!this.runningToday) {
            this.runningToday = await this.getTripsRunningToday();
        }

        const now = Math.floor(Date.now() / 1000);
        const tripsCurrentlyRunning = this.runningToday
            .filter(tripInfo => {
                // consider only trips that should be currently running (with some padding)
                return now >= (tripInfo.departureTime - this.TRIP_SELECTION_PADDING) && 
                        now <= (tripInfo.arrivalTime + this.TRIP_SELECTION_PADDING);
            })
            .map(tripInfo => tripInfo.tripId.substring(tripInfo.tripId.indexOf(":") + 1)); // remove feedId (OTP gtfs IDs -> feedId:tripId)
        
        const trips = new Set(tripsCurrentlyRunning).union(this.trackedTrips);
        this.feed = await this.createTripUpdatesFeed(trips);

        this.logger.log(`[${this.feedId}] Created feed in ${Date.now() - start}ms. Made ${trips.size} requests to the TT API.`);
    }

    /**
     * Create an empty GTFS realtime feed.
     * @returns the empty feed already encoded
     */
    private createEmptyFeed(): Uint8Array {
        const realtimeFeed = create(FeedMessageSchema, {
            header: {
                gtfsRealtimeVersion: "2.0",
                incrementality: FeedHeader_Incrementality.FULL_DATASET,
                timestamp: BigInt(Math.floor(Date.now() / 1000))
            }
        });
        return toBinary(FeedMessageSchema, realtimeFeed);
    }

    /**
     * Create a trip updates realtime feed for the given trips.
     * Trip updates are always for the current day, as the TT API does not support searching for trips on days different than the current one.
     * @param trips the trips to include in the feed (IDs)
     * @returns the already encoded feed
     */
    private async createTripUpdatesFeed(trips: Iterable<string>): Promise<Uint8Array> {

        const realtimeFeed = create(FeedMessageSchema, {
            header: {
                gtfsRealtimeVersion: "2.0",
                incrementality: FeedHeader_Incrementality.FULL_DATASET,
                timestamp: BigInt(Math.floor(Date.now() / 1000))
            }
        });
        const todayDate = this.otpService.formatAsYYYYMMDDD(new Date());

        for(const tripId of trips) {

            const realtimeInfo = await this.ttApiService.getTripInfo(tripId);
            if(realtimeInfo.delay == null || realtimeInfo.lastSequenceDetection === realtimeInfo.stopTimes.length) {
                // no realtime data (either lost signal or trip completed)
                this.trackedTrips.delete(tripId);
                continue;
            }

            const serviceDateInfo = this.runningToday!.find(times => times.tripId.endsWith(tripId))!;

            // keep track of trips that have realtime info, so we don't stop considering them if they're late and go out of the window defined in updateFeed()
            this.trackedTrips.add(tripId);

            realtimeFeed.entity.push(create(FeedEntitySchema, {
                id: tripId,
                tripUpdate: {
                    timestamp: BigInt(Math.floor(Date.parse(realtimeInfo.lastEventRecivedAt) / 1000)),
                    trip: {
                        tripId: tripId,
                        startDate: todayDate
                    },
                    stopTimeUpdate: [
                        {
                            stopSequence: serviceDateInfo.stops[realtimeInfo.lastSequenceDetection].sequenceNumber,
                            departure: {
                                delay: realtimeInfo.delay! * 60
                            }
                        }
                    ]
                }
            }));
        }

        return toBinary(FeedMessageSchema, realtimeFeed);
    }
}