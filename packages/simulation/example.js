import { simulate } from "./index.js"

let arrivalDistribution = [
    0.94, 0.94, 0.94, 0.94, 0.94,  0.94,  0.94,  0.94, 2.83, 2.83, 5.66, 5.66,
    5.66, 7.55, 7.55, 7.55, 10.38, 10.38, 10.38, 4.72, 4.72, 4.72, 0.94, 0.94
];

let chargingDemandProbabilities = new Map([
    [0, 34.31],  [5, 4.90],   [10, 9.80],  [20, 11.76], [30, 8.82],
    [50, 11.76], [100, 10.78], [200, 4.90], [300, 2.94]
]);

console.log("Chargers | Theoretical Max Power (kW) | Actual Max Power (kW) | Concurrency Factor");
console.log("---------|---------------------------|----------------------|-------------------");

for (let numChargers = 1; numChargers <= 30; numChargers++) {
    const chargers = new Array(numChargers).fill(11);
    const theoreticalMaxPower = numChargers * 11;
    
    simulate({
        arrivalDistribution,
        chargingDemandProbabilities,
        chargers: chargers,
        evConsumption: 18
    }, (results) => {
        const actualMaxPower = results.totalMaxPowerKw;
        const concurrencyFactor = actualMaxPower / theoreticalMaxPower;
        
        console.log(`${numChargers.toString().padStart(8)} | ${theoreticalMaxPower.toString().padStart(25)} | ${actualMaxPower.toFixed(2).padStart(20)} | ${concurrencyFactor.toFixed(4).padStart(17)}`);
    });
}
