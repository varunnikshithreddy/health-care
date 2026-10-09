import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../feedback/ToastContainer';
import { EncouragementModal } from '../feedback/EncouragementModal';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-sand-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 max-w-5xl w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <ToastContainer />
      <EncouragementModal />
    </div>
  );
};
