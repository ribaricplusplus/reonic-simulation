'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimulationRun } from '@/generated/gql/graphql'
import { ChargerConfig } from '@/lib/types'

function LoadingChart() {
    return (
        <div className="h-64 flex items-center justify-center">Loading chart...</div>
    )
}

const EnergyConsumptionChart = dynamic(() => import('./energy-consumption-chart'), {
    ssr: false,
    loading: () => <LoadingChart />
})

const WeeklyEnergyConsumptionChart = dynamic(() => import('./weekly-energy-consumption-chart'), {
    ssr: false,
    loading: () => <LoadingChart />
})

const MonthlyEnergyConsumptionChart = dynamic(() => import('./monthly-energy-consumption-chart'), {
    ssr: false,
    loading: () => <LoadingChart />
})

const WeeklyMaxPowerChart = dynamic(() => import('./weekly-max-power-chart'), {
    ssr: false,
    loading: () => <LoadingChart />
})

interface ExistingSimulationViewProps {
    simulation: SimulationRun | undefined | null
    simulationId: string
}

export default function ExistingSimulationView({ simulation, simulationId }: ExistingSimulationViewProps) {
    const maxTheoreticalPowerKw = useMemo<number>(() => {
        if (!simulation?.inputs) {
            return 0;
        }
        let powerSum = 0;
        for (const charger of simulation.inputs.chargers) {
            powerSum += charger.count * charger.power;
        }
        return powerSum;
    }, [simulation?.inputs])

    if (!simulation) {
        return (<p>Missing simulation data.</p>);
    }
    const chargers = simulation.inputs?.chargers as ChargerConfig[] || []
    const energyConsumption = simulation.inputs?.energyConsumption as number || 0

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">
                {simulation?.name || `Simulation ${simulationId}`}
            </h1>

            {/* Display simulation configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>
                        Simulation parameters and settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-2">Charger Configuration</h4>
                        <div className="space-y-2">
                            {chargers.map((charger, index) => (
                                <div key={charger.id} className="flex gap-4 text-sm">
                                    <span>Configuration {index + 1}:</span>
                                    <span>{charger.count} chargers at {charger.power}kW each</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Energy Consumption</h4>
                        <p className="text-sm">{energyConsumption} kWh per 100km</p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${simulation?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                simulation?.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-800' :
                                    simulation?.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                            {simulation?.status || 'Unknown'}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Simulation Results</CardTitle>
                    <CardDescription>
                        Results and visualizations from this simulation run
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {simulation?.results ? (
                        <div className="space-y-12">
                            <div>
                                <div className="text-sm">
                                    <strong>Total Energy Consumed:</strong> {simulation.results.totalEnergyConsumed ? Number(simulation.results.totalEnergyConsumed).toFixed(2) : 'N/A'} kWh
                                </div>
                                <div className="text-sm">
                                    <strong>Maximum Power Demand:</strong> {simulation.results.totalMaxPowerKw} kW
                                </div>
                                <div className="text-sm">
                                    <strong>Theoretical Maximum Power Demand:</strong> {maxTheoreticalPowerKw} kW
                                </div>
                                <div className="text-sm">
                                    <strong>Concurrency Factor:</strong> {(simulation.results.totalMaxPowerKw/maxTheoreticalPowerKw*100).toFixed(2)}%
                                </div>
                            </div>
                            <EnergyConsumptionChart results={simulation.results} />
                            <WeeklyEnergyConsumptionChart results={simulation.results} />
                            <MonthlyEnergyConsumptionChart results={simulation.results} />
                            <WeeklyMaxPowerChart results={simulation.results} />
                        </div>
                    ) : (
                        <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                            {simulation?.status === 'RUNNING' ?
                                'Simulation is still running. Results will appear here when completed.' :
                                'No results available for this simulation.'
                            }
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
