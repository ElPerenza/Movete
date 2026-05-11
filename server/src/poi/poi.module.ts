import { Module } from "@nestjs/common";
import { StopController } from "./controllers/stop.controller";
import { StopService } from "./services/stop.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Stop, StopSchema } from "./models/stop.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Stop.name, schema: StopSchema }
        ])
    ],
    controllers: [StopController],
    providers: [StopService]
})
export class PoiModule {}
