import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StopTime } from '../models/stop-time.model';

@Injectable()
export class OtpService {

    // Official GTFS endpoint for OTP2
    private readonly otpGraphqlUrl = 'http://localhost:8080/otp/gtfs/v1';

    // Accepts an array of strings to handle multiple GTFS IDs for a single logical stop
    async getStopTimes(gtfsIds: string[]): Promise<StopTime[]> {
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
                        trip { gtfsId }
                    }
                }
            }
        `;

        try {
            // POST requests to the local OTP GraphQL API in parallel
            const fetchPromises = gtfsIds.map(async (gtfsId) => {
                const response = await fetch(this.otpGraphqlUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        query,
                        variables: {
                            stopId: gtfsId,
                            numDepartures: 30 // Requesting 30 departures instead of the default 5
                        },
                    }),
                });

                if (!response.ok) {
                    console.error(`OTP HTTP Error for id ${gtfsId}: ${response.status}`);
                    // Return an empty array for this specific ID to avoid failing the entire request
                    return [];
                }

                const { data, errors } = await response.json();

                // Handle specific GraphQL syntax errors or the case where the stop ID is missing from the OTP graph
                if (errors || !data?.stop) {
                    if (errors) console.error("GraphQL errors from OTP:", errors);
                    return [];
                }

                // Map the raw GraphQL response to StopTime DTO model
                return data.stop.stoptimesWithoutPatterns.map((st: any) => {
                    const stopTime = new StopTime();

                    // Assign the destination name
                    // If headsign is empty/unknown --> null
                    stopTime.headsign = st.headsign || null;

                    // Extract the parent trip's GTFS ID
                    stopTime.tripId = st.trip?.gtfsId;

                    // Time calculation: (serviceDay + seconds) * 1000 to get milliseconds for Date object
                    stopTime.scheduledArrival = new Date((st.serviceDay + st.scheduledArrival) * 1000);
                    stopTime.scheduledDeparture = new Date((st.serviceDay + st.scheduledDeparture) * 1000);

                    // Map potential delays, defaulting to 0 seconds
                    stopTime.arrivalDelay = st.arrivalDelay || 0;
                    stopTime.departureDelay = st.departureDelay || 0;

                    // Indicates whether the timing data includes live real-time updates
                    stopTime.realtime = st.realtime || false;

                    return stopTime;
                });
            });

            // Wait for all parallel fetches to complete
            const resultsArray = await Promise.all(fetchPromises);

            // Flatten the array of arrays into a single flat list
            const allStopTimes: StopTime[] = resultsArray.flat();

            // Sort all stop times chronologically by scheduled departure
            allStopTimes.sort((a, b) => a.scheduledDeparture.getTime() - b.scheduledDeparture.getTime());

            return allStopTimes;

        } catch (error) {
            console.error("Failed to retrieve stop times:", error);
            throw new HttpException(
                'Internal error while retrieving transit data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
