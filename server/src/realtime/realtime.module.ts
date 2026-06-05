import { Module, Provider } from '@nestjs/common';
import { OtpRealtimeService } from './services/otp-realtime.service';
import { GraphQLClientModule } from '../graphql-client/graphql-client.module';
import { GtfsRealtimeController } from './controllers/gtfs-realtime.controller';
import { TrentinoTrasportiApiService } from './services/trentino-trasporti-api.service';
import { TrentinoTrasportiGtfsRealtimeFactory } from './services/trentino-trasporti-gtfs-realtime-factory';
import { ConfigModule } from '@nestjs/config';
import { GTFS_RT_PROVIDERS } from './provider-tokens';
import { GtfsRealtimeProvider } from './gtfs-realtime-providers/gtfs-realtime-provider';
import { ScheduleModule } from '@nestjs/schedule';

const gtfsRealtimeProviders: Provider<Map<string, GtfsRealtimeProvider>> = {
    provide: GTFS_RT_PROVIDERS,
    inject: [TrentinoTrasportiGtfsRealtimeFactory],
    useFactory: (ttRealtimeFactory: TrentinoTrasportiGtfsRealtimeFactory) => {
        return new Map([
            ["TrentinoTrasportiUrbano", ttRealtimeFactory.forFeed("TrentinoTrasportiUrbano")],
            ["TrentinoTrasportiExtraurbano", ttRealtimeFactory.forFeed("TrentinoTrasportiExtraurbano")]
        ]);
    }
};

@Module({
    imports: [GraphQLClientModule, ConfigModule, ScheduleModule],
    controllers: [GtfsRealtimeController],
    providers: [
        OtpRealtimeService, 
        TrentinoTrasportiApiService,
        TrentinoTrasportiGtfsRealtimeFactory,
        gtfsRealtimeProviders
    ]
})
export class RealtimeModule {}
