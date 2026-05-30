import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { LoginRequest } from "../models/login-request";

@Injectable({
    providedIn: "root"
})
export class AuthService {
    // Assicurati che l'URL punti alla porta del tuo server NestJS
    private baseUrl = "http://localhost:3000/auth";

    private loggedIn = new BehaviorSubject<boolean>(false);

    public isLoggedIn$ = this.loggedIn.asObservable();

    constructor(private http: HttpClient) { }

    login(credentials: LoginRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
            tap(() => this.loggedIn.next(true)) //to swap accedi button with icon
        );
    }

    register(credentials: LoginRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/register`, credentials);
    }

    logout(): Observable<any> {
        return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
            tap(() => this.loggedIn.next(false))
        );
    }
}
