
import React from 'react';
import DataStructureVisualization from '@/components/visualization/DataStructureVisualization';

const DataStructure: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Data Architecture</h1>
        <p className="text-gray-600 mt-1">
          Visual representation of your entity and ownership data relationships
        </p>
        
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Entity Relationships</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span>Owner Relationships</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-yellow-500"></div>
            <span>Owned Relationships</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-purple-500"></div>
            <span>Share Class Links</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <DataStructureVisualization />
      </div>
    </div>
  );
};

export default DataStructure;
