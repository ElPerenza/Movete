import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StopTime } from '../models/stop-time.model';

@Injectable()
export class OtpService {

    // endpoint ufficiale GTFS per OTP2
    private readonly otpGraphqlUrl = 'http://localhost:8080/otp/gtfs/v1';

    async getStopTimes(gtfsId: string): Promise<StopTime[]> {
        // query ottimizzata per GTFS di OTP2
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
                throw new Error(`Errore HTTP da OTP: ${response.status}`);
            }

            const { data, errors } = await response.json();

            if (errors) {
                console.error("Errori GraphQL da OTP:", errors);
                throw new Error("Errore nella query GraphQL verso OTP2");
            }

            if (!data.stop) {
                throw new HttpException('Fermata non trovata in OTP2', HttpStatus.NOT_FOUND);
            }

            const stopTimes: StopTime[] = data.stop.stoptimesWithoutPatterns.map((st: any) => {
                const stopTime = new StopTime();

                stopTime.headsign = st.headsign || 'Sconosciuta';
                stopTime.tripId = st.trip?.gtfsId;

                // le date in OTP GTFS si calcolano sommando la mezzanotte (serviceDay) ai secondi
                stopTime.scheduledArrival = new Date((st.serviceDay + st.scheduledArrival) * 1000);
                stopTime.scheduledDeparture = new Date((st.serviceDay + st.scheduledDeparture) * 1000);

                stopTime.arrivalDelay = st.arrivalDelay || 0;
                stopTime.departureDelay = st.departureDelay || 0;
                stopTime.realtime = false;

                return stopTime;
            });

            return stopTimes;

        } catch (error) {
            console.error("Errore nel recupero degli stop times:", error);
            throw new HttpException(
                'Errore interno durante il recupero dei dati di trasporto',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
