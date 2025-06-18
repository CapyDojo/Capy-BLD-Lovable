
import React, { useState } from 'react';
import { DocumentGrid } from './DocumentGrid';
import { DocumentUpload } from './DocumentUpload';
import { Search, Filter, Upload, FolderPlus } from 'lucide-react';

export const DocumentRepository: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Repository</h1>
          <p className="text-gray-600">Organize and manage legal documents by entity and type</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </button>
          
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Documents</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Documents</option>
            <option value="formation">Formation Documents</option>
            <option value="governance">Governance</option>
            <option value="compliance">Compliance</option>
            <option value="contracts">Contracts</option>
            <option value="financial">Financial</option>
          </select>
        </div>
      </div>

      <DocumentGrid searchTerm={searchTerm} filter={selectedFilter} />
      
      {showUpload && (
        <DocumentUpload onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
};
