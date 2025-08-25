'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { useMutation } from '@apollo/client/react'
import { RUN_SIMULATION, GET_SIMULATIONS } from '@/graphql/mutations'
import { Mutation } from '@/generated/gql/graphql'
import { ChargerConfig } from '@/lib/types'

export default function NewSimulationView() {
    const router = useRouter()
    const [chargers, setChargers] = useState<ChargerConfig[]>([
        { id: '1', count: 1, power: 11 }
    ])
    const [arrivalProbabilities, setArrivalProbabilities] = useState<number[]>(
        [0.94, 0.94, 0.94, 0.94, 0.94, 0.94, 0.94, 0.94, 2.83, 2.83, 5.66, 5.66,
            5.66, 7.55, 7.55, 7.55, 10.38, 10.38, 10.38, 4.72, 4.72, 4.72, 0.94, 0.94]
    )
    const [energyConsumption, setEnergyConsumption] = useState<number>(18)
    const [simulationName, setSimulationName] = useState<string>('')
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const [runSimulation] = useMutation<Mutation>(RUN_SIMULATION, {
        refetchQueries: [{ query: GET_SIMULATIONS }],
        onCompleted: (data) => {
            console.log(data)
            setIsRunning(false);
            setError(null);
            if (data.runSimulation?.id) {
                router.push(`/simulations/${data.runSimulation.id}`)
            }
        },
        onError: (error) => {
            console.error('Error running simulation:', error);
            setIsRunning(false);
            setError(error.message || 'An unexpected error occurred while running the simulation');
        }
    })

    const addCharger = () => {
        const newId = Date.now().toString()
        setChargers((prevChargers) => [...prevChargers, { id: newId, count: 1, power: 11 }])
    }

    const removeCharger = (id: string) => {
        setChargers((prevChargers) => prevChargers.filter(charger => charger.id !== id))
    }

    const updateCharger = (id: string, field: 'count' | 'power', value: string) => {
        const parsedValue = value ? Number(value) : 0;
        setChargers((prevChargers) => prevChargers.map(charger =>
            charger.id === id ? { ...charger, [field]: parsedValue } : charger
        ))
    }

    const updateArrivalProbability = (hour: number, probability: string) => {
        const newProbabilities = [...arrivalProbabilities]
        const parsedProbability = probability ? parseFloat(probability) : 0;
        newProbabilities[hour] = parsedProbability
        setArrivalProbabilities(newProbabilities)
    }

    const updateEnergyConsumption = (value: string) => {
        const parsedProbability = value ? parseFloat(value) : 0;
        setEnergyConsumption(parsedProbability);
    }

    const handleRunSimulation = async () => {
        setIsRunning(true);
        setError(null);

        try {
            await runSimulation({
                variables: {
                    input: {
                        chargers,
                        arrivalProbabilities,
                        energyConsumption,
                        name: simulationName || `Simulation ${new Date().toLocaleString()}`
                    }
                }
            });
        } catch (error) {
            console.error('Failed to run simulation:', error);
            setIsRunning(false);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred while running the simulation');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Create New Simulation</h1>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <div className="h-4 w-4 rounded-full bg-red-500"></div>
                            <p className="text-sm font-medium">Error running simulation</p>
                        </div>
                        <p className="text-sm text-red-700 mt-2">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                            onClick={() => setError(null)}
                        >
                            Dismiss
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Simulation Name */}
            <Card>
                <CardHeader>
                    <CardTitle>Simulation Name</CardTitle>
                    <CardDescription>
                        Give your simulation a descriptive name
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <Label htmlFor="simulation-name">Name</Label>
                        <Input
                            id="simulation-name"
                            type="text"
                            placeholder="My EV Charging Simulation"
                            value={simulationName}
                            onChange={(e) => setSimulationName(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Charger Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Charger Configuration</CardTitle>
                    <CardDescription>
                        Configure the number and power of chargers for this simulation
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {chargers.map((charger) => (
                        <div key={charger.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-1">
                                <Label htmlFor={`charger-count-${charger.id}`}>Number of Chargers</Label>
                                <Input
                                    id={`charger-count-${charger.id}`}
                                    type="number"
                                    value={charger.count || ""}
                                    onChange={(e) => updateCharger(charger.id, 'count', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor={`charger-power-${charger.id}`}>Power (kW)</Label>
                                <Input
                                    id={`charger-power-${charger.id}`}
                                    type="number"
                                    value={charger.power || ""}
                                    onChange={(e) => updateCharger(charger.id, 'power', e.target.value)}
                                />
                            </div>
                            {chargers.length > 1 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeCharger(charger.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button onClick={addCharger} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Charger Configuration
                    </Button>
                </CardContent>
            </Card>

            {/* Arrival Probability */}
            <Card>
                <CardHeader>
                    <CardTitle>Arrival Probability</CardTitle>
                    <CardDescription>
                        Set the probability of EV arrivals for each hour of the day (in percentages)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {Array.from({ length: 24 }, (_, hour) => (
                            <div key={hour} className="space-y-1">
                                <Label className="text-xs">
                                    {String(hour).padStart(2, '0')}:00-{String(hour + 1).padStart(2, '0')}:00
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={arrivalProbabilities[hour] || ""}
                                    onChange={(e) => updateArrivalProbability(hour, e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Energy Consumption */}
            <Card>
                <CardHeader>
                    <CardTitle>EV Energy Consumption</CardTitle>
                    <CardDescription>
                        Average energy consumption per 100km
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-xs">
                        <Label htmlFor="energy-consumption">kWh per 100km</Label>
                        <Input
                            id="energy-consumption"
                            type="number"
                            min="1"
                            step="0.1"
                            value={energyConsumption || ""}
                            onChange={(e) => updateEnergyConsumption(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button
                    className="w-32"
                    onClick={handleRunSimulation}
                    disabled={isRunning}
                >
                    {isRunning ? 'Running...' : 'Run Simulation'}
                </Button>
            </div>
        </div>
    )
}
