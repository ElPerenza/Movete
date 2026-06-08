import { Component, OnInit } from '@angular/core';
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

    constructor(private statsService: StatisticsService) {}

    ngOnInit(): void {
        this.loadDropdownOptions();
    }

    loadDropdownOptions() {
        this.statsService.getParkingOptions().subscribe(data => this.parkingOptions = data);
        this.statsService.getTripOptions().subscribe(data => this.tripOptions = data);
    }

    onSearchTypeChange() {
        this.selectedId = '';
        this.statsData = null;
    }

    loadStatistics() {
        if (!this.selectedId) return;

        this.isLoading = true;
        const request$ = this.searchType === 'parking' 
        ? this.statsService.getParkingWeeklyStats(this.selectedId)
        : this.statsService.getTripWeeklyStats(this.selectedId);

        request$.subscribe({
        next: (data) => {
            this.statsData = data;
            this.isLoading = false;
        },
        error: (err) => {
            console.error('Errore nel caricamento delle statistiche:', err);
            this.isLoading = false;
        }
        });
    }


    getBarHeight(average: number): string {
        if (!average) return '0%';
        const percentage = (average / 10) * 100;
        return `${percentage}%`;
    }
}