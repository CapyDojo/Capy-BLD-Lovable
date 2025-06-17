
import React from 'react';
import { StatsGrid } from './StatsGrid';
import { RecentActivity } from './RecentActivity';
import { ComplianceAlerts } from './ComplianceAlerts';
import { QuickActions } from './QuickActions';
import { TestRunner } from '../testing/TestRunner';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your legal entity portfolio</p>
      </div>

      <StatsGrid />
      
      {/* Add Test Runner Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Development Tools</h2>
        <TestRunner />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <ComplianceAlerts />
        </div>
      </div>
    </div>
  );
};
