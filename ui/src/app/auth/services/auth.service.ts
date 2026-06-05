import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap, catchError, of } from "rxjs";
import { LoginRequest } from "../models/login-request";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: "root"
})
export class AuthService {
    private baseUrl = `${environment.apiUrl}auth`;

    private loggedIn = new BehaviorSubject<boolean>(false);

    public isLoggedIn$ = this.loggedIn.asObservable();

    private currentUser: any = null;

    constructor(private http: HttpClient) {
        this.checkInitialSession().subscribe();
    }

    login(credentials: LoginRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
            tap(() => {
                this.loggedIn.next(true);
                this.checkInitialSession().subscribe();
            })
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

    checkInitialSession(): Observable<any> {
        return this.http.get(`${this.baseUrl}/me`).pipe(
            tap((user: any) => {
                this.currentUser = user;
                this.loggedIn.next(true);
            }),
            catchError((err) => {
                console.log("Invalid session or non-existent", err.status)
                this.clearLocalSession();
                return of(null);
            })
        );
    }

    getCurrentUser() {
        return this.currentUser;
    }

    public clearLocalSession(): void {
        this.currentUser = null;
        this.loggedIn.next(false);
    }
}
