import { apiClient } from './client';

export interface FileAttachment {
  _id: string;
  id?: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  filePath?: string;
  storageProvider: 'local' | 's3' | 'azure' | 'gcs';
  entityType: string;
  entityId: string;
  uploadedBy: string | { _id: string; name: string; email: string };
  uploadedByName?: string;
  isPublic: boolean;
  accessRoles: string[];
  accessUsers: string[];
  description?: string;
  tags: string[];
  category?: string;
  status: 'active' | 'deleted' | 'archived';
  createdAt: string;
  deletedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UploadFileData {
  entityType: string;
  entityId: string;
  description?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  accessRoles?: string[];
  accessUsers?: string[];
}

export const filesApi = {
  async uploadFile(file: File, data: UploadFileData): Promise<ApiResponse<{ file: FileAttachment }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', data.entityType);
    formData.append('entityId', data.entityId);
    if (data.description) formData.append('description', data.description);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.category) formData.append('category', data.category);
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
    if (data.accessRoles) formData.append('accessRoles', JSON.stringify(data.accessRoles));
    if (data.accessUsers) formData.append('accessUsers', JSON.stringify(data.accessUsers));

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to upload file' }));
      throw new Error(error.message || 'Failed to upload file');
    }

    return response.json();
  },

  async getFile(id: string): Promise<ApiResponse<{ file: FileAttachment }>> {
    return apiClient.get<ApiResponse<{ file: FileAttachment }>>(`/files/${id}`);
  },

  async downloadFile(id: string): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/files/${id}/download`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to download file' }));
      throw new Error(error.message || 'Failed to download file');
    }

    return response.blob();
  },

  async deleteFile(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/files/${id}`);
  },

  async getFilesByEntity(entityType: string, entityId: string): Promise<ApiResponse<{ files: FileAttachment[] }>> {
    return apiClient.get<ApiResponse<{ files: FileAttachment[] }>>(`/files/by-entity?entityType=${entityType}&entityId=${entityId}`);
  },

  async generatePDF(data: any, options?: { filename?: string; content?: string }): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/files/generate-pdf', {
      data,
      ...options,
    });
  },
};

