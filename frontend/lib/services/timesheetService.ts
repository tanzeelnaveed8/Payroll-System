import { timesheetApi, type Timesheet } from '@/lib/api/timesheets';

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type { Timesheet } from '@/lib/api/timesheets';

export interface TimesheetFilter {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
  employeeName?: string;
  department?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: TimesheetStatus;
  employeeId?: string;
}

export interface TimesheetSort {
  field: string;
  direction: 'asc' | 'desc';
}

export const timesheetService = {
  async getTimesheets(filters: TimesheetFilter = {}): Promise<Timesheet[]> {
    const response = await timesheetApi.getTimesheets(filters);
    return response.data;
  },

  async getTimesheetById(id: string): Promise<Timesheet> {
    try {
      const response = await timesheetApi.getTimesheetById(id);
      if (!response || !response.data || !response.data.timesheet) {
        throw new Error('Timesheet not found');
      }
      return response.data.timesheet;
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('ResourceNotFound')) {
        throw new Error('Timesheet not found');
      }
      if (error.message?.includes('403') || error.message?.includes('permission') || error.message?.includes('AccessDenied')) {
        throw new Error('You do not have permission to view this timesheet');
      }
      throw error;
    }
  },

  async createTimesheet(data: {
    date: string;
    hours: number;
    clockIn?: string;
    clockOut?: string;
    payrollPeriodId?: string;
    comments?: string;
  }): Promise<Timesheet> {
    const response = await timesheetApi.createTimesheet(data);
    return response.data.timesheet;
  },

  async updateTimesheet(id: string, data: {
    date?: string;
    hours?: number;
    clockIn?: string;
    clockOut?: string;
    comments?: string;
  }): Promise<Timesheet> {
    const response = await timesheetApi.updateTimesheet(id, data);
    return response.data.timesheet;
  },

  async submitTimesheet(id: string): Promise<Timesheet> {
    const response = await timesheetApi.submitTimesheet(id);
    return response.data.timesheet;
  },

  async approveTimesheet(id: string, comments?: string): Promise<Timesheet> {
    const response = await timesheetApi.approveTimesheet(id, comments);
    return response.data.timesheet;
  },

  async rejectTimesheet(id: string, reason: string): Promise<Timesheet> {
    const response = await timesheetApi.rejectTimesheet(id, reason);
    return response.data.timesheet;
  },

  async bulkApproveTimesheets(timesheetIds: string[], comments?: string): Promise<void> {
    await timesheetApi.bulkApproveTimesheets(timesheetIds, comments);
  },

  async bulkRejectTimesheets(timesheetIds: string[], reason: string): Promise<void> {
    await timesheetApi.bulkRejectTimesheets(timesheetIds, reason);
  },

  async getEmployeeTimesheets(employeeId: string, filters: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  } = {}): Promise<Timesheet[]> {
    const response = await timesheetApi.getEmployeeTimesheets(employeeId, filters);
    return response.data;
  },

  async getEmployeePeriodTimesheet(employeeId: string, periodId: string): Promise<{ period: any; timesheets: Timesheet[] }> {
    const response = await timesheetApi.getEmployeePeriodTimesheet(employeeId, periodId);
    return response.data;
  },

  async getUniqueDepartments(): Promise<string[]> {
    const response = await timesheetApi.getUniqueDepartments();
    return response.data.departments;
  },

  async getUniqueRoles(): Promise<string[]> {
    const response = await timesheetApi.getUniqueRoles();
    return response.data.roles;
  },
};
