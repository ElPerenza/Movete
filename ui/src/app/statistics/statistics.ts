import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService } from './statistics.service';
import { ParkingSelectOption, TripSelectOption, WeeklyOverview } from '../class/statistic';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface SortedTripOption {
  id: string; 
  time: string; 
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics.html',
})
export class StatisticsComponent implements OnInit {
    searchType: 'parking' | 'trip' = 'parking';
    
    selectedId: string = '';
    selectedTripRealId: string = ''; 

    parkingOptions: ParkingSelectOption[] = [];
    rawTripOptions: TripSelectOption[] = []; 
    distinctHeadsigns: string[] = [];         
    tripTimeOptions: SortedTripOption[] = [];

    statsData: WeeklyOverview | null = null;
    isLoading: boolean = false;
    isLoadingTimes: boolean = false;

    constructor(private statsService: StatisticsService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.loadDropdownOptions();
    }

    loadDropdownOptions() {
        this.statsService.getParkingOptions().subscribe(data => {
            this.parkingOptions = data;
            this.cdr.detectChanges();
        });
        
        this.statsService.getTripOptions().subscribe(data => {
            this.rawTripOptions = data;
            const headsignsSet = new Set(data.map(t => t.headsign).filter(Boolean));
            this.distinctHeadsigns = Array.from(headsignsSet).sort();
            this.cdr.detectChanges();
        });
    }

    onSearchTypeChange() {
        this.selectedId = '';
        this.selectedTripRealId = '';
        this.tripTimeOptions = [];
        this.statsData = null;
        this.cdr.detectChanges();
    }

    onMainSelectionChange() {
        this.statsData = null;
        this.selectedTripRealId = '';
        this.tripTimeOptions = [];

        if (!this.selectedId) return;

        if (this.searchType === 'parking') {
            this.loadStatistics();
        } else {

            this.loadDepartureTimesForHeadsign(this.selectedId);
        }
    }

    loadDepartureTimesForHeadsign(headsign: string) {
        this.isLoadingTimes = true;
        this.cdr.detectChanges();

        const matchingTrips = this.rawTripOptions.filter(t => t.headsign === headsign);
        const todayTimestamp = new Date().setHours(0, 0, 0, 0);

        if (matchingTrips.length === 0) {
            this.isLoadingTimes = false;
            this.cdr.detectChanges();
            return;
        }

        const requests = matchingTrips.map(trip => 
            this.statsService.getTripDetails(trip.id, todayTimestamp).pipe(
                catchError(err => {
                    console.error(`Errore caricamento dettagli per trip ${trip.id}:`, err);
                    return of(null);
                })
            )
        );

        forkJoin(requests).subscribe({
            next: (responses) => {
                const tempOptions: SortedTripOption[] = [];

                responses.forEach((stopTimes, index) => {
                    const originalTripId = matchingTrips[index].id;
                    
                    if (stopTimes && stopTimes.length > 0) {
                        const departureDates = stopTimes
                            .map((st: any) => st.stoptime?.scheduledDeparture || st.scheduledDeparture)
                            .filter(Boolean);

                        if (departureDates.length > 0) {
                            const firstDeparture = new Date(departureDates[0]);
                            const formattedTime = firstDeparture.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            
                            tempOptions.push({
                                id: originalTripId,
                                time: formattedTime
                            });
                        }
                    }
                });

                this.tripTimeOptions = tempOptions.sort((a, b) => a.time.localeCompare(b.time));
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoadingTimes = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadStatistics() {
        const targetId = this.searchType === 'parking' ? this.selectedId : this.selectedTripRealId;
        if (!targetId) return;

        this.isLoading = true;
        this.cdr.detectChanges();

        const request$ = this.searchType === 'parking' 
            ? this.statsService.getParkingWeeklyStats(targetId)
            : this.statsService.getTripWeeklyStats(targetId);

        request$.subscribe({
            next: (data) => {
                this.statsData = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Errore nel caricamento delle statistiche:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getBarHeight(average: number): string {
        if (!average) return '0%';
        return `${(average / 10) * 100}%`;
    }

    getSelectedTimeText(): string {
        const found = this.tripTimeOptions.find(o => o.id === this.selectedTripRealId);
        return found ? found.time : '';
    }
}