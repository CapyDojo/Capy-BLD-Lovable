import React from 'react';
import { StressTestSuite } from '@/components/testing/StressTestSuite';

const StressTestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Architecture Stress Testing</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive testing suite for Structure Chart and Cap Table functionality to validate data architecture resilience.
        </p>
      </div>
      
      <StressTestSuite />
    </div>
  );
};

export default StressTestPage;