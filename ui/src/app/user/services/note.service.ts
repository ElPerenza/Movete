import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class NoteService {
    private baseUrl = `${environment.apiUrl}notes`;

    constructor(private http: HttpClient) { }

    getNoteForStop(stopId: string): Observable<{ _id?: string, content: string }> {
        return this.http.get<{ _id?: string, content: string }>(`${this.baseUrl}/poi/${stopId}`);
    }

    saveNote(stopId: string, content: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/poi/${stopId}`, { content });
    }

    deleteNote(noteId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${noteId}`);
    }
}
