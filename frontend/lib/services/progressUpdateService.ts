import {
  progressUpdatesApi,
  type ProgressUpdate,
} from '@/lib/api/progressUpdates';

const mapId = <T extends { _id?: string; id?: string }>(item: T): T & { id: string } => {
  if (item._id && !item.id) {
    return { ...item, id: item._id };
  }
  return item as T & { id: string };
};

export const progressUpdateService = {
  async createUpdate(update: Partial<ProgressUpdate>): Promise<ProgressUpdate> {
    const response = await progressUpdatesApi.createUpdate(update);
    return mapId(response.data);
  },

  async getMyUpdates(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ProgressUpdate[]> {
    const response = await progressUpdatesApi.getMyUpdates(filters);
    return response.data.updates.map(mapId);
  },

  async getUpdates(filters?: {
    departmentId?: string;
    deptLeadId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ProgressUpdate[]> {
    const response = await progressUpdatesApi.getUpdates(filters);
    return response.data.updates.map(mapId);
  },

  async getUpdateById(updateId: string): Promise<ProgressUpdate> {
    const response = await progressUpdatesApi.getUpdateById(updateId);
    return mapId(response.data);
  },

  async acknowledgeUpdate(updateId: string, comments: string): Promise<ProgressUpdate> {
    const response = await progressUpdatesApi.acknowledgeUpdate(updateId, comments);
    return mapId(response.data);
  },

  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatPeriod(start: string | Date, end: string | Date): string {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  },
};
