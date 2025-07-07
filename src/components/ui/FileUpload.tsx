import React, { useState, useRef } from 'react';
import { Upload, File, X, Image, FileText } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  helperText?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = 'image/*,.pdf',
  maxSize = 5, // 5MB default
  label = 'Upload File',
  helperText = 'Drag and drop a file here, or click to select a file',
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setFileError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    // Check file type
    const fileType = file.type;
    const acceptedTypes = accept.split(',').map(type => type.trim());
    
    // Handle wildcards like image/* or specific extensions
    const isAccepted = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return fileType.startsWith(type.split('*')[0]);
      }
      if (type.startsWith('.')) {
        return file.name.endsWith(type);
      }
      return type === fileType;
    });

    if (!isAccepted) {
      setFileError('File type not supported');
      return false;
    }

    setFileError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload size={24} className="text-gray-400" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image size={24} className="text-blue-500" />;
    }
    
    return <FileText size={24} className="text-blue-500" />;
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : fileError 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          {selectedFile ? (
            <div className="w-full">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  {getFileIcon()}
                  <span className="ml-2 text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
              
              {preview && (
                <div className="mt-3 relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <Upload size={24} className="text-gray-400" />
              <p className="text-sm text-gray-500 text-center">{helperText}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select File
              </Button>
            </>
          )}
        </div>
      </div>
      
      {(fileError || error) && (
        <p className="mt-1 text-sm text-red-600">
          {fileError || error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
