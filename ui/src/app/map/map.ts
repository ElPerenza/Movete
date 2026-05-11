import { AfterViewInit, Component } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import * as L from 'leaflet';

@Component({
    selector: "app-map",
    imports: [],
    templateUrl: "./map.html",
    styleUrl: "./map.css"
})
export class Map implements AfterViewInit{
    private map! : L.Map;
    private baseUrl: String = 'http://localhost:3000/pois/stop/'
    private header: HttpHeaders = new HttpHeaders({ 'Content-Type' : 'application/json' });



    constructor(private http: HttpClient) {}

    ngAfterViewInit(): void {
        this.initMap();
    }

    private initMap(): void {
        //Centered in Trento
        this.map = L.map('map').setView([46.0667, 11.1333], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        
        var bottomRight = this.map.getBounds().getSouthEast();
        var topLeft = this.map.getBounds().getNorthWest();
        this.http.post<any>(this.baseUrl+'search', JSON.stringify({
                "bbox": { 
                    "topLeft":  {
                        "type":  "Point",
                        "coordinates":  [topLeft.lng, topLeft.lat]
                    },
                    "bottomRight": {
                        "type":  "Point",
                        "coordinates":  [bottomRight.lng, bottomRight.lat]
                    }
                },
                "transportTypes" : []
            }), {headers: this.header}).subscribe({
                next: (data) => {
                    console.log(data);
                    this.addStopsToMap(data);
                }
            });
        
    }

    private addStopsToMap(stops: any[]): void {
        stops.forEach(stop => {
            const lat = stop.location.coordinates[1];
            const lon = stop.location.coordinates[0];

            L.marker([lat, lon]).addTo(this.map)
        })
    }
}
