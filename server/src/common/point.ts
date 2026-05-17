import { Expose } from "class-transformer";
import { IsIn } from "class-validator";
import { IsLongitudeLatitudeTuple } from "./is-longitude-latitude-tuple";

export class Point {
    
    @Expose()
    @IsIn(["Point"])
    type: "Point";

    @Expose()
    @IsLongitudeLatitudeTuple()
    coordinates: [number, number];
}
