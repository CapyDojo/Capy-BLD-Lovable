
import React from 'react';
import { FileText, Download, Eye, MoreVertical } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  entity: string;
  size: string;
  uploadDate: string;
  category: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Certificate of Incorporation',
    type: 'PDF',
    entity: 'Parent Corporation',
    size: '2.1 MB',
    uploadDate: '2025-06-10',
    category: 'formation',
  },
  {
    id: '2',
    name: 'Operating Agreement',
    type: 'PDF',
    entity: 'Subsidiary LLC',
    size: '1.8 MB',
    uploadDate: '2025-06-08',
    category: 'formation',
  },
  {
    id: '3',
    name: 'Board Resolution Q1 2025',
    type: 'DOCX',
    entity: 'Tech Holdings Inc',
    size: '156 KB',
    uploadDate: '2025-06-05',
    category: 'governance',
  },
  {
    id: '4',
    name: 'Delaware Annual Report',
    type: 'PDF',
    entity: 'Parent Corporation',
    size: '890 KB',
    uploadDate: '2025-06-01',
    category: 'compliance',
  },
];

interface DocumentGridProps {
  searchTerm: string;
  filter: string;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({ searchTerm, filter }) => {
  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || doc.category === filter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'formation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'governance':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'compliance':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'contracts':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'financial':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDocuments.map((document) => (
        <div key={document.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {document.name}
                </h3>
                <p className="text-xs text-gray-500">{document.type} • {document.size}</p>
              </div>
            </div>
            
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Entity:</span>
              <span className="font-medium text-gray-900">{document.entity}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploaded:</span>
              <span className="text-gray-900">{document.uploadDate}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(document.category)}`}>
              {document.category}
            </span>
            
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <Eye className="h-4 w-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
