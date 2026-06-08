import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, OnInit, OnDestroy } from "@angular/core";
import { DatePipe, CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { Stop } from "../class/stop";
import { Stoptime, StoptimeWithTripInfo, TripInformation } from '../class/stop-time';
import { AuthService } from "../auth/services/auth.service";
import { UserService } from "../user/services/user.service";
import { NoteService } from "../user/services/note.service";
import { AlertService, Alert } from "../alert/services/alert.service";
import { Park } from "../class/park";

/**
 * Component for displaying transport timetables for a specific stop.
 * Shows upcoming departures, calculating real-time delays or scheduled times.
 * Triggers a backend call whenever the `stop` input property changes (via ngOnChanges).
 */
@Component({
    selector: 'app-timetable',
    imports: [DatePipe, FormsModule, CommonModule],
    templateUrl: './timetable.html'
})
export class Timetable implements OnChanges, OnInit, OnDestroy {
    @Input() stop?: Stop;
    @Input() park?: Park;

    public currentStopTimes: StoptimeWithTripInfo[] = [];
    public isLoadingTimes: boolean = false;
    public timesError: string | null = null;

    public isModalOpen: boolean = false;
    public selectedTrip?: TripInformation = undefined;
    public tripDetails: Stoptime[] = [];
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
    public isAlertsPanelOpen: boolean = false;

    //Endipoint backend
    private baseUrl: string = "http://localhost:3000/pois/stop/";

    public selectedScore: number = 0;
    public isSubmittingFeedback: boolean = false;
    public feedbackSuccess: boolean = false;
    public existingFeedbackScore: number | null = null;
    public isLoadingFeedback: boolean = false;
    public isEditingFeedback: boolean = false;
    public isFeedbackSectionOpen: boolean = false;
    public averageAffollamento: number = 0;
    public selectedTripArrivalDate: string | null = null;

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
            if (this.isLoggedIn && (this.stop || this.park)) {
                this.loadUserDataForPoi();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["stop"] && this.stop) {
            this.isAlertsPanelOpen = false;

            this.park = undefined; 

            this.fetchStopTimes(this.stop.id);
            this.loadAlerts();

            if (this.isLoggedIn) {
                this.loadUserDataForPoi();
            }
        }

        if (changes["park"] && this.park) {
            this.isAlertsPanelOpen = false;
            
            this.stop = undefined; 

            this.currentStopTimes = [];
            this.activeAlerts = [];

            if (this.isLoggedIn) {
                this.loadUserDataForPoi();
            }
        }
    }

    ngOnDestroy() {
        if (this.authSub) this.authSub.unsubscribe();
    }

    private getPoiId(): string | undefined {
        if (this.park) return this.park.id || (this.park as any)._id;
        if (this.stop) return this.stop.id || (this.stop as any)._id;
        return undefined;
    }

    //---Notes and Favourites---
    private loadUserDataForPoi() {
        const poiId = this.getPoiId();
        if (!poiId) return;

        this.isLoadingNote = true;

        if (this.park) {
            // Reset preventivo dello stato per evitare flash visivi errati
            this.isFavourite = false;
            this.noteContent = '';
            this.savedNoteId = undefined;

            this.userService.getFavouriteParks().subscribe({
                next: (favouriteParks) => {
                    this.isFavourite = favouriteParks.some(fav => fav.id === poiId || (fav as any)._id === poiId);
                    this.cdr.detectChanges();
                },
                error: (err) => console.error("Errore caricamento parcheggi preferiti", err)
            });

            this.noteService.getNoteForPark(poiId).subscribe({
                next: (note) => {
                    this.noteContent = note?.content || '';
                    this.savedNoteId = note?._id;
                    this.isLoadingNote = false;
                    this.cdr.detectChanges();
                },
                error: () => { this.isLoadingNote = false; }
            });

        } else if (this.stop) {
            this.isFavourite = false;
            this.noteContent = '';
            this.savedNoteId = undefined;

            this.userService.getFavourites().subscribe({
                next: (favourites) => {
                    this.isFavourite = favourites.some(fav => fav.id === poiId || (fav as any)._id === poiId);
                    this.cdr.detectChanges();
                },
                error: (err) => console.error("Errore caricamento fermate preferite", err)
            });

            this.noteService.getNoteForStop(poiId).subscribe({
                next: (note) => {
                    this.noteContent = note?.content || '';
                    this.savedNoteId = note?._id;
                    this.isLoadingNote = false;
                    this.cdr.detectChanges();
                },
                error: () => { this.isLoadingNote = false; }
            });
        }
    }

    public toggleFavourite(event: Event) {
        event.stopPropagation();
        const poiId = this.getPoiId();
        if (!poiId) return;

        this.isFavourite = !this.isFavourite;
        this.cdr.detectChanges();

        if (this.park) {
            if (this.isFavourite) {
                this.userService.addFavouritePark(poiId).subscribe({
                    next: () => console.log('Parcheggio preferito aggiunto!'),
                    error: (err) => {
                        console.error('Errore aggiunta parcheggio preferito', err);
                        this.isFavourite = false;
                        this.cdr.detectChanges();
                    }
                });
            } else {
                this.userService.removeFavouritePark(poiId).subscribe({
                    next: () => console.log('Parcheggio preferito rimosso!'),
                    error: (err) => {
                        console.error('Errore rimozione parcheggio preferito', err);
                        this.isFavourite = true;
                        this.cdr.detectChanges();
                    }
                });
            }
        } else if (this.stop) {
            if (this.isFavourite) {
                this.userService.addFavourite(poiId).subscribe({
                    next: () => console.log('Fermata preferita aggiunta!'),
                    error: (err) => {
                        console.error('Errore aggiunta fermata preferita', err);
                        this.isFavourite = false;
                        this.cdr.detectChanges();
                    }
                });
            } else {
                this.userService.removeFavourite(poiId).subscribe({
                    next: () => console.log('Fermata preferita rimossa!'),
                    error: (err) => {
                        console.error('Errore rimozione fermata preferita', err);
                        this.isFavourite = true;
                        this.cdr.detectChanges();
                    }
                });
            }
        }
    }

    toggleAlertsPanel(): void {
        this.isAlertsPanelOpen = !this.isAlertsPanelOpen;
    }


    public openNoteModal(event: Event) {
        event.stopPropagation();
        this.tempNoteContent = this.noteContent;
        this.isNoteModalOpen = true;
    }

    public closeNoteModal(event: Event) {
        event.stopPropagation();
        this.isNoteModalOpen = false;
    }

    public saveStopNote(event: Event): void {
        event.stopPropagation();
        if (!this.stop) return;
        const stopId = this.stop.id || (this.stop as any)._id;
        if (!stopId) return;

        if (!this.tempNoteContent.trim()) {
            if (this.savedNoteId) {
                this.isLoadingNote = true;
                this.noteService.deleteNote(this.savedNoteId).subscribe(() => {
                    this.resetNoteState();
                });
            } else {
                this.isNoteModalOpen = false;
            }
            return;
        }

        this.isLoadingNote = true;
        this.noteService.saveNote(stopId, this.tempNoteContent).subscribe((res) => {
            this.updateNoteState(res._id);
        });
    }

    public saveParkNote(event: Event): void {
        event.stopPropagation();
        if (!this.park) return;
        const parkId = this.park.id || (this.park as any)._id;
        if (!parkId) return;

        if (!this.tempNoteContent.trim()) {
            if (this.savedNoteId) {
                this.isLoadingNote = true;
                this.noteService.deleteParkNote(this.savedNoteId).subscribe(() => {
                    this.resetNoteState();
                });
            } else {
                this.isNoteModalOpen = false;
            }
            return;
        }

        this.isLoadingNote = true;
        this.noteService.saveParkNote(parkId, this.tempNoteContent).subscribe((res) => {
            this.updateNoteState(res._id);
        });
    }

    private resetNoteState(): void {
        this.noteContent = '';
        this.savedNoteId = undefined;
        this.isLoadingNote = false;
        this.isNoteModalOpen = false;
        this.cdr.detectChanges();
    }

    private updateNoteState(noteId: string): void {
        this.savedNoteId = noteId;
        this.noteContent = this.tempNoteContent;
        this.isLoadingNote = false;
        this.isNoteModalOpen = false;
        this.cdr.detectChanges();
    }
    private fetchStopTimes(stopId: string): void {
        this.isLoadingTimes = true;
        this.timesError = null;
        this.currentStopTimes = [];

        this.http.get<StoptimeWithTripInfo[]>(`${this.baseUrl}${stopId}/stop-times`).subscribe({
            next: (data) => {
                this.currentStopTimes = data;
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching stop times', err);
                this.timesError = 'Impossibile caricare gli orari in tempo reale.';
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadAlerts(): void {
        if (!this.stop) return;
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

    public openTripDetails(time: StoptimeWithTripInfo): void {
        this.isModalOpen = true;
        this.selectedTrip = time.tripInfo;
        this.isLoadingTrip = true;
        this.tripDetails = [];

        this.selectedScore = 0;
        this.feedbackSuccess = false;
        this.existingFeedbackScore = null;
        this.averageAffollamento = 0;
        this.selectedTripArrivalDate = time.stoptime?.scheduledArrival || null;
        if (time.tripInfo?.id) {
            this.userService.getAvgTripFeedback(time.tripInfo.id)
                .subscribe((avg: number) => {
                    this.averageAffollamento = avg || 0;
                    this.cdr.detectChanges();
                })
        }


        const encodedTripId = encodeURIComponent(time.tripInfo.id);
        const serviceDateTimestamp = Date.parse(time.tripInfo.serviceDate);

        this.http.get<Stoptime[]>(`${this.baseUrl}trip/${encodedTripId}/${serviceDateTimestamp}/details`).subscribe({
            next: (data) => {
                this.tripDetails = data;
                this.isLoadingTrip = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error(err);
                this.isLoadingTrip = false;
                this.cdr.detectChanges();
            }
        });

        if (this.isLoggedIn) {
            const feedbackDateString = this.selectedTripArrivalDate || new Date().toISOString();
            const dateObj = new Date(feedbackDateString);
            const currentDay = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
            this.isLoadingFeedback = true;
            this.userService.getTripFeedback(time.tripInfo.id, currentDay).subscribe({
                next: (fb) => {
                    this.isLoadingFeedback = false;
                    if (fb && fb.feedback) {
                        this.existingFeedbackScore = fb.feedback;
                        this.selectedScore = fb.feedback;
                    }
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoadingFeedback = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    protected isUpcomingStop(stop: Stoptime, allStops: Stoptime[]): boolean {
        const realtimeStopIndex = allStops.findIndex(s => s.realtime);
        if(realtimeStopIndex === -1 || this.selectedTrip?.id.startsWith("Trenitalia")) { // hack to prevent Trenitalia trips from breaking visulization, will need to go once vehicle positions are implemented
            const now = Date.now();
            const stopTime = Date.parse(stop.scheduledDeparture) + (stop.departureDelay * 1000);
            return stopTime - now > 0;
        } else {
            // workaround only for TT until vehicle positions get implemented
            const delay = allStops.at(-1)!.departureDelay;
            return allStops.findIndex(s => s === stop) >= realtimeStopIndex;
        }
    }

    public closeModal(): void {
        this.isModalOpen = false;
        this.tripDetails = [];
        this.selectedScore = 0;
        this.feedbackSuccess = false;
        this.isSubmittingFeedback = false;
        this.existingFeedbackScore = null;
        this.isLoadingFeedback = false;
        this.isEditingFeedback = false;
        this.averageAffollamento = 0;
        this.selectedTripArrivalDate = null;
    }

    public setScore(score: number, event: Event): void {
        event.stopPropagation();
        if (!this.isEditingFeedback && this.existingFeedbackScore !== null) return;
        if (this.isSubmittingFeedback || this.feedbackSuccess) return;

        this.selectedScore = score;
        this.cdr.detectChanges();
    }

    public enableEditing(event: Event): void {
        event.stopPropagation();
        this.isEditingFeedback = true;
        this.cdr.detectChanges();
    }

    toggleFeedbackSection(event: Event): void {
        event.stopPropagation();
        this.isFeedbackSectionOpen = !this.isFeedbackSectionOpen;
        this.cdr.detectChanges();
    }

    public submitFeedback(): void {
        if (!this.selectedTrip || this.selectedScore < 1 || this.selectedScore > 10) return;

        this.isSubmittingFeedback = true;
        this.cdr.detectChanges();

        const feedbackDateString = this.selectedTripArrivalDate || new Date().toISOString();
        const dateObj = new Date(feedbackDateString);
        const currentDay = dateObj.getDay() === 0 ? 7 : dateObj.getDay(); // Convert Sunday from 0 to 7 for ISO standard

        const request$ = this.existingFeedbackScore !== null
        ? this.userService.updateTripFeedback(this.selectedTrip.id, this.selectedTrip.headsign, this.selectedScore, currentDay)
        : this.userService.sendTripFeedback(this.selectedTrip.id, this.selectedTrip.headsign, this.selectedScore, currentDay);

        request$.subscribe({
            next: () => {
                this.isSubmittingFeedback = false;
                this.feedbackSuccess = true;
                this.existingFeedbackScore = this.selectedScore; // Update historical value reference
                this.isEditingFeedback = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Failed to submit/update trip feedback", err);
                this.isSubmittingFeedback = false;
                this.cdr.detectChanges();
            }
        });
    }

}
