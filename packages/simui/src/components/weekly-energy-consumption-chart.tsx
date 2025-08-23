'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DayResult {
    maxPowerKw: number;
    energyConsumedKwh: number;
}

interface WeeklyEnergyConsumptionChartProps {
    results: any; // This is the SimulationResult from the database
}

export default function WeeklyEnergyConsumptionChart({ results }: WeeklyEnergyConsumptionChartProps) {
    // Transform the results data for weekly consumption
    const weeklyChartData = React.useMemo(() => {
        if (!results?.results || !Array.isArray(results.results)) {
            return []
        }

        const weeklyData = []
        const dailyResults = results.results as DayResult[]
        
        // Group days into weeks (7 days per week)
        for (let i = 0; i < dailyResults.length; i += 7) {
            const weekDays = dailyResults.slice(i, i + 7)
            const weekNumber = Math.floor(i / 7) + 1
            
            // Sum energy consumption for all days in this week
            const totalWeeklyEnergy = weekDays.reduce((sum, day) => {
                return sum + (day.energyConsumedKwh || 0)
            }, 0)
            
            weeklyData.push({
                week: `Week ${weekNumber}`,
                energyConsumed: Math.round(totalWeeklyEnergy * 100) / 100,
                daysInWeek: weekDays.length
            })
        }
        
        return weeklyData
    }, [results])

    if (weeklyChartData.length === 0) {
        return (
            <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                No weekly energy consumption data available
            </div>
        )
    }

    return (
        <div className="h-64 w-full">
            <h4 className="text-sm font-medium mb-4">Weekly Energy Consumption</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis 
                        label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                            `${value} kWh`,
                            `Energy Consumed (${props.payload.daysInWeek} days)`
                        ]}
                        labelStyle={{ color: '#000' }}
                    />
                    <Bar 
                        dataKey="energyConsumed" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}