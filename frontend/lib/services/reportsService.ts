export type { PayrollSummary, AttendanceOverview, LeaveAnalytics, DepartmentCost, ReportData } from '@/lib/api/reports';

const generatePDF = (reportType: string, data: any, dateFrom: string, dateTo: string, department?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const title = reportType.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const period = department ? `${department} - ${dateFrom} to ${dateTo}` : `All Departments - ${dateFrom} to ${dateTo}`;

  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #0F172A; border-bottom: 2px solid #2563EB; padding-bottom: 10px; }
        h2 { color: #64748B; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E2E8F0; }
        th { background-color: #F8FAFC; font-weight: bold; color: #0F172A; }
        .metric { margin: 15px 0; padding: 15px; background-color: #F8FAFC; border-radius: 5px; }
        .metric-label { font-size: 12px; color: #64748B; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0F172A; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>${title} Report</h1>
      <p><strong>Period:</strong> ${period}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  `;

  if (reportType === 'payroll-summary') {
    content += `
      <div class="metric">
        <div class="metric-label">Total Payroll</div>
        <div class="metric-value">$${data.totalPayroll.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Employee Count</div>
        <div class="metric-value">${data.employeeCount}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Average Salary</div>
        <div class="metric-value">$${data.averageSalary.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Period</div>
        <div class="metric-value">${data.period}</div>
      </div>
    `;
  } else if (reportType === 'attendance-overview') {
    content += `
      <div class="metric">
        <div class="metric-label">Total Days</div>
        <div class="metric-value">${data.totalDays}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Present Days</div>
        <div class="metric-value">${data.presentDays}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Absent Days</div>
        <div class="metric-value">${data.absentDays}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Late Arrivals</div>
        <div class="metric-value">${data.lateArrivals}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Attendance Rate</div>
        <div class="metric-value">${data.attendanceRate.toFixed(1)}%</div>
      </div>
    `;
  } else if (reportType === 'leave-analytics') {
    content += `
      <div class="metric">
        <div class="metric-label">Total Leaves</div>
        <div class="metric-value">${data.totalLeaves}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Approved</div>
        <div class="metric-value">${data.approvedLeaves}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Pending</div>
        <div class="metric-value">${data.pendingLeaves}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Rejected</div>
        <div class="metric-value">${data.rejectedLeaves}</div>
      </div>
      <h2>Leave Types</h2>
      <table>
        <tr><th>Type</th><th>Count</th></tr>
        ${data.leaveTypes.map((lt: any) => `<tr><td>${lt.type}</td><td>${lt.count}</td></tr>`).join('')}
      </table>
    `;
  } else if (reportType === 'department-costs') {
    content += `
      <h2>Department Costs</h2>
      <table>
        <tr><th>Department</th><th>Employees</th><th>Total Cost</th><th>Percentage</th></tr>
        ${data.map((d: any) => `
          <tr>
            <td>${d.department}</td>
            <td>${d.employeeCount}</td>
            <td>$${d.totalCost.toLocaleString()}</td>
            <td>${d.percentage.toFixed(1)}%</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  content += `
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

const generateExcel = (reportType: string, data: any, dateFrom: string, dateTo: string, department?: string) => {
  const title = reportType.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const period = department ? `${department} - ${dateFrom} to ${dateTo}` : `All Departments - ${dateFrom} to ${dateTo}`;

  let csvContent = `${title} Report\n`;
  csvContent += `Period: ${period}\n`;
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  if (reportType === 'payroll-summary') {
    csvContent += `Metric,Value\n`;
    csvContent += `Total Payroll,$${data.totalPayroll.toLocaleString()}\n`;
    csvContent += `Employee Count,${data.employeeCount}\n`;
    csvContent += `Average Salary,$${data.averageSalary.toLocaleString()}\n`;
    csvContent += `Period,${data.period}\n`;
  } else if (reportType === 'attendance-overview') {
    csvContent += `Metric,Value\n`;
    csvContent += `Total Days,${data.totalDays}\n`;
    csvContent += `Present Days,${data.presentDays}\n`;
    csvContent += `Absent Days,${data.absentDays}\n`;
    csvContent += `Late Arrivals,${data.lateArrivals}\n`;
    csvContent += `Attendance Rate,${data.attendanceRate.toFixed(1)}%\n`;
  } else if (reportType === 'leave-analytics') {
    csvContent += `Metric,Value\n`;
    csvContent += `Total Leaves,${data.totalLeaves}\n`;
    csvContent += `Approved,${data.approvedLeaves}\n`;
    csvContent += `Pending,${data.pendingLeaves}\n`;
    csvContent += `Rejected,${data.rejectedLeaves}\n\n`;
    csvContent += `Leave Type,Count\n`;
    data.leaveTypes.forEach((lt: any) => {
      csvContent += `${lt.type},${lt.count}\n`;
    });
  } else if (reportType === 'department-costs') {
    csvContent += `Department,Employees,Total Cost,Percentage\n`;
    data.forEach((d: any) => {
      csvContent += `${d.department},${d.employeeCount},$${d.totalCost.toLocaleString()},${d.percentage.toFixed(1)}%\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportType}-${dateFrom}-to-${dateTo}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

import { reportsApi, type ReportData } from '@/lib/api/reports';

export const reportsService = {
  async getReportData(
    dateFrom: string,
    dateTo: string,
    department?: string
  ): Promise<ReportData> {
    const response = await reportsApi.getExecutiveReport(dateFrom, dateTo, department);
    return response.data;
  },

  async exportPDF(reportType: string, data: any, dateFrom: string, dateTo: string, department?: string): Promise<void> {
    generatePDF(reportType, data, dateFrom, dateTo, department);
  },

  async exportExcel(reportType: string, data: any, dateFrom: string, dateTo: string, department?: string): Promise<void> {
    generateExcel(reportType, data, dateFrom, dateTo, department);
  },
};



