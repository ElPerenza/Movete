import { AfterViewInit, Component } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import * as L from 'leaflet';
import { Stop } from "../class/stop";

@Component({
    selector: "app-map",
    imports: [],
    templateUrl: "./map.html",
    styleUrl: "./map.css"
})
export class Map implements AfterViewInit{
    private map! : L.Map;
    private markerLayer: L.LayerGroup = L.layerGroup();
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

        this.markerLayer.addTo(this.map);

        this.fetchStopsInBound();
        
        this.map.on('moveend', () => {
            console.log("Map moved or zoomed")
            this.fetchStopsInBound();
        })
        
        
        
    }

    private fetchStopsInBound(): void {
        var bottomRight = this.map.getBounds().getSouthEast();
        var topLeft = this.map.getBounds().getNorthWest();
        this.http.post<Stop[]>(this.baseUrl+'search', JSON.stringify({
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

    private addStopsToMap(stops: Stop[]): void {
        this.markerLayer.clearLayers();
        stops.forEach(stop => {
            const lat = stop.location.coordinates[1];
            const lon = stop.location.coordinates[0];

            L.marker([lat, lon]).addTo(this.markerLayer)
        })
    }
}
