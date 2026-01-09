"use client";

import { useState, useRef } from "react";
import { fileService, type UploadFileData } from "@/lib/services/fileService";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface FileUploadProps {
  entityType: string;
  entityId: string;
  onUploadSuccess?: (file: any) => void;
  onUploadError?: (error: Error) => void;
  allowedTypes?: 'images' | 'documents' | 'all';
  maxSize?: number;
  className?: string;
}

export default function FileUpload({
  entityType,
  entityId,
  onUploadSuccess,
  onUploadError,
  allowedTypes = 'all',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = "",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const error = new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      onUploadError?.(error);
      alert(error.message);
      return;
    }

    // Validate file type
    const allowedMimeTypes = {
      images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ],
      all: []
    };

    let validMimeTypes: string[] = [];
    if (allowedTypes === 'images') {
      validMimeTypes = allowedMimeTypes.images;
    } else if (allowedTypes === 'documents') {
      validMimeTypes = allowedMimeTypes.documents;
    } else {
      validMimeTypes = [...allowedMimeTypes.images, ...allowedMimeTypes.documents];
    }

    if (validMimeTypes.length > 0 && !validMimeTypes.includes(file.type)) {
      const error = new Error(`File type ${file.type} is not allowed`);
      onUploadError?.(error);
      alert(error.message);
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const uploadData: UploadFileData = {
        entityType,
        entityId,
      };

      // Simulate progress (in real implementation, use XMLHttpRequest for progress tracking)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const uploadedFile = await fileService.uploadFile(file, uploadData);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      onUploadSuccess?.(uploadedFile);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      onUploadError?.(error);
      alert(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        accept={
          allowedTypes === 'images'
            ? 'image/*'
            : allowedTypes === 'documents'
            ? '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'
            : undefined
        }
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading... {progress}%
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </>
        )}
      </Button>
      {uploading && progress > 0 && (
        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-[#2563EB] h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

