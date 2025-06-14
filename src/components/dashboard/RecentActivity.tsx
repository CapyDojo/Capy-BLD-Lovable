
import React from 'react';
import { Clock, Building2, FileText, Users } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'entity_created',
    title: 'New entity created',
    description: 'Capy Subsidiary LLC added to Delaware structure',
    time: '2 hours ago',
    icon: Building2,
  },
  {
    id: 2,
    type: 'document_uploaded',
    title: 'Document uploaded',
    description: 'Certificate of Formation for Tech Holdings Inc',
    time: '5 hours ago',
    icon: FileText,
  },
  {
    id: 3,
    type: 'ownership_updated',
    title: 'Ownership structure updated',
    description: 'Parent Co ownership in Sub LLC changed to 85%',
    time: '1 day ago',
    icon: Users,
  },
  {
    id: 4,
    type: 'compliance_completed',
    title: 'Annual filing completed',
    description: 'Delaware annual report submitted for Main Entity LLC',
    time: '2 days ago',
    icon: Clock,
  },
];

export const RecentActivity: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <activity.icon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
