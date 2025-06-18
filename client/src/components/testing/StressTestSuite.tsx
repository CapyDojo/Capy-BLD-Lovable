import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Database,
  Network,
  Zap
} from 'lucide-react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { Entity } from '@/types/entity';
import { UnifiedOwnership } from '@/types/unified';
import { DataArchitectureValidator } from '@/services/testing/DataArchitectureValidator';

interface TestResult {
  testName: string;
  category: 'performance' | 'data-integrity' | 'edge-cases' | 'concurrency';
  status: 'running' | 'passed' | 'failed' | 'pending';
  duration?: number;
  details?: string;
  error?: string;
}

interface StressTestMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  avgResponseTime: number;
  memoryUsage: number;
  dataIntegrityScore: number;
}

export const StressTestSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [metrics, setMetrics] = useState<StressTestMetrics | null>(null);

  const updateTestResult = useCallback((testName: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(test => 
      test.testName === testName 
        ? { ...test, ...updates }
        : test
    ));
  }, []);

  const addTestResult = useCallback((test: TestResult) => {
    setResults(prev => [...prev, test]);
  }, []);

  // Performance stress tests for Structure Chart
  const runStructureChartStressTests = async () => {
    const repository = await getUnifiedRepository('ENTERPRISE');
    const startTime = performance.now();

    // Test 1: Large entity creation burst
    setCurrentTest('SC-PERF-001: Large Entity Creation');
    addTestResult({
      testName: 'SC-PERF-001: Large Entity Creation',
      category: 'performance',
      status: 'running'
    });

    try {
      const entityPromises = Array.from({ length: 50 }, (_, i) => 
        repository.createEntity({
          name: `Stress Test Entity ${i}`,
          type: 'Corporation',
          jurisdiction: 'Delaware',
          metadata: { testId: `stress-${i}`, batch: 'large-creation' }
        }, 'stress-test')
      );

      await Promise.all(entityPromises);
      const duration = performance.now() - startTime;
      
      updateTestResult('SC-PERF-001: Large Entity Creation', {
        status: 'passed',
        duration,
        details: `Created 50 entities in ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      updateTestResult('SC-PERF-001: Large Entity Creation', {
        status: 'failed',
        error: String(error)
      });
    }

    // Test 2: Rapid canvas operations
    setCurrentTest('SC-PERF-002: Rapid Canvas Operations');
    addTestResult({
      testName: 'SC-PERF-002: Rapid Canvas Operations',
      category: 'performance',
      status: 'running'
    });

    try {
      const entities = await repository.getAllEntities();
      const operationStart = performance.now();

      // Simulate rapid position updates
      for (let i = 0; i < 100; i++) {
        const randomEntity = entities[Math.floor(Math.random() * entities.length)];
        await repository.updateEntity(randomEntity.id, {
          position: { x: Math.random() * 1000, y: Math.random() * 1000 }
        }, 'stress-test');
      }

      const duration = performance.now() - operationStart;
      updateTestResult('SC-PERF-002: Rapid Canvas Operations', {
        status: 'passed',
        duration,
        details: `100 position updates in ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      updateTestResult('SC-PERF-002: Rapid Canvas Operations', {
        status: 'failed',
        error: String(error)
      });
    }
  };

  // Cap Table stress tests
  const runCapTableStressTests = async () => {
    const repository = await getUnifiedRepository('ENTERPRISE');

    // Test 3: Complex ownership chain creation
    setCurrentTest('CT-PERF-001: Complex Ownership Chains');
    addTestResult({
      testName: 'CT-PERF-001: Complex Ownership Chains',
      category: 'performance',
      status: 'running'
    });

    try {
      const startTime = performance.now();
      const entities = await repository.getAllEntities();
      
      // Create complex multi-level ownership structures
      for (let i = 0; i < 20; i++) {
        const owner = entities[Math.floor(Math.random() * entities.length)];
        const owned = entities[Math.floor(Math.random() * entities.length)];
        
        if (owner.id !== owned.id) {
          // Create share class first
          const shareClass = await repository.createShareClass({
            entityId: owned.id,
            name: `Test Class ${i}`,
            type: 'Common Stock',
            totalAuthorizedShares: 1000000,
            votingRights: true
          }, 'stress-test');

          // Create ownership
          await repository.createOwnership({
            ownerEntityId: owner.id,
            ownedEntityId: owned.id,
            shares: Math.floor(Math.random() * 100000),
            shareClassId: shareClass.id,
            effectiveDate: new Date(),
            createdBy: 'stress-test',
            updatedBy: 'stress-test'
          }, 'stress-test');
        }
      }

      const duration = performance.now() - startTime;
      updateTestResult('CT-PERF-001: Complex Ownership Chains', {
        status: 'passed',
        duration,
        details: `Created complex ownership chains in ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      updateTestResult('CT-PERF-001: Complex Ownership Chains', {
        status: 'failed',
        error: String(error)
      });
    }

    // Test 4: Cap table computation stress
    setCurrentTest('CT-PERF-002: Cap Table Computation Stress');
    addTestResult({
      testName: 'CT-PERF-002: Cap Table Computation Stress',
      category: 'performance',
      status: 'running'
    });

    try {
      const startTime = performance.now();
      const entities = await repository.getAllEntities();
      
      // Generate cap tables for all entities rapidly
      const capTablePromises = entities.map(entity => 
        repository.getCapTableView(entity.id)
      );
      
      await Promise.all(capTablePromises);
      const duration = performance.now() - startTime;
      
      updateTestResult('CT-PERF-002: Cap Table Computation Stress', {
        status: 'passed',
        duration,
        details: `Computed ${entities.length} cap tables in ${duration.toFixed(2)}ms`
      });
    } catch (error) {
      updateTestResult('CT-PERF-002: Cap Table Computation Stress', {
        status: 'failed',
        error: String(error)
      });
    }
  };

  // Data integrity tests
  const runDataIntegrityTests = async () => {
    const repository = await getUnifiedRepository('ENTERPRISE');

    // Test 5: Circular ownership detection
    setCurrentTest('DI-001: Circular Ownership Detection');
    addTestResult({
      testName: 'DI-001: Circular Ownership Detection',
      category: 'data-integrity',
      status: 'running'
    });

    try {
      const entities = await repository.getAllEntities();
      if (entities.length >= 3) {
        const [entityA, entityB, entityC] = entities.slice(0, 3);

        // Try to create circular ownership A->B->C->A
        let circularDetected = false;
        try {
          // This should fail due to circular ownership detection
          await repository.createOwnership({
            ownerEntityId: entityC.id,
            ownedEntityId: entityA.id,
            shares: 1000,
            shareClassId: 'test-class',
            effectiveDate: new Date(),
            createdBy: 'stress-test',
            updatedBy: 'stress-test'
          }, 'stress-test');
        } catch (error) {
          if (String(error).includes('circular')) {
            circularDetected = true;
          }
        }

        updateTestResult('DI-001: Circular Ownership Detection', {
          status: circularDetected ? 'passed' : 'failed',
          details: circularDetected ? 'Circular ownership properly detected and prevented' : 'Circular ownership not detected'
        });
      }
    } catch (error) {
      updateTestResult('DI-001: Circular Ownership Detection', {
        status: 'failed',
        error: String(error)
      });
    }

    // Test 6: Share allocation validation
    setCurrentTest('DI-002: Share Allocation Validation');
    addTestResult({
      testName: 'DI-002: Share Allocation Validation',
      category: 'data-integrity',
      status: 'running'
    });

    try {
      const entities = await repository.getAllEntities();
      if (entities.length >= 2) {
        const [owner, owned] = entities.slice(0, 2);
        
        // Create share class with limited shares
        const shareClass = await repository.createShareClass({
          entityId: owned.id,
          name: 'Limited Test Class',
          type: 'Common Stock',
          totalAuthorizedShares: 1000,
          votingRights: true
        }, 'stress-test');

        // Try to over-allocate shares
        let overAllocationPrevented = false;
        try {
          await repository.createOwnership({
            ownerEntityId: owner.id,
            ownedEntityId: owned.id,
            shares: 2000, // More than authorized
            shareClassId: shareClass.id,
            effectiveDate: new Date(),
            createdBy: 'stress-test',
            updatedBy: 'stress-test'
          }, 'stress-test');
        } catch (error) {
          if (String(error).includes('shares') || String(error).includes('exceed')) {
            overAllocationPrevented = true;
          }
        }

        updateTestResult('DI-002: Share Allocation Validation', {
          status: overAllocationPrevented ? 'passed' : 'failed',
          details: overAllocationPrevented ? 'Over-allocation properly prevented' : 'Over-allocation not detected'
        });
      }
    } catch (error) {
      updateTestResult('DI-002: Share Allocation Validation', {
        status: 'failed',
        error: String(error)
      });
    }
  };

  // Edge case tests
  const runEdgeCaseTests = async () => {
    const repository = await getUnifiedRepository('ENTERPRISE');

    // Test 7: Empty data handling
    setCurrentTest('EC-001: Empty Data Handling');
    addTestResult({
      testName: 'EC-001: Empty Data Handling',
      category: 'edge-cases',
      status: 'running'
    });

    try {
      // Test cap table for non-existent entity
      const capTable = await repository.getCapTableView('non-existent-id');
      
      updateTestResult('EC-001: Empty Data Handling', {
        status: capTable === null ? 'passed' : 'failed',
        details: capTable === null ? 'Properly handled non-existent entity' : 'Did not handle non-existent entity'
      });
    } catch (error) {
      updateTestResult('EC-001: Empty Data Handling', {
        status: 'passed',
        details: 'Properly threw error for non-existent entity'
      });
    }

    // Test 8: Malformed data resilience
    setCurrentTest('EC-002: Malformed Data Resilience');
    addTestResult({
      testName: 'EC-002: Malformed Data Resilience',
      category: 'edge-cases',
      status: 'running'
    });

    try {
      // Try to create entity with invalid data
      let validationWorking = false;
      try {
        await repository.createEntity({
          name: '', // Invalid empty name
          type: 'InvalidType' as any,
          metadata: {}
        }, 'stress-test');
      } catch (error) {
        validationWorking = true;
      }

      updateTestResult('EC-002: Malformed Data Resilience', {
        status: validationWorking ? 'passed' : 'failed',
        details: validationWorking ? 'Validation properly rejected malformed data' : 'Malformed data was accepted'
      });
    } catch (error) {
      updateTestResult('EC-002: Malformed Data Resilience', {
        status: 'failed',
        error: String(error)
      });
    }
  };

  const runFullStressTest = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    
    const startTime = performance.now();

    try {
      // Initialize the comprehensive validator
      const validator = new DataArchitectureValidator();
      setCurrentTest('Initializing comprehensive validator...');
      
      // Run comprehensive validation tests
      setCurrentTest('Running comprehensive data architecture validation...');
      const validationResults = await validator.runComprehensiveTests();
      
      // Convert validation results to our format
      validationResults.forEach(result => {
        addTestResult({
          testName: result.testName,
          category: result.testName.includes('Performance') ? 'performance' : 
                   result.testName.includes('Integrity') ? 'data-integrity' : 
                   result.testName.includes('Concurrency') ? 'concurrency' : 'edge-cases',
          status: result.passed ? 'passed' : 'failed',
          duration: result.duration,
          details: result.details
        });
      });
      
      setProgress(40);
      
      // Run original stress tests
      await runStructureChartStressTests();
      setProgress(60);
      
      await runCapTableStressTests();
      setProgress(80);
      
      await runDataIntegrityTests();
      setProgress(90);
      
      await runEdgeCaseTests();
      setProgress(100);

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Calculate final metrics
      setTimeout(() => {
        const finalResults = results.length > 0 ? results : 
          validationResults.map(r => ({
            testName: r.testName,
            category: 'performance' as const,
            status: r.passed ? 'passed' as const : 'failed' as const,
            duration: r.duration,
            details: r.details
          }));
          
        const passedTests = finalResults.filter(r => r.status === 'passed').length;
        const failedTests = finalResults.filter(r => r.status === 'failed').length;
        const avgResponseTime = finalResults.reduce((sum, r) => sum + (r.duration || 0), 0) / finalResults.length;

        setMetrics({
          totalTests: finalResults.length,
          passed: passedTests,
          failed: failedTests,
          avgResponseTime,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          dataIntegrityScore: Math.round((passedTests / finalResults.length) * 100)
        });
      }, 500);

    } catch (error) {
      console.error('Stress test suite failed:', error);
      addTestResult({
        testName: 'Comprehensive Test Suite',
        category: 'performance',
        status: 'failed',
        details: `Suite failed: ${error}`
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const stopStressTest = () => {
    setIsRunning(false);
    setCurrentTest('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: TestResult['category']) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'data-integrity': return <Database className="h-4 w-4" />;
      case 'edge-cases': return <AlertTriangle className="h-4 w-4" />;
      case 'concurrency': return <Network className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Data Architecture Stress Test Suite
            <div className="flex gap-2">
              <Button 
                onClick={runFullStressTest} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Run Full Suite
              </Button>
              {isRunning && (
                <Button 
                  onClick={stopStressTest} 
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">
                Current: {currentTest || 'Initializing...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{metrics.totalTests}</div>
              <p className="text-xs text-muted-foreground">Total Tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{metrics.passed}</div>
              <p className="text-xs text-muted-foreground">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{metrics.failed}</div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{metrics.dataIntegrityScore}%</div>
              <p className="text-xs text-muted-foreground">Integrity Score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(test.category)}
                    <div>
                      <h4 className="font-medium">{test.testName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {test.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="text-sm">{test.status}</span>
                    {test.duration && (
                      <span className="text-xs text-gray-500">
                        {test.duration.toFixed(2)}ms
                      </span>
                    )}
                  </div>
                </div>
                {test.details && (
                  <p className="text-sm text-gray-600 mt-2">{test.details}</p>
                )}
                {test.error && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{test.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
            {results.length === 0 && !isRunning && (
              <p className="text-center text-gray-500 py-8">
                No tests run yet. Click "Run Full Suite" to start stress testing.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};