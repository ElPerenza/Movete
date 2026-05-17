import { IsNotEmptyObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Point } from "./point";

export class BoundingBox {
    
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Point)
    topLeft: Point;

    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Point)
    bottomRight: Point;
}
