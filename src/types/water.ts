export type UnitSystem = 'ml' | 'oz';

export interface WaterLogEntry {
  id: string;
  timestamp: number; // UNIX ms
  amountMl: number;  // Always store in ml for normalized precision
  presetLabel: string;
}

export interface WaterDailyGoal {
  targetMl: number;
  currentMl: number;
  unitSystem: UnitSystem;
  quickPresetsMl: number[];
}

export interface DailyWaterHistory {
  dateString: string; // YYYY-MM-DD
  totalMl: number;
  targetMl: number;
  entriesCount: number;
}
