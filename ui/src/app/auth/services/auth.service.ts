import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { LoginRequest } from "../models/login-request";

@Injectable({
    providedIn: "root"
})
export class AuthService {
    // Assicurati che l'URL punti alla porta del tuo server NestJS
    private baseUrl = "http://localhost:3000/auth";

    constructor(private http: HttpClient) { }

    login(credentials: LoginRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/login`, credentials);
    }

    register(credentials: LoginRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/register`, credentials);
    }

    logout(): Observable<any> {
        return this.http.post(`${this.baseUrl}/logout`, {});
    }
}
