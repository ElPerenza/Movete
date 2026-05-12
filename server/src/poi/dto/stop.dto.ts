import { ArrayNotEmpty, IsIn, IsMongoId, isNotEmpty, IsNotEmpty, IsNotEmptyObject, ValidateNested } from "class-validator";
import { Point } from "../../common/point";
import { IsGtfsId } from "../is-gtfs-id";
import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Expose, Type } from "class-transformer";
import { stopTypes, StopType } from "../poi.types.ts/stopType";


export class StopDto {

    @Expose()
    @IsMongoId()
    id: string;

    @Expose()
    @IsNotEmpty()
    name: string;

    @Expose()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Point)
    location: Point;

    @Expose()
    @ArrayNotEmpty()
    @IsIn(stopTypes, { each: true })
    transportModes: StopType[];

    @Expose()
    @ArrayNotEmpty()
    @IsGtfsId({ each: true })
    otpStops: string[];
}

export class CreateStopDto extends OmitType(StopDto, ["id"]) {}

export class UpdateStopDto extends PartialType(CreateStopDto) {}