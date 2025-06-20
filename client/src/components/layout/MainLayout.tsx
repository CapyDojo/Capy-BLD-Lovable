
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  sensitivity?: {
    approachZone: number;
    connectionZone: number;
    dwellTime: number;
  };
  setSensitivity?: (value: any) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, sensitivity, setSensitivity }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
      />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
