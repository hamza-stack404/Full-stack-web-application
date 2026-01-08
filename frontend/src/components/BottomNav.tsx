"use client";

import Link from 'next/link';
import { Home, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around md:hidden">
      <Link href="/tasks" className={`flex flex-col items-center gap-1 ${pathname === '/tasks' ? 'text-primary' : 'text-slate-500'}`}>
        <Home className="h-6 w-6" />
        <span className="text-xs">Tasks</span>
      </Link>
      <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard' ? 'text-primary' : 'text-slate-500'}`}>
        <LayoutDashboard className="h-6 w-6" />
        <span className="text-xs">Dashboard</span>
      </Link>
    </div>
  );
}
