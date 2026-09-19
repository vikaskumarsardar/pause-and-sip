export type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export type BreathPatternId = 'box' | 'relax_4_7_8' | 'equal_4_4' | 'custom';

export interface BreathPhaseConfig {
  phase: BreathPhase;
  durationSeconds: number;
  label: string;
  colorKey: 'inhale' | 'exhale' | 'hold';
}

export interface BreathPattern {
  id: BreathPatternId;
  name: string;
  description: string;
  isProOnly: boolean;
  phases: BreathPhaseConfig[];
  totalCycleSeconds: number;
}

export interface BreathSessionLog {
  id: string;
  timestamp: number;
  patternId: BreathPatternId;
  durationSeconds: number;
  completedCycles: number;
}
