
import React from 'react';
import { Plus, Upload, Download, Settings } from 'lucide-react';
import { Link } from 'wouter';

const actions = [
  {
    title: 'Create Entity',
    description: 'Add a new legal entity',
    icon: Plus,
    href: '/structure',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    title: 'Upload Document',
    description: 'Add legal documents',
    icon: Upload,
    href: '/documents',
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    title: 'Export Reports',
    description: 'Generate and download reports',
    icon: Download,
    href: '/reports',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`${action.color} text-white rounded-lg p-4 block hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center space-x-3">
                <action.icon className="h-5 w-5" />
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
