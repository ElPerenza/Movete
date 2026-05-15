import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RealtimeModule } from './realtime/realtime.module';
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule.forRoot(), ScheduleModule.forRoot(), RealtimeModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
