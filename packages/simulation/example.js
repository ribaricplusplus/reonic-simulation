import { simulate } from "./index.js"

let arrivalDistribution = [
    0.94, 0.94, 0.94, 0.94, 0.94,  0.94,  0.94,  0.94, 2.83, 2.83, 5.66, 5.66,
    5.66, 7.55, 7.55, 7.55, 10.38, 10.38, 10.38, 4.72, 4.72, 4.72, 0.94, 0.94
];

let chargingDemandProbabilities = new Map([
    [0, 34.31],  [5, 4.90],   [10, 9.80],  [20, 11.76], [30, 8.82],
    [50, 11.76], [100, 10.78], [200, 4.90], [300, 2.94]
]);

simulate({
    arrivalDistribution,
    chargingDemandProbabilities,
    chargers: [11],
    evConsumption: 18
}, (results) => {
    console.log(results);
    const nonZeroMaxPowerEntries = results.results.filter(day => day.maxPowerKw > 0).length;
    console.log(`Number of days with non-zero maxPowerKw: ${nonZeroMaxPowerEntries}`);
});
