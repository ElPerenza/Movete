import { PartialType } from "@nestjs/mapped-types";
import { Expose } from "class-transformer";
import { IsNotEmpty, Max, Min } from "class-validator";

export class ParkFeedbackDto {

    @Expose()
    @IsNotEmpty()
    stopId: string;

    @Expose()
    @IsNotEmpty()
    userId: string;

    @Expose()
    @Min(1)
    @Max(10)
    feedback: number;

    @Expose()
    feedbackDate: Date;

    @Expose()
    @Min(1)
    @Max(7)
    day: number;

    @Expose()
    @Min(6)
    @Max(23)
    hour: number;
}

export class UpdateParkFeedbackDto extends PartialType(ParkFeedbackDto) {}

