import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Stop, StopDocument } from "../models/stop.schema"
import { CreateStopDto, UpdateStopDto } from "../dto/stop.dto";
import { SearchStopRequestDto } from "../dto/search-stop-request.dto";

@Injectable()
export class StopService {
    constructor(
        @InjectModel(Stop.name) private stopModel: Model<Stop>
    ) {}

    async create(stop: CreateStopDto): Promise<StopDocument> {
        return new this.stopModel(stop).save();
    }

    async findAll(): Promise<StopDocument[]> {
        return this.stopModel.find().exec();
    }

    async findStopById(id: string): Promise<StopDocument | null> {
        return this.stopModel.findById(id).exec();
    }

    async updateStopById(id: string, updateData: UpdateStopDto): Promise<StopDocument | null> {
        return this.stopModel.findByIdAndUpdate(id, updateData).exec();
    }

    async deleteStopById(id: string): Promise<StopDocument | null> {
        return this.stopModel.findByIdAndDelete(id).exec();
    }
 
    async search(request: SearchStopRequestDto): Promise<StopDocument[]> {
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

        if(transportTypes != null) {
            query.where('transportModes').in(transportTypes);
        }

        return query.exec();
    };
    
}
