
import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Building2, 
  PieChart, 
  Folder, 
  Calendar, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  sensitivity?: {
    approachZone: number;
    connectionZone: number;
    dwellTime: number;
  };
  setSensitivity?: (value: any) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: PieChart },
  { name: 'Structure Chart', href: '/structure', icon: Building2 },
  { name: 'Bump Connect', href: '/working-bump', icon: Zap },
  { name: 'Cap Table', href: '/cap-table', icon: PieChart },
  { name: 'Data Architecture', href: '/data-structure', icon: Database },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'System Health', href: '/stress-test', icon: Zap },
  { name: 'Documents', href: '/documents', icon: Folder },
  { name: 'Compliance', href: '/compliance', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, sensitivity, setSensitivity }) => {
  const [location] = useLocation();
  const isBumpConnectPage = location === '/working-bump';

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo and Toggle */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Capy</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-5 w-5 mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sensitivity Controls - Only show on Bump Connect page and when not collapsed */}
      {isBumpConnectPage && !collapsed && sensitivity && setSensitivity && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-semibold mb-3 text-gray-800">Connection Sensitivity</div>
            
            {/* Approach Zone Slider */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Approach Zone</span>
                <span className="text-xs font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded">{sensitivity.approachZone}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                step="10"
                value={sensitivity.approachZone}
                onChange={(e) => setSensitivity((prev: any) => ({ ...prev, approachZone: parseInt(e.target.value) }))}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Connection Zone Slider */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Connection Zone</span>
                <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded">{sensitivity.connectionZone}px</span>
              </div>
              <input
                type="range"
                min="60"
                max="200"
                step="10"
                value={sensitivity.connectionZone}
                onChange={(e) => setSensitivity((prev: any) => ({ ...prev, connectionZone: parseInt(e.target.value) }))}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Dwell Time Slider */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Dwell Time</span>
                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{sensitivity.dwellTime}ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="100"
                value={sensitivity.dwellTime}
                onChange={(e) => setSensitivity((prev: any) => ({ ...prev, dwellTime: parseInt(e.target.value) }))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Preset Buttons */}
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => setSensitivity({ approachZone: 280, connectionZone: 160, dwellTime: 100 })}
                className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Easy
              </button>
              <button
                onClick={() => setSensitivity({ approachZone: 280, connectionZone: 160, dwellTime: 300 })}
                className="flex-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
              >
                Normal
              </button>
              <button
                onClick={() => setSensitivity({ approachZone: 140, connectionZone: 80, dwellTime: 600 })}
                className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Precise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
