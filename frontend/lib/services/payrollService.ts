import { payrollApi, type PayrollPeriod, type Paystub } from '@/lib/api/payroll';

export type PayrollStatus = "draft" | "processing" | "completed" | "cancelled";

export type { PayrollPeriod, Paystub } from '@/lib/api/payroll';

export interface PayrollFilter {
  period?: string;
  department?: string;
  status?: PayrollStatus;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const payrollService = {
  async getPayrollPeriods(filters: PayrollFilter = {}): Promise<PayrollPeriod[]> {
    const response = await payrollApi.getPayrollPeriods(filters);
    return response.data;
  },

  async getPayrollPeriodById(id: string): Promise<PayrollPeriod> {
    const response = await payrollApi.getPayrollPeriodById(id);
    return response.data.period;
  },

  async createPayrollPeriod(data: { periodStart: string; periodEnd: string; payDate: string; departmentId?: string; department?: string }): Promise<PayrollPeriod> {
    const response = await payrollApi.createPayrollPeriod(data);
    return response.data.period;
  },

  async updatePayrollPeriod(id: string, data: Partial<PayrollPeriod>): Promise<PayrollPeriod> {
    const response = await payrollApi.updatePayrollPeriod(id, data);
    return response.data.period;
  },

  async processPayroll(periodId: string): Promise<void> {
    await payrollApi.processPayroll(periodId);
  },

  async approvePayroll(periodId: string): Promise<void> {
    await payrollApi.approvePayroll(periodId);
  },

  async getCurrentPeriod(): Promise<PayrollPeriod | null> {
    const response = await payrollApi.getCurrentPeriod();
    return response.data.period || null;
  },

  async getNextPayrollDate(): Promise<string> {
    const response = await payrollApi.getNextPayDate();
    return response.data.nextPayDate || '';
  },

  async getPaystubs(filters: { employeeId?: string; payrollPeriodId?: string; status?: string } = {}): Promise<Paystub[]> {
    const response = await payrollApi.getPaystubs(filters);
    return response.data;
  },

  async getPaystubById(id: string): Promise<Paystub> {
    const response = await payrollApi.getPaystubById(id);
    return response.data.paystub;
  },

  async getPaystubPDF(id: string): Promise<void> {
    const blob = await payrollApi.getPaystubPDF(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paystub-${id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async getEmployeePaystubs(employeeId: string): Promise<Paystub[]> {
    const response = await payrollApi.getEmployeePaystubs(employeeId);
    return response.data;
  },

  async calculatePayroll(periodId: string): Promise<void> {
    await payrollApi.calculatePayroll(periodId);
  },
};



