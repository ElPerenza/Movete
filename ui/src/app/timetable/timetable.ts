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

    public closeModal(): void {
        this.isModalOpen = false;
        this.tripDetails = [];
    }
}
