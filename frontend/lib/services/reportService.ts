import { reportsApi, type Report, type ReportType, type GenerateReportRequest } from '@/lib/api/reports';

export interface ReportFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  type?: ReportType;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  createdBy?: string;
}

export const reportService = {
  /**
   * Get list of reports with filters
   */
  async getReports(filters?: ReportFilters) {
    try {
      const response = await reportsApi.getReports(filters);
      return {
        reports: response.data.items || [],
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      throw error;
    }
  },

  /**
   * Get a single report by ID
   */
  async getReportById(id: string): Promise<Report> {
    try {
      const response = await reportsApi.getReportById(id);
      return response.data.report;
    } catch (error) {
      console.error('Failed to fetch report:', error);
      throw error;
    }
  },

  /**
   * Generate a new report
   */
  async generateReport(data: GenerateReportRequest): Promise<Report> {
    try {
      const response = await reportsApi.generateReport(data);
      return response.data.report;
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  },

  /**
   * Download PDF report
   */
  async downloadPDF(id: string, filename?: string): Promise<void> {
    try {
      const blob = await reportsApi.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `report-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  },

  /**
   * Download Excel report
   */
  async downloadExcel(id: string, filename?: string): Promise<void> {
    try {
      const blob = await reportsApi.downloadExcel(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `report-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download Excel:', error);
      throw error;
    }
  },

  /**
   * Get quick payroll summary (no storage)
   */
  async getPayrollSummary(dateFrom: string, dateTo: string, departmentId?: string) {
    try {
      const response = await reportsApi.getPayrollSummary(dateFrom, dateTo, departmentId);
      return response.data.payrollSummary;
    } catch (error) {
      console.error('Failed to fetch payroll summary:', error);
      throw error;
    }
  },

  /**
   * Get quick attendance overview (no storage)
   */
  async getAttendanceOverview(dateFrom: string, dateTo: string, departmentId?: string) {
    try {
      const response = await reportsApi.getAttendanceOverview(dateFrom, dateTo, departmentId);
      return response.data.attendanceOverview;
    } catch (error) {
      console.error('Failed to fetch attendance overview:', error);
      throw error;
    }
  },

  /**
   * Get quick leave analytics (no storage)
   */
  async getLeaveAnalytics(dateFrom: string, dateTo: string, departmentId?: string) {
    try {
      const response = await reportsApi.getLeaveAnalytics(dateFrom, dateTo, departmentId);
      return response.data.leaveAnalytics;
    } catch (error) {
      console.error('Failed to fetch leave analytics:', error);
      throw error;
    }
  },

  /**
   * Get quick department costs (no storage)
   */
  async getDepartmentCosts(dateFrom: string, dateTo: string) {
    try {
      const response = await reportsApi.getDepartmentCosts(dateFrom, dateTo);
      return response.data.departmentCosts || [];
    } catch (error) {
      console.error('Failed to fetch department costs:', error);
      throw error;
    }
  },
};

