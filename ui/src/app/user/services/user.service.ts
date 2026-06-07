import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Stop } from "../../class/stop";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../auth/services/auth.service";


@Injectable({ providedIn: "root" })
export class UserService {
    private baseUrl = `${environment.apiUrl}users`
    private baseStopUrl = `${environment.apiUrl}pois/stop`

    constructor(private http: HttpClient, private authService: AuthService) { }

    getFavourites(): Observable<Stop[]> {
        return this.http.get<Stop[]>(`${this.baseUrl}/favourites`);
    }

    addFavourite(stopId: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/favourites/${stopId}`, {});
    }

    removeFavourite(stopId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/favourites/${stopId}`);
    }

    sendTripFeedback(tripId: string, headsign: string, score: number, currentDay: number): Observable<any> {

        const currentUserId = this.authService.getCurrentUser().userId;


        const payload = {
            tripId: tripId,
            headsign: headsign,
            userId: currentUserId,
            feedback: score,
            feedbackDate: new Date(),
            day: currentDay
        };
        console.log("Submitting feedback with payload:", payload);
        return this.http.post(`${this.baseStopUrl}/trip/feedback`, payload);
    }

    updateTripFeedback(tripId: string, headsign: string, score: number, currentDay: number): Observable<any> {
        const currentUserId = this.authService.getCurrentUser().userId;
        

        const payload = {
            tripId: tripId,
            headsign: headsign,
            userId: currentUserId,
            feedback: score,
            feedbackDate: new Date().toISOString(),
            day: currentDay
        };

        return this.http.put(`${this.baseStopUrl}/trip/feedback`, payload);
    }

    getTripFeedback(tripId: string, day: number): Observable<any> {
        const currentUserId = this.authService.getCurrentUser().userId;
        const encodedTripId = encodeURIComponent(tripId);
        const encodedUserId = encodeURIComponent(currentUserId);
        const encodedDay = encodeURIComponent(day.toString());
        return this.http.get(`${this.baseStopUrl}/trip/feedback/${encodedTripId}/${encodedUserId}/${encodedDay}`);
    }

    getAvgTripFeedback(tripId: string): Observable<number> {
        const encodedTripId = encodeURIComponent(tripId);
        return this.http.get<number>(`${this.baseStopUrl}/trip/feedback/${encodedTripId}/`);
    }
}
