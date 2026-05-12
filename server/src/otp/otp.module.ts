import { Module } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { OtpController } from './controllers/otp.controller';

@Module({
    imports: [],
    controllers: [OtpController], //<-- for testing (must remove and implement in poi controller)
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule { }
