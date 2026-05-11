import { Module } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { OtpController } from './controllers/otp.controller';

@Module({
    imports: [],
    controllers: [OtpController], //<-- per testare (poi rimuovere)
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule { }
