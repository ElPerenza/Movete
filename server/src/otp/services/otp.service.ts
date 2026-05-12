import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StopTime } from '../models/stop-time.model';

@Injectable()
export class OtpService {

    // Official GTFS endpoint for OTP2
    private readonly otpGraphqlUrl = 'http://localhost:8080/otp/gtfs/v1';

    async getStopTimes(gtfsId: string): Promise<StopTime[]> {
        //GraphQL query to fetch stop times without grouping them by route patterns.
        const query = `
            query GetStopTimes($stopId: String!) {
                stop(id: $stopId) {
                    name
                    stoptimesWithoutPatterns {
                        headsign
                        scheduledArrival
                        scheduledDeparture
                        arrivalDelay
                        departureDelay
                        serviceDay
                        trip { gtfsId }
                    }
                }
            }
        `;

        try {
            // Execute the POST request to the local OTP GraphQL API
            const response = await fetch(this.otpGraphqlUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { stopId: gtfsId },
                }),
            });

            if (!response.ok) {
                throw new Error(`OTP HTTP Error: ${response.status}`);
            }

            const { data, errors } = await response.json();

            // Handle specific GraphQL syntax or execution errors returned by the server
            if (errors) {
                console.error("GraphQL errors from OTP:", errors);
                throw new Error("Error executing the GraphQL query against OTP2");
            }

            // Handle the case where the stop ID is valid in syntax but missing from the OTP graph
            if (!data.stop) {
                throw new HttpException('Stop not found in OTP2', HttpStatus.NOT_FOUND);
            }

            // Map the raw GraphQL response to StopTime DTO model
            const stopTimes: StopTime[] = data.stop.stoptimesWithoutPatterns.map((st: any) => {
                const stopTime = new StopTime();

                //Assign the destination name
                //If headsign is empty/unknown --> null
                stopTime.headsign = st.headsign || null;

                //Extract the parent trip's GTFS ID
                stopTime.tripId = st.trip?.gtfsId;


                // Time calculation (serviceDay + seconds) * 100
                stopTime.scheduledArrival = new Date((st.serviceDay + st.scheduledArrival) * 1000);
                stopTime.scheduledDeparture = new Date((st.serviceDay + st.scheduledDeparture) * 1000);

                //Map potential delays, defaulting to 0 seconds
                stopTime.arrivalDelay = st.arrivalDelay || 0;
                stopTime.departureDelay = st.departureDelay || 0;
                stopTime.realtime = false;

                return stopTime;
            });

            return stopTimes;

        } catch (error) {
            console.error("Failed to retrieve stop times:", error);
            throw new HttpException(
                'Internal error while retrieving transit data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
