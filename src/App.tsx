
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

// Import migration modules directly and expose functions immediately
import { migrationValidator } from '@/services/dataStore/MigrationValidation';
import { migrationBridge } from '@/services/dataStore/MigrationBridge';

// Expose functions to global window object immediately
console.log('🔄 Exposing migration functions to window...');

(window as any).runMigrationTests = () => {
  console.log('🧪 Running migration tests...');
  return migrationValidator.runAllTests();
};

(window as any).runMigrationTest = (testName: string) => {
  console.log(`🧪 Running single test: ${testName}`);
  return migrationValidator.runSingleTest(testName);
};

(window as any).getMigrationTestNames = () => {
  console.log('📋 Getting migration test names...');
  return migrationValidator.getTestNames();
};

(window as any).getMigrationStatus = () => {
  console.log('📊 Getting migration status...');
  return migrationBridge.getMigrationStatus();
};

(window as any).testFunction = () => {
  console.log('✅ Test function called successfully!');
  return 'Test function works!';
};

console.log('✅ Migration functions exposed to window:');
console.log('  - runMigrationTests()');
console.log('  - runMigrationTest(name)');
console.log('  - getMigrationTestNames()');
console.log('  - getMigrationStatus()');
console.log('  - testFunction()');

// Verify functions are attached
console.log('🔍 Verification:');
console.log('  - testFunction type:', typeof (window as any).testFunction);
console.log('  - runMigrationTests type:', typeof (window as any).runMigrationTests);

const queryClient = new QueryClient();

const App = () => {
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
