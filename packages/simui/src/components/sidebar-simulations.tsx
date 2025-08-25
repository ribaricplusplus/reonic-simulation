"use client"
import { Query } from "@/generated/gql/graphql";
import { GET_SIMULATIONS } from "@/graphql/mutations";
import { useSuspenseQuery } from "@apollo/client/react";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SidebarSimulations() {
    const { data } = useSuspenseQuery<Query>(GET_SIMULATIONS);

    return (
        <div className="flex flex-col space-y-2 h-screen overflow-auto">
            {data?.allSimulationRuns?.map((simulation) => (
                <Link key={simulation.id} href={`/simulations/${simulation.id}`}>
                    <Card className="cursor-pointer hover:bg-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{simulation.name}</CardTitle>
                            <CardDescription className="text-xs">
                                {simulation.status}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
