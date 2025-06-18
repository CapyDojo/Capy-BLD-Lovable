
import React from 'react';
import { MigrationAudit } from '@/components/testing/MigrationAudit';

export const MigrationAuditPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Migration Status Audit</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive analysis of component migration status from legacy DataStore to Unified Repository architecture.
        </p>
      </div>
      
      <MigrationAudit />
    </div>
  );
};
