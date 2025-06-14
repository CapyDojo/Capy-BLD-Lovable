
import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const alerts = [
  {
    id: 1,
    title: 'Delaware Annual Report',
    entity: 'Tech Holdings Inc',
    dueDate: 'Due in 5 days',
    priority: 'high',
    status: 'pending',
  },
  {
    id: 2,
    title: 'California Statement of Information',
    entity: 'West Coast LLC',
    dueDate: 'Due in 2 weeks',
    priority: 'medium',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Federal Tax Return',
    entity: 'Parent Co',
    dueDate: 'Completed',
    priority: 'low',
    status: 'completed',
  },
];

export const ComplianceAlerts: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Compliance Alerts</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {alert.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : alert.priority === 'high' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                <p className="text-sm text-gray-600">{alert.entity}</p>
                <p className={`text-xs mt-1 ${
                  alert.status === 'completed' ? 'text-green-600' :
                  alert.priority === 'high' ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {alert.dueDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
