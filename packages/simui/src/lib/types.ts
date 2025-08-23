export interface ChargerConfig {
  id: string;
  count: number;
  power: number;
}

export interface SimulationInput {
  chargers: ChargerConfig[];
  arrivalProbabilities: number[];
  energyConsumption: number;
  name?: string;
}
