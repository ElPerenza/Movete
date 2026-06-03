import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClientService } from '../../graphql-client/services/graphql-client.service'
import { Stop, Stoptime, StoptimeType, StoptimeWithTripInfo, TripPathInformation } from '../types/otp-types';

/**
 * A OTP trip ID with its associated active dates in YYYYMMDD format.
 */
interface TripDates {
    tripId: string
    activeDates: string[]
}

/**
 * Service responsible for accessing OpenTripPlanner data through its GraphQL API.
 * 
 * For documentation regarding the raw GraphQL queries, see https://docs.opentripplanner.org/api/dev-2.x/graphql-gtfs/introduction
 */
@Injectable()
export class OtpService {

    private readonly OTP_GRAPHQL_URL: string;

    constructor(
        private readonly graphQlClient: GraphQLClientService,
        configService: ConfigService
    ) {
        this.OTP_GRAPHQL_URL = configService.getOrThrow("OTP_GRAPHQL_URL");
    }

    /**
     * Format a {@link Date} object or UNIX milliseconds timestamp as a YYYYMMDD string.
     * @param date the date to format
     * @returns the formatted date
     */
    formatAsYYYYMMDDD(date: Date | number): string {
        const dateObj = typeof date === "object" ? date : new Date(date);
        let dateString = dateObj.getFullYear().toString();
        if(dateObj.getMonth() + 1 >= 10) {
            dateString += (dateObj.getMonth() + 1).toString();
        } else {
            dateString += `0${dateObj.getMonth() + 1}`;
        }
        if(dateObj.getDate() >= 10) {
            dateString += dateObj.getDate().toString();
        } else {
            dateString += `0${dateObj.getDate()}`;
        }
        return dateString;
    }

