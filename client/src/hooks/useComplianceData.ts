
import { useMemo } from 'react';

const alertsData = [
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

export const useComplianceData = () => {
    return useMemo(() => ({ alerts: alertsData }), []);
};
