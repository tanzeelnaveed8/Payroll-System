import User from '../models/User.js';
import Department from '../models/Department.js';
import Timesheet from '../models/Timesheet.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import PayStub from '../models/PayStub.js';
import mongoose from 'mongoose';

/**
 * Get admin dashboard data
 * Aggregates KPIs, recent payroll activity, and department breakdown
 */
export const getDashboardData = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  /**
   * IMPORTANT PERFORMANCE NOTE
   *
   * The original implementation did many sequential queries and one query
   * per department/payroll period. On realistic data volumes this caused
   * the admin dashboard endpoint to take tens of seconds or more.
   *
   * The refactored implementation:
   * - Groups as many operations as possible into Promise.all
   * - Uses aggregation pipelines to compute department stats in a single query
   * - Aggregates paystub data for recent periods in one pass
   *
   * This dramatically reduces round‑trips to MongoDB and brings the
   * endpoint into a few hundred milliseconds on production‑like data.
   */

  // 1) Core user KPIs (parallel)
  const coreUserStatsPromise = Promise.all([
    // Total active employees
    User.countDocuments({
      role: 'employee',
      status: { $in: ['active', 'on-leave'] }
    }),
    // New hires in last 30 days
    User.countDocuments({
      role: 'employee',
      status: { $in: ['active', 'on-leave'] },
      joinDate: { $gte: thirtyDaysAgo }
    })
  ]);

  // 2) Current payroll period (single query)
  const currentPeriodPromise = PayrollPeriod.findOne({
    periodStart: { $lte: now },
    periodEnd: { $gte: now },
    status: { $in: ['draft', 'processing'] }
  })
    .sort({ periodStart: -1 })
    .lean();

  let payrollStatus = {
    total: 0,
    status: 'No active period',
    nextPayday: null
  };

  // 3) Pending approvals (parallel)
  const pendingApprovalsPromise = Promise.all([
    Timesheet.countDocuments({ status: 'pending' }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    PayrollPeriod.countDocuments({ status: 'processing' })
  ]);

  // 4) Department & salary statistics (parallel)
  const departmentsPromise = Department.find({ status: 'active' })
    .select('name')
    .lean();

  const salaryAggregatePromise = User.aggregate([
    {
      $match: {
        role: 'employee',
        status: { $in: ['active', 'on-leave'] },
        salary: { $exists: true, $ne: null, $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        average: { $avg: '$salary' },
        count: { $sum: 1 }
      }
    }
  ]);

  // 5) Leave requests & timesheet completion (parallel)
  const leaveAndTimesheetStatsPromise = Promise.all([
    LeaveRequest.countDocuments({
      status: 'pending',
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
    }),
    Timesheet.countDocuments({
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    }),
    Timesheet.countDocuments({
      date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: { $in: ['approved', 'submitted'] }
    })
  ]);

  // 6) Recent payroll periods (for activity list)
  const recentPayrollPeriodsPromise = PayrollPeriod.find()
    .sort({ periodStart: -1 })
    .limit(4)
    .lean();

  // Await all the independent operations above in parallel
  const [
    [totalEmployees, newHiresLast30Days],
    currentPeriod,
    [pendingTimesheets, pendingLeaveRequests, pendingPayroll],
    departments,
    salaryData,
    [leaveRequestsThisMonth, totalTimesheets, completedTimesheets],
    recentPayrollPeriods
  ] = await Promise.all([
    coreUserStatsPromise,
    currentPeriodPromise,
    pendingApprovalsPromise,
    departmentsPromise,
    salaryAggregatePromise,
    leaveAndTimesheetStatsPromise,
    recentPayrollPeriodsPromise
  ]);

  // Derive payroll status using aggregated data
  if (currentPeriod) {
    const periodTotals = await PayStub.aggregate([
      {
        $match: {
          payrollPeriodId: new mongoose.Types.ObjectId(currentPeriod._id)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$netPay' }
        }
      }
    ]);

    payrollStatus = {
      total: periodTotals.length > 0 ? periodTotals[0].total : 0,
      status: currentPeriod.status === 'processing' ? 'Processing' : 'Draft',
      nextPayday: currentPeriod.payDate
    };
  }

  const totalPendingApprovals = pendingTimesheets + pendingLeaveRequests + pendingPayroll;
  const totalDepartments = departments.length;

  const averageSalary = salaryData.length > 0 ? Math.round(salaryData[0].average) : 0;

  const timesheetCompletionRate = totalTimesheets > 0
    ? Math.round((completedTimesheets / totalTimesheets) * 100)
    : 0;

  // Optimized recent payroll activity:
  // - Single aggregation over PayStub covering all recent periods
  const recentPeriodIds = recentPayrollPeriods.map(p => p._id);

  const paystubStatsByPeriod = await PayStub.aggregate([
    {
      $match: {
        payrollPeriodId: { $in: recentPeriodIds.map(id => new mongoose.Types.ObjectId(id)) }
      }
    },
    {
      $group: {
        _id: '$payrollPeriodId',
        total: { $sum: '$netPay' },
        employees: { $sum: 1 }
      }
    }
  ]);

  const paystubStatsMap = new Map(
    paystubStatsByPeriod.map(stat => [stat._id.toString(), stat])
  );

  const recentPayrollActivity = recentPayrollPeriods.map((period) => {
    const stat = paystubStatsMap.get(period._id.toString());

    const periodName = period.periodStart.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const formattedDate = period.status === 'completed'
      ? period.processedAt
        ? new Date(period.processedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : period.periodEnd.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
      : 'In Progress';

    return {
      id: period._id,
      period: periodName,
      amount: stat ? stat.total : 0,
      status: period.status === 'completed' ? 'Completed' : 'Processing',
      date: formattedDate,
      employees: stat ? stat.employees : 0
    };
  });

  // Optimized department breakdown:
  // - One aggregate over User to compute employees & payroll per department
  const departmentStats = await User.aggregate([
    {
      $match: {
        role: 'employee',
        status: { $in: ['active', 'on-leave'] },
        department: { $exists: true, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$department',
        employees: { $sum: 1 },
        payroll: { $sum: { $ifNull: ['$salary', 0] } }
      }
    }
  ]);

  const departmentStatsMap = new Map(
    departmentStats.map(stat => [stat._id, stat])
  );

  const colorPalette = [
    { bg: 'bg-blue-100', bar: 'bg-blue-500' },
    { bg: 'bg-green-100', bar: 'bg-green-500' },
    { bg: 'bg-purple-100', bar: 'bg-purple-500' },
    { bg: 'bg-indigo-100', bar: 'bg-indigo-500' },
    { bg: 'bg-amber-100', bar: 'bg-amber-500' },
    { bg: 'bg-pink-100', bar: 'bg-pink-500' }
  ];

  const departmentBreakdown = departments.map((dept, index) => {
    const stats = departmentStatsMap.get(dept.name) || { employees: 0, payroll: 0 };
    const color = colorPalette[index % colorPalette.length];

    return {
      id: dept._id,
      name: dept.name,
      employees: stats.employees,
      payroll: stats.payroll,
      bgColor: color.bg,
      barColor: color.bar
    };
  });

  // Find largest department
  const largestDept = departmentBreakdown.reduce((max, dept) => 
    dept.employees > (max?.employees || 0) ? dept : max, null
  );

  // Calculate employee growth percentage (comparing last 30 days to previous 30 days)
  const previous30DaysStart = new Date(thirtyDaysAgo);
  previous30DaysStart.setDate(previous30DaysStart.getDate() - 30);
  const previous30DaysEnd = thirtyDaysAgo;

  const previous30DaysHires = await User.countDocuments({
    role: 'employee',
    status: { $in: ['active', 'on-leave'] },
    joinDate: { $gte: previous30DaysStart, $lt: previous30DaysEnd }
  });

  const employeeGrowth = previous30DaysHires > 0
    ? Math.round(((newHiresLast30Days - previous30DaysHires) / previous30DaysHires) * 100)
    : newHiresLast30Days > 0 ? 100 : 0;

  // Calculate compliance metric based on multiple factors
  const complianceFactors = {
    timesheetCompliance: 0,
    payrollCompliance: 0,
    leaveCompliance: 0,
    dataCompleteness: 0,
    approvalCompliance: 0
  };

  // 1. Timesheet Compliance (30% weight)
  // Check if timesheets are submitted on time (within pay period)
  const currentPeriodStart = currentPeriod ? currentPeriod.periodStart : new Date(now.getFullYear(), now.getMonth(), 1);
  const currentPeriodEnd = currentPeriod ? currentPeriod.periodEnd : new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const [totalTimesheetsInPeriod, submittedTimesheetsInPeriod] = await Promise.all([
    Timesheet.countDocuments({
      date: { $gte: currentPeriodStart, $lte: currentPeriodEnd }
    }),
    Timesheet.countDocuments({
      date: { $gte: currentPeriodStart, $lte: currentPeriodEnd },
      status: { $in: ['submitted', 'approved'] }
    })
  ]);

  complianceFactors.timesheetCompliance = totalTimesheetsInPeriod > 0
    ? Math.round((submittedTimesheetsInPeriod / totalTimesheetsInPeriod) * 100)
    : 100;

  // 2. Payroll Compliance (25% weight)
  // Check if payroll periods are processed on time
  const last3Periods = await PayrollPeriod.find()
    .sort({ periodEnd: -1 })
    .limit(3)
    .lean();

  let onTimePayrolls = 0;
  last3Periods.forEach(period => {
    if (period.status === 'completed' && period.processedAt) {
      // Check if processed within 3 days of period end
      const daysToProcess = (period.processedAt - period.periodEnd) / (1000 * 60 * 60 * 24);
      if (daysToProcess <= 3) {
        onTimePayrolls++;
      }
    }
  });

  complianceFactors.payrollCompliance = last3Periods.length > 0
    ? Math.round((onTimePayrolls / last3Periods.length) * 100)
    : 100;

  // 3. Leave Compliance (20% weight)
  // Check if leave requests are processed within SLA (7 days)
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);
  
  const [totalLeaveRequests, processedLeaveRequests, onTimeLeaveRequests] = await Promise.all([
    LeaveRequest.countDocuments({
      createdAt: { $gte: last30Days }
    }),
    LeaveRequest.countDocuments({
      createdAt: { $gte: last30Days },
      status: { $in: ['approved', 'rejected'] }
    }),
    LeaveRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
          status: { $in: ['approved', 'rejected'] },
          reviewedAt: { $exists: true }
        }
      },
      {
        $project: {
          daysToReview: {
            $divide: [
              { $subtract: ['$reviewedAt', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $match: {
          daysToReview: { $lte: 7 }
        }
      },
      {
        $count: 'count'
      }
    ])
  ]);

  const onTimeLeaves = onTimeLeaveRequests.length > 0 ? onTimeLeaveRequests[0].count : 0;
  complianceFactors.leaveCompliance = processedLeaveRequests > 0
    ? Math.round((onTimeLeaves / processedLeaveRequests) * 100)
    : totalLeaveRequests === 0 ? 100 : 0;

  // 4. Data Completeness (15% weight)
  // Check if employees have required fields filled
  const [employeesWithCompleteData, totalActiveEmployees] = await Promise.all([
    User.countDocuments({
      role: 'employee',
      status: { $in: ['active', 'on-leave'] },
      email: { $exists: true, $ne: '' },
      name: { $exists: true, $ne: '' },
      department: { $exists: true, $ne: '' },
      salary: { $exists: true, $gt: 0 }
    }),
    User.countDocuments({
      role: 'employee',
      status: { $in: ['active', 'on-leave'] }
    })
  ]);

  complianceFactors.dataCompleteness = totalActiveEmployees > 0
    ? Math.round((employeesWithCompleteData / totalActiveEmployees) * 100)
    : 100;

  // 5. Approval Compliance (10% weight)
  // Check if pending approvals are within acceptable threshold (< 5% pending)
  const totalApprovalItems = await Promise.all([
    Timesheet.countDocuments({ status: 'pending' }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    PayrollPeriod.countDocuments({ status: 'processing' })
  ]);

  const totalPending = totalApprovalItems.reduce((sum, count) => sum + count, 0);
  const totalItems = await Promise.all([
    Timesheet.countDocuments({}),
    LeaveRequest.countDocuments({}),
    PayrollPeriod.countDocuments({})
  ]);
  const totalAll = totalItems.reduce((sum, count) => sum + count, 0);

  const pendingPercentage = totalAll > 0 ? (totalPending / totalAll) * 100 : 0;
  // Compliance is higher when pending percentage is lower
  complianceFactors.approvalCompliance = Math.max(0, Math.round(100 - (pendingPercentage * 2)));

  // Calculate weighted compliance score
  const complianceScore = Math.round(
    complianceFactors.timesheetCompliance * 0.30 +
    complianceFactors.payrollCompliance * 0.25 +
    complianceFactors.leaveCompliance * 0.20 +
    complianceFactors.dataCompleteness * 0.15 +
    complianceFactors.approvalCompliance * 0.10
  );

  return {
    kpis: {
      totalEmployees,
      employeeGrowth,
      newHiresLast30Days,
      payrollStatus: {
        total: payrollStatus.total,
        status: payrollStatus.status,
        nextPayday: payrollStatus.nextPayday
      },
      pendingApprovals: totalPendingApprovals,
      pendingTimesheets,
      pendingLeaveRequests,
      pendingPayroll,
      totalDepartments,
      averageSalary,
      leaveRequestsThisMonth,
      timesheetCompletionRate,
      compliance: Math.min(100, Math.max(0, complianceScore)) // Ensure between 0-100
    },
    recentPayrollActivity,
    departmentBreakdown: {
      departments: departmentBreakdown,
      largestDepartment: largestDept ? `${largestDept.name} (${largestDept.employees} employees)` : null
    }
  };
};

