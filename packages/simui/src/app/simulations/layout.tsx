import { Suspense } from 'react';
import SidebarSimulations from '@/components/sidebar-simulations';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex">
            {/* Left Sidebar */}
            <aside className="w-80 border-r bg-gray-50 p-4">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Simulations</h2>
                        <Link href="/simulations/new">
                            <Button size="sm">
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
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
