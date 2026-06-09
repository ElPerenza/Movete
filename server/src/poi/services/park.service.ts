import { Model } from "mongoose";
import { Logger, Injectable, OnApplicationBootstrap, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Park, ParkDocument, ParkType } from "../models/park.schema"
import { CreateParkDto, UpdateParkDto } from "../dto/park.dto";
import { SearchParkRequestDto } from "../dto/search-park-request.dto";
import { ConfigService } from "@nestjs/config";
import { OtpService } from "../../otp/services/otp.service";
import { Point } from "../../common/point";
import { throwError } from "rxjs";
import { ParkFeedbackDto } from "../dto/park-feedback.dto";
import { ParkFeedback, ParkFeedbackDocument } from "../models/parkFeedback.schema";
import { WeeklyOverview } from "../../common/statistics";

@Injectable()
export class ParkingService implements OnApplicationBootstrap {
    private readonly logger = new Logger(ParkingService.name, { timestamp: true });
    constructor(
        @InjectModel(Park.name) private parkModel: Model<Park>,
        @InjectModel(ParkFeedback.name) private ParkFeedbackModel: Model<ParkFeedbackDto>,
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
        const result = await this.parkModel.findOne({ otpId }).exec();
        return result;
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
     * Extracts [longitude, latitude] coordinates from a WKT string like "POINT(11.113621 46.0702)"
     */
    private parseWktPoint(wkt: string): [number, number] {
        const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
            const lng = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            return [lng, lat];
        }
        else return [0, 0];
    }

    /**
     * Geospatial calculation using Haversine Formula
     */
    private getDistanceInMeters(coord1: [number, number], coord2: [number, number]): number {
        const R = 6371000; // Earth's radius in meters
        const lat1 = (coord1[1] * Math.PI) / 180;
        const lat2 = (coord2[1] * Math.PI) / 180;
        const deltaLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
        const deltaLng = ((coord2[0] - coord1[0]) * Math.PI) / 180;

        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
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
        const dbParks: ParkDocument[] = await query.exec();

        let externalParks: any[] = [];
        try {
            const response = await fetch('https://parcheggi.comune.trento.it/static/services/registry_parks.json');
            if (response.ok) {
                const data = await response.json();
                externalParks = Array.isArray(data) ? data : (data.parks || []);
            }
        } catch (error) {
            this.logger.error(`Failed to fetch external parks: ${error}`);
            // Fallback gracefully to standard database records if target endpoint fails
            return dbParks;
        }
        externalParks.forEach(externalPark => {
            var exist = false;
            var externalType = externalPark.type !== "park" ? externalPark.type : "car";
            const externalCoords: [number, number] = this.parseWktPoint(externalPark.geom);
            var currentPark  = new this.parkModel();
            dbParks.forEach(park => {
                if (this.getDistanceInMeters(park.location.coordinates, externalCoords) <= 100){
                    if (externalType === park.parkType) {
                        exist = true
                        currentPark = park;
                        return ;
                    }
                }
            })

            if (exist){
                currentPark.trentinoApiId = externalPark.id;
                currentPark.currentCapacity = externalPark.freeslots;
            } else {
                currentPark.otpId = ""
                currentPark.trentinoApiId = externalPark.id;
                currentPark.name = externalPark.name;
                currentPark.location.type = "Point";
                currentPark.location.coordinates = externalCoords;
                currentPark.parkType = externalPark.type !== "park" ? externalPark.type : "car";
                currentPark.maxCapacity = externalPark.capacity;
                currentPark.currentCapacity = externalPark.freeslots;
            }
            if(currentPark.parkType in request.parkTypes){
                dbParks.push(currentPark);
            }
        });
        return dbParks;
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
            newPark.maxCapacity = otpCarPark.maxCapacity
            newPark.parkType = ParkType.CAR;
            await this.create(newPark);
            parksAdded++;
        }

        this.logger.log(`Park initialization complete: added ${parksAdded} of ${otpCarParks.length} parks present in OpenTripPlanner`);
        parksAdded = 0;
        const otpBikeParks = await this.otpService.getAllBikePark();
        for(const otpBikePark of otpBikeParks) {
            if(await this.findParkByOtpId(otpBikePark.otpId) != null) {
                // we don't add OTP parks that already have their ID in the database
                continue;
            }

            const newPark = new CreateParkDto();
            newPark.name = otpBikePark.name;
            newPark.location = otpBikePark.location;
            newPark.otpId = otpBikePark.otpId;
            newPark.maxCapacity = otpBikePark.maxCapacity
            newPark.parkType = ParkType.BIKE;
            await this.create(newPark);
            parksAdded++;
        }

