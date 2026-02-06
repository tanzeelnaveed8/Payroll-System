import {
  dailyReportsApi,
  type DailyReport,
  type DepartmentReportsData,
  type ReportStats,
} from '@/lib/api/dailyReports';

const mapId = <T extends { _id?: string; id?: string }>(item: T): T & { id: string } => {
  if (item._id && !item.id) {
    return { ...item, id: item._id };
  }
  return item as T & { id: string };
};

export const dailyReportService = {
  async createReport(report: Partial<DailyReport>): Promise<DailyReport> {
    const response = await dailyReportsApi.createReport(report);
    return mapId(response.data);
  },

  async getMyReports(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Promise<DailyReport[]> {
    const response = await dailyReportsApi.getMyReports(filters);
    return response.data.reports.map(mapId);
  },

  async getDepartmentReports(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    employeeId?: string;
    limit?: number;
  }): Promise<DepartmentReportsData> {
    const response = await dailyReportsApi.getDepartmentReports(filters);
    return {
      ...response.data,
      reports: response.data.reports.map(mapId),
      employees: response.data.employees.map(emp => ({
        ...emp,
        reports: emp.reports.map(mapId)
      }))
    };
  },

  async getReportById(reportId: string): Promise<DailyReport> {
    const response = await dailyReportsApi.getReportById(reportId);
    return mapId(response.data);
  },

  async reviewReport(reportId: string, comments: string): Promise<DailyReport> {
    const response = await dailyReportsApi.reviewReport(reportId, comments);
    return mapId(response.data);
  },

  async getReportStats(period: 'week' | 'month' | '30days' = 'week'): Promise<ReportStats> {
    const response = await dailyReportsApi.getReportStats(period);
    return response.data;
  },

  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },
};
