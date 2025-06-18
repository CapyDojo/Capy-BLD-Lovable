
import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, Filter } from 'lucide-react';

interface ComplianceItem {
  id: string;
  title: string;
  entity: string;
  dueDate: string;
  status: 'completed' | 'pending' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  description: string;
  jurisdiction: string;
}

const complianceItems: ComplianceItem[] = [
  {
    id: '1',
    title: 'Delaware Annual Report',
    entity: 'Parent Corporation',
    dueDate: '2025-06-20',
    status: 'pending',
    priority: 'high',
    description: 'Annual franchise tax report for Delaware corporation',
    jurisdiction: 'Delaware',
  },
  {
    id: '2',
    title: 'California Statement of Information',
    entity: 'Subsidiary LLC',
    dueDate: '2025-07-01',
    status: 'pending',
    priority: 'medium',
    description: 'Biennial statement of information filing',
    jurisdiction: 'California',
  },
  {
    id: '3',
    title: 'Federal Tax Return',
    entity: 'Tech Holdings Inc',
    dueDate: '2025-05-15',
    status: 'completed',
    priority: 'high',
    description: 'Form 1120 corporate income tax return',
    jurisdiction: 'Federal',
  },
  {
    id: '4',
    title: 'Beneficial Ownership Report',
    entity: 'Parent Corporation',
    dueDate: '2025-06-10',
    status: 'overdue',
    priority: 'high',
    description: 'FinCEN beneficial ownership information report',
    jurisdiction: 'Federal',
  },
];

export const ComplianceTimeline: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  const filteredItems = complianceItems.filter(item => 
    filter === 'all' || item.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Timeline</h1>
          <p className="text-gray-600">Track and manage regulatory requirements and deadlines</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 h-4 w-4" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Items</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Calendar className="h-4 w-4" />
            <span>View Calendar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(item.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">
                        Entity: <span className="font-medium text-gray-900">{item.entity}</span>
                      </span>
                      <span className="text-gray-500">
                        Jurisdiction: <span className="font-medium text-gray-900">{item.jurisdiction}</span>
                      </span>
                    </div>
                    <span className="text-gray-500">
                      Due: <span className="font-medium text-gray-900">{item.dueDate}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
