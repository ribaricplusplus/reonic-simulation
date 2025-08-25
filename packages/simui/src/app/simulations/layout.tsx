"use client"
import { Suspense, useState } from 'react';
import SidebarSimulations from '@/components/sidebar-simulations';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex relative">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white shadow-md"
                >
                    {sidebarOpen ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Menu className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Left Sidebar */}
            <aside className={`
                w-80 border-r bg-gray-50 p-4 transition-transform duration-300 ease-in-out z-40
                lg:translate-x-0 lg:static lg:block
                ${sidebarOpen 
                    ? 'fixed inset-y-0 left-0 translate-x-0' 
                    : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0'
                }
            `}>
                <div className="space-y-4 pt-12 lg:pt-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Simulations</h2>
                        <Link href="/simulations/new">
                            <Button size="sm" onClick={() => setSidebarOpen(false)}>
                                <Plus className="h-4 w-4 mr-2" />
                                New
                            </Button>
                        </Link>
                    </div>

                    <Separator />

                    <Suspense fallback={<p>Loading...</p>}>
                        <SidebarSimulations />
                    </Suspense>
                </div>
            </aside>

            <main className="flex-1 lg:ml-0">
                {children}
            </main>
        </div>
    );
}
