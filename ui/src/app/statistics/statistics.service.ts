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
        return this.http.get<ParkingSelectOption[]>(`${this.baseUrl}/pois/park`);
    }

    getTripOptions(): Observable<TripSelectOption[]> {
        return this.http.get<TripSelectOption[]>(`${this.baseUrl}/pois/stop/trip/statistic`);
    }

    getParkingWeeklyStats(parkId: string): Observable<WeeklyOverview> {
        return this.http.get<WeeklyOverview>(`${this.baseUrl}/pois/park/feedback/${parkId}/weekly-overview`);
    }

    getTripWeeklyStats(tripId: string): Observable<WeeklyOverview> {
        return this.http.get<WeeklyOverview>(`${this.baseUrl}/pois/stop/trip/feedback/${tripId}/weekly-overview`);
    }

    getTripDetails(tripId: string, serviceDate: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/pois/stop/trip/${tripId}/${serviceDate}/details`);
    }
}