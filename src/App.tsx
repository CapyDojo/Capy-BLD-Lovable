
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
  // Expose migration functions immediately when component mounts
  React.useEffect(() => {
    const exposeMigrationFunctions = async () => {
      try {
        console.log('🔄 Loading migration validation functions...');
        
        // Import the modules
        const { migrationValidator } = await import('@/services/dataStore/MigrationValidation');
        const { migrationBridge } = await import('@/services/dataStore/MigrationBridge');
        
        console.log('✅ Migration modules loaded successfully');
        console.log('📦 migrationValidator:', migrationValidator);
        console.log('📦 migrationBridge:', migrationBridge);
        
        // Expose functions directly to window - no wrapper functions
        (window as any).runMigrationTests = () => migrationValidator.runAllTests();
        (window as any).runMigrationTest = (testName: string) => migrationValidator.runSingleTest(testName);
        (window as any).getMigrationTestNames = () => migrationValidator.getTestNames();
        (window as any).getMigrationStatus = () => migrationBridge.getMigrationStatus();
        
        // Additional debugging function
        (window as any).testFunction = () => {
          console.log('✅ Test function works!');
          return 'Test successful';
        };
        
        console.log('🧪 Migration test functions exposed to console:');
        console.log('  - runMigrationTests()');
        console.log('  - runMigrationTest(name)');
        console.log('  - getMigrationTestNames()');
        console.log('  - getMigrationStatus()');
        console.log('  - testFunction() [for debugging]');
        
        // Comprehensive verification
        console.log('🔍 Function verification:');
        Object.keys(window).filter(key => key.includes('Migration') || key === 'testFunction').forEach(key => {
          console.log(`  - ${key}:`, typeof (window as any)[key]);
        });
        
        // Force a final check
        console.log('🎯 Direct window check:');
        console.log('  - window.runMigrationTests exists:', typeof (window as any).runMigrationTests);
        console.log('  - window.testFunction exists:', typeof (window as any).testFunction);
        
      } catch (error) {
        console.error('❌ Failed to expose migration functions:', error);
        console.error('❌ Error details:', error);
      }
    };
    
    // Execute immediately
    exposeMigrationFunctions();
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
