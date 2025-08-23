'use client'

import React from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_SIMULATION } from '@/graphql/mutations'
import { Query } from '@/generated/gql/graphql'
import NewSimulationView from '@/components/new-simulation-view'
import ExistingSimulationView from '@/components/existing-simulation-view'

interface SimulationPageProps {
    params: Promise<{ id: string }>
}

export default function SimulationPage({ params }: SimulationPageProps) {
    const resolvedParams = React.use(params)
    const isNewSimulation = resolvedParams.id === 'new'

    // Fetch simulation data if not creating new simulation
    const { data: simulationData, loading: simulationLoading, error: simulationError } = useQuery<Query>(
        GET_SIMULATION,
        {
            variables: { id: resolvedParams.id },
            skip: isNewSimulation, // Skip query if creating new simulation
        }
    )

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {simulationLoading && !isNewSimulation ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading simulation data...</div>
                </div>
            ) : simulationError && !isNewSimulation ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">
                        Error loading simulation: {simulationError.message}
                    </div>
                </div>
            ) : isNewSimulation ? (
                <NewSimulationView />
            ) : simulationData ? (
                <ExistingSimulationView 
                    simulation={simulationData?.simulationRunById}
                    simulationId={resolvedParams.id} 
                />
            ) : null}
        </div>
    )
}
