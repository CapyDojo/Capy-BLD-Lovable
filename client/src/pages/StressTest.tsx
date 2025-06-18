import React from 'react';
import { StressTestSuite } from '@/components/testing/StressTestSuite';

const StressTestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Health Monitor</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive validation suite to ensure your entity management system maintains data integrity and performance at scale.
        </p>
      </div>
      
      <StressTestSuite />
    </div>
  );
};

export default StressTestPage;