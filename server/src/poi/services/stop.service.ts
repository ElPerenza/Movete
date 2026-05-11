import { Model } from "mongoose";
import { Logger, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Stop, StopDocument } from "../models/stop.schema"
import { CreateStopDto, UpdateStopDto } from "../dto/stop.dto";
import { SearchStopRequestDto } from "../dto/search-stop-request.dto";

@Injectable()
export class StopService {
    private readonly logger = new Logger(StopService.name, { timestamp: true });
    constructor(
        @InjectModel(Stop.name) private stopModel: Model<Stop>
    ) {}

    /**
     * Given a new stop, it creates it and save it on the database.
     * @param stop.
     * @returns the stop created.
     */
    async create(stop: CreateStopDto): Promise<StopDocument> {
        this.logger.log(`Creating stop with the given params: ${stop}`)
        return new this.stopModel(stop).save();
    }

    /**
     * Return all stops that are in the database.
     * @returns list of all stops finded.
     */
    async findAll(): Promise<StopDocument[]> {
        this.logger.log(`Searching all stops`)
        return this.stopModel.find().exec();
    }

    /**
     * Given the id of stop it search it on the database.
     * @param id 
     * @returns the stop requested or null if not finded.
     */
    async findStopById(id: string): Promise<StopDocument | null> {
        this.logger.log(`Searching stop with id: ${id}`)
        return this.stopModel.findById(id).exec();
    }

    /**
     * Given the id and the paramater to update it update the stop.
     * @param id, the stop id.
     * @param updateData, the data to update, missing data will not be updated.
     * @returns the updated stop.
     */
    async updateStopById(id: string, updateData: UpdateStopDto): Promise<StopDocument | null> {
        this.logger.log(`Updating stop with id: ${id}`)
        this.logger.log(`Updating stop with params: ${JSON.stringify(updateData)}`)
        return this.stopModel.findByIdAndUpdate(id, updateData).exec();
    }

    /**
     * Given the id it delete the corresponding stop.
     * @param id, the id of the stop to delete.
     * @returns the deleted stop, return null if nothing is deleted.
     */
    async deleteStopById(id: string): Promise<StopDocument | null> {
        this.logger.log(`Deleting stop with id: ${id}`)
        return this.stopModel.findByIdAndDelete(id).exec();
    }
 
    /**
     * Given the request data, it search in the database with that filters.
     * If request is completily empty it return all stops.
     * @param request, data for filtering.
     * @returns the stops founded by the filter.
     */
    async search(request: SearchStopRequestDto): Promise<StopDocument[]> {
        this.logger.log(`Searching stops filtering by: ${JSON.stringify(request)}`)
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
    
}
