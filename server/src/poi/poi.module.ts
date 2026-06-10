import { Module } from "@nestjs/common";
import { StopController } from "./controllers/stop.controller";
import { StopService } from "./services/stop.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Stop, StopSchema } from "./models/stop.schema";
import { OtpModule } from "../otp/otp.module";
import { ConfigModule } from "@nestjs/config";
import { Park, ParkSchema } from "./models/park.schema";
import { ParkController } from "./controllers/park.controller";
import { ParkingService } from "./services/park.service";
import { TripFeedback, tripFeedbackSchema } from "./models/tripFeedback.shema";
import { ParkFeedback, parkFeedbackSchema } from "./models/parkFeedback.schema";

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([
            { name: Stop.name, schema: StopSchema },
            { name: Park.name, schema: ParkSchema },
            { name: TripFeedback.name, schema: tripFeedbackSchema },
            { name: ParkFeedback.name, schema: parkFeedbackSchema }
        ]),
        OtpModule
    ],
    controllers: [StopController, ParkController], 
    providers: [StopService, ParkingService]
})
export class PoiModule { }
