import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async (data) => {
  try {
    await AuditLog.create({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      userEmail: data.userEmail,
      changes: data.changes,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      metadata: data.metadata,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

export const logUserAction = async (req, action, entityType, entityId, changes = null, description = null) => {
  if (!req.user) return;
  
  await createAuditLog({
    action,
    entityType,
    entityId,
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    userEmail: req.user.email,
    changes,
    description: description || `${action} ${entityType}`,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    metadata: {
      method: req.method,
      path: req.path,
    },
  });
};

