
import React from 'react';
import { StatsGrid } from './StatsGrid';
import { RecentActivity } from './RecentActivity';
import { ComplianceAlerts } from './ComplianceAlerts';
import { QuickActions } from './QuickActions';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your legal entity portfolio</p>
      </div>

      <StatsGrid />
      
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
