
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

// Import the new simple test runner
import { simpleTestRunner } from '@/services/testing/SimpleTestRunner';

// Simple, direct global function exposure
console.log('🔧 Setting up simple test functions...');

// Expose simple test functions directly
(window as any).testFunction = () => {
  console.log('✅ Global testFunction called!');
  return simpleTestRunner.test();
};

(window as any).runAllTests = () => {
  console.log('🧪 Global runAllTests called!');
  return simpleTestRunner.runAllTests();
};

(window as any).getTestNames = () => {
  console.log('📋 Global getTestNames called!');
  return simpleTestRunner.getTestNames();
};

// Also expose the test runner itself
(window as any).simpleTestRunner = simpleTestRunner;

console.log('✅ Simple test functions exposed!');
console.log('🎯 Try these commands:');
console.log('  - testFunction()');
console.log('  - runAllTests()');
console.log('  - getTestNames()');
console.log('  - simpleTestRunner.test()');

// Verify immediately
console.log('🔍 Immediate verification:');
console.log('  - testFunction exists:', typeof (window as any).testFunction);
console.log('  - runAllTests exists:', typeof (window as any).runAllTests);
console.log('  - simpleTestRunner exists:', typeof (window as any).simpleTestRunner);

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
