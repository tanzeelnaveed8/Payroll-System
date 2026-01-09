import {
  filesApi,
  type FileAttachment,
  type UploadFileData,
} from '@/lib/api/files';

const mapId = (file: FileAttachment): FileAttachment => {
  if (file._id && !file.id) {
    return { ...file, id: file._id };
  }
  return file;
};

export const fileService = {
  async uploadFile(file: File, data: UploadFileData): Promise<FileAttachment> {
    const response = await filesApi.uploadFile(file, data);
    if (response.success && response.data?.file) {
      return mapId(response.data.file);
    }
    throw new Error(response.message || 'Failed to upload file');
  },

  async getFile(id: string): Promise<FileAttachment> {
    const response = await filesApi.getFile(id);
    if (response.success && response.data?.file) {
      return mapId(response.data.file);
    }
    throw new Error(response.message || 'Failed to get file');
  },

  async downloadFile(id: string, filename?: string): Promise<void> {
    const blob = await filesApi.downloadFile(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async deleteFile(id: string): Promise<void> {
    const response = await filesApi.deleteFile(id);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete file');
    }
  },

  async getFilesByEntity(entityType: string, entityId: string): Promise<FileAttachment[]> {
    const response = await filesApi.getFilesByEntity(entityType, entityId);
    if (response.success && response.data?.files) {
      return response.data.files.map(mapId);
    }
    return [];
  },

  async generatePDF(data: any, options?: { filename?: string; content?: string }): Promise<any> {
    const response = await filesApi.generatePDF(data, options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to generate PDF');
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📎';
  },
};

export type { FileAttachment, UploadFileData };

