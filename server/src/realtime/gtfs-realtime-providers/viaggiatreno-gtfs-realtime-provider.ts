import { create, toBinary } from "@bufbuild/protobuf";
import { GtfsRealtimeProvider } from "./gtfs-realtime-provider";
import { FeedEntitySchema, FeedHeader_Incrementality, FeedMessageSchema, TripDescriptor_ScheduleRelationship, TripUpdate_StopTimeEventSchema, TripUpdate_StopTimeUpdate_ScheduleRelationship, TripUpdate_StopTimeUpdateSchema } from "../../generated/gtfs-realtime_pb";
import { Logger } from "@nestjs/common";
import { OtpService } from "../../otp/services/otp.service";
import { TripPathInformation } from "../../otp/types/otp-types";
import { ViaggiatrenoApiService } from "../services/viaggiatreno-api.service";
import { StopStatus, TripStatus } from "../types/viaggiatreno-api-types";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import trentinoStops from "../trentino_stops.json";

export class ViaggiatrenoGtfsRealtimeProvider implements GtfsRealtimeProvider {

    private readonly logger = new Logger(ViaggiatrenoGtfsRealtimeProvider.name);

    /** "Padding" (in seconds) to add to the departure and arrival of a trip when checking if the trip should be currently running. */
    private readonly TRIP_SELECTION_PADDING = 600;

    // TODO: A lot of shared state between methods in this class. It works and isn't terribly complex, but I'd like a cleaner way of doing things in the future
    private runningToday?: TripPathInformation[];
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
            });
        
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

        const [ tripsToday, tripsYesterday ] = await Promise.all([
            await this.otpService.getTripPathsByFeed(this.feedId, today),
            await this.otpService.getTripPathsByFeed(this.feedId, yesterday)
        ]);

        // limit returned trips to only ones that serve stations in Trentino (and stations just outside that have connecting TT bus services)
        // This stays like this as long as this app doesn't expand its scope beyond Trentino
        const trentinoStopIds = trentinoStops.map(s => s.id);
        const tripTimes = tripsToday.concat(tripsYesterday).filter(trip => {
            for(const stop of trip.stops) {
                if(trentinoStopIds.includes(Number(stop.id.split(":").at(-1)!))) {
                    return true;
                }
            }
            return false;
        });

        this.logger.log(`[${this.feedId}] Retrieved yesterday's and today's trips departure/arrival times in ${Date.now() - start}ms. ${tripTimes.length} trips total.`);
        return tripTimes;
    }

    /**
     * Convert a stop ID from the new format (`8300*****`) to the old one (`S*****`).
     * @param id the ID to convert
     * @returnsthe converted ID
     */
    private newToOldIdFormat(id: string): string {
        return "S" + id.slice(4);
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
            const departureStationId = this.newToOldIdFormat(trip.stops[0].id.split(":").at(-1)!);
            const realtimeInfo = await this.vtApiService.getTripInfo(trainNumber, departureStationId, new Date(trip.departureTime * 1000));

            if(!realtimeInfo || !realtimeInfo.lastRecordingTime) {
                // no realtime data (either trip completed or not started yet/data lost)
                //this.trackedTrips.delete(tripId);
                continue;
            }

            // TODO: tracking trips like this means that we retroactively include all trips that circulated that day. Do we drop them after X time?
            //       It'd be nice to keep them if they don't slow down the data gathering too much (has to comfortably stay under 60s).
            // keep track of trips that have realtime info, so we don't stop considering them if they're late and go out of the window defined in updateFeed()
            //this.trackedTrips.add(tripId);

            // TODO: add DIVERTED support
            // create stopUpdates for all stops with realtime data
            const stopUpdates = realtimeInfo.stops
                .filter(stop => stop.status !== StopStatus.NO_DATA && stop.status !== StopStatus.DIVERTED)
                .map(stop => {

                    // TODO how do we tackle this? Some stops have different IDs in NeTEx and Viaggiatreno data. Need some way to fix this rift.
                    const stopWithSameId = trip.stops.find(s => this.newToOldIdFormat(s.id.split(":").at(-1)!) === stop.stopId);
                    if(!stopWithSameId) {
                        this.logger.warn(`[${this.feedId}] Stop with Viaggiatreno ID ${stop.stopId} has no correspondence in OTP for train ${trip.tripId}`);
                        return; // we ignore these stops as we wouldn't know where they go in the sequence
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

        return toBinary(FeedMessageSchema, realtimeFeed);
    }
}
