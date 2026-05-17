import { Logger, Injectable } from "@nestjs/common";
import { PathRequestDto } from "../dto/pathRequest.dto";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class PathService {
    private readonly OTP_GRAPHQL_URL: string;
    private readonly logger = new Logger(PathService.name, { timestamp: true })
    
    constructor(configService: ConfigService) {
        this.OTP_GRAPHQL_URL = configService.getOrThrow("OTP_GRAPHQL_URL");
    }

    /**
     * This method call the transmodel API of OTP for creating a path (in gtfs)
     * @param request The parameter of the path the user want to create
     * @returns A JSON that contain a list of possible path
     */
    async findPathGtfs(request: PathRequestDto): Promise<string> {
        const query = `
            query planConnection(
                $origin: PlanLabeledLocationInput!
                $destination: PlanLabeledLocationInput!
                $dateTime: PlanDateTimeInput
                $modes: PlanModesInput
                $first: Int
            ) {
                planConnection(
                    origin: $origin
                    destination: $destination
                    dateTime: $dateTime
                    modes: $modes
                    first: $first
                ) {
                    edges {
                    cursor
                    node {
                        startTime
                        endTime
                        duration
                            legs {
                                    mode
                                    startTime
                                    endTime
                                    realTime
                                    distance
                                    duration
                                    from {
                                        name
                                        stop { id gtfsId }
                                    }
                                    to {
                                        name
                                        stop { id gtfsId }
                                    }
                                    trip {
                                        tripHeadsign
                                        gtfsId
                                    }
                                    route {
                                        shortName
                                        longName
                                        gtfsId
                                        color
                                    }
                                    agency {
                                        name
                                        gtfsId
                                    }
                                    legGeometry {
                                        points
                                        length
                                    }   
                                }
                            }
                        }
                    }
                }`;
        const response = await fetch(this.OTP_GRAPHQL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: this.requestToVariables(request),
                })
            });

        this.logger.log(JSON.stringify(this.requestToVariables(request)));
        const { data, errors } = await response.json();
        this.logger.log(JSON.stringify(errors));
        return JSON.stringify(data);
    }

    /**
     * support method that transform request object in JSON format for OpenTripPlanner
     * @param request 
     * @returns The Json for the OTP query
     */
    private requestToVariables(request: PathRequestDto) {
       const modes: {transit?: any, direct?: string[], directOnly: boolean, transitOnly: boolean} = {directOnly: false, transitOnly: false};

        const transit: {
            access?: string[];
            egress?: string[];
            transfer?: string[];
            transit?: { mode: string }[];
        } = {};
        if (request.modes?.accessMode) {
            transit.access = [request.modes.accessMode.toUpperCase()];
        }

        if (request.modes?.egressMode) {
            transit.egress = [request.modes.egressMode.toUpperCase()];
        }

        if (request.modes?.directMode) {
            modes.direct = [request.modes.directMode.toUpperCase()];
        }

        if (request.modes?.transportModes?.length) {
            transit.transit = request.modes.transportModes.map(m => ({
                mode: m.toUpperCase()
            }));
        }


        modes.transit = transit;
        

        const dateTime: {latestArrival?: string, earliestDeparture?: string} = {}
        if (request.arriveBy) {
            dateTime.latestArrival = request.dateTime;
        } else {
            dateTime.earliestDeparture = request.dateTime;
        }
        return {
            origin: {
                location: {
                    coordinate: {
                        latitude: request.from.latitude,
                        longitude: request.from.longitude
                    }
                }
            },

            destination: {
                location: {
                    coordinate: {
                        latitude: request.to.latitude,
                        longitude: request.to.longitude
                    }
                }
            },

            dateTime: dateTime,

            modes: modes,

            first: 5,
            arriveBy: request.arriveBy ?? false,

            preferences: {
                "street": {
                    "walk": {
                        "boardCost": 100,
                        "reluctance": 1.0,    
                        "safetyFactor": 0.25,
                        "speed": 1.43          
                    }
                }
            }
        };
    }
}