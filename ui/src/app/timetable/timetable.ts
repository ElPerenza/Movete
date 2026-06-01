import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Stop } from '../class/stop';
import { StopTime } from '../class/stop-time';

export interface TripDetail {
    stopName: string;
    scheduledArrival: string;
    delay: number;
    realtime: boolean;
}
/**
 * Component for displaying transport timetables for a specific stop.
 * Shows upcoming departures, calculating real-time delays or scheduled times.
 * Triggers a backend call whenever the `stop` input property changes (via ngOnChanges).
 */
@Component({
    selector: 'app-timetable',
    imports: [DatePipe, DecimalPipe],
    templateUrl: './timetable.html'
})
export class Timetable implements OnChanges {
    @Input({ required: true }) stop!: Stop;

    public currentStopTimes: StopTime[] = [];
    public isLoadingTimes: boolean = false;
    public timesError: string | null = null;

    public isModalOpen: boolean = false;
    public selectedTripHeadsign: string = '';
    public tripDetails: TripDetail[] = [];
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

        this.http.get<StopTime[]>(`${this.baseUrl}${stopId}/stop-times`).subscribe({
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

    public openTripDetails(time: StopTime): void {
        this.isModalOpen = true;
        this.selectedTripHeadsign = time.headsign || 'Sconosciuta';
        this.isLoadingTrip = true;
        this.tripDetails = [];
        this.cdr.detectChanges();

        const encodedTripId = encodeURIComponent(time.tripId);

        this.http.get<TripDetail[]>(`${this.baseUrl}trip/${encodedTripId}/details`).subscribe({
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

    protected isUpcomingStop(stop: TripDetail, allStops: TripDetail[]): boolean {
        const realtimeStopIndex = allStops.findIndex(s => s.realtime);
        if(realtimeStopIndex === -1) {
            const now = Date.now();
            const stopTime = Date.parse(stop.scheduledArrival) + (stop.delay * 1000);
            return stopTime - now > 0;
        } else {
            const delay = allStops.at(-1)!.delay; // workaround only for TT until vehicle positions get implemented (will probably break once Trenitalia realtime data gets added)
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
