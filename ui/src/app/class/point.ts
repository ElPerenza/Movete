export class Point {
    type: string;
    coordinates: [number, number];

    constructor(type:string, coordinate: [number, number]){
        this.type = type;
        this.coordinates = coordinate;
    }
}