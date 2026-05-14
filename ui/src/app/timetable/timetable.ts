import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Stop } from '../class/stop';
import { StopTime } from '../class/stop-time';

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

    private baseUrl: string = 'http://localhost:3000/pois/stop/';

    constructor(private http: HttpClient) { }

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
            },
            error: (err) => {
                console.error('Error fetching stop times', err);
                this.timesError = 'Impossibile caricare gli orari in tempo reale.';
                this.isLoadingTimes = false;
            }
        });
    }
}
