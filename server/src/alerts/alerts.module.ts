import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsController } from './controllers/alerts.controller';
import { AlertsService } from './services/alerts.service';
import { Alert, AlertSchema } from './schemas/alert.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }])],
    controllers: [AlertsController],
    providers: [AlertsService],
    exports: [AlertsService]
})
export class AlertsModule { }
