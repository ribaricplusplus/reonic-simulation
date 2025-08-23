export interface Charger {
  id: string;
  count: number;
  power: number;
}

export interface SimulationConfig {
  chargers: number[];
  chargingDemandProbabilities: Map<number, number>;
  arrivalDistribution: number[];
  evConsumption: number;
}

export interface DayResult {
  maxPowerKw: number;
  energyConsumedKwh: number;
}

export interface SimulationResult {
  results: DayResult[];
  totalEnergyConsumed: number;
  totalMaxPowerKw: number;
}

export type SimulationCallback = (result: SimulationResult) => void;

export function simulate(config: SimulationConfig, callback: SimulationCallback): void;

declare const _default: {
  simulate: typeof simulate;
};

export default _default;