#pragma once
#include <map>
#include <random>
#include <vector>

#define TICK_DURATION 15

using demand_t = int;

namespace sim {

struct Charger {
  double powerKw;
};

struct ChargerState {
  double powerKw;
  bool occupied;
  double demandKwh;
};

// Saved for each tick.
// Assuming 1 entry = 20 bytes, 35 000 ticks and 16 threads
// This consumes 11 MB of RAM in total.
struct WorkerState {
  double totalPowerKw;   // Power consumed by all chargers
  double totalEnergyKwh; // Total energy charged in this tick
  int numOfEvents; // Number of charging events (# of EVs that arrived to charge
                   // in this tick)
};

class Random {
public:
  // Constructor takes a map of outcomes (int) to their probabilities (double).
  Random(std::map<demand_t, double> _demandDistribution,
         std::vector<double> _arrivalDistribution);

  // Get energy demand
  demand_t demand();

  // Given simulation tick, determine if an EV arrives
  bool evArrives(int tick);

private:
  std::mt19937 gen;
  std::uniform_real_distribution<> arrivalDis;
  std::vector<int> outcomes;
  std::vector<double> weights;
  std::discrete_distribution<int> demandDis;
  std::vector<double> arrivalProbabilities;
  // Seed for random number generation
  static constexpr unsigned int seed = 1;
};

class Worker {
public:
  static constexpr int totalTicks = 35040; // 1 year

  void run();

  double demandToKwh(demand_t demand);

  const std::vector<WorkerState>& getWorkerState();

  Worker(std::map<demand_t, double> demandDistribution,
         std::vector<double> _arrivalDistribution,
         std::vector<Charger> chargers, double evConsumption);

private:
  Random rand;
  double evConsumption;
  std::vector<Charger> chargers;
  std::vector<ChargerState> chargersState;
  std::vector<WorkerState> workerState;
  // Seed for random number generation
  static constexpr unsigned int seed = 1;
};
} // namespace sim
