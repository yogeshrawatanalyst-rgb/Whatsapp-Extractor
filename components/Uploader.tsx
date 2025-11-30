import React, { useCallback } from 'react';
import { Upload, FileImage, Loader2 } from 'lucide-react';

interface UploaderProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onImageSelected, isLoading }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isLoading) return;
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    },
    [onImageSelected, isLoading]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-300 ${
        isLoading
          ? 'bg-gray-50 border-gray-300 opacity-50 cursor-not-allowed'
          : 'bg-white border-blue-200 hover:border-blue-500 hover:bg-blue-50'
      }`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={isLoading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="flex flex-col items-center text-center p-6 space-y-4">
        <div className={`p-4 rounded-full ${isLoading ? 'bg-gray-200' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}`}>
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-700">
            {isLoading ? 'Processing Screenshot...' : 'Drop WhatsApp Screenshot'}
          </p>
          <p className="text-sm text-gray-500">
            {isLoading ? 'Gemini is reading the messages' : 'or click to browse files'}
          </p>
        </div>
      </div>
    </div>
  );
};