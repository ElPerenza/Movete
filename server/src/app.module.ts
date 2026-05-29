import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PoiModule } from "./poi/poi.module";
import { RealtimeModule } from './realtime/realtime.module';
import { ScheduleModule } from "@nestjs/schedule";
import { PathModule } from './path/path.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ScheduleModule.forRoot(),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                return {
                    uri: configService.get<string>("MONGODB_URL"),
                    user: configService.get<string>("MONGODB_USER"),
                    pass: configService.get<string>("MONGODB_PASSWORD"),
                    dbName: configService.get<string>("MONGODB_DB_NAME"),
                };
            }
        }),
        PoiModule,
        RealtimeModule,
        PathModule,
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule { }
