import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import PayStub from '../models/PayStub.js';
import Timesheet from '../models/Timesheet.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PayrollPeriod from '../models/PayrollPeriod.js';
import PayrollCalculation from '../models/PayrollCalculation.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Task from '../models/Task.js';
import PerformanceUpdate from '../models/PerformanceUpdate.js';
import Setting from '../models/Setting.js';
import Project from '../models/Project.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import UserSession from '../models/UserSession.js';
import FileAttachment from '../models/FileAttachment.js';
import RolePermission from '../models/RolePermission.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...\n');

    // Connect to MongoDB
    await connectDB();

    // Create indexes for Users collection
    console.log('📊 Creating indexes for Users collection...');
    await User.createIndexes();
    console.log('✅ Users indexes created successfully');

    // Create indexes for Departments collection
    console.log('📊 Creating indexes for Departments collection...');
    await Department.createIndexes();
    console.log('✅ Departments indexes created successfully');

    // Create indexes for PayStubs collection
    console.log('📊 Creating indexes for PayStubs collection...');
    await PayStub.createIndexes();
    console.log('✅ PayStubs indexes created successfully');

    // Create indexes for Timesheets collection
    console.log('📊 Creating indexes for Timesheets collection...');
    await Timesheet.createIndexes();
    console.log('✅ Timesheets indexes created successfully');

    // Create indexes for LeaveRequests collection
    console.log('📊 Creating indexes for LeaveRequests collection...');
    await LeaveRequest.createIndexes();
    console.log('✅ LeaveRequests indexes created successfully');

    // Create indexes for PayrollPeriods collection
    console.log('📊 Creating indexes for PayrollPeriods collection...');
    await PayrollPeriod.createIndexes();
    console.log('✅ PayrollPeriods indexes created successfully');

    // Create indexes for PayrollCalculations collection
    console.log('📊 Creating indexes for PayrollCalculations collection...');
    await PayrollCalculation.createIndexes();
    console.log('✅ PayrollCalculations indexes created successfully');

    // Create indexes for LeaveBalances collection
    console.log('📊 Creating indexes for LeaveBalances collection...');
    await LeaveBalance.createIndexes();
    console.log('✅ LeaveBalances indexes created successfully');

    // Create indexes for Tasks collection
    console.log('📊 Creating indexes for Tasks collection...');
    await Task.createIndexes();
    console.log('✅ Tasks indexes created successfully');

    // Create indexes for PerformanceUpdates collection
    console.log('📊 Creating indexes for PerformanceUpdates collection...');
    await PerformanceUpdate.createIndexes();
    console.log('✅ PerformanceUpdates indexes created successfully');

    // Create indexes for Settings collection
    console.log('📊 Creating indexes for Settings collection...');
    await Setting.createIndexes();
    console.log('✅ Settings indexes created successfully');

    // Create indexes for Projects collection
    console.log('📊 Creating indexes for Projects collection...');
    await Project.createIndexes();
    console.log('✅ Projects indexes created successfully');

    // Create indexes for Reports collection
    console.log('📊 Creating indexes for Reports collection...');
    await Report.createIndexes();
    console.log('✅ Reports indexes created successfully');

    // Create indexes for Notifications collection
    console.log('📊 Creating indexes for Notifications collection...');
    await Notification.createIndexes();
    console.log('✅ Notifications indexes created successfully');

    // Create indexes for UserSessions collection
    console.log('📊 Creating indexes for UserSessions collection...');
    await UserSession.createIndexes();
    console.log('✅ UserSessions indexes created successfully');

    // Create indexes for FileAttachments collection
    console.log('📊 Creating indexes for FileAttachments collection...');
    await FileAttachment.createIndexes();
    console.log('✅ FileAttachments indexes created successfully');

    // Create indexes for RolesPermissions collection
    console.log('📊 Creating indexes for RolesPermissions collection...');
    await RolePermission.createIndexes();
    console.log('✅ RolesPermissions indexes created successfully');

    // Create indexes for AuditLogs collection
    console.log('📊 Creating indexes for AuditLogs collection...');
    await AuditLog.createIndexes();
    console.log('✅ AuditLogs indexes created successfully');

    // Verify indexes
    console.log('\n📋 Verifying indexes...\n');
    
    const userIndexes = await User.collection.getIndexes();
    console.log('Users Collection Indexes:');
    console.log(JSON.stringify(userIndexes, null, 2));

    const departmentIndexes = await Department.collection.getIndexes();
    console.log('\nDepartments Collection Indexes:');
    console.log(JSON.stringify(departmentIndexes, null, 2));

    const payStubIndexes = await PayStub.collection.getIndexes();
    console.log('\nPayStubs Collection Indexes:');
    console.log(JSON.stringify(payStubIndexes, null, 2));

    const timesheetIndexes = await Timesheet.collection.getIndexes();
    console.log('\nTimesheets Collection Indexes:');
    console.log(JSON.stringify(timesheetIndexes, null, 2));

    const leaveRequestIndexes = await LeaveRequest.collection.getIndexes();
    console.log('\nLeaveRequests Collection Indexes:');
    console.log(JSON.stringify(leaveRequestIndexes, null, 2));

    const payrollPeriodIndexes = await PayrollPeriod.collection.getIndexes();
    console.log('\nPayrollPeriods Collection Indexes:');
    console.log(JSON.stringify(payrollPeriodIndexes, null, 2));

    const payrollCalculationIndexes = await PayrollCalculation.collection.getIndexes();
    console.log('\nPayrollCalculations Collection Indexes:');
    console.log(JSON.stringify(payrollCalculationIndexes, null, 2));

    const leaveBalanceIndexes = await LeaveBalance.collection.getIndexes();
    console.log('\nLeaveBalances Collection Indexes:');
    console.log(JSON.stringify(leaveBalanceIndexes, null, 2));

    const taskIndexes = await Task.collection.getIndexes();
    console.log('\nTasks Collection Indexes:');
    console.log(JSON.stringify(taskIndexes, null, 2));

    const performanceUpdateIndexes = await PerformanceUpdate.collection.getIndexes();
    console.log('\nPerformanceUpdates Collection Indexes:');
    console.log(JSON.stringify(performanceUpdateIndexes, null, 2));

    const settingIndexes = await Setting.collection.getIndexes();
    console.log('\nSettings Collection Indexes:');
    console.log(JSON.stringify(settingIndexes, null, 2));

    const projectIndexes = await Project.collection.getIndexes();
    console.log('\nProjects Collection Indexes:');
    console.log(JSON.stringify(projectIndexes, null, 2));

    const reportIndexes = await Report.collection.getIndexes();
    console.log('\nReports Collection Indexes:');
    console.log(JSON.stringify(reportIndexes, null, 2));

    const notificationIndexes = await Notification.collection.getIndexes();
    console.log('\nNotifications Collection Indexes:');
    console.log(JSON.stringify(notificationIndexes, null, 2));

    const userSessionIndexes = await UserSession.collection.getIndexes();
    console.log('\nUserSessions Collection Indexes:');
    console.log(JSON.stringify(userSessionIndexes, null, 2));

    const fileAttachmentIndexes = await FileAttachment.collection.getIndexes();
    console.log('\nFileAttachments Collection Indexes:');
    console.log(JSON.stringify(fileAttachmentIndexes, null, 2));

    const rolePermissionIndexes = await RolePermission.collection.getIndexes();
    console.log('\nRolesPermissions Collection Indexes:');
    console.log(JSON.stringify(rolePermissionIndexes, null, 2));

    const auditLogIndexes = await AuditLog.collection.getIndexes();
    console.log('\nAuditLogs Collection Indexes:');
    console.log(JSON.stringify(auditLogIndexes, null, 2));

    console.log('\n✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();

