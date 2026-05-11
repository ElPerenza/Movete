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

    /**
     * init the map, centered in Trento, then from the backend it retrive the
     * stops that are in the initial bounding box, add an event listener on map
     * movment and zoom, this event listener ask for the data in the current bounding box
     * each time the user move the map or zoom in and out.
     * TODO: add the filter on the movment of the map. 
     */
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

    /**
     * Retrive the stops that are in the current bounding box from the database
     */
    private fetchStopsInBound(): void {
        //Get the bounding box of the current map
        var bottomRight = this.map.getBounds().getSouthEast();
        var topLeft = this.map.getBounds().getNorthWest();

        //Actual request
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
                //TODO add on error
            });
    }

    /**
     * Add all the stops to the markerLayer, and displays it on the map
     * @param stops, the list of stop that need to be displayed
     */
    private addStopsToMap(stops: Stop[]): void {
        //Clear the previews markers
        this.markerLayer.clearLayers();

        stops.forEach(stop => {
            const lat = stop.location.coordinates[1];
            const lon = stop.location.coordinates[0];

            L.marker([lat, lon]).addTo(this.markerLayer)
        })
    }
}
