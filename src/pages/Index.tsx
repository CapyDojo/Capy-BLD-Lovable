
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CapTableEditor } from '@/components/cap-table/CapTableEditor';
import { EntityCanvas } from '@/components/canvas/EntityCanvas';
import { DocumentRepository } from '@/components/documents/DocumentRepository';
import { ComplianceTimeline } from '@/components/compliance/ComplianceTimeline';

const Index = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cap-table" element={<CapTableEditor />} />
        <Route path="/structure" element={<EntityCanvas />} />
        <Route path="/documents" element={<DocumentRepository />} />
        <Route path="/compliance" element={<ComplianceTimeline />} />
      </Routes>
    </MainLayout>
  );
};

export default Index;
