'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DayResult {
    maxPowerKw: number;
    energyConsumedKwh: number;
}

interface WeeklyMaxPowerChartProps {
    results: any; // This is the SimulationResult from the database
}

export default function WeeklyMaxPowerChart({ results }: WeeklyMaxPowerChartProps) {
    // Transform the results data for weekly maximum power
    const weeklyMaxPowerData = React.useMemo(() => {
        if (!results?.results || !Array.isArray(results.results)) {
            return []
        }

        const weeklyData = []
        const dailyResults = results.results as DayResult[]
        
        // Group days into weeks (7 days per week)
        for (let i = 0; i < dailyResults.length; i += 7) {
            const weekDays = dailyResults.slice(i, i + 7)
            const weekNumber = Math.floor(i / 7) + 1
            
            // Find the maximum power across all days in this week
            const maxPowerInWeek = weekDays.reduce((maxPower, day) => {
                return Math.max(maxPower, day.maxPowerKw || 0)
            }, 0)
            
            weeklyData.push({
                week: `Week ${weekNumber}`,
                maxPower: Math.round(maxPowerInWeek * 100) / 100,
                daysInWeek: weekDays.length
            })
        }
        
        return weeklyData
    }, [results])

    if (weeklyMaxPowerData.length === 0) {
        return (
            <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                No weekly maximum power data available
            </div>
        )
    }

    return (
        <div className="h-64 w-full">
            <h4 className="text-sm font-medium mb-4">Weekly Maximum Power</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyMaxPowerData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis 
                        label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                            `${value} kW`,
                            `Max Power (${props.payload.daysInWeek} days)`
                        ]}
                        labelStyle={{ color: '#000' }}
                    />
                    <Bar 
                        dataKey="maxPower" 
                        fill="#dc2626" 
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}