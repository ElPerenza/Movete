import { create, toBinary } from "@bufbuild/protobuf";
import { GtfsRealtimeProvider } from "./gtfs-realtime-provider";
import { FeedEntitySchema, FeedHeader_Incrementality, FeedMessageSchema, TripDescriptor_ScheduleRelationship, TripUpdate_StopTimeEventSchema, TripUpdate_StopTimeUpdate_ScheduleRelationship, TripUpdate_StopTimeUpdateSchema } from "../../generated/gtfs-realtime_pb";
import { Logger } from "@nestjs/common";
import { OtpService } from "../../otp/services/otp.service";
import { TripPathInformation } from "../../otp/types/otp-types";
import { StopStatus, TripStatus, ViaggiatrenoApiService, ViaggiatrenoTripInfo } from "../services/viaggiatreno-api.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";

export class ViaggiatrenoGtfsRealtimeProvider implements GtfsRealtimeProvider {

    private readonly logger = new Logger(ViaggiatrenoGtfsRealtimeProvider.name);

    /** "Padding" (in seconds) to add to the departure and arrival of a trip when checking if the trip should be currently running. */
    private readonly TRIP_SELECTION_PADDING = 600;

    // TODO: A lot of shared state between methods in this class. It works and isn't terribly complex, but I'd like a cleaner way of doing things in the future
    private runningToday?: TripPathInformation[];
    private readonly trackedTrips: Set<string> = new Set();
    private feed?: Uint8Array;

