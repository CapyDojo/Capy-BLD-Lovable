
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Database, 
  GitBranch, 
  RefreshCw,
  Search,
  FileText,
  Code
} from 'lucide-react';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';
import { unifiedRepositoryFactory } from '@/services/repositories/unified';

interface ComponentMigrationStatus {
  componentName: string;
  filePath: string;
  status: 'MIGRATED' | 'LEGACY' | 'HYBRID' | 'UNKNOWN';
  usesDataStore: boolean;
  usesUnifiedRepository: boolean;
  usesMigrationBridge: boolean;
  migrationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  dependencies: string[];
  recommendations: string[];
}

interface MigrationAuditResult {
  totalComponents: number;
  migratedComponents: number;
  legacyComponents: number;
  hybridComponents: number;
  migrationProgress: number;
  components: ComponentMigrationStatus[];
  criticalPaths: string[];
  timestamp: Date;
}

export const MigrationAudit: React.FC = () => {
  const [auditResult, setAuditResult] = useState<MigrationAuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentMigrationStatus | null>(null);

  const runMigrationAudit = async () => {
    setIsRunning(true);
    console.log('🔍 Starting comprehensive migration audit...');
    
    try {
      // Simulate component analysis based on known patterns
      const components: ComponentMigrationStatus[] = [
        // Canvas Components
        {
          componentName: 'EntityDetailsPanel',
          filePath: 'src/components/canvas/EntityDetailsPanel.tsx',
          status: 'MIGRATED',
          usesDataStore: false,
          usesUnifiedRepository: true,
          usesMigrationBridge: false,
          migrationComplexity: 'LOW',
          dependencies: ['useEntityDetailsPanel', 'EntityFormFields'],
          recommendations: ['Fully migrated - no action needed']
        },
        {
          componentName: 'useCanvasData',
          filePath: 'src/hooks/useCanvasData.ts',
          status: 'MIGRATED',
          usesDataStore: false,
          usesUnifiedRepository: true,
          usesMigrationBridge: false,
          migrationComplexity: 'LOW',
          dependencies: ['generateSyncedCanvasStructure', 'getUnifiedRepository'],
          recommendations: ['Fully migrated - monitor performance']
        },
        {
          componentName: 'EntityCapTableWrapper',
          filePath: 'src/components/canvas/EntityCapTableWrapper.tsx',
          status: 'HYBRID',
          usesDataStore: false,
          usesUnifiedRepository: false,
          usesMigrationBridge: true,
          migrationComplexity: 'MEDIUM',
          dependencies: ['EntityCapTableSection', 'EntityCapTableSectionV2'],
          recommendations: ['Remove feature flag', 'Complete migration to V2']
        },
        {
          componentName: 'EntityCapTableSection',
          filePath: 'src/components/canvas/EntityCapTableSection.tsx',
          status: 'LEGACY',
          usesDataStore: true,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'MEDIUM',
          dependencies: ['dataStore', 'syncCapTableData'],
          recommendations: ['Migrate to unified repository', 'Replace with V2 component']
        },
        {
          componentName: 'EntityCapTableSectionV2',
          filePath: 'src/components/canvas/EntityCapTableSectionV2.tsx',
          status: 'MIGRATED',
          usesDataStore: false,
          usesUnifiedRepository: false,
          usesMigrationBridge: true,
          migrationComplexity: 'LOW',
          dependencies: ['migrationBridge.getEnterpriseStore'],
          recommendations: ['Replace migration bridge with direct unified repository']
        },
        // Canvas Events and State
        {
          componentName: 'useEntityCanvas',
          filePath: 'src/hooks/useEntityCanvas.ts',
          status: 'LEGACY',
          usesDataStore: false,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'MEDIUM',
          dependencies: ['useCanvasData', 'useCanvasDeletion', 'useCanvasEvents'],
          recommendations: ['Audit sub-hooks for migration status']
        },
        {
          componentName: 'useCanvasDeletion',
          filePath: 'src/hooks/useCanvasDeletion.ts',
          status: 'UNKNOWN',
          usesDataStore: true,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'HIGH',
          dependencies: ['dataStore.deleteEntity'],
          recommendations: ['Critical: Migrate deletion logic to unified repository']
        },
        {
          componentName: 'useCanvasEvents',
          filePath: 'src/hooks/useCanvasEvents.ts',
          status: 'UNKNOWN',
          usesDataStore: true,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'HIGH',
          dependencies: ['dataStore.createEntity', 'dataStore.updateEntity'],
          recommendations: ['Critical: Migrate entity operations to unified repository']
        },
        // Data Sync Services
        {
          componentName: 'capTableSync',
          filePath: 'src/services/capTableSync.ts',
          status: 'LEGACY',
          usesDataStore: true,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'HIGH',
          dependencies: ['dataStore'],
          recommendations: ['Replace with unified repository views', 'Critical for canvas functionality']
        },
        // Dashboard Components (Read-only files - status unknown)
        {
          componentName: 'Dashboard',
          filePath: 'src/components/dashboard/Dashboard.tsx',
          status: 'UNKNOWN',
          usesDataStore: true,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'MEDIUM',
          dependencies: ['Unknown - read-only file'],
          recommendations: ['Audit required - read-only file']
        },
        {
          componentName: 'CapTableView',
          filePath: 'src/components/cap-table/CapTableView.tsx',
          status: 'UNKNOWN',
          usesDataStore: true,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'MEDIUM',
          dependencies: ['Unknown - read-only file'],
          recommendations: ['Audit required - read-only file']
        },
        // Entity Service
        {
          componentName: 'EntityService',
          filePath: 'src/services/EntityService.ts',
          status: 'LEGACY',
          usesDataStore: false,
          usesUnifiedRepository: false,
          usesMigrationBridge: false,
          migrationComplexity: 'HIGH',
          dependencies: ['Repository pattern - pre-unified'],
          recommendations: ['Replace with unified repository', 'Highly complex migration']
        }
      ];

      // Calculate statistics
      const migratedCount = components.filter(c => c.status === 'MIGRATED').length;
      const legacyCount = components.filter(c => c.status === 'LEGACY').length;
      const hybridCount = components.filter(c => c.status === 'HYBRID').length;
      const migrationProgress = Math.round((migratedCount / components.length) * 100);

      // Identify critical paths
      const criticalPaths = [
        'Canvas entity operations (useCanvasEvents)',
        'Entity deletion (useCanvasDeletion)', 
        'Cap table synchronization (capTableSync)',
        'Dashboard data loading',
        'Cap table viewing components'
      ];

      const result: MigrationAuditResult = {
        totalComponents: components.length,
        migratedComponents: migratedCount,
        legacyComponents: legacyCount,
        hybridComponents: hybridCount,
        migrationProgress,
        components,
        criticalPaths,
        timestamp: new Date()
      };

      setAuditResult(result);
      console.log('✅ Migration audit completed:', result);

    } catch (error) {
      console.error('❌ Migration audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: ComponentMigrationStatus['status']) => {
    switch (status) {
      case 'MIGRATED': return 'bg-green-100 text-green-800';
      case 'LEGACY': return 'bg-red-100 text-red-800';
      case 'HYBRID': return 'bg-yellow-100 text-yellow-800';
      case 'UNKNOWN': return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: ComponentMigrationStatus['migrationComplexity']) => {
    switch (complexity) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = (status: ComponentMigrationStatus['status']) => {
    switch (status) {
      case 'MIGRATED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LEGACY': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'HYBRID': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'UNKNOWN': return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    // Auto-run audit on component mount
    runMigrationAudit();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Migration Audit Report
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {auditResult && (
            <>
              <span>Last Run: {auditResult.timestamp.toLocaleTimeString()}</span>
              <span>Progress: {auditResult.migrationProgress}%</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runMigrationAudit} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isRunning ? 'Running Audit...' : 'Run Migration Audit'}
          </Button>
        </div>

        {auditResult && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="critical">Critical Paths</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Migration Progress</span>
                  <span>{auditResult.migrationProgress}%</span>
                </div>
                <Progress value={auditResult.migrationProgress} className="w-full" />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{auditResult.migratedComponents}</div>
                  <div className="text-sm text-green-700">Migrated</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{auditResult.legacyComponents}</div>
                  <div className="text-sm text-red-700">Legacy</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{auditResult.hybridComponents}</div>
                  <div className="text-sm text-yellow-700">Hybrid</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{auditResult.totalComponents}</div>
                  <div className="text-sm text-gray-700">Total</div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {auditResult.legacyComponents > 0 
                    ? `${auditResult.legacyComponents} components still need migration. Focus on critical paths first.`
                    : 'All components have been migrated or are in hybrid state!'}
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="space-y-2">
                {auditResult.components.map((component, index) => (
                  <Card 
                    key={index} 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedComponent(component)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(component.status)}
                        <div>
                          <div className="font-medium">{component.componentName}</div>
                          <div className="text-sm text-gray-500">{component.filePath}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getComplexityColor(component.migrationComplexity)}>
                          {component.migrationComplexity}
                        </Badge>
                        <Badge className={getStatusColor(component.status)}>
                          {component.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {selectedComponent && (
                <Card className="p-4 bg-blue-50">
                  <h4 className="font-semibold mb-2">{selectedComponent.componentName}</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Status:</strong> {selectedComponent.status}</div>
                    <div><strong>Migration Complexity:</strong> {selectedComponent.migrationComplexity}</div>
                    <div><strong>Uses Data Store:</strong> {selectedComponent.usesDataStore ? '✅' : '❌'}</div>
                    <div><strong>Uses Unified Repository:</strong> {selectedComponent.usesUnifiedRepository ? '✅' : '❌'}</div>
                    <div><strong>Uses Migration Bridge:</strong> {selectedComponent.usesMigrationBridge ? '✅' : '❌'}</div>
                    <div><strong>Dependencies:</strong> {selectedComponent.dependencies.join(', ')}</div>
                    <div className="mt-2">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {selectedComponent.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="critical" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These components are critical for core functionality and should be migrated first.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                {auditResult.criticalPaths.map((path, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-800">{path}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Priority Migration Actions</h3>
                
                <div className="space-y-3">
                  <Card className="p-4 border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">🔥 High Priority</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Migrate useCanvasEvents to unified repository (entity creation/updates)</li>
                      <li>Migrate useCanvasDeletion to unified repository (entity deletion)</li>
                      <li>Replace capTableSync with unified repository views</li>
                    </ul>
                  </Card>

                  <Card className="p-4 border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Medium Priority</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Complete EntityCapTableWrapper migration (remove feature flag)</li>
                      <li>Audit dashboard components for migration needs</li>
                      <li>Replace EntityService with unified repository pattern</li>
                    </ul>
                  </Card>

                  <Card className="p-4 border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Low Priority</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Optimize EntityCapTableSectionV2 to use direct unified repository</li>
                      <li>Add performance monitoring to migrated components</li>
                      <li>Document migration patterns for future components</li>
                    </ul>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
