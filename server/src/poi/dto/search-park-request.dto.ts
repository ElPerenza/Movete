import { IsEnum, ValidateNested } from "class-validator";
import { BoundingBox } from "../../common/bounding-box";
import { Type } from "class-transformer";
import { ParkType } from "../models/park.schema";


export class SearchParkRequestDto {

    @ValidateNested()
    @Type(() => BoundingBox)
    bbox: BoundingBox;

    @IsEnum(ParkType, { each: true })
    parkTypes: ParkType[];
}
