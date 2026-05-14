import { Logger, Injectable } from "@nestjs/common";
import { PathRequestDto } from "../dto/pathRequest.dto";


@Injectable()
export class PathService {
    private readonly otpGraphqlUrl = 'http://localhost:8080/otp/transmodel/v3';
    private readonly logger = new Logger(PathService.name, { timestamp: true })
    
    constructor() {}

    /**
     * This method call the transmodel API of OTP for creating a path
     * @param request The parameter of the path the user want to create
     * @returns A JSON that contain a list of possible path
     */
    async findPath(request: PathRequestDto): Promise<string> {
        this.logger.log(JSON.stringify(request));

        const query = 
        `query trip($dateTime: DateTime, $from: Location!, $modes: Modes, $to: Location!, $arriveBy: Boolean) {
            trip(dateTime: $dateTime, from: $from, modes: $modes, to: $to, arriveBy: $arriveBy) {
                previousPageCursor
                nextPageCursor
                tripPatterns {
                    aimedStartTime
                    aimedEndTime
                    expectedEndTime
                    expectedStartTime
                    duration
                    distance
                    generalizedCost
                    legs {
                        id
                        mode
                        aimedStartTime
                        aimedEndTime
                        expectedEndTime
                        expectedStartTime
                        realtime
                        distance
                        duration
                        generalizedCost
                        fromPlace {
                        name
                            quay {
                                id
                            }
                        }
                        toPlace {
                            name
                            quay {
                                id
                            }
                        }
                        fromEstimatedCall {
                            destinationDisplay {
                                frontText
                            }
                        }
                        line {
                            publicCode
                            name
                            id
                            presentation {
                                colour
                            }
                        }
                        authority {
                            name
                            id
                        }
                        pointsOnLink {
                            points
                        }
                        interchangeTo {
                            staySeated
                        }
                        interchangeFrom {
                            staySeated
                        }
                    }
                    systemNotices {
                        tag
                    }
                }
            }
        }`;

        const response = await fetch(this.otpGraphqlUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: this.requestToJson(request),
                })
            });

        const { data, errors } = await response.json();

        return JSON.stringify(data);
    }

    /**
     * support method that transform request object in JSON format for OpenTripPlanner
     * @param request 
     * @returns The Json for the OTP query
     */
    private requestToJson(request: PathRequestDto): {from: any, to: any, dateTime: Date, modes?: any, arriveBy?: boolean} {
        const json:{from: any, to: any, dateTime: Date, modes?: any, arriveBy?: boolean} = {
            "from" : {
                "coordinates" : {
                    "latitude" : request.from.latitude,
                    "longitude" : request.from.longitude
                }
            },
            "to" : {
                "coordinates" : {
                    "latitude" : request.to.latitude,
                    "longitude" : request.to.longitude
                }
            },
            "dateTime" : request.dateTime,   
        }
        const modes: {accessMode?: string, transportModes?: {"transportMode": string}[], egressMode?: string, directMode?: string} = {}
        if (request.modes.accessMode != null) {
            modes.accessMode = request.modes.accessMode;
        }
        const transportModes: {transportMode: string}[] = [];
        if (request.modes.transportModes != null && request.modes.transportModes.length > 0) {
            request.modes.transportModes.forEach((element, index) => {
                transportModes[index] = {"transportMode" : element};
            });
            modes.transportModes = transportModes;
        }

        if (request.modes.egressMode != null) {
            modes.egressMode = request.modes.egressMode;
        }

        if (request.modes.directMode != null) {
            modes.directMode = request.modes.directMode
        }
        
        if (Object.keys(modes).length !== 0) {
            json.modes = modes;
        }

        json.arriveBy = request.arriveBy;

        return json;
    }
}