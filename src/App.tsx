
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

// Import migration modules
import { migrationValidator } from '@/services/dataStore/MigrationValidation';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';

// Create a global testing object
const setupGlobalFunctions = () => {
  console.log('🔧 Setting up global test functions...');
  
  // Create a global testing namespace
  (window as any).migrationTest = {
    runAllTests: () => {
      console.log('🧪 Running all migration tests...');
      return migrationValidator.runAllTests();
    },
    
    runSingleTest: (testName: string) => {
      console.log(`🧪 Running single test: ${testName}`);
      return migrationValidator.runSingleTest(testName);
    },
    
    getTestNames: () => {
      console.log('📋 Getting test names...');
      return migrationValidator.getTestNames();
    },
    
    getMigrationStatus: () => {
      console.log('📊 Getting migration status...');
      return migrationBridge.getMigrationStatus();
    },
    
    test: () => {
      console.log('✅ Test function works!');
      return 'Hello from migration test!';
    }
  };
  
  // Also expose individual functions for backward compatibility
  (window as any).runMigrationTests = (window as any).migrationTest.runAllTests;
  (window as any).runMigrationTest = (window as any).migrationTest.runSingleTest;
  (window as any).getMigrationTestNames = (window as any).migrationTest.getTestNames;
  (window as any).getMigrationStatus = (window as any).migrationTest.getMigrationStatus;
  (window as any).testFunction = (window as any).migrationTest.test;
  
  console.log('✅ Global functions setup complete!');
  console.log('🎯 Try these commands:');
  console.log('  - migrationTest.test()');
  console.log('  - migrationTest.runAllTests()');
  console.log('  - testFunction()');
  console.log('  - runMigrationTests()');
  
  // Force verify they're accessible
  console.log('🔍 Verification:');
  console.log('  - migrationTest exists:', typeof (window as any).migrationTest);
  console.log('  - testFunction exists:', typeof (window as any).testFunction);
  console.log('  - runMigrationTests exists:', typeof (window as any).runMigrationTests);
};

// Setup immediately
setupGlobalFunctions();

const queryClient = new QueryClient();

const App = () => {
  // Also setup on mount as a fallback
  React.useEffect(() => {
    setTimeout(() => {
      setupGlobalFunctions();
    }, 100);
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
