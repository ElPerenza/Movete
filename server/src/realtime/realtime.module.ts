import { Module, Provider } from '@nestjs/common';
<<<<<<< HEAD
import { OtpRealtimeService } from './services/otp-realtime.service';
=======
>>>>>>> 6830432f9a670f564a654d85eb4e17395e0ee76a
import { GraphQLClientModule } from '../graphql-client/graphql-client.module';
import { GtfsRealtimeController } from './controllers/gtfs-realtime.controller';
import { TrentinoTrasportiApiService } from './services/trentino-trasporti-api.service';
import { TrentinoTrasportiGtfsRealtimeFactory } from './services/trentino-trasporti-gtfs-realtime-factory';
import { ConfigModule } from '@nestjs/config';
import { GTFS_RT_PROVIDERS } from './provider-tokens';
import { GtfsRealtimeProvider } from './gtfs-realtime-providers/gtfs-realtime-provider';
import { ScheduleModule } from '@nestjs/schedule';
<<<<<<< HEAD

const gtfsRealtimeProviders: Provider<Map<string, GtfsRealtimeProvider>> = {
    provide: GTFS_RT_PROVIDERS,
    inject: [TrentinoTrasportiGtfsRealtimeFactory],
    useFactory: (ttRealtimeFactory: TrentinoTrasportiGtfsRealtimeFactory) => {
        return new Map([
            ["TrentinoTrasportiUrbano", ttRealtimeFactory.forFeed("TrentinoTrasportiUrbano")],
            ["TrentinoTrasportiExtraurbano", ttRealtimeFactory.forFeed("TrentinoTrasportiExtraurbano")]
=======
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
>>>>>>> 6830432f9a670f564a654d85eb4e17395e0ee76a
        ]);
    }
};

@Module({
<<<<<<< HEAD
    imports: [GraphQLClientModule, ConfigModule, ScheduleModule],
    controllers: [GtfsRealtimeController],
    providers: [
        OtpRealtimeService, 
        TrentinoTrasportiApiService,
        TrentinoTrasportiGtfsRealtimeFactory,
=======
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
>>>>>>> 6830432f9a670f564a654d85eb4e17395e0ee76a
        gtfsRealtimeProviders
    ]
})
export class RealtimeModule {}