    /**
     * Retrieve a number of trip arrivals/departures for the given stop.
     * @param stopId OTP ID of the stop
     * @param limit the number of stop times to retrieve
     * @returns the stop times for the given stops, or an empty array if non were found
     */
    async getStoptimes(stopId: string, limit: number): Promise<StoptimeWithTripInfo[]> {
        const query = `
            query GetStopTimes($stopId: String!, $numDepartures: Int!) {
                stop(id: $stopId) {
                    name
                    stoptimesWithoutPatterns(numberOfDepartures: $numDepartures) {
                        headsign
                        scheduledArrival
                        scheduledDeparture
                        arrivalDelay
                        departureDelay
                        serviceDay
                        realtime
                        stopPosition
                        trip {
                            gtfsId
                            route {
                                shortName
                            }
                            departureStoptime {
                                stopPosition
                            }
                            arrivalStoptime {
                                stopPosition
                                stop {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const data = await this.graphQlClient.makeQuery<{
            stop?: {
                name: string
                stoptimesWithoutPatterns: {
                    headsign: string
                    scheduledArrival: number
                    scheduledDeparture: number
                    arrivalDelay: number
                    departureDelay: number
                    serviceDay: number
                    realtime: boolean
                    stopPosition: number
                    trip: {
                        gtfsId: string
                        route: {
                            shortName: string
                        }
                        departureStoptime: {
                            stopPosition: number
                        }
                        arrivalStoptime: {
                            stopPosition: number
                            stop: {
                                name: string
                            }
                        }
                    }
                }[]
            }
        }>(this.OTP_GRAPHQL_URL, query, { stopId, numDepartures: limit });
        if(!data.stop) {
            return [];
        }

        const stopName = data.stop.name;
        return data.stop.stoptimesWithoutPatterns.map(st => {

            let stopType: StoptimeType = 'INTERMEDIATE';
            if(st.stopPosition === st.trip.departureStoptime.stopPosition) {
                stopType = 'ORIGIN';
            } else if(st.stopPosition === st.trip.arrivalStoptime.stopPosition) {
                stopType = 'DESTINATION';
            }

            return {
                stoptime: {
                    stopName: stopName,
                    scheduledArrival: new Date((st.serviceDay + st.scheduledArrival) * 1000),
                    scheduledDeparture: new Date((st.serviceDay + st.scheduledDeparture) * 1000),
                    arrivalDelay: st.arrivalDelay,
                    departureDelay: st.departureDelay,
                    realtime: st.realtime
                },
                tripInfo: {
                    id: st.trip.gtfsId,
                    headsign: st.headsign === "" ? st.trip.arrivalStoptime.stop.name : st.headsign, // if no headsign, use name of trip destination
                    routeShortName: st.trip.route.shortName,
                    serviceDate: new Date(st.serviceDay * 1000)
                },
                stopType: stopType
            }
        });
    }

    /**
     * Retrieve a trip's stoptimes for the given service date.
     * @param tripId OTP ID of the trip
     * @param serviceDate the service date for the stop times
     * @returns the trip's stoptimes, or an empty array if none were found
     */
    async getTripStoptimes(tripId: string, serviceDate: Date): Promise<Stoptime[]> {
        const query = `
            query GetTripDetails($tripId: String!, $serviceDate: String!) {
                trip(id: $tripId) {
                    activeDates
                    stoptimesForDate(serviceDate: $serviceDate) {
                        stop {
                            name
                        }
                        scheduledArrival
                        arrivalDelay
                        scheduledDeparture
                        departureDelay
                        realtime
                    }
                }
            }
        `;

        const serviceDateString = this.formatAsYYYYMMDDD(serviceDate);
        const data = await this.graphQlClient.makeQuery<{
            trip?: {
                activeDates: string[]
                stoptimesForDate: {
                    stop: {
                        name: string
                    }
                    scheduledArrival: number
                    arrivalDelay: number
                    scheduledDeparture: number
                    departureDelay: number
                    realtime: boolean
                }[]
            }
        }>(this.OTP_GRAPHQL_URL, query, { tripId, serviceDate: serviceDateString });
        // stoptimesForDate() still returns data even if the trip is not active on the given date..... so we manually check
        if(!data.trip || !data.trip.activeDates.includes(serviceDateString)) {
            return [];
        }

        const midnight = new Date(serviceDate);
        midnight.setHours(0, 0, 0, 0);

        return data.trip.stoptimesForDate.map(st => {
            return {
                stopName: st.stop.name,
                scheduledArrival: new Date(midnight.getTime() + (st.scheduledArrival * 1000)),
                scheduledDeparture: new Date(midnight.getTime() + (st.scheduledDeparture * 1000)),
                arrivalDelay: st.arrivalDelay,
                departureDelay: st.departureDelay,
                realtime: st.realtime
            };
        });
    }

    /**
     * Retrieve all stops stored in OpenTripPlanner.
     * @returns all OTP stops
     */
    async getAllStops(): Promise<Stop[]> {
        const query = `
            query GetAllStops {
                stops {
                    id: gtfsId
                    name
                    lat
                    lon
                    vehicleMode
                }
            }
        `;
        const { stops } = await this.graphQlClient.makeQuery<{ stops: Stop[] }>(this.OTP_GRAPHQL_URL, query, undefined);
        return stops;
    }

    /**
     * Retrieve all trips' pathing information for a given feed that run on the specified service date.
     * @param feedId the OTP feed ID
     * @param serviceDate the service date
     * @returns all of the feed's trips running on the given date
     */
    async getTripPathsByFeed(feedId: string, serviceDate: Date): Promise<TripPathInformation[]> {
        const serviceDateString = this.formatAsYYYYMMDDD(serviceDate);
        const activeTrips = 
            (await this.getTripsDatesByFeed(feedId))
                .filter(td => td.activeDates.includes(serviceDateString))
                .map(async td => await this.getTripPathInfo(td.tripId, serviceDateString));
        return Promise.all(activeTrips);
    }

    /**
     * Retrieve a trip's departure and arrival times and stop sequence numbers for a specific service date.
     * @param tripId id of the trip
     * @param serviceDate date for which to get times, in YYYYMMDD format
     * @returns the trip's departure and arrival times
     */
    private async getTripPathInfo(tripId: string, serviceDate: string): Promise<TripPathInformation> {
        
        const query = `
            query TripDepartureArrivalTimes($tripId: String!, $serviceDate: String!) {
                trip(id: $tripId) {
                    departureStoptime(serviceDate: $serviceDate) {
                        serviceDay
                        scheduledDeparture
                    }
                    arrivalStoptime(serviceDate: $serviceDate) {
                        scheduledArrival
                    }
                    stoptimesForDate(serviceDate: $serviceDate) {
                        stop {
                            gtfsId
                        }
                        stopPosition
                    }
                }
            }
        `;
        const { trip: tripTimes } = await this.graphQlClient.makeQuery<{ 
            trip: {
                departureStoptime: {
                    serviceDay: number
                    scheduledDeparture: number
                }
                arrivalStoptime: {
                    scheduledArrival: number
                }
                stoptimesForDate: {
                    stop: { 
                        gtfsId: string 
                    }
                    stopPosition: number
                }[]
            }
        }>(this.OTP_GRAPHQL_URL, query, { tripId: tripId, serviceDate: serviceDate });

        const serviceDay = tripTimes.departureStoptime.serviceDay;
        return {
            tripId,
            serviceDate,
            departureTime: serviceDay + tripTimes.departureStoptime.scheduledDeparture,
            arrivalTime: serviceDay + tripTimes.arrivalStoptime.scheduledArrival,
            stops: tripTimes.stoptimesForDate.map(st => {
                return {
                    id: st.stop.gtfsId,
                    sequenceNumber: st.stopPosition
                };
            })
        };
    }

    /**
     * Retrieve all trips with their associated active dates for a specific feed.
     * @param feedId id of the feed
     * @returns all of `feedId`'s trips and their active dates
     */
    private async getTripsDatesByFeed(feedId: string): Promise<TripDates[]> {
        const query = `
            query TripsDatesByFeed($feedId: String!) {
                trips(feeds: [$feedId]) {
                    tripId: gtfsId
                    activeDates
                }
            }
        `;
        const { trips: tripDates } = await this.graphQlClient.makeQuery<{ trips: TripDates[] }>(this.OTP_GRAPHQL_URL, query, { feedId: feedId });
        return tripDates;
    }
}
