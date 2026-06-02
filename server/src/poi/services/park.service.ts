import { Model } from "mongoose";
import { Logger, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Park, ParkDocument, ParkType } from "../models/park.schema"
import { CreateParkDto, UpdateParkDto } from "../dto/park.dto";
import { SearchParkRequestDto } from "../dto/search-park-request.dto";
import { ConfigService } from "@nestjs/config";
import { OtpService } from "../../otp/services/otp.service";
import { Point } from "../../common/point";

@Injectable()
export class ParkService implements OnApplicationBootstrap {
    private readonly logger = new Logger(ParkService.name, { timestamp: true });
    constructor(
        @InjectModel(Park.name) private parkModel: Model<Park>,
        private readonly configService: ConfigService,
        private readonly otpService: OtpService
    ) {}

    /**
     * Given a new park, it creates it and save it on the database.
     * @param park.
     * @returns the park created.
     */
    async create(park: CreateParkDto): Promise<ParkDocument> {
        this.logger.debug(`Creating park with the given params: ${park}`)
        return new this.parkModel(park).save();
    }

    /**
     * Return all parks that are in the database.
     * @returns list of all parks finded.
     */
    async findAll(): Promise<ParkDocument[]> {
        this.logger.debug(`Searching all parks`)
        return this.parkModel.find().exec();
    }

    /**
     * Given the id of park it search it on the database.
     * @param id 
     * @returns the park requested or null if not finded.
     */
    async findParkById(id: string): Promise<ParkDocument | null> {
        this.logger.debug(`Searching park with id: ${id}`)
        return this.parkModel.findById(id).exec();
    }

    /**
     * Find a park that includes a given OTP park.
     * @param otpId the OpenTripPlanner `gtfsId` to search for
     * @returns the park found or `null` if no park was found
     */
    async findParkByOtpId(otpId: string): Promise<ParkDocument | null> {
        this.logger.debug(`Searching park with OTP id: ${otpId}`);
        const result = await this.parkModel.find({ otpParks: otpId }).limit(1).exec();
        if(result.length === 0) {
            return null;
        }
        return result[0];
    }

    /**
     * Given the id and the paramater to update it update the park.
     * @param id, the park id.
     * @param updateData, the data to update, missing data will not be updated.
     * @returns the updated park.
     */
    async updateParkById(id: string, updateData: UpdateParkDto): Promise<ParkDocument | null> {
        this.logger.debug(`Updating park with id: ${id}`)
        this.logger.debug(`Updating park with params: ${JSON.stringify(updateData)}`)
        return this.parkModel.findByIdAndUpdate(id, updateData).exec();
    }

    /**
     * Given the id it delete the corresponding park.
     * @param id, the id of the park to delete.
     * @returns the deleted park, return null if nothing is deleted.
     */
    async deleteParkById(id: string): Promise<ParkDocument | null> {
        this.logger.debug(`Deleting park with id: ${id}`)
        return this.parkModel.findByIdAndDelete(id).exec();
    }
 
    /**
     * Given the request data, it search in the database with that filters.
     * If request is completily empty it return all parks.
     * @param request, data for filtering.
     * @returns the parks founded by the filter.
     */
    async search(request: SearchParkRequestDto): Promise<ParkDocument[]> {
        this.logger.debug(`Searching parks filtering by: ${JSON.stringify(request)}`)
        const query = this.parkModel.find();
        const boundingBox = request.bbox;
        const parkTypes = request.parkTypes

        if(boundingBox != null) {
            query.where('location').within({ 
                box:  [ 
                    [ boundingBox.bottomRight.coordinates[0], boundingBox.bottomRight.coordinates[1]], 
                    [ boundingBox.topLeft.coordinates[0], boundingBox.topLeft.coordinates[1] ] 
                ] 
            });
            
        }

        if(parkTypes != null && parkTypes.length > 0) {
            query.where('parkType').in(parkTypes);
        }

        return query.exec();
    };
    
    /**
     * On application bootstrap, populate the database with parks taken from OpenTripPlanner if env variable `POPULATE_PARK` is set.
     */
    async onApplicationBootstrap(): Promise<void> {

        if(this.configService.get<string>("POPULATE_PARK") !== "true") {
            this.logger.log("Variable 'POPULATE_PARK' not set: skipping park initialization");
            return;
        }
        this.logger.log("Variable 'POPULATE_PARK' set: initializing parks...");

        let parksAdded = 0;
        const otpCarParks = await this.otpService.getAllCarPark();
        for(const otpCarPark of otpCarParks) {
            if(await this.findParkByOtpId(otpCarPark.otpId) != null) {
                // we don't add OTP parks that already have their ID in the database
                continue;
            }

            const newPark = new CreateParkDto();
            newPark.name = otpCarPark.name;
            newPark.location = otpCarPark.location;
            newPark.otpId = otpCarPark.otpId;
            newPark.maxCapaity = otpCarPark.maxCapacity
            newPark.parkType = ParkType.CAR;
            await this.create(newPark);
            parksAdded++;
        }

        this.logger.log(`Park initialization complete: added ${parksAdded} of ${otpCarParks.length} parks present in OpenTripPlanner`);
        parksAdded = 0;
        const otpBikeParks = await this.otpService.getAllCarPark();
        for(const otpBikePark of otpBikeParks) {
            if(await this.findParkByOtpId(otpBikePark.otpId) != null) {
                // we don't add OTP parks that already have their ID in the database
                continue;
            }

            const newPark = new CreateParkDto();
            newPark.name = otpBikePark.name;
            newPark.location = otpBikePark.location;
            newPark.otpId = otpBikePark.otpId;
            newPark.maxCapaity = otpBikePark.maxCapacity
            newPark.parkType = ParkType.BIKE;
            await this.create(newPark);
            parksAdded++;
        }

        this.logger.log(`Park initialization complete: added ${parksAdded} of ${otpBikeParks.length} parks present in OpenTripPlanner`);
    }
}
