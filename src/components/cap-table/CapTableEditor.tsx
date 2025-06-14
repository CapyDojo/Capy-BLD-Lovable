
import React, { useState } from 'react';
import { CapTableView } from './CapTableView';
import { OwnershipChart } from './OwnershipChart';
import { Plus, Download, Upload } from 'lucide-react';

export const CapTableEditor: React.FC = () => {
  const [view, setView] = useState<'table' | 'chart'>('table');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cap Table</h1>
          <p className="text-gray-600">Manage ownership structure and equity distribution</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setView('chart')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                view === 'chart' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Chart View
            </button>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Add Stakeholder</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {view === 'table' ? <CapTableView /> : <OwnershipChart />}
    </div>
  );
};
