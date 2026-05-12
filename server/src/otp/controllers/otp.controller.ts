import { Controller, Get, Param } from '@nestjs/common';
import { OtpService } from '../services/otp.service';
import { StopTime } from '../models/stop-time.model';

@Controller('api/v1/test-otp')
export class OtpController {

    constructor(private readonly otpService: OtpService) { }

    @Get(':id/stop-times')
    async testGetStopTimes(@Param('id') gtfsId: string): Promise<StopTime[]> {
        console.log(`[TEST OTP] Richiesti orari per la fermata: ${gtfsId}`);
        return this.otpService.getStopTimes(gtfsId);
    }
}
