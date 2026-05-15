import { Controller, Get, Param } from '@nestjs/common';
import { OtpService } from '../services/otp.service';
import { StopTime } from '../models/stop-time.model';

/**
 * Utility/testing controller for direct calls to OpenTripPlanner.
 * NOTE: For actual app usage, the frontend calls the `StopController` 
 * which in turn uses the OtpService by combining the MongoDB ID with GTFS IDs.
 */

@Controller('api/v1/test-otp')
export class OtpController {

    constructor(private readonly otpService: OtpService) { }

    // Testing endpoint to fetch stop times by directly providing a single GTFS ID.

    @Get(':id/stop-times')
    async testGetStopTimes(@Param('id') gtfsId: string): Promise<StopTime[]> {
        console.log(`[TEST OTP] Richiesti orari per la fermata: ${gtfsId}`);
        return this.otpService.getStopTimes([gtfsId]);
    }
}
