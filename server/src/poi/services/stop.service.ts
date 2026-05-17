import { Model } from "mongoose";
import { Logger, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Stop, StopDocument } from "../models/stop.schema"
import { CreateStopDto, UpdateStopDto } from "../dto/stop.dto";
import { SearchStopRequestDto } from "../dto/search-stop-request.dto";
import { ConfigService } from "@nestjs/config";
import { OtpService } from "../../otp/services/otp.service";
import { Point } from "../../common/point";

@Injectable()
export class StopService implements OnApplicationBootstrap {
    private readonly logger = new Logger(StopService.name, { timestamp: true });
    constructor(
        @InjectModel(Stop.name) private stopModel: Model<Stop>,
        private readonly configService: ConfigService,
        private readonly otpService: OtpService
    ) {}

    /**
     * Given a new stop, it creates it and save it on the database.
     * @param stop.
     * @returns the stop created.
     */
    async create(stop: CreateStopDto): Promise<StopDocument> {
        this.logger.debug(`Creating stop with the given params: ${stop}`)
        return new this.stopModel(stop).save();
    }

    /**
     * Return all stops that are in the database.
     * @returns list of all stops finded.
     */
    async findAll(): Promise<StopDocument[]> {
        this.logger.debug(`Searching all stops`)
        return this.stopModel.find().exec();
    }

    /**
     * Given the id of stop it search it on the database.
     * @param id 
     * @returns the stop requested or null if not finded.
     */
    async findStopById(id: string): Promise<StopDocument | null> {
        this.logger.debug(`Searching stop with id: ${id}`)
        return this.stopModel.findById(id).exec();
    }

    /**
     * Find a stop that includes a given OTP stop.
     * @param otpId the OpenTripPlanner `gtfsId` to search for
     * @returns the stop found or `null` if no stop was found
     */
    async findStopByOtpId(otpId: string): Promise<StopDocument | null> {
        this.logger.debug(`Searching stop with OTP id: ${otpId}`);
        const result = await this.stopModel.find({ otpStops: otpId }).limit(1).exec();
        if(result.length === 0) {
            return null;
        }
        return result[0];
    }

    /**
     * Given the id and the paramater to update it update the stop.
     * @param id, the stop id.
     * @param updateData, the data to update, missing data will not be updated.
     * @returns the updated stop.
     */
    async updateStopById(id: string, updateData: UpdateStopDto): Promise<StopDocument | null> {
        this.logger.debug(`Updating stop with id: ${id}`)
        this.logger.debug(`Updating stop with params: ${JSON.stringify(updateData)}`)
        return this.stopModel.findByIdAndUpdate(id, updateData).exec();
    }

    /**
     * Given the id it delete the corresponding stop.
     * @param id, the id of the stop to delete.
     * @returns the deleted stop, return null if nothing is deleted.
     */
    async deleteStopById(id: string): Promise<StopDocument | null> {
        this.logger.debug(`Deleting stop with id: ${id}`)
        return this.stopModel.findByIdAndDelete(id).exec();
    }
 
    /**
     * Given the request data, it search in the database with that filters.
     * If request is completily empty it return all stops.
     * @param request, data for filtering.
     * @returns the stops founded by the filter.
     */
    async search(request: SearchStopRequestDto): Promise<StopDocument[]> {
        this.logger.debug(`Searching stops filtering by: ${JSON.stringify(request)}`)
        const query = this.stopModel.find();
        const boundingBox = request.bbox;
        const transportTypes = request.transportTypes

        if(boundingBox != null) {
            query.where('location').within({ 
                box:  [ 
                    [ boundingBox.bottomRight.coordinates[0], boundingBox.bottomRight.coordinates[1]], 
                    [ boundingBox.topLeft.coordinates[0], boundingBox.topLeft.coordinates[1] ] 
                ] 
            });
            
        }

        if(transportTypes != null && transportTypes.length > 0) {
            query.where('transportModes').in(transportTypes);
        }

        return query.exec();
    };
    
    /**
     * On application bootstrap, populate the database with stops taken from OpenTripPlanner if env variable `POPULATE_STOPS` is set.
     */
    async onApplicationBootstrap(): Promise<void> {

        if(this.configService.get<string>("POPULATE_STOPS") !== "true") {
            this.logger.log("Variable 'POPULATE_STOPS' not set: skipping stop initialization");
            return;
        }
        this.logger.log("Variable 'POPULATE_STOPS' set: initializing stops...");

        let stopsAdded = 0;
        const otpStops = await this.otpService.getAllStops();
        for(const otpStop of otpStops) {
            if(await this.findStopByOtpId(otpStop.gtfsId) != null) {
                // we don't add OTP stops that already have their ID in the database
                continue;
            }

            const newStop = new CreateStopDto();
            newStop.name = otpStop.name;
            newStop.otpStops = [otpStop.gtfsId];
            newStop.location = new Point();
            newStop.location.coordinates = [otpStop.lon, otpStop.lat];
            newStop.transportModes = [otpStop.vehicleMode === "RAIL" ? "TRAIN" : otpStop.vehicleMode]; // map RAIL to TRAIN
            await this.create(newStop);
            stopsAdded++;
        }

        this.logger.log(`Stop initialization complete: added ${stopsAdded} of ${otpStops.length} stops present in OpenTripPlanner`);
    }
}