        this.logger.log(`Bike park initialization complete: added ${parksAdded} of ${otpBikeParks.length} bike parks present in OpenTripPlanner`);
    }

    async createParkFeedback(feedback: ParkFeedbackDto): Promise<ParkFeedbackDto> {
        this.logger.debug(`Creating Park feedback with the given params: ${JSON.stringify(feedback)}`);
        return new this.ParkFeedbackModel(feedback).save();
    }

    async updateParkFeedback(feedback: ParkFeedbackDto): Promise<ParkFeedbackDocument | null> {
        const updatedDocument = await this.ParkFeedbackModel.findOneAndUpdate(
            { parkId: feedback.parkId, userId: feedback.userId, day: feedback.day },
            { $set: feedback },
            { new: true, runValidators: true } // Ritorna il documento modificato ed esegue i validatori del DTO
        ).exec();

        if (!updatedDocument) {
            throw new NotFoundException(`Impossibile trovare il feedback del parcheggio da aggiornare.`);
        }
        this.logger.log(updatedDocument);
        return updatedDocument;
    }

    async getParkFeedback(parkId: string, userId: string, day: number): Promise<ParkFeedbackDocument[] | null> {
        const query = this.ParkFeedbackModel.find({ parkId: parkId, userId: userId, day: day}).exec();
        return query;
    }

    async getAvgParkFeedback(parkId: string, day: number):  Promise<{ hour: number; avgFeedback: number }[]> {
        
        const result = await this.ParkFeedbackModel.aggregate([
            { 
                $match: { 
                    parkId: parkId, 
                    day: day 
                } 
            },
            { 
                $group: { 
                    _id: "$hour", 
                    avgFeedback: { $avg: "$feedback" } 
                } 
            },
            { 
                $project: { 
                    _id: 0,
                    hour: "$_id",
                    avgFeedback: { $round: ["$avgFeedback", 1] } 
                } 
            },
            { 
                $sort: { hour: 1 }
            }
        ]).exec();

        const hourlyData = [];
        for (let h = 6; h <= 23; h++) {
            const found = result.find(r => r.hour === h);
            hourlyData.push({
                hour: h,
                avgFeedback: found ? found.avgFeedback : 0
            });
        }

        return hourlyData;
    }

    async getParkingWeeklyStats(parkId: string): Promise<WeeklyOverview> {
        const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

        const stats = await this.ParkFeedbackModel.aggregate([
            {
                $match: {
                    parkId: parkId 
                }
            },
            {
                $group: {
                    _id: null,
                    totalFeedbacksAllTime: { $sum: 1 },
                    overallAverage: { $avg: "$feedback" },
                    allFeedbacks: {
                        $push: {
                            dayOfWeek: "$day", 
                            rating: "$feedback" 
                        }
                    }
                }
            }
        ]).exec();

        if (!stats || stats.length === 0) {
            return {
                totalFeedbacksAllTime: 0,
                overallAverage: 0,
                weeklyData: dayNames.map((name, index) => ({
                    dayOfWeek: index === 0 ? 7 : index,
                    dayName: name,
                    totalFeedbacks: 0,
                    averageFeedback: 0
                })).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            };
        }

        const globalStats = stats[0];

        const weeklyDataMap = new Map<number, { total: number; sum: number }>();
        for (let i = 1; i <= 7; i++) {
            weeklyDataMap.set(i, { total: 0, sum: 0 });
        }

        globalStats.allFeedbacks.forEach((fb: { dayOfWeek: number; rating: number }) => {
            const current = weeklyDataMap.get(fb.dayOfWeek);
            if (current) {
                current.total += 1;
                current.sum += fb.rating;
            }
        });

        const weeklyData = dayNames.map((name, index) => {
            const databaseDayIndex = index + 1; 
            const dayStats = weeklyDataMap.get(databaseDayIndex) || { total: 0, sum: 0 };

            let frontendDayOfWeek = databaseDayIndex - 1; 
            if (frontendDayOfWeek === 0) frontendDayOfWeek = 7; 

            return {
                dayOfWeek: frontendDayOfWeek,
                dayName: name,
                totalFeedbacks: dayStats.total,
                averageFeedback: dayStats.total > 0 ? dayStats.sum / dayStats.total : 0
            };
        });

        weeklyData.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

        return {
            totalFeedbacksAllTime: globalStats.totalFeedbacksAllTime,
            overallAverage: globalStats.overallAverage || 0,
            weeklyData: weeklyData
        };
    }
}
