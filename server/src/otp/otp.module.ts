import { Module } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule { }
