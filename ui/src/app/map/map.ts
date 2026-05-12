import { AfterViewInit, Component, ChangeDetectorRef} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import * as L from 'leaflet';
import { Stop } from "../class/stop";

@Component({
    selector: "app-map",
    imports: [FormsModule],
    templateUrl: "./map.html",
    styleUrl: "./map.css"
})
export class Map implements AfterViewInit{
    private map! : L.Map;
    private markerLayer: L.LayerGroup = L.layerGroup();
    private baseUrl: String = 'http://localhost:3000/pois/stop/'
    private header: HttpHeaders = new HttpHeaders({ 'Content-Type' : 'application/json' });
    private panning: boolean = false;

    public currentStops: Stop[] = [];
    public showSidebar: boolean = false;
    public selectedStopId: string | null = null;

    /**
     * Filter for the transport type, it is an array of object with the label, the value and if it is checked or not
     * TODO here we will add poi types like stops, park and park with sensor.
     */
    public transportFilters = [
        { label: 'Bus', value: 'BUS', checked: false },
        { label: 'Train', value: 'TRAIN', checked: false },
        { label: 'Cable Car', value: 'CABLE_CAR', checked: false }
    ];
    public useBbox: boolean = true;


    //TODO verify if cdr have some impact on performance but is the only thing that make the navbar working dynamically
    constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

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
            //Check if this a panning move, if it is it dose not ask for new data
            if(!this.panning) {
                console.log("not panning");
                this.fetchStopsInBound();
            } else {
                this.panning = false;
            }
        })
    }

    /**
     * Retrive the stops that are in the current bounding box from the database
     */
    private fetchStopsInBound(): void {
        //Get the bounding box of the current map
        var bottomRight = this.map.getBounds().getSouthEast();
        var topLeft = this.map.getBounds().getNorthWest();
        const payload: {transportTypes: string[], bbox? : any} = {
            "transportTypes": this.selectedTransportTypes
        };
        if (this.useBbox) {
            payload.bbox = { 
                "topLeft": { "type": "Point", "coordinates": [topLeft.lng, topLeft.lat] },
                "bottomRight": { "type": "Point", "coordinates": [bottomRight.lng, bottomRight.lat] }
            }
        }
        //Actual request
        this.http.post<Stop[]>(this.baseUrl+'search', JSON.stringify(payload), {headers: this.header}).subscribe({
                next: (data) => {
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
        this.currentStops = stops;

        stops.forEach(stop => {
            const marker = L.marker([stop.location.coordinates[1], stop.location.coordinates[0]]);

            marker.on('click', () => {
                this.selectStop(stop);
                this.showSidebar = true;
                this.cdr.detectChanges();
            });
            marker.addTo(this.markerLayer)
        })
        this.cdr.detectChanges();
    }

    /**
     * Display the content of the stop that has been clicked on the navbar
     * @param stop, the stop to visualize
     */
    public selectStop(stop: Stop): void{
        this.selectedStopId = (this.selectedStopId === stop.id) ? null : stop.id;

        this.panning = true;
        this.map.panTo([stop.location.coordinates[1], stop.location.coordinates[0]]);
    }

    /**
     * Get the transport types that are selected in the filter, 
     * this is used to send the request to the backend with the correct filter
     */
    get selectedTransportTypes(): string[] {
        return this.transportFilters
            .filter(f => f.checked)
            .map(f => f.value);
    }

    /**
     * This function is called each time the user change the filter, 
     * it ask for new data to the backend with the new filter
     */
    public onFilterChange(): void {
        this.fetchStopsInBound();
    }
}
