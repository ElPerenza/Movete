import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Stop } from "../../class/stop";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../auth/services/auth.service";
import { Park } from "../../class/park";


@Injectable({ providedIn: "root" })
export class UserService {
    private baseUrl = `${environment.apiUrl}users`
    private baseStopUrl = `${environment.apiUrl}pois/stop`
    private baseParkUrl = `${environment.apiUrl}pois/park`

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

    getFavouriteParks(): Observable<Park[]> {
        return this.http.get<Park[]>(`${this.baseUrl}/favourite-parks`);
    }

    addFavouritePark(parkId: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/favourite-parks/${parkId}`, {});
    }

    removeFavouritePark(parkId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/favourite-parks/${parkId}`);
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

    getAvgTripFeedback(tripId: string, day: number): Observable<number> {
        const encodedTripId = encodeURIComponent(tripId);
        return this.http.get<number>(`${this.baseStopUrl}/trip/feedback/${encodedTripId}/${day}`);
    }

    sendParkFeedback(parkId: string, score: number): Observable<any> {
        const currentUserId = this.authService.getCurrentUser().userId;

        const payload = {
            parkId: parkId,
            userId: currentUserId,
            feedback: score,
            feedbackDate: new Date(),
            day: new Date().getDay() == 0 ? 7 : new Date().getDay(),
            hour: new Date().getHours() < 6 ? 6 : new Date().getHours() > 23 ? 23 : new Date().getHours() 
        };
        console.log("Submitting park feedback with payload:", payload);
        return this.http.post(`${this.baseParkUrl}/feedback`, payload);
    }

    updateParkFeedback(parkId: string, score: number): Observable<any> {
        const currentUserId = this.authService.getCurrentUser().userId;

        const payload = {
            parkId: parkId,
            userId: currentUserId,
            feedback: score,
            feedbackDate: new Date().toISOString(),
            day: new Date().getDay() == 0 ? 7 : new Date().getDay(),
            hour: new Date().getHours() < 6 ? 6 : new Date().getHours() > 23 ? 23 : new Date().getHours() 
        };
        console.log("Updating park feedback with payload:", payload);
        return this.http.put(`${this.baseParkUrl}/feedback`, payload);
    }

    getParkFeedback(parkId: string, day: number): Observable<any> {
        const currentUserId = this.authService.getCurrentUser().userId;
        const encodedParkId = encodeURIComponent(parkId);
        const encodedUserId = encodeURIComponent(currentUserId);
        
        return this.http.get(`${this.baseParkUrl}/feedback/${encodedParkId}/${encodedUserId}/${day}`);
    }

    getAvgParkFeedback(parkId: string, day: number): Observable<{ hour: number; avgFeedback: number }[]> {
        const encodedParkId = encodeURIComponent(parkId);
        return this.http.get<{ hour: number; avgFeedback: number }[]>(`${this.baseParkUrl}/feedback/${encodedParkId}/distribution/${day}`);
    }
}
