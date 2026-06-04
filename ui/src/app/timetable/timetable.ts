import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Stop } from '../class/stop';
import { Stoptime, StoptimeWithTripInfo, TripInformation } from '../class/stop-time';

/**
 * Component for displaying transport timetables for a specific stop.
 * Shows upcoming departures, calculating real-time delays or scheduled times.
 * Triggers a backend call whenever the `stop` input property changes (via ngOnChanges).
 */
@Component({
    selector: 'app-timetable',
    imports: [DatePipe],
    templateUrl: './timetable.html'
})
export class Timetable implements OnChanges {
    @Input({ required: true }) stop!: Stop;

    public currentStopTimes: StoptimeWithTripInfo[] = [];
    public isLoadingTimes: boolean = false;
    public timesError: string | null = null;

    public isModalOpen: boolean = false;
    public selectedTrip?: TripInformation = undefined;
    public tripDetails: Stoptime[] = [];
    public isLoadingTrip: boolean = false;

    //Endipoint backend
    private baseUrl: string = 'http://localhost:3000/pois/stop/';

    constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['stop'] && this.stop) {
            this.fetchStopTimes(this.stop.id);
        }
    }

    private fetchStopTimes(stopId: string): void {
        this.isLoadingTimes = true;
        this.timesError = null;
        this.currentStopTimes = [];

        this.http.get<StoptimeWithTripInfo[]>(`${this.baseUrl}${stopId}/stop-times`).subscribe({
            next: (data) => {
                this.currentStopTimes = data;
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching stop times', err);
                this.timesError = 'Impossibile caricare gli orari in tempo reale.';
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            }
        });
    }

    public openTripDetails(time: StoptimeWithTripInfo): void {
        this.isModalOpen = true;
        this.selectedTrip = time.tripInfo;
        this.isLoadingTrip = true;
        this.tripDetails = [];
        this.cdr.detectChanges();

        const encodedTripId = encodeURIComponent(time.tripInfo.id);
        const serviceDateTimestamp = Date.parse(time.tripInfo.serviceDate);

        this.http.get<Stoptime[]>(`${this.baseUrl}trip/${encodedTripId}/${serviceDateTimestamp}/details`).subscribe({
            next: (data) => {
                this.tripDetails = data;
                this.isLoadingTrip = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.isLoadingTrip = false;
                this.cdr.detectChanges();
            }
        });
    }

    protected isUpcomingStop(stop: Stoptime, allStops: Stoptime[]): boolean {
        const realtimeStopIndex = allStops.findIndex(s => s.realtime);
        if(realtimeStopIndex === -1 || this.selectedTrip?.id.startsWith("Trenitalia")) { // hack to prevent Trenitalia trips from breaking visulization, will need to go once vehicle positions are implemented
            const now = Date.now();
            const stopTime = Date.parse(stop.scheduledDeparture) + (stop.departureDelay * 1000);
            return stopTime - now > 0;
        } else {
            // workaround only for TT until vehicle positions get implemented
            const delay = allStops.at(-1)!.departureDelay;
            if(delay <= 0) {
                return allStops.findIndex(s => s === stop) >= realtimeStopIndex;
            } else {
                return allStops.findIndex(s => s === stop) > realtimeStopIndex;
            }
        }
    }

    public closeModal(): void {
        this.isModalOpen = false;
        this.tripDetails = [];
    }
}
