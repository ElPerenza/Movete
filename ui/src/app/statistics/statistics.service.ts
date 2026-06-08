import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParkingSelectOption, TripSelectOption, WeeklyOverview } from '../class/statistic';

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private baseUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) {}

    getParkingOptions(): Observable<ParkingSelectOption[]> {
        return this.http.get<ParkingSelectOption[]>(`${this.baseUrl}/pois/park/list`);
    }

    getTripOptions(): Observable<TripSelectOption[]> {
        return this.http.get<TripSelectOption[]>(`${this.baseUrl}/pois/stop/trips/list`);
    }

    getParkingWeeklyStats(parkId: string): Observable<WeeklyOverview> {
        return this.http.get<WeeklyOverview>(`${this.baseUrl}/pois/park/feedback/${parkId}/weekly-overview`);
    }

    getTripWeeklyStats(tripId: string): Observable<WeeklyOverview> {
        return this.http.get<WeeklyOverview>(`${this.baseUrl}/pois/stop/trips/feedback/${tripId}/weekly-overview`);
    }
}