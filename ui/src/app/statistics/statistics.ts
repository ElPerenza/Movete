import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService } from './statistics.service';
import { ParkingSelectOption, TripSelectOption, WeeklyOverview } from '../class/statistic';
import { catchError, forkJoin, of } from 'rxjs';

interface SortedTripOption {
  id: string; 
  time: string; 
}

interface EnhancedTripOption extends TripSelectOption {
  routeShortName?: string;
  extractedTime?: string;
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
    tripOptions: EnhancedTripOption[] = []; 
    distinctHeadsigns: EnhancedTripOption[] = [];   
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
        
        this.statsService.getTripOptions().subscribe(trips => {
            if (!trips || trips.length === 0) return;

            this.tripOptions = trips.map(trip => {
                return { ...trip, routeShortName: ''};
            });

            this.updateDistinctHeadsigns();

            this.tripOptions.forEach((trip, index) => {
                this.statsService.getTripDetails(trip.id).subscribe({
                    next: (res) => {
                        const serverShortName = res ? res.trim() : '';

                        if (trip.id.startsWith('Trenitalia:')) {
                            const parts = trip.id.split('-');
                            const trainNumber = parts.length >= 3 ? parts[parts.length - 3].trim() : '';
                            
                            this.tripOptions[index].routeShortName = serverShortName 
                                ? `${serverShortName} ${trainNumber}`.trim() 
                                : trainNumber;
                        } else {
                            this.tripOptions[index].routeShortName = serverShortName;
                        }
                        
                        this.updateDistinctHeadsigns();
                    },
                    error: () => {

                        this.tripOptions[index].routeShortName = '';
                        
                        this.updateDistinctHeadsigns();
                    }
                });
            });
        });
    }

    updateDistinctHeadsigns() {
        const seen = new Set<string>();
        const tempDistinct: EnhancedTripOption[] = [];

        this.tripOptions.forEach(trip => {
            if (!seen.has(trip.headsign)) {
                seen.add(trip.headsign);
                tempDistinct.push({ ...trip });
            } else {
                const existing = tempDistinct.find(t => t.headsign === trip.headsign);
                if (existing && !existing.routeShortName && trip.routeShortName) {
                    existing.routeShortName = trip.routeShortName;
                }
            }
        });

        this.distinctHeadsigns = [...tempDistinct];
        this.cdr.detectChanges();
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
        
        const matchingTrips = this.tripOptions.filter(t => t.headsign === headsign);

        const tempOptions: SortedTripOption[] = [];
        const seenTimes = new Set<string>();
        const todayTimestamp = new Date().setHours(0, 0, 0, 0);

        if (matchingTrips.length === 0) {
            this.isLoadingTimes = false;
            this.cdr.detectChanges();
            return;
        }

        const requests = matchingTrips.map(trip => 
            this.statsService.getTripDetailsWithTime(trip.id, todayTimestamp).pipe(
                catchError(err => {
                    console.error(`Errore caricamento dettagli per trip ${trip.id}:`, err);
                    return of(null);
                })
            )
        );

        forkJoin(requests).subscribe({
            next: (responses) => {
                responses.forEach((stopTimes, index) => {
                    const originalTripId = matchingTrips[index].id;
                    
                    if (stopTimes && stopTimes.length > 0) {
                        const departureDates = stopTimes
                            .map((st: any) => st.stoptime?.scheduledDeparture || st.scheduledDeparture)
                            .filter(Boolean);

                        if (departureDates.length > 0) {
                            const firstDeparture = new Date(departureDates[0]);
                            const formattedTime = firstDeparture.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            
                            // Controlla se l'orario è già stato inserito per evitare duplicati
                            if (!seenTimes.has(formattedTime)) {
                                seenTimes.add(formattedTime);
                                tempOptions.push({
                                    id: originalTripId,
                                    time: formattedTime
                                });
                            }
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