'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DayResult {
    maxPowerKw: number;
    energyConsumedKwh: number;
}

interface EnergyConsumptionChartProps {
    results: any; // This is the SimulationResult from the database
}

export default function EnergyConsumptionChart({ results }: EnergyConsumptionChartProps) {
    // Transform the results data for the chart
    const chartData = React.useMemo(() => {
        if (!results?.results || !Array.isArray(results.results)) {
            return []
        }

        return results.results.map((dayResult: DayResult, index: number) => ({
            day: `Day ${index + 1}`,
            energyConsumed: dayResult.energyConsumedKwh,
        }))
    }, [results])

    if (chartData.length === 0) {
        return (
            <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                No energy consumption data available
            </div>
        )
    }

    return (
        <div className="h-64 w-full">
            <h4 className="text-sm font-medium mb-4">Daily Energy Consumption</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} width={600} height={600}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis 
                        label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                        formatter={(value: number) => [`${value} kWh`, 'Energy Consumed']}
                        labelStyle={{ color: '#000' }}
                    />
                    <Bar 
                        dataKey="energyConsumed" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
