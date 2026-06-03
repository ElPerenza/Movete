import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, Alert } from '../alert/services/alert.service';
import { AuthService } from '../auth/services/auth.service';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, FormsModule],
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
    public alerts: Alert[] = [];
    public isLoading = false;

    // Modello per il nuovo avviso
    public newAlert: Partial<Alert> = {
        title: '',
        message: '',
        stopId: '',
        validFrom: '',
        validUntil: '',
        isActive: true
    };

    public searchStopId: string = '';
    public hasSearched: boolean = false;
    public isShowingFiltered: boolean = false;

    constructor(
        private alertService: AlertService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadAlerts();
    }

    searchAlertsForStop() {
        if (!this.searchStopId.trim()) {
            this.loadAlerts();
            return;
        }

        this.isLoading = true;
        this.hasSearched = true;

        this.alertService.getActiveAlertsForStop(this.searchStopId.trim()).subscribe({
            next: (data) => {
                this.alerts = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Errore ricerca', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadAlerts() {
        this.isLoading = true;
        this.isShowingFiltered = false;
        this.searchStopId = '';
        this.alertService.getAllAlerts(20).subscribe({
            next: (data) => {
                this.alerts = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Errore nel caricamento avvisi', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    createAlert() {
        const currentUser = this.authService.getCurrentUser();

        if (!currentUser || !currentUser.userId) {
            alert('Devi essere loggato per creare un avviso!');
            return;
        }

        if (!this.newAlert.stopId || !this.newAlert.title || !this.newAlert.message) {
            alert("Compila tutti i campi di testo.");
            return;
        }
        if (!this.newAlert.validFrom || !this.newAlert.validUntil) {
            alert("Inserisci le date di inizio e fine validità.");
            return;
        }

        const alertToSave: Alert = {
            title: this.newAlert.title!,
            message: this.newAlert.message!,
            stopId: this.newAlert.stopId!,
            validFrom: new Date(this.newAlert.validFrom!).toISOString(),
            validUntil: new Date(this.newAlert.validUntil!).toISOString(),
            isActive: true,
            createdBy: currentUser.userId
        } as Alert;

        this.alertService.saveAlert(alertToSave).subscribe({
            next: (savedAlert) => {
                this.alerts.unshift(savedAlert); // Aggiunge in cima alla lista
                this.resetForm();
                alert("Avviso creato con successo");
            },
            error: (err) => {
                console.error('Errore salvataggio avviso', err);
                alert("Errore dal server: controlla la console");
            }
        });
    }

    deleteAlert(id: string) {
        if (confirm('Sei sicuro di voler eliminare questo avviso?')) {
            this.alertService.deleteAlert(id).subscribe({
                next: () => {
                    this.alerts = this.alerts.filter(a => (a._id || (a as any).id) !== id);
                },
                error: (err) => console.error('Errore cancellazione avviso', err)
            });
        }
    }

    private resetForm() {
        this.newAlert = { title: '', message: '', stopId: '', validFrom: '', validUntil: '', isActive: true };
    }
}
