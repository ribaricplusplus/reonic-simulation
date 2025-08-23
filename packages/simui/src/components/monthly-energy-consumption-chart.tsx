'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DayResult {
    maxPowerKw: number;
    energyConsumedKwh: number;
}

interface MonthlyEnergyConsumptionChartProps {
    results: any; // This is the SimulationResult from the database
}

export default function MonthlyEnergyConsumptionChart({ results }: MonthlyEnergyConsumptionChartProps) {
    // Transform the results data for monthly consumption
    const monthlyChartData = React.useMemo(() => {
        if (!results?.results || !Array.isArray(results.results)) {
            return []
        }

        const monthlyData = []
        const dailyResults = results.results as DayResult[]
        
        // Days in each month (non-leap year)
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        let currentDayIndex = 0
        let monthNumber = 0
        
        while (currentDayIndex < dailyResults.length && monthNumber < 12) {
            const currentMonthDays = daysInMonth[monthNumber]
            const availableDays = Math.min(currentMonthDays, dailyResults.length - currentDayIndex)
            
            // Get days for this month
            const monthDays = dailyResults.slice(currentDayIndex, currentDayIndex + availableDays)
            
            // Sum energy consumption for all days in this month
            const totalMonthlyEnergy = monthDays.reduce((sum, day) => {
                return sum + (day.energyConsumedKwh || 0)
            }, 0)
            
            monthlyData.push({
                month: monthNames[monthNumber],
                energyConsumed: Math.round(totalMonthlyEnergy * 100) / 100,
                daysInMonth: availableDays
            })
            
            currentDayIndex += availableDays
            monthNumber++
        }
        
        return monthlyData
    }, [results])

    if (monthlyChartData.length === 0) {
        return (
            <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                No monthly energy consumption data available
            </div>
        )
    }

    return (
        <div className="h-64 w-full">
            <h4 className="text-sm font-medium mb-4">Monthly Energy Consumption</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                        label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                            `${value} kWh`,
                            `Energy Consumed (${props.payload.daysInMonth} days)`
                        ]}
                        labelStyle={{ color: '#000' }}
                    />
                    <Bar 
                        dataKey="energyConsumed" 
                        fill="#f59e0b" 
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}