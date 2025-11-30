import React, { useState, useMemo } from 'react';
import { ExtractedData } from '../types';
import { Download, Search, Trash2 } from 'lucide-react';

interface ExtractionTableProps {
  data: ExtractedData[];
  onDelete: (index: number) => void;
  onClearAll: () => void;
}

export const ExtractionTable: React.FC<ExtractionTableProps> = ({ data, onDelete, onClearAll }) => {
  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!filter) return data;
    const lowerFilter = filter.toLowerCase();
    return data.filter(
      (item) =>
        item.sender.toLowerCase().includes(lowerFilter) ||
        item.code.includes(lowerFilter)
    );
  }, [data, filter]);

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = ['Sender', 'Code', 'Original Context'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map((row) =>
        [
          `"${row.sender.replace(/"/g, '""')}"`,
          `"${row.code}"`,
          `"${row.originalMessage.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'whatsapp_codes_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Extracted Data</h2>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                {filteredData.length} Found
            </span>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter sender..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
           <button
            onClick={onClearAll}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs">
            <tr>
              <th className="px-6 py-3">Sender</th>
              <th className="px-6 py-3">Code (6-Digit)</th>
              <th className="px-6 py-3 hidden md:table-cell">Context Snippet</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.sender}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-300">
                      {row.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500 truncate max-w-xs" title={row.originalMessage}>
                    {row.originalMessage}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(index)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  No data matches your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};