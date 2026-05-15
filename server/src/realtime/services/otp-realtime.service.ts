import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClientService } from '../../graphql-client/services/graphql-client.service';
import { TripDates, TripDepartureArrivalTimes } from '../types/otp-types';

/**
 * A service providing access to OpenTripPlanner data needed by the GTFS Realtime providers.
 */
@Injectable()
export class OtpRealtimeService {

    private readonly OTP_GRAPHQL_URL: string;

    constructor(
        private readonly graphQLClient: GraphQLClientService,
        configService: ConfigService
    ) {
        this.OTP_GRAPHQL_URL = configService.getOrThrow("OTP_GRAPHQL_URL");
    }

    /**
     * Format a {@link Date} object as a YYYYMMDD string.
     * @param date the date to format
     * @returns the formatted date
     */
    formatAsYYYYMMDDD(date: Date): string {
        let dateString = date.getFullYear().toString();
        if(date.getMonth() + 1 >= 10) {
            dateString += (date.getMonth() + 1).toString();
        } else {
            dateString += `0${date.getMonth() + 1}`;
        }
        if(date.getDate() >= 10) {
            dateString += date.getDate().toString();
        } else {
            dateString += `0${date.getDate()}`;
        }
        return dateString;
    }

    /**
     * Retrieve all trips with their associated active dates for a specific feed.
     * @param feedId id of the feed
     * @returns all of `feedId`'s trips and their active dates
     */
    async getTripsDatesByFeed(feedId: string): Promise<TripDates[]> {
        const query = `
            query TripsDatesByFeed($feedId: String!) {
                trips(feeds: [$feedId]) {
                    tripId: gtfsId
                    activeDates
                }
            }
        `;
        const { trips: tripDates } = await this.graphQLClient.makeQuery<{ trips: TripDates[] }>(this.OTP_GRAPHQL_URL, query, { feedId: feedId });
        return tripDates;
    }

    /**
     * Retrieve a trip's departure and arrival times (origin/destination, not single stop) for a specific service date.
     * @param tripId id of the trip
     * @param serviceDate date for which to get times, in YYYYMMDD format
     * @returns the trip's departure and arrival times
     */
    async getTripDepartureArrivalTimes(tripId: string, serviceDate: string): Promise<TripDepartureArrivalTimes> {
        const query = `
            query TripDepartureArrivalTimes($tripId: String!, $serviceDate: String!) {
                trip(id: $tripId) {
                    departureStoptime(serviceDate: $serviceDate) {
                        serviceDay
                        scheduledDeparture
                    }
                    arrivalStoptime(serviceDate: $serviceDate) {
                        serviceDay
                        scheduledArrival
                    }
                }
            }
        `;
        const { trip: tripTimes } = await this.graphQLClient.makeQuery<{ 
            trip: {
                departureStoptime: {
                    serviceDay: number
                    scheduledDeparture: number
                }
                arrivalStoptime: {
                    serviceDay: number
                    scheduledArrival: number
                }
            }
        }>(this.OTP_GRAPHQL_URL, query, { tripId: tripId, serviceDate: serviceDate });
        return {
            tripId,
            serviceDate,
            departureTime: tripTimes.departureStoptime.serviceDay + tripTimes.departureStoptime.scheduledDeparture,
            arrivalTime: tripTimes.arrivalStoptime.serviceDay + tripTimes.arrivalStoptime.scheduledArrival
        }
    }
}
