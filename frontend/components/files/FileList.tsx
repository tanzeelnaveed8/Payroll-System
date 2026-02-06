"use client";

import { useState, useEffect, useCallback } from "react";
import { fileService, type FileAttachment } from "@/lib/services/fileService";
import { useAuth } from "@/lib/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FileUpload from "./FileUpload";

interface FileListProps {
  entityType: string;
  entityId: string;
  onFileDeleted?: () => void;
  showUpload?: boolean;
  onUploadSuccess?: () => void;
}

export default function FileList({
  entityType,
  entityId,
  onFileDeleted,
  showUpload = true,
  onUploadSuccess,
}: FileListProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Check if user can delete files
  const canDeleteFile = (file: FileAttachment) => {
    if (!user) return false;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';
    const isUploader = file.uploadedBy === user.id || (file.uploadedBy as any)?._id === user.id;
    
    // Admin and manager can delete any file
    if (isAdmin || isManager) return true;
    
    // User can delete their own files
    if (isUploader) return true;
    
    return false;
  };

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const fileList = await fileService.getFilesByEntity(entityType, entityId);
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleDownload = async (file: FileAttachment) => {
    try {
      await fileService.downloadFile(file.id || file._id, file.originalFileName);
    } catch (error: any) {
      alert(error.message || 'Failed to download file');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setDeleting(fileId);
      await fileService.deleteFile(fileId);
      await loadFiles();
      onFileDeleted?.();
    } catch (error: any) {
      alert(error.message || 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadSuccess = () => {
    loadFiles();
    onUploadSuccess?.();
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-[#64748B]">
        <p className="text-sm">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showUpload && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <FileUpload
            entityType={entityType}
            entityId={entityId}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-8 text-[#64748B]">
          <p className="text-sm">No files attached</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id || file._id}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">{fileService.getFileIcon(file.fileType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">
                    {file.originalFileName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-[#64748B]">
                      {fileService.formatFileSize(file.fileSize)}
                    </p>
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                      {file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                    {file.status === 'deleted' && (
                      <Badge className="bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20 text-xs">
                        Deleted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="text-xs"
                >
                  Download
                </Button>
                {file.status !== 'deleted' && canDeleteFile(file) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(file.id || file._id)}
                    disabled={deleting === (file.id || file._id)}
                    className="text-xs text-[#DC2626] border-[#DC2626]/20 hover:bg-[#DC2626]/5"
                  >
                    {deleting === (file.id || file._id) ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

