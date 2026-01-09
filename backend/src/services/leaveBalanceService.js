import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { ResourceNotFoundError, InvalidInputError } from '../utils/errorHandler.js';

/**
 * Calculate total days between two dates excluding weekends
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} workingDays - Array of working days (e.g., ['monday', 'tuesday', ...])
 * @returns {Number} - Total working days
 */
export const calculateTotalDays = (startDate, endDate, workingDays = null) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  let days = 0;
  const current = new Date(start);
  
  // Default working days (Monday to Friday)
  const defaultWorkingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const validWorkingDays = workingDays || defaultWorkingDays;
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  while (current <= end) {
    const dayName = dayNames[current.getDay()];
    if (validWorkingDays.includes(dayName)) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

/**
 * Get or create leave balance for an employee for a specific year
 */
export const getOrCreateLeaveBalance = async (employeeId, year = null) => {
  if (!year) {
    year = new Date().getFullYear();
  }
  
  let balance = await LeaveBalance.findOne({ employeeId, year });
  
  if (!balance) {
    // Get leave policies from settings
    const settings = await Setting.findOne({ type: 'leave' });
    const policies = settings?.leavePolicies || [];
    
    // Initialize balance with default values
    balance = new LeaveBalance({
      employeeId,
      year,
      annual: {
        total: 0,
        used: 0,
        remaining: 0,
        accrued: 0,
        carryForward: 0
      },
      sick: {
        total: 0,
        used: 0,
        remaining: 0,
        accrued: 0,
        carryForward: 0
      },
      casual: {
        total: 0,
        used: 0,
        remaining: 0
      },
      paid: {
        total: 0,
        used: 0,
        remaining: 0
      },
      unpaid: {
        total: 0,
        used: 0,
        remaining: 0
      },
      maternity: {
        total: 0,
        used: 0,
        remaining: 0
      },
      paternity: {
        total: 0,
        used: 0,
        remaining: 0
      },
      accrualRate: {
        annual: 0,
        sick: 0
      }
    });
    
    // Apply policies
    for (const policy of policies) {
      if (policy.enabled) {
        const leaveType = policy.type;
        if (leaveType === 'annual' && balance.annual) {
          balance.annual.total = policy.maxDays || 0;
          balance.annual.remaining = policy.maxDays || 0;
          balance.accrualRate.annual = policy.accrualRate || 0;
        } else if (leaveType === 'sick' && balance.sick) {
          balance.sick.total = policy.maxDays || 0;
          balance.sick.remaining = policy.maxDays || 0;
          balance.accrualRate.sick = policy.accrualRate || 0;
        } else if (leaveType === 'casual' && balance.casual) {
          balance.casual.total = policy.maxDays || 0;
          balance.casual.remaining = policy.maxDays || 0;
        } else if (leaveType === 'paid' && balance.paid) {
          balance.paid.total = policy.maxDays || 0;
          balance.paid.remaining = policy.maxDays || 0;
        } else if (leaveType === 'unpaid' && balance.unpaid) {
          balance.unpaid.total = policy.maxDays || 0;
          balance.unpaid.remaining = policy.maxDays || 0;
        }
      }
    }
    
    await balance.save();
  }
  
  return balance;
};

/**
 * Calculate remaining leave balance
 */
export const calculateLeaveBalance = async (employeeId, leaveType, year = null) => {
  if (!year) {
    year = new Date().getFullYear();
  }
  
  const balance = await getOrCreateLeaveBalance(employeeId, year);
  
  // Recalculate remaining based on used
  if (balance[leaveType]) {
    balance[leaveType].remaining = (balance[leaveType].total || 0) - (balance[leaveType].used || 0);
    if (balance[leaveType].remaining < 0) {
      balance[leaveType].remaining = 0;
    }
    await balance.save();
  }
  
  return balance[leaveType]?.remaining || 0;
};

/**
 * Check if leave can be taken (has sufficient balance)
 */
export const checkLeaveAvailability = async (employeeId, leaveType, days, year = null) => {
  if (!year) {
    year = new Date().getFullYear();
  }
  
  const balance = await getOrCreateLeaveBalance(employeeId, year);
  
  // Unpaid leave doesn't require balance check
  if (leaveType === 'unpaid') {
    return { available: true, remaining: 0 };
  }
  
  const leaveBalance = balance[leaveType];
  if (!leaveBalance) {
    throw new InvalidInputError(`Leave type ${leaveType} is not configured`);
  }
  
  const remaining = (leaveBalance.total || 0) - (leaveBalance.used || 0);
  const available = remaining >= days;
  
  return {
    available,
    remaining: Math.max(0, remaining),
    total: leaveBalance.total || 0,
    used: leaveBalance.used || 0
  };
};

/**
 * Update leave balance after approval
 */
export const updateLeaveBalance = async (employeeId, leaveType, days, year = null) => {
  if (!year) {
    year = new Date().getFullYear();
  }
  
  const balance = await getOrCreateLeaveBalance(employeeId, year);
  
  // Unpaid leave doesn't affect balance
  if (leaveType === 'unpaid') {
    return balance;
  }
  
  if (!balance[leaveType]) {
    throw new InvalidInputError(`Leave type ${leaveType} is not configured`);
  }
  
  // Update used days
  balance[leaveType].used = (balance[leaveType].used || 0) + days;
  balance[leaveType].remaining = (balance[leaveType].total || 0) - balance[leaveType].used;
  
  if (balance[leaveType].remaining < 0) {
    balance[leaveType].remaining = 0;
  }
  
  await balance.save();
  
  return balance;
};

/**
 * Revert leave balance (when request is rejected or cancelled)
 */
export const revertLeaveBalance = async (employeeId, leaveType, days, year = null) => {
  if (!year) {
    year = new Date().getFullYear();
  }
  
  const balance = await getOrCreateLeaveBalance(employeeId, year);
  
  // Unpaid leave doesn't affect balance
  if (leaveType === 'unpaid') {
    return balance;
  }
  
  if (!balance[leaveType]) {
    return balance;
  }
  
  // Revert used days
  balance[leaveType].used = Math.max(0, (balance[leaveType].used || 0) - days);
  balance[leaveType].remaining = (balance[leaveType].total || 0) - balance[leaveType].used;
  
  await balance.save();
  
  return balance;
};

/**
 * Monthly accrual calculation
 */
export const accrueLeave = async (employeeId, leaveType, accrualAmount, year = null) => {
  if (!year) {
    year = new Date().getFullYear();
  }
  
  const balance = await getOrCreateLeaveBalance(employeeId, year);
  
  if (!balance[leaveType]) {
    return balance;
  }
  
  // Add to accrued and total
  balance[leaveType].accrued = (balance[leaveType].accrued || 0) + accrualAmount;
  balance[leaveType].total = (balance[leaveType].total || 0) + accrualAmount;
  balance[leaveType].remaining = balance[leaveType].total - (balance[leaveType].used || 0);
  
  await balance.save();
  
  return balance;
};

/**
 * Year-end carry forward
 */
export const carryForwardLeave = async (employeeId, fromYear, toYear) => {
  const fromBalance = await LeaveBalance.findOne({ employeeId, year: fromYear });
  if (!fromBalance) {
    return null;
  }
  
  const toBalance = await getOrCreateLeaveBalance(employeeId, toYear);
  
  // Get carry forward settings
  const settings = await Setting.findOne({ type: 'leave' });
  const policies = settings?.leavePolicies || [];
  
  // Carry forward annual leave
  if (fromBalance.annual && fromBalance.annual.remaining > 0) {
    const annualPolicy = policies.find(p => p.type === 'annual');
    const carryForwardLimit = annualPolicy?.carryForwardLimit || 0;
    const carryForwardEnabled = annualPolicy?.carryForwardEnabled || false;
    
    if (carryForwardEnabled && carryForwardLimit > 0) {
      const carryForwardAmount = Math.min(fromBalance.annual.remaining, carryForwardLimit);
      toBalance.annual.carryForward = carryForwardAmount;
      toBalance.annual.total = (toBalance.annual.total || 0) + carryForwardAmount;
      toBalance.annual.remaining = toBalance.annual.total - (toBalance.annual.used || 0);
    }
  }
  
  // Carry forward sick leave (if policy allows)
  if (fromBalance.sick && fromBalance.sick.remaining > 0) {
    const sickPolicy = policies.find(p => p.type === 'sick');
    const carryForwardEnabled = sickPolicy?.carryForwardEnabled || false;
    
    if (carryForwardEnabled) {
      const carryForwardAmount = fromBalance.sick.remaining;
      toBalance.sick.carryForward = carryForwardAmount;
      toBalance.sick.total = (toBalance.sick.total || 0) + carryForwardAmount;
      toBalance.sick.remaining = toBalance.sick.total - (toBalance.sick.used || 0);
    }
  }
  
  await toBalance.save();
  
  return toBalance;
};

/**
 * Check for overlapping leave requests
 */
export const checkOverlappingRequests = async (employeeId, startDate, endDate, excludeRequestId = null) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  const query = {
    employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      // Request starts within existing request
      { startDate: { $gte: start, $lte: end } },
      // Request ends within existing request
      { endDate: { $gte: start, $lte: end } },
      // Request completely contains existing request
      { startDate: { $lte: start }, endDate: { $gte: end } },
      // Existing request completely contains new request
      { startDate: { $gte: start }, endDate: { $lte: end } }
    ]
  };
  
  if (excludeRequestId) {
    query._id = { $ne: excludeRequestId };
  }
  
  const overlapping = await LeaveRequest.find(query);
  
  return overlapping;
};

