import { IsEnum,  IsMongoId, IsNotEmpty, IsNotEmptyObject, ValidateNested } from "class-validator";
import { Point } from "../../common/point";
import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Expose, Type } from "class-transformer";
import { ParkType } from "../models/park.schema";


export class ParkDto {

    @Expose()
    @IsMongoId()
    id: string;

    @Expose()
    otpId: string;
    
    @Expose()
    trentinoApiId: string;

    @Expose()
    @IsNotEmpty()
    name: string;

    @Expose()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Point)
    location: Point;

    @Expose()
    @IsEnum(ParkType)
    parkType: ParkType;

    @Expose()
    maxCapacity: number;

    @Expose()
    currentCapacity: number;

}

export class CreateParkDto extends OmitType(ParkDto, ["id"]) {}

export class UpdateParkDto extends PartialType(CreateParkDto) {}