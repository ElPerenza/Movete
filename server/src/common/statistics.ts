export interface ParkingSelectOption {
  id: string;
  name: string;
}

export interface TripSelectOption {
  id: string;
  headsign: string;
}

// Per i dati del grafico settimanale
export interface WeeklyStopStatistic {
  dayOfWeek: number;
  dayName: string;
  averageFeedback: number;
  totalFeedbacks: number; 
}

export interface WeeklyOverview {
  totalFeedbacksAllTime: number;
  overallAverage: number;
  weeklyData: WeeklyStopStatistic[];
}