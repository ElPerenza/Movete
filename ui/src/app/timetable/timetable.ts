import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, OnInit, OnDestroy } from "@angular/core";
import { DatePipe, DecimalPipe, CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { Stop } from "../class/stop";
import { StopTime } from "../class/stop-time";
import { AuthService } from "../auth/services/auth.service";
import { UserService } from "../user/services/user.service";
import { NoteService } from "../user/services/note.service";
import { AlertService, Alert } from "../alert/services/alert.service";

export interface TripDetail {
    stopName: string;
    scheduledArrival: string;
    delay: number;
    realtime: boolean;
}
/**
 * Component for displaying transport timetables for a specific stop.
 * Shows upcoming departures, calculating real-time delays or scheduled times.
 * Triggers a backend call whenever the `stop` input property changes (via ngOnChanges).
 */
@Component({
    selector: "app-timetable",
    imports: [DatePipe, DecimalPipe, CommonModule, FormsModule],
    templateUrl: "./timetable.html"
})
export class Timetable implements OnChanges, OnInit, OnDestroy {
    @Input({ required: true }) stop!: Stop;

    public currentStopTimes: StopTime[] = [];
    public isLoadingTimes: boolean = false;
    public timesError: string | null = null;

    public isModalOpen: boolean = false;
    public selectedTripHeadsign: string = "";
    public tripDetails: TripDetail[] = [];
    public isLoadingTrip: boolean = false;

    // ---New Variables for Note and Favourites---
    public isLoggedIn: boolean = false;
    private authSub!: Subscription;

    public isFavourite: boolean = false;

    public noteContent: string = "";
    public savedNoteId: string | undefined = undefined;
    public isLoadingNote: boolean = false;
    public isNoteModalOpen: boolean = false;
    public tempNoteContent: string = '';

    public activeAlerts: Alert[] = [];
    public isLoadingAlerts: boolean = false;

    //Endipoint backend
    private baseUrl: string = "http://localhost:3000/pois/stop/";

    constructor(
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private authService: AuthService,
        private userService: UserService,
        private noteService: NoteService,
        private alertService: AlertService,
    ) { }

    ngOnInit() {
        this.authSub = this.authService.isLoggedIn$.subscribe(status => {
            this.isLoggedIn = status;
            if (this.isLoggedIn && this.stop) {
                this.loadUserDataForStop();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["stop"] && this.stop) {
            this.fetchStopTimes(this.stop.id);
            this.loadAlerts();
            if (this.isLoggedIn) {
                this.loadUserDataForStop();
            }
        }
    }

    ngOnDestroy() {
        if (this.authSub) this.authSub.unsubscribe();
    }

    //---Notes and Favourites---
    private loadUserDataForStop() {
        this.isLoadingNote = true;

        this.userService.getFavourites().subscribe({
            next: (favourites) => {
                this.isFavourite = favourites.some(fav => fav.id === this.stop.id || (fav as any)._id === this.stop.id);
                this.cdr.detectChanges();
            },
            error: (err) => console.error("Errore caricamento preferiti", err)
        });

        // loads the note
        this.noteService.getNoteForStop(this.stop.id).subscribe({
            next: (note) => {
                this.noteContent = note?.content || '';
                this.savedNoteId = note?._id;
                this.isLoadingNote = false;
                this.cdr.detectChanges();
            },
            error: () => { this.isLoadingNote = false; }
        });
    }
    public toggleFavourite(event: Event) {
        event.stopPropagation();

        this.isFavourite = !this.isFavourite;
        this.cdr.detectChanges();

        if (this.isFavourite) {
            this.userService.addFavourite(this.stop.id).subscribe({
                next: () => console.log('Preferito aggiunto!'),
                error: (err) => {
                    console.error('Errore aggiunta preferito', err);
                    this.isFavourite = false; // Rollback in caso di errore del server
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.userService.removeFavourite(this.stop.id).subscribe({
                next: () => console.log('Preferito rimosso!'),
                error: (err) => {
                    console.error('Errore rimozione preferito', err);
                    this.isFavourite = true; // Rollback in caso di errore del server
                    this.cdr.detectChanges();
                }
            });
        }
    }


    public openNoteModal(event: Event) {
        event.stopPropagation();
        this.tempNoteContent = this.noteContent; // Copia il testo attuale per modificarlo
        this.isNoteModalOpen = true;
    }

    public closeNoteModal(event: Event) {
        event.stopPropagation();
        this.isNoteModalOpen = false;
    }

    public saveNote(event: Event) {
        event.stopPropagation();

        // If user empties the note --> delete note
        if (!this.tempNoteContent.trim()) {
            if (this.savedNoteId) {
                this.isLoadingNote = true;
                this.noteService.deleteNote(this.savedNoteId).subscribe(() => {
                    this.noteContent = '';
                    this.savedNoteId = undefined;
                    this.isLoadingNote = false;
                    this.isNoteModalOpen = false;
                    this.cdr.detectChanges();
                });
            } else {
                this.isNoteModalOpen = false;
            }
            return;
        }

        // otherwise save
        this.isLoadingNote = true;
        this.noteService.saveNote(this.stop.id, this.tempNoteContent).subscribe((res) => {
            this.savedNoteId = res._id;
            this.noteContent = this.tempNoteContent;
            this.isLoadingNote = false;
            this.isNoteModalOpen = false;
            this.cdr.detectChanges();
        });
    }

    private fetchStopTimes(stopId: string): void {
        this.isLoadingTimes = true;
        this.timesError = null;
        this.currentStopTimes = [];

        this.http.get<StopTime[]>(`${this.baseUrl}${stopId}/stop-times`).subscribe({
            next: data => {
                this.currentStopTimes = data;
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            },
            error: err => {
                console.error("Error fetching stop times", err);
                this.timesError = "Impossibile caricare gli orari in tempo reale.";
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadAlerts(): void {
        this.isLoadingAlerts = true;
        this.activeAlerts = [];

        this.alertService.getActiveAlertsForStop(this.stop.id).subscribe({
            next: (alerts) => {
                this.activeAlerts = alerts;
                this.isLoadingAlerts = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Errore durante il caricamento degli avvisi", err);
                this.isLoadingAlerts = false;
                this.cdr.detectChanges();
            }
        });
    }

    public openTripDetails(time: StopTime): void {
        this.isModalOpen = true;
        this.selectedTripHeadsign = time.headsign || "Sconosciuta";
        this.isLoadingTrip = true;
        this.tripDetails = [];
        this.cdr.detectChanges();

        const encodedTripId = encodeURIComponent(time.tripId);

        this.http.get<TripDetail[]>(`${this.baseUrl}trip/${encodedTripId}/details`).subscribe({
            next: data => {
                this.tripDetails = data;
                this.isLoadingTrip = false;
                this.cdr.detectChanges();
            },
            error: err => {
                console.error(err);
                this.isLoadingTrip = false;
                this.cdr.detectChanges();
            }
        });
    }

    public closeModal(): void {
        this.isModalOpen = false;
        this.tripDetails = [];
    }
}
