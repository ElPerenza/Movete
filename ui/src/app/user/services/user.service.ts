import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Stop } from "../../class/stop";
import { environment } from "../../../environments/environment";


@Injectable({ providedIn: "root" })
export class UserService {
    private baseUrl = `${environment.apiUrl}users`

    constructor(private http: HttpClient) { }

    getFavourites(): Observable<Stop[]> {
        return this.http.get<Stop[]>(`${this.baseUrl}/favourites`);
    }

    addFavourite(stopId: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/favourites/${stopId}`, {});
    }

    removeFavourite(stopId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/favourites/${stopId}`);
    }
}
