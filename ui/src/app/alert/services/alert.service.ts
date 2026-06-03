import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alert {
    _id?: string;
    title: string;
    message: string;
    stopId: string;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
    private baseUrl = 'http://localhost:3000/alerts';

    constructor(private http: HttpClient) { }

    getAllAlerts(limit: number = 20): Observable<Alert[]> {
        return this.http.get<Alert[]>(`${this.baseUrl}?limit=${limit}`);
    }

    saveAlert(alert: Alert): Observable<Alert> {
        if (alert._id) {
            return this.http.put<Alert>(`${this.baseUrl}/${alert._id}`, alert);
        }
        return this.http.post<Alert>(this.baseUrl, alert);
    }

    deleteAlert(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${id}`);
    }

    getActiveAlertsForStop(stopId: string): Observable<Alert[]> {
        return this.http.get<Alert[]>(`${this.baseUrl}/stop/${stopId}/active`);
    }
}
