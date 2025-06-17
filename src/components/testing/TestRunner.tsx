
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export const TestRunner: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const basicTests = [
    {
      name: 'Basic Function Test',
      fn: () => {
        console.log('✅ Basic test running...');
        return true;
      }
    },
    {
      name: 'Async Test',
      fn: async () => {
        console.log('🔄 Async test running...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      }
    },
    {
      name: 'Window Object Test',
      fn: () => {
        console.log('🪟 Testing window object access...');
        return typeof window !== 'undefined';
      }
    },
    {
      name: 'Math Operations Test',
      fn: () => {
        console.log('🧮 Testing math operations...');
        const result = 2 + 2;
        return result === 4;
      }
    },
    {
      name: 'Array Methods Test',
      fn: () => {
        console.log('📋 Testing array methods...');
        const arr = [1, 2, 3];
        return arr.map(x => x * 2).join(',') === '2,4,6';
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🧪 Starting test run...');
    console.log('====================');
    
    const results: TestResult[] = [];
    
    for (const test of basicTests) {
      try {
        console.log(`▶️ Running: ${test.name}`);
        const startTime = Date.now();
        const result = await test.fn();
        const duration = Date.now() - startTime;
        
        const testResult = { 
          name: test.name, 
          passed: result, 
          duration 
        };
        
        console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'} (${duration}ms)`);
        results.push(testResult);
        
        // Update results in real-time
        setTestResults([...results]);
        
      } catch (error) {
        const testResult = { 
          name: test.name, 
          passed: false, 
          error: String(error) 
        };
        
        console.log(`💥 ${test.name}: ERROR - ${error}`);
        results.push(testResult);
        setTestResults([...results]);
      }
    }
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    console.log('====================');
    console.log(`🏁 Tests complete: ${passed}/${total} passed`);
    
    setIsRunning(false);
    setLastRun(new Date());
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.passed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Simple Test Runner
        </CardTitle>
        {lastRun && (
          <p className="text-sm text-gray-500">
            Last run: {lastRun.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          {testResults.length > 0 && (
            <div className="text-sm font-medium">
              {passedCount}/{totalCount} tests passed
            </div>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results:</h3>
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                  {getStatusIcon(result)}
                  <span className="flex-1">{result.name}</span>
                  {result.duration && (
                    <span className="text-xs text-gray-500">{result.duration}ms</span>
                  )}
                  {result.error && (
                    <span className="text-xs text-red-500 truncate max-w-32" title={result.error}>
                      {result.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 This test runner logs all output to the browser console. 
          Open DevTools → Console to see detailed test execution logs.
        </div>
      </CardContent>
    </Card>
  );
};
