import { AfterViewInit, Component, ChangeDetectorRef, ViewChild } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule, DatePipe, DecimalPipe } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { RouterLink, RouterOutlet } from "@angular/router";
import * as L from 'leaflet';
import * as polyline from '@mapbox/polyline';
import { Stop } from "../class/stop";
import { Path } from "../path/path";

import { StopTime } from "../class/stop-time"
import { Timetable } from "../timetable/timetable";
import { environment } from "../../environments/environment";

@Component({
    selector: "app-map",
    imports: [ReactiveFormsModule, FormsModule, Path, Timetable, RouterLink, RouterOutlet],
    templateUrl: "./map.html",
    styleUrl: "./map.css"
})
export class Map implements AfterViewInit {
    private map!: L.Map;
    private stopsLayerMarkerGroup: L.LayerGroup = L.layerGroup();
    private _pathComponent!: Path;
    @ViewChild(Path) set pathComponent(content: Path) {
        if (content) {
            this._pathComponent = content;
            // Wait for the component to be loaded
            this.initDraggableFlags();
            this.setupFormToMapSync();
            this.setupItineraryListeners();
        }
    }
    private pathsLayer = L.layerGroup();
    private flagsLayer = L.layerGroup();
    private startMarker!: L.Marker;
    private destinationMarker!: L.Marker;

    private defaultStart: L.LatLngExpression = [46.067, 11.121]; // Trento Example
    private defaultEnd: L.LatLngExpression = [46.070, 11.130];

    private baseUrl: string = new URL('pois/stop/', environment.apiUrl).href;
    private header: HttpHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
    private panning: boolean = false;

    public currentStops: Stop[] = [];
    public showSidebar: boolean = true;
    public selectedStopId: string | null = null;
    public showPathForm = false;
    Math = Math

    public calculatedRoutes: any[] = [];
    public activeItineraryIndex: number = 0;
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
    constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

    public toggleSidebar(): void {
        this.showSidebar = !this.showSidebar;

        /**
         * to ensure Leaflet does not mess because of div size variations
         * we use a timeout to make Tailwind apply safely its classes
        */
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 100);
    }

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

        this.stopsLayerMarkerGroup.addTo(this.map);
        this.pathsLayer.addTo(this.map);

        this.fetchStopsInBound();

        this.map.on('moveend', () => {
            //Check if this a panning move, if it is it dose not ask for new data
            if (!this.panning) {
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
        const payload: { transportTypes: string[], bbox?: any } = {
            "transportTypes": this.selectedTransportTypes
        };
        if (this.useBbox) {
            payload.bbox = {
                "topLeft": { "type": "Point", "coordinates": [topLeft.lng, topLeft.lat] },
                "bottomRight": { "type": "Point", "coordinates": [bottomRight.lng, bottomRight.lat] }
            }
        }
        //Actual request
        this.http.post<Stop[]>(this.baseUrl + 'search', JSON.stringify(payload), { headers: this.header }).subscribe({
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
        this.stopsLayerMarkerGroup.clearLayers();
        this.currentStops = stops;

        stops.forEach(stop => {
            const marker = L.marker([stop.location.coordinates[1], stop.location.coordinates[0]]);

            marker.on('click', () => {
                this.selectStop(stop);
                this.showSidebar = true;
                this.cdr.detectChanges();
            });
            marker.addTo(this.stopsLayerMarkerGroup)
        })
        this.cdr.detectChanges();
    }

    /**
     * Display the content of the stop that has been clicked on the navbar
     * @param stop, the stop to visualize
     */
    public selectStop(stop: Stop): void {
        if (this.selectedStopId === stop.id) {
            // Deselect if clicking the same stop
            this.selectedStopId = null;
        } else {
            // Select and fetch data
            this.selectedStopId = stop.id;
            this.panning = true;
            this.map.panTo([stop.location.coordinates[1], stop.location.coordinates[0]]);
            const targetElement = document.getElementById(`stop-card-${stop.id}`);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'instant', // Smooth slide animation
                    block: 'start'    // Brings it into view minimalistically without jarring the whole page
                });
            }
        }
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

    /**
     * this method allow the Path component
     */
    togglePathForm() {
        this.showPathForm = true;
        this.updateMapLayers();
    }

    // This function is called when you click the back arrow
    closeForm() {
        this.showPathForm = false;
        this.calculatedRoutes = [];
        this.pathsLayer.clearLayers();
        this.updateMapLayers();
    }

    /**
     * this method shwos the navbar and the form form from Path component
     */
    private updateMapLayers() {
        if (this.showPathForm) {

            this.map.removeLayer(this.stopsLayerMarkerGroup);
            this.flagsLayer.addTo(this.map);
        } else {

            this.flagsLayer.remove();
            this.stopsLayerMarkerGroup.addTo(this.map);
        }
    }

    /**
     * this method handles the draggable marker of the Path componenet
     * @returns exit method
     */
    private initDraggableFlags() {
        if (this.startMarker && this.destinationMarker) {
            // Clear the container layer group to ensure no visual ghosts
            this.flagsLayer.clearLayers();

            // Re-add the existing instances (retaining their dragged coordinates!)
            this.flagsLayer.addLayer(this.startMarker);
            this.flagsLayer.addLayer(this.destinationMarker);
            return;
        }

        this.startMarker = L.marker(this.defaultStart, {
            draggable: true,
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        });

        this.destinationMarker = L.marker(this.defaultEnd, {
            draggable: true,
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        });

        // 3. Listen to Drag Events
        this.startMarker.on('dragend', () => this.updateFormCoordinates());
        this.destinationMarker.on('dragend', () => this.updateFormCoordinates());

        // Add to our specialized layer
        this.flagsLayer.addLayer(this.startMarker);
        this.flagsLayer.addLayer(this.destinationMarker);
        this.updateFormCoordinates();
    }

    /**
     * this method updates the form in the Path component evry time the user move the marker
     */
    private updateFormCoordinates() {
        const data = {
            start: this.startMarker?.getLatLng(),
            arrive: this.destinationMarker?.getLatLng()
        };

        if (this._pathComponent) {
            this._pathComponent.updateFormFromMap(data);
        }

    }

    /**
     * This method setup the Listener for the Path component Itinerary search
     */
    private setupItineraryListeners() {
        if (!this._pathComponent) return;

        // Listen for new query responses coming from the HTTP submit block
        this._pathComponent.routesCalculated?.subscribe((edges: any[]) => {
            this.calculatedRoutes = edges || [];
            this.activeItineraryIndex = 0;
            this.drawSelectedItinerary();
            this.cdr.detectChanges();
        });
    }

    public selectItinerary(index: number) {
        this.activeItineraryIndex = index;
        this.drawSelectedItinerary();
    }

    /**
     * Decodes polyline collections and visually shifts active camera frames
     */
    private drawSelectedItinerary() {
        this.pathsLayer.clearLayers();

        const activeRoute = this.calculatedRoutes[this.activeItineraryIndex];
        if (!activeRoute || !activeRoute.node || !activeRoute.node.legs) return;

        const bounds = L.latLngBounds([]);

        activeRoute.node.legs.forEach((leg: any) => {
            if (!leg.legGeometry || !leg.legGeometry.points) return;

            // Use Mapbox polyline dependency tool decoder
            const decodedPoints: [number, number][] = polyline.decode(leg.legGeometry.points);

            // Format styling guidelines matchers based on transport variants types
            const pathStyle: L.PolylineOptions = {
                color: leg.mode === 'WALK' ? '#3b82f6' : '#ef4444',
                weight: 6,
                opacity: leg.mode === 'WALK' ? 0.7 : 0.9,
                dashArray: leg.mode === 'WALK' ? '8, 12' : undefined
            };

            const segmentPolyline = L.polyline(decodedPoints, pathStyle);
            segmentPolyline.addTo(this.pathsLayer);
            bounds.extend(segmentPolyline.getBounds());
        });

        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    public formatTime(timestamp: number): string {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * This method change the markers based on the Path Form coordinates
     */
    setupFormToMapSync() {
        if (!this._pathComponent || !this._pathComponent.form) return;

        this._pathComponent.form.valueChanges.subscribe(val => {
            const startLat = parseFloat(val.startLatitude);
            const startLng = parseFloat(val.startLongitude);
            const arriveLat = parseFloat(val.arriveLatitude);
            const arriveLng = parseFloat(val.arriveLongitude);
            console.log(val);
            // Update Start Marker
            if (!isNaN(startLat) && !isNaN(startLng)) {
                const newLatLng = L.latLng(startLat, startLng);
                // Only update if the position is actually different
                if (!this.startMarker.getLatLng().equals(newLatLng)) {
                    this.startMarker.setLatLng(newLatLng);
                    this.map.panTo(newLatLng);
                }
            }

            // Update Destination Marker
            if (!isNaN(arriveLat) && !isNaN(arriveLng)) {
                const newLatLng = L.latLng(arriveLat, arriveLng);
                if (!this.destinationMarker.getLatLng().equals(newLatLng)) {
                    this.destinationMarker.setLatLng(newLatLng);
                    this.map.panTo(newLatLng);
                }
            }

        });
    }

    /**
     * This method reset the Path creation 
     */
    public resetSearch(): void {
        // 1. Clear out the active map paths lines
        this.pathsLayer.clearLayers();

        // 2. Clear out the alternatives data array
        this.calculatedRoutes = [];
        this.activeItineraryIndex = 0;

        // 3. Reset the form coordinates inside the child component back to defaults
        if (this._pathComponent) {
            this._pathComponent.updateFormFromMap({
                start: L.latLng(this.defaultStart as L.LatLngTuple),
                arrive: L.latLng(this.defaultEnd as L.LatLngTuple)
            });
        }

        // 4. Force markers back to original default positions
        this.startMarker.setLatLng(this.defaultStart);
        this.destinationMarker.setLatLng(this.defaultEnd);

        // 5. Center map view back to Trento default
        this.map.setView([46.0667, 11.1333], 15);

        this.cdr.detectChanges();
    }

    public getLegDuration(startTime: number, endTime: number): number {
        const diffMs = endTime - startTime;
        return Math.round(diffMs / 1000 / 60);
    }
}
