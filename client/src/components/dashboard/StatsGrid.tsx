
import React from 'react';
import { Building2, Users, FileText, AlertTriangle } from 'lucide-react';
import { usePortfolioStats } from '@/hooks/usePortfolioStats';

export const StatsGrid: React.FC = () => {
  const { 
    totalEntities, 
    activeComplianceItems, 
    totalStakeholders, 
    totalDocuments 
  } = usePortfolioStats();

  const stats = [
    {
      title: 'Total Entities',
      value: totalEntities.toString(),
      change: '',
      changeType: 'positive',
      icon: Building2,
    },
    {
      title: 'Active Compliance Items',
      value: activeComplianceItems.toString(),
      change: activeComplianceItems > 0 ? 'Needs attention' : 'All clear',
      changeType: 'warning',
      icon: AlertTriangle,
    },
    {
      title: 'Stakeholders',
      value: totalStakeholders.toString(),
      change: '',
      changeType: 'positive',
      icon: Users,
    },
    {
      title: 'Documents',
      value: totalDocuments.toString(),
      change: '',
      changeType: 'positive',
      icon: FileText,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <stat.icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          {stat.change && (
            <div className="mt-4">
              <span className={`text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'warning' ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
