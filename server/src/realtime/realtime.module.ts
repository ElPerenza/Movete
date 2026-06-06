import { Module, Provider } from '@nestjs/common';
import { GraphQLClientModule } from '../graphql-client/graphql-client.module';
import { GtfsRealtimeController } from './controllers/gtfs-realtime.controller';
import { TrentinoTrasportiApiService } from './services/trentino-trasporti-api.service';
import { TrentinoTrasportiGtfsRealtimeFactory } from './services/trentino-trasporti-gtfs-realtime-factory';
import { ConfigModule } from '@nestjs/config';
import { GTFS_RT_PROVIDERS } from './provider-tokens';
import { GtfsRealtimeProvider } from './gtfs-realtime-providers/gtfs-realtime-provider';
import { ScheduleModule } from '@nestjs/schedule';
import { ViaggiatrenoApiService } from './services/viaggiatreno-api.service';
import { ViaggiatrenoGtfsRealtimeFactory } from './services/viaggiatreno-gtfs-realtime-factory';
import { OtpModule } from '../otp/otp.module';

const gtfsRealtimeProviders: Provider<Map<string, GtfsRealtimeProvider>> = {
    provide: GTFS_RT_PROVIDERS,
    inject: [TrentinoTrasportiGtfsRealtimeFactory, ViaggiatrenoGtfsRealtimeFactory],
    useFactory: (ttRealtimeFactory: TrentinoTrasportiGtfsRealtimeFactory, vtRealtimeFactory: ViaggiatrenoGtfsRealtimeFactory) => {
        return new Map<string, GtfsRealtimeProvider>([
            ["TrentinoTrasportiUrbano", ttRealtimeFactory.forFeed("TrentinoTrasportiUrbano")],
            ["TrentinoTrasportiExtraurbano", ttRealtimeFactory.forFeed("TrentinoTrasportiExtraurbano")],
            ["Trenitalia", vtRealtimeFactory.forFeed("Trenitalia")]
        ]);
    }
};

@Module({
    imports: [
        GraphQLClientModule,
        ConfigModule, 
        ScheduleModule,
        OtpModule
    ],
    controllers: [GtfsRealtimeController],
    providers: [ 
        TrentinoTrasportiApiService,
        TrentinoTrasportiGtfsRealtimeFactory,
        ViaggiatrenoApiService,
        ViaggiatrenoGtfsRealtimeFactory,
        gtfsRealtimeProviders
    ]
})
export class RealtimeModule {}
