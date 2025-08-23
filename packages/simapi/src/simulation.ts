import { simulate, SimulationResult } from 'simulation';

let chargingDemandProbabilities = new Map([
    [0, 34.31],  [5, 4.90],   [10, 9.80],  [20, 11.76], [30, 8.82],
    [50, 11.76], [100, 10.78], [200, 4.90], [300, 2.94]
]);

interface SimulationRunResults {
  data: SimulationResult;
  status: 'COMPLETED' | 'FAILED';
}

export function executeSimulation(inputs: any): Promise<SimulationRunResults> {
  const chargers: number[] = [];
  for (let i = 0; i < inputs.chargers.length; i++) {
    for (let j = 0; j < inputs.chargers[i].count; j++) {
      chargers.push(inputs.chargers[i].power);
    }
  }
  return new Promise((resolve) => {
    simulate({
      chargingDemandProbabilities,
      chargers,
      arrivalDistribution: inputs.arrivalProbabilities,
      evConsumption: inputs.energyConsumption
    }, (results) => {
      resolve({
        data: results,
        status: 'COMPLETED'
      })
    })
  })
}
