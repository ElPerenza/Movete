import { Module } from "@nestjs/common";
import { StopController } from "./controllers/stop.controller";
import { StopService } from "./services/stop.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Stop, StopSchema } from "./models/stop.schema";
import { OtpModule } from "../otp/otp.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Stop.name, schema: StopSchema }
        ]),
        OtpModule
    ],
    controllers: [StopController],
    providers: [StopService]
})
export class PoiModule { }
