#include "worker.hpp"
#include <stdexcept>

namespace sim {
Random::Random(std::map<demand_t, double> _demandDistribution,
               std::vector<double> _arrivalDistribution)
    : arrivalProbabilities(_arrivalDistribution) {
  if (_demandDistribution.empty()) {
    throw std::invalid_argument("Demand distribution cannot be empty.");
  }

  if (_arrivalDistribution.size() != 24) {
    throw std::invalid_argument(
        "Arrival probabilities must contain 24 values.");
  }

  gen.seed(Random::seed);

  for (const auto &pair : _demandDistribution) {
    outcomes.push_back(pair.first);
    weights.push_back(pair.second);
  }

  demandDis = std::discrete_distribution<int>(weights.begin(), weights.end());
  arrivalDis = std::uniform_real_distribution<>(0.0, 1.0);
}

demand_t Random::demand() {
  int sampled_index = demandDis(gen);
  return outcomes[sampled_index];
}

bool Random::evArrives(int tick) {
  // (tick % ticksInDay) / ticksInHour
  int hour = (tick % (4 * 24)) / 4;
  return arrivalDis(gen) < arrivalProbabilities[hour];
}

const std::vector<WorkerState> &Worker::getWorkerState() { return workerState; }

Worker::Worker(std::map<demand_t, double> d1, std::vector<double> d2,
               std::vector<Charger> chargers, double evConsumption)
    : rand(Random(d1, d2)), chargers(chargers), evConsumption(evConsumption) {
  chargersState.resize(chargers.size());
  for (int i = 0; i < chargersState.size(); i++) {
    chargersState[i].powerKw = chargers[i].powerKw;
    chargersState[i].occupied = false;
  }
  workerState.resize(Worker::totalTicks);
}

// Accurate summation of many "double" values.
double kahanSum(const std::vector<double> &values) {
  double sum = 0.0;
  double c = 0.0; // A running compensation for lost low-order bits.

  for (double val : values) {
    double y =
        val -
        c; // c is the error from the last addition. Correct the next number.
    double t = sum + y; // Add the corrected number to the sum.
    // (t - sum) is the high-order part of y.
    // y - (t - sum) is the low-order part of y that was lost.
    // So, c is the new error.
    c = (t - sum) - y;
    sum = t;
  }
  return sum;
}

double Worker::demandToKwh(demand_t demand) {
  return (double)demand * evConsumption / 100.0;
}

void Worker::run() {
  for (int tick = 0; tick < Worker::totalTicks; tick++) {
    for (auto &charger : chargersState) {
      if (charger.demandKwh <= 0.0) {
        // Car leaves.
        charger.occupied = false;
        charger.demandKwh = 0.0;
      }

      if (!charger.occupied) {
        bool evArrived = rand.evArrives(tick);

        if (evArrived) {
          workerState[tick].numOfEvents++;
        }

        if ((charger.occupied = evArrived)) {
          demand_t demand = rand.demand();
          charger.demandKwh = demandToKwh(demand);
        }
      }

      // Consume energy if charger is occupied and there is demand
      if (charger.occupied && charger.demandKwh > 0.0) {
        double energyGenerated = charger.powerKw * (TICK_DURATION / 60.0);
        charger.demandKwh -= energyGenerated;

        workerState[tick].totalEnergyKwh += energyGenerated;
        workerState[tick].totalPowerKw += charger.powerKw;
      }
    }
  }
}
} // namespace sim
