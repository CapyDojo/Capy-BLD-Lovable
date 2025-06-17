
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { CapTableEditor } from "@/components/cap-table/CapTableEditor";
import { EntityCanvas } from "@/components/canvas/EntityCanvas";
import { DocumentRepository } from "@/components/documents/DocumentRepository";
import { ComplianceTimeline } from "@/components/compliance/ComplianceTimeline";
import DataStructure from "@/pages/DataStructure";
import Database from "@/pages/Database";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Expose migration functions after component mounts
  React.useEffect(() => {
    const exposeMigrationFunctions = async () => {
      try {
        console.log('🔄 Loading migration validation functions...');
        
        const migrationValidationModule = await import('@/services/dataStore/MigrationValidation');
        const migrationBridgeModule = await import('@/services/dataStore/MigrationBridge');
        
        console.log('✅ Migration modules loaded successfully');
        
        // Create wrapper functions to avoid binding issues
        const runMigrationTests = async () => {
          return await migrationValidationModule.migrationValidator.runAllTests();
        };
        
        const runMigrationTest = async (testName: string) => {
          return await migrationValidationModule.migrationValidator.runSingleTest(testName);
        };
        
        const getMigrationTestNames = () => {
          return migrationValidationModule.migrationValidator.getTestNames();
        };
        
        const getMigrationStatus = () => {
          return migrationBridgeModule.migrationBridge.getMigrationStatus();
        };
        
        // Attach to window object
        (window as any).runMigrationTests = runMigrationTests;
        (window as any).runMigrationTest = runMigrationTest;
        (window as any).getMigrationTestNames = getMigrationTestNames;
        (window as any).getMigrationStatus = getMigrationStatus;
        
        console.log('🧪 Migration test functions exposed to console:');
        console.log('  - runMigrationTests()');
        console.log('  - runMigrationTest(name)');
        console.log('  - getMigrationTestNames()');
        console.log('  - getMigrationStatus()');
        
        // Verify functions are properly attached
        console.log('🔍 Function verification:');
        console.log('  - runMigrationTests:', typeof (window as any).runMigrationTests);
        console.log('  - Window has runMigrationTests:', 'runMigrationTests' in window);
        
      } catch (error) {
        console.error('❌ Failed to expose migration functions:', error);
      }
    };
    
    // Use a longer delay to ensure everything is loaded
    const timeoutId = setTimeout(exposeMigrationFunctions, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            } />
            <Route path="/structure" element={
              <MainLayout>
                <EntityCanvas />
              </MainLayout>
            } />
            <Route path="/cap-table" element={
              <MainLayout>
                <CapTableEditor />
              </MainLayout>
            } />
            <Route path="/documents" element={
              <MainLayout>
                <DocumentRepository />
              </MainLayout>
            } />
            <Route path="/compliance" element={
              <MainLayout>
                <ComplianceTimeline />
              </MainLayout>
            } />
            <Route path="/data-structure" element={
              <MainLayout>
                <DataStructure />
              </MainLayout>
            } />
            <Route path="/database" element={
              <MainLayout>
                <Database />
              </MainLayout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
