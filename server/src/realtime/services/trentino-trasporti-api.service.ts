import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TrentinoTrasportiTripResponse } from "../types/trentino-trasporti-trip-response";
import { TrentinoTrasportiError } from "../types/trentino-trasporti-error";

/**
 * Service to interface with the Trentino Trasporti/Muoversi in Trentino API.
 */
@Injectable()
export class TrentinoTrasportiApiService {

    private readonly API_URL: string;
    private readonly BASIC_AUTH : string

    constructor(configService: ConfigService) {
        this.API_URL = configService.getOrThrow("TT_API_URL");
        this.BASIC_AUTH = configService.getOrThrow("TT_API_AUTH");
    }

    /**
     * Retrieve scheduled and realtime information for a given trip.
     * @param tripdId the trip's ID
     * @returns the trip information
     */
    async getTripInfo(tripdId: string): Promise<TrentinoTrasportiTripResponse> {

        const response = await fetch(new URL(`trips/${tripdId}`, this.API_URL), { 
            headers: {
                "Authorization": `Basic ${this.BASIC_AUTH}`
            }
        });
        if(!response.ok) {
            const error: TrentinoTrasportiError = await response.json();
            throw new Error(`Error ${response.status}: ${error.message}`);
        }

        const responseBody = await response.text();
        // if you pass a non existent trip ID, the API just returns 200 and an empty body....
        if(responseBody.length === 0) {
            throw new Error(`Invalid Trentino Trasporti trip ID: ${tripdId}`);
        }
        return JSON.parse(responseBody);
    }
}