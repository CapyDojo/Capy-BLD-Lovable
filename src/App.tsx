
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
        
        console.log('✅ Migration modules loaded:', migrationValidationModule, migrationBridgeModule);
        
        // Explicitly attach to window object
        (window as any).runMigrationTests = migrationValidationModule.migrationValidator.runAllTests.bind(migrationValidationModule.migrationValidator);
        (window as any).runMigrationTest = (testName: string) => migrationValidationModule.migrationValidator.runSingleTest(testName);
        (window as any).getMigrationTestNames = () => migrationValidationModule.migrationValidator.getTestNames();
        (window as any).getMigrationStatus = () => migrationBridgeModule.migrationBridge.getMigrationStatus();
        
        console.log('🧪 Migration test functions exposed to console:');
        console.log('  - runMigrationTests()');
        console.log('  - runMigrationTest(name)');
        console.log('  - getMigrationTestNames()');
        console.log('  - getMigrationStatus()');
        
        // Test that functions are actually available
        console.log('🔍 Testing function availability:');
        console.log('  - runMigrationTests:', typeof (window as any).runMigrationTests);
        console.log('  - runMigrationTest:', typeof (window as any).runMigrationTest);
        console.log('  - getMigrationTestNames:', typeof (window as any).getMigrationTestNames);
        console.log('  - getMigrationStatus:', typeof (window as any).getMigrationStatus);
        
      } catch (error) {
        console.error('❌ Failed to expose migration functions:', error);
      }
    };
    
    // Add a small delay to ensure all modules are loaded
    setTimeout(exposeMigrationFunctions, 1000);
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
