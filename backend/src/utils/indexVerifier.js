import mongoose from 'mongoose';

/**
 * Verify and create indexes for a model
 */
export const verifyIndexes = async (Model, indexes) => {
  try {
    const collection = Model.collection;
    const existingIndexes = await collection.indexes();

    console.log(`[Index Verification] Checking indexes for ${Model.modelName}...`);

    for (const indexSpec of indexes) {
      const indexName = typeof indexSpec === 'string' 
        ? indexSpec 
        : Object.keys(indexSpec)[0];

      const indexExists = existingIndexes.some(idx => 
        idx.name === indexName || 
        JSON.stringify(idx.key) === JSON.stringify(indexSpec)
      );

      if (!indexExists) {
        try {
          await collection.createIndex(indexSpec, { background: true });
          console.log(`[Index Verification] ✓ Created index: ${indexName} for ${Model.modelName}`);
        } catch (error) {
          console.error(`[Index Verification] ✗ Failed to create index ${indexName} for ${Model.modelName}:`, error.message);
        }
      } else {
        console.log(`[Index Verification] ✓ Index exists: ${indexName} for ${Model.modelName}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`[Index Verification] Error verifying indexes for ${Model.modelName}:`, error);
    return false;
  }
};

/**
 * Verify all model indexes on startup
 */
export const verifyAllIndexes = async () => {
  try {
    const User = (await import('../models/User.js')).default;
    const Timesheet = (await import('../models/Timesheet.js')).default;
    const PayStub = (await import('../models/PayStub.js')).default;
    const LeaveRequest = (await import('../models/LeaveRequest.js')).default;
    const LeaveBalance = (await import('../models/LeaveBalance.js')).default;
    const PayrollPeriod = (await import('../models/PayrollPeriod.js')).default;
    const Task = (await import('../models/Task.js')).default;
    const Notification = (await import('../models/Notification.js')).default;
    const FileAttachment = (await import('../models/FileAttachment.js')).default;
    const Project = (await import('../models/Project.js')).default;
    const PerformanceUpdate = (await import('../models/PerformanceUpdate.js')).default;

    console.log('[Index Verification] Starting index verification...');

    // User indexes
    await verifyIndexes(User, [
      { email: 1 },
      { employeeId: 1 },
      { role: 1, status: 1 },
      { managerId: 1 },
      { department: 1 },
    ]);

    // Timesheet indexes
    await verifyIndexes(Timesheet, [
      { employeeId: 1, date: -1 },
      { payrollPeriodId: 1 },
      { status: 1 },
      { date: -1 },
    ]);

    // PayStub indexes
    await verifyIndexes(PayStub, [
      { employeeId: 1, payDate: -1 },
      { payrollPeriodId: 1 },
      { status: 1 },
    ]);

    // LeaveRequest indexes
    await verifyIndexes(LeaveRequest, [
      { employeeId: 1, startDate: -1 },
      { status: 1 },
      { leaveType: 1 },
      { startDate: 1, endDate: 1 },
    ]);

    // LeaveBalance indexes
    await verifyIndexes(LeaveBalance, [
      { employeeId: 1, year: 1 },
      { employeeId: 1 },
    ]);

    // PayrollPeriod indexes
    await verifyIndexes(PayrollPeriod, [
      { periodStart: 1, periodEnd: 1 },
      { status: 1 },
      { department: 1 },
    ]);

    // Task indexes
    await verifyIndexes(Task, [
      { employeeId: 1, status: 1 },
      { assignedBy: 1 },
      { dueDate: 1 },
      { status: 1, priority: 1 },
    ]);

    // Notification indexes
    await verifyIndexes(Notification, [
      { userId: 1, read: 1, createdAt: -1 },
      { userId: 1, createdAt: -1 },
      { type: 1 },
      { expiresAt: 1 },
    ]);

    // FileAttachment indexes
    await verifyIndexes(FileAttachment, [
      { entityType: 1, entityId: 1 },
      { uploadedBy: 1 },
      { status: 1 },
      { createdAt: -1 },
    ]);

    // Project indexes
    await verifyIndexes(Project, [
      { status: 1 },
      { ownerId: 1 },
      { createdAt: -1 },
    ]);

    // PerformanceUpdate indexes
    await verifyIndexes(PerformanceUpdate, [
      { managerId: 1, date: -1 },
      { employeeId: 1, date: -1 },
      { date: -1 },
    ]);

    console.log('[Index Verification] ✓ All indexes verified');
  } catch (error) {
    console.error('[Index Verification] Error verifying indexes:', error);
  }
};

/**
 * Get index statistics for a model
 */
export const getIndexStats = async (Model) => {
  try {
    const collection = Model.collection;
    const indexes = await collection.indexes();
    const stats = await collection.stats();

    return {
      model: Model.modelName,
      indexes: indexes.map(idx => ({
        name: idx.name,
        keys: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false,
      })),
      collectionSize: stats.size,
      documentCount: stats.count,
      indexSize: stats.totalIndexSize,
    };
  } catch (error) {
    console.error(`Error getting index stats for ${Model.modelName}:`, error);
    return null;
  }
};

