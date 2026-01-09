import { adminApi, AdminDashboardData } from '../api/admin';

/**
 * Map _id to id for consistency
 */
const mapId = <T extends { _id?: string; id?: string }>(item: T): T & { id: string } => {
  if (item._id && !item.id) {
    return { ...item, id: item._id };
  }
  return item as T & { id: string };
};

export const adminService = {
  /**
   * Get admin dashboard data
   */
  async getDashboardData(): Promise<AdminDashboardData> {
    try {
      const data = await adminApi.getDashboard();
      
      // Map IDs in recent payroll activity
      const recentPayrollActivity = data.recentPayrollActivity.map(mapId);
      
      // Map IDs in department breakdown
      const departmentBreakdown = {
        ...data.departmentBreakdown,
        departments: data.departmentBreakdown.departments.map(mapId)
      };

      return {
        ...data,
        recentPayrollActivity,
        departmentBreakdown
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      throw error;
    }
  },

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Format large currency (in millions)
   */
  formatLargeCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return this.formatCurrency(amount);
  },

  /**
   * Format date
   */
  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

