import React, { useState, useRef } from 'react';
import { Upload, File, Image } from 'lucide-react';
import Button from '../ui/Button';

interface DocumentUploaderProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onFileUpload, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 p-3 rounded-full bg-blue-100">
          <Upload className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="mb-2 text-lg font-medium">Upload Document</h3>
        <p className="mb-4 text-sm text-gray-500">
          Drag and drop your invoice, receipt, or other document here, or click to browse
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <div className="flex items-center px-3 py-1 text-xs bg-gray-100 rounded-full">
            <File className="h-3 w-3 mr-1" />
            PDF
          </div>
          <div className="flex items-center px-3 py-1 text-xs bg-gray-100 rounded-full">
            <Image className="h-3 w-3 mr-1" />
            JPG
          </div>
          <div className="flex items-center px-3 py-1 text-xs bg-gray-100 rounded-full">
            <Image className="h-3 w-3 mr-1" />
            PNG
          </div>
        </div>
        <Button
          variant="primary"
          onClick={onButtonClick}
          isLoading={isUploading}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Select File'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default DocumentUploader;
