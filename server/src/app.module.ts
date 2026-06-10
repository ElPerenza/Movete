import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { PoiModule } from "./poi/poi.module";
import { RealtimeModule } from './realtime/realtime.module';
import { ScheduleModule } from "@nestjs/schedule";
import { PathModule } from './path/path.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from "./users/users.module";
import { NotesModule } from "./notes/notes.module";
import { AlertsModule } from "./alerts/alerts.module";

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
        AuthModule,
        UsersModule,
        NotesModule,
        AlertsModule,
    ]
})
export class AppModule { }