    constructor(
        private readonly otpService: OtpService,
        private readonly vtApiService: ViaggiatrenoApiService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly feedId: string
    ) {

        // TODO: cron time for retrieving today's trips and interval for realtime updates should be settable from environmental variables.
        //       Also, should it be a global config for all raltime providers or on a per-provider basis? (probably the latter)

        // cron job and interval must be added dynamically as we're not using NestJS DI (no @Injectable)
        // cronjob time is tied to specific timezones isn't it... not a problem as long as the server is running in the same timezone as the buses.
        const job = new CronJob("0 0 0 * * *", async () => {
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

    get tripUpdatesFeed(): Uint8Array<ArrayBufferLike> {
        if(!this.feed) {
            return this.createEmptyFeed();
        }
        return this.feed;
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
            //.map(tripInfo => tripInfo.tripId.substring(tripInfo.tripId.indexOf(":") + 1)); // remove feedId (OTP gtfs IDs -> feedId:tripId)
        
        //const trips = new Set(tripsCurrentlyRunning).union(this.trackedTrips);
        this.feed = await this.createTripUpdatesFeed(tripsCurrentlyRunning);

        this.logger.log(`[${this.feedId}] Created feed in ${Date.now() - start}ms. Made ${tripsCurrentlyRunning.length} requests to the VT API.`);
    }

    /**
     * Retrieve the arrival and departure times of trips running on the current date.
     * @returns the arrival and departure times of trips running today
     */
    async getTripsRunningToday(): Promise<TripPathInformation[]> {
        const start = Date.now();

        // TODO: timezones? as long as server is running in Europe/Rome timezone it's fine
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // TODO: temporarily removed Promise.all to try to avoid running out of sockets. Once socket pool implemented, add back.
        const tripsToday = await this.otpService.getTripPathsByFeed(this.feedId, today);
        const tripsYesterday = await this.otpService.getTripPathsByFeed(this.feedId, yesterday);
        const tripTimes = tripsToday.concat(tripsYesterday);

        this.logger.log(`[${this.feedId}] Retrieved yesterday's and today's trips departure/arrival times in ${Date.now() - start}ms. ${tripTimes.length} trips total.`);
        return tripTimes;
    }

    /**
     * Create a trip updates realtime feed for the given trips.
     * @param trips the trips to include in the feed (IDs)
     * @returns the already encoded feed
     */
    private async createTripUpdatesFeed(trips: Iterable<TripPathInformation>): Promise<Uint8Array> {

        const realtimeFeed = create(FeedMessageSchema, {
            header: {
                gtfsRealtimeVersion: "2.0",
                incrementality: FeedHeader_Incrementality.FULL_DATASET,
                timestamp: BigInt(Math.floor(Date.now() / 1000))
            }
        });

        for(const trip of trips) {

            const gtfsTripId = trip.tripId.substring(trip.tripId.indexOf(":") + 1);
            const trainNumber = trip.tripId.split("-")[1]; // ID format (19336 is the train number): <feedId>:IT::VehicleJourney:railTRENITALIA:10083_0_1-19336-44B5-0083_1-19336-44B5-0083
            const departureStationId = "S" + trip.stops[0].id.split(":").at(-1)!.slice(4);
            const realtimeInfo = await this.vtApiService.getTripInfo(trainNumber, departureStationId, new Date(trip.departureTime * 1000));

            if(!realtimeInfo || !realtimeInfo.lastRecordingTime) {
                this.logger.log(`[${this.feedId}] Trip ${trip.tripId} has no realtime data`);
                // no realtime data (either lost signal or trip completed)
                //this.trackedTrips.delete(tripId);
                continue;
            }

            // TODO: tracking trips like this means that we retroactively include all trips that circulated that day. Do we drop them after X time?
            //       It'd be nice to keep them if they don't slow down the data gathering too much (has to comfortably stay under 60s).
            // keep track of trips that have realtime info, so we don't stop considering them if they're late and go out of the window defined in updateFeed()
            //this.trackedTrips.add(tripId);

            // TODO: add DIVERTED support
            const stopUpdates = realtimeInfo.stops
                .filter(stop => stop.status !== StopStatus.NO_DATA && stop.status !== StopStatus.DIVERTED)
                .map(stop => {

                    // TODO how do we tackle this?
                    const stopWithSameId = trip.stops.find(s => ("S" + s.id.split(":").at(-1)!.slice(4)) === stop.stopId);
                    if(!stopWithSameId) {
                        this.logger.log(`[${this.feedId}] Stop with Viaggiatreno ID ${stop.stopId} has no correspondence in OTP for train ${trip.tripId}`);
                        return;
                    }

                    const stopUpdate = create(TripUpdate_StopTimeUpdateSchema, {
                        stopSequence: stopWithSameId.sequenceNumber,
                        scheduleRelationship: stop.status === StopStatus.CANCELLED ? TripUpdate_StopTimeUpdate_ScheduleRelationship.SKIPPED : TripUpdate_StopTimeUpdate_ScheduleRelationship.SCHEDULED,
                    });
                    if(stop.arrivalDelay != undefined) {
                        stopUpdate.arrival = create(TripUpdate_StopTimeEventSchema, {
                            delay: stop.arrivalDelay
                        });
                    }
                    if(stop.departureDelay != undefined) {
                        stopUpdate.departure = create(TripUpdate_StopTimeEventSchema, {
                            delay: stop.departureDelay
                        });
                    }
                    return stopUpdate;
                })
                .filter(stop => stop != undefined);

            realtimeFeed.entity.push(create(FeedEntitySchema, {
                id: `${trainNumber}:${trip.serviceDate}`,
                tripUpdate: {
                    timestamp: BigInt(Math.floor(realtimeInfo.lastRecordingTime / 1000)),
                    trip: {
                        tripId: gtfsTripId,
                        startDate: trip.serviceDate,
                        scheduleRelationship: realtimeInfo.status === TripStatus.CANCELLED ? TripDescriptor_ScheduleRelationship.CANCELED : TripDescriptor_ScheduleRelationship.SCHEDULED
                    },
                    stopTimeUpdate: stopUpdates
                }
            }));
        }

        this.logger.log(`[${this.feedId}] The Realtime feed contains ${realtimeFeed.entity.length} tripUpdates.`);

        return toBinary(FeedMessageSchema, realtimeFeed);
    }
}
