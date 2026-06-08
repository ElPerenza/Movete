import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatisticsService } from './statistics.service';
import { ParkingSelectOption, TripSelectOption, WeeklyOverview } from '../class/statistic';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics.html',
})
export class StatisticsComponent implements OnInit {
    searchType: 'parking' | 'trip' = 'parking';
    selectedId: string = '';

  
    parkingOptions: ParkingSelectOption[] = [];
    tripOptions: TripSelectOption[] = [];


    statsData: WeeklyOverview | null = null;
    isLoading: boolean = false;

    constructor(private statsService: StatisticsService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.loadDropdownOptions();
    }

    loadDropdownOptions() {
        this.statsService.getParkingOptions().subscribe(data => {this.parkingOptions = data; this.cdr.detectChanges();});
        this.statsService.getTripOptions().subscribe(data => {this.tripOptions = data; this.cdr.detectChanges();});
        this.cdr.detectChanges();
    }

    onSearchTypeChange() {
        this.selectedId = '';
        this.statsData = null;
        this.cdr.detectChanges();
    }

    loadStatistics() {
        if (!this.selectedId) return;

        this.cdr.detectChanges();
        this.isLoading = true;
        const request$ = this.searchType === 'parking' 
        ? this.statsService.getParkingWeeklyStats(this.selectedId)
        : this.statsService.getTripWeeklyStats(this.selectedId);

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
        const percentage = (average / 10) * 100;
        return `${percentage}%`;
    }
}