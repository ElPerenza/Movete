import { Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { TripDates, TripDepartureArrivalTimes } from "../types/otp-types";
import { OtpRealtimeService } from "../services/otp-realtime.service";
import { FeedEntitySchema, FeedHeader_Incrementality, FeedMessageSchema } from "../../generated/gtfs-realtime_pb";
import { create, toBinary } from "@bufbuild/protobuf";
import { TrentinoTrasportiApiService } from "../services/trentino-trasporti-api.service";
import { GtfsRealtimeProvider } from "./gtfs-realtime-provider";

/**
 * A {@link GtfsRealtimeProvider} that sources data from the Trentino Trasporti API.
 */
export class TrentinoTrasportiGtfsRealtimeProvider implements GtfsRealtimeProvider {

    private readonly logger = new Logger(TrentinoTrasportiGtfsRealtimeProvider.name);

    private tripDates?: TripDates[];
    private runningToday?: TripDepartureArrivalTimes[];
    private feed?: Uint8Array

    constructor(
        private readonly realtimeService: OtpRealtimeService,
        private readonly ttApiService: TrentinoTrasportiApiService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly feedId: string
    ) {

        // cron job and interval must be added dynamically as we're not using NestJS DI (no @Injectable)
        // cronjob time is tied to specific timezones isn't it... not a problem as long as the server is running in the same timezone as the buses.
        const job = new CronJob("0 0 1 * * *", async () => {
            try {
                await this.updateTripsRunningToday();
            } catch(err) {
                this.logger.error(err);
            }
        });
        this.schedulerRegistry.addCronJob(`${feedId}-update-trips-running-today`, job);
        job.start();

        // arrow function to make sure it's called with the correct "this" reference (https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#functions_are_called_with_the_global_this)
        const interval = setInterval(async () => {
            try {
                await this.loop();
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

    async updateTripsRunningToday() {
        if(!this.tripDates) {
            this.tripDates = await this.realtimeService.getTripsDatesByFeed(this.feedId);
        }
        this.runningToday = await this.getTripsOriginDestinationTimes(this.tripDates, new Date());
    }

    async loop() {

        if(!this.runningToday) {
            await this.updateTripsRunningToday();
        }

        const now = Math.floor(Date.now() / 1000);
        const tripsCurrentlyRunning = this.runningToday!
            .filter(times => {
                return now >= times.departureTime && now <= times.arrivalTime;
            }).map(times => { 
                return { tripId: times.tripId, serviceDate: times.serviceDate };
            });
        
        this.feed = await this.createTripUpdatesFeed(tripsCurrentlyRunning);
    }

    private async getTripsOriginDestinationTimes(tripsDates: TripDates[], date: Date) {
        const serviceDate = this.realtimeService.formatAsYYYYMMDDD(date);
        const tripsRunning = tripsDates.filter(td => td.activeDates.includes(serviceDate))
        return await Promise.all(tripsRunning.map(async td => await this.realtimeService.getTripDepartureArrivalTimes(td.tripId, serviceDate)));
    }

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

    private async createTripUpdatesFeed(trips: { tripId: string, serviceDate: string }[]): Promise<Uint8Array> {

        const realtimeFeed = create(FeedMessageSchema, {
            header: {
                gtfsRealtimeVersion: "2.0",
                incrementality: FeedHeader_Incrementality.FULL_DATASET,
                timestamp: BigInt(Math.floor(Date.now() / 1000))
            }
        });

        for(const { tripId, serviceDate } of trips) {
            const apiTripId = tripId.substring(tripId.indexOf(":") + 1); // remove feedId

            const tripInfo = await this.ttApiService.getTripInfo(apiTripId);
            if(tripInfo.delay == null || tripInfo.stopLast == tripInfo.stopNext) {
                // no realtime data
                continue;
            }

            realtimeFeed.entity.push(create(FeedEntitySchema, {
                id: apiTripId,
                tripUpdate: {
                    timestamp: BigInt(Math.floor(Date.parse(tripInfo.lastEventRecivedAt) / 1000)),
                    trip: {
                        tripId: apiTripId,
                        startDate: serviceDate
                    },
                    stopTimeUpdate: [
                        {
                            // TODO:
                            // stopLast and stopNext aren't always 100% reliable, investigate using lastSequenceDetection
                            stopId: tripInfo.stopNext.toString(),
                            departure: {
                                delay: tripInfo.delay! * 60
                            }
                        }
                    ]
                }
            }));
        }

        return toBinary(FeedMessageSchema, realtimeFeed);
    }
}