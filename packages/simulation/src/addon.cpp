#include <napi.h>
#include <atomic>
#include <memory>
#include <mutex>
#include "worker.hpp"

struct Results {
  double maxPowerKw;
  double energyConsumedKwh;
};

struct Shared {
  std::mutex mtx;
  std::vector<std::vector<sim::WorkerState>> simulationRuns;
  std::atomic<int> remaining{0};
  Napi::FunctionReference cb;
};

// Accurate summation of many "double" values.
double kahanSum(const std::vector<Results> &values) {
  double sum = 0.0;
  double c = 0.0; // A running compensation for lost low-order bits.

  for (auto result : values) {
    double val = result.energyConsumedKwh;
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

class WorkUnit : public Napi::AsyncWorker {
public:
  WorkUnit(Napi::Env env, std::shared_ptr<Shared> s, int id, std::unique_ptr<sim::Worker> worker)
    : Napi::AsyncWorker(env), s_(std::move(s)), id_(id), worker_(std::move(worker)) {}

  void Execute() override {
    worker_->run();
  }

  void OnOK() override {
    // Save simulation run
    {
      std::unique_lock<std::mutex> lock(s_->mtx);
      s_->simulationRuns.push_back(worker_->getWorkerState()); // Slow! Makes a copy of 35 000 elements.
    }

    if (s_->remaining.fetch_sub(1) == 1) {
      // This runs when all workers are done. (It runs on the main thread, we can use JS)

      // We calculate things we need based on simulation data.
      std::vector<Results> out(0);
      int ticksInDay = (60 / TICK_DURATION) * 24;
      int currentDay = 0;
      Results results;
      double totalMaxPower = 0.0;
      for (int i = 0; i < sim::Worker::totalTicks; i++) {
      double powerKw = 0.0;

        for (int j = 0; j < s_->simulationRuns.size(); j++) {
          powerKw += s_->simulationRuns[j][i].totalPowerKw;
          results.energyConsumedKwh += s_->simulationRuns[j][i].totalEnergyKwh;
        }

        if (powerKw > results.maxPowerKw) {
          results.maxPowerKw = powerKw;
        }

        if (powerKw > totalMaxPower) {
          totalMaxPower = powerKw;
        }

        // If this is a new day
        if (i > 0 && (i % ticksInDay) == 0 ) {
          out.push_back(results);
          currentDay++;
          results = {};
        }
      }

      // This is completely overkill
      double totalEnergyConsumed = kahanSum(out);

      Napi::HandleScope scope(Env());
      
      // Create JavaScript object with results
      Napi::Object resultObj = Napi::Object::New(Env());
      Napi::Array resultsArray = Napi::Array::New(Env(), out.size());
      Napi::Number jsTotalEnergyConsumed = Napi::Number::New(Env(), totalEnergyConsumed);
      Napi::Number jsTotalMaxPower = Napi::Number::New(Env(), totalMaxPower);
      
      for (size_t i = 0; i < out.size(); i++) {
        Napi::Object dayResult = Napi::Object::New(Env());
        dayResult.Set("maxPowerKw", Napi::Number::New(Env(), out[i].maxPowerKw));
        dayResult.Set("energyConsumedKwh", Napi::Number::New(Env(), out[i].energyConsumedKwh));
        resultsArray.Set(i, dayResult);
      }
      
      resultObj.Set("results", resultsArray);
      resultObj.Set("totalEnergyConsumed", jsTotalEnergyConsumed);
      resultObj.Set("totalMaxPowerKw", jsTotalMaxPower);
      
      s_->cb.Call({resultObj});
      s_->cb.Unref();
    }
    // AsyncWorker auto-deletes after OnOK/OnError. That will also delete Shared data.
  }

private:
  std::shared_ptr<Shared> s_;
  int id_;
  std::unique_ptr<sim::Worker> worker_;
};

Napi::Value RunWorkers(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Expect (config:object, callback:function)
  if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsFunction()) {
    Napi::TypeError::New(env, "Expected (config:object, callback:function)").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Napi::Object config = info[0].As<Napi::Object>();
  
  // Extract chargers array
  if (!config.Has("chargers") || !config.Get("chargers").IsArray()) {
    Napi::TypeError::New(env, "Config must have 'chargers' array").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  Napi::Array chargersArray = config.Get("chargers").As<Napi::Array>();
  std::vector<sim::Charger> chargers;
  for (uint32_t i = 0; i < chargersArray.Length(); i++) {
    if (!chargersArray.Get(i).IsNumber()) {
      Napi::TypeError::New(env, "All charger values must be numbers").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    chargers.push_back({chargersArray.Get(i).As<Napi::Number>().DoubleValue()});
  }

  // Extract charging demand probabilities
  if (!config.Has("chargingDemandProbabilities") || !config.Get("chargingDemandProbabilities").IsObject()) {
    Napi::TypeError::New(env, "Config must have 'chargingDemandProbabilities' Map").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  Napi::Object demandProbs = config.Get("chargingDemandProbabilities").As<Napi::Object>();
  Napi::Function mapCtor = env.Global().Get("Map").As<Napi::Function>();
  if (!demandProbs.InstanceOf(mapCtor)) {
    Napi::TypeError::New(env, "Expected chargingDemandProbabilities to be a Map.").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  Napi::Function entriesFn = demandProbs.Get("entries").As<Napi::Function>();
  Napi::Object demandProbsIterator = entriesFn.Call(demandProbs, {}).As<Napi::Object>();
  Napi::Array demandKeys = demandProbs.GetPropertyNames();
  Napi::Function nextFn = demandProbsIterator.Get("next").As<Napi::Function>();
  std::map<demand_t, double> chargingDemandProbabilities;

  while (true) {
    Napi::Object res = nextFn.Call(demandProbsIterator, {}).As<Napi::Object>();
    bool done = res.Get("done").ToBoolean();
    if (done) break;

    Napi::Array pair = res.Get("value").As<Napi::Array>();
    Napi::Value k = pair.Get((uint32_t)0);
    Napi::Value v = pair.Get((uint32_t)1);

    demand_t demand = k.ToNumber().Int32Value();
    double probability = v.ToNumber().DoubleValue() / 100;

    chargingDemandProbabilities[demand] = probability;
  }

  // Extract arrival distribution
  if (!config.Has("arrivalDistribution") || !config.Get("arrivalDistribution").IsArray()) {
    Napi::TypeError::New(env, "Config must have 'arrivalDistribution' array").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  Napi::Array arrivalArray = config.Get("arrivalDistribution").As<Napi::Array>();
  if (arrivalArray.Length() != 24) {
    Napi::TypeError::New(env, "arrivalDistribution must have exactly 24 elements").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  std::vector<double> arrivalDistribution;
  for (uint32_t i = 0; i < arrivalArray.Length(); i++) {
    if (!arrivalArray.Get(i).IsNumber()) {
      Napi::TypeError::New(env, "All arrival distribution values must be numbers").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    arrivalDistribution.push_back(arrivalArray.Get(i).As<Napi::Number>().DoubleValue() / 100.0);
  }

  // Extract EV consumption
  if (!config.Has("evConsumption") || !config.Get("evConsumption").IsNumber()) {
    Napi::TypeError::New(env, "Config must have 'evConsumption' number").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  double evConsumption = config.Get("evConsumption").As<Napi::Number>().DoubleValue();

  // TODO: Determine number of workers based on libuv threadpool size.
  int numWorkers = 4;

  // Split chargers between workers
  int chargersPerWorker = chargers.size() / numWorkers;
  int remainingChargers = chargers.size() % numWorkers;

  auto shared = std::make_shared<Shared>();
  shared->remaining = numWorkers;
  shared->cb = Napi::Persistent(info[1].As<Napi::Function>());
  shared->cb.Ref();

  int chargerIndex = 0;
  for (int i = 0; i < numWorkers; ++i) {
    int chargersForThisWorker = chargersPerWorker + (i < remainingChargers ? 1 : 0);
    std::vector<sim::Charger> workerChargers;
    
    for (int j = 0; j < chargersForThisWorker; j++) {
      workerChargers.push_back(chargers[chargerIndex++]);
    }

    auto worker = std::make_unique<sim::Worker>(chargingDemandProbabilities, arrivalDistribution, workerChargers, evConsumption);
    (new WorkUnit(env, shared, i, std::move(worker)))->Queue();
  }

  return env.Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("simulate", Napi::Function::New(env, RunWorkers));
  return exports;
}
NODE_API_MODULE(addon, Init)
