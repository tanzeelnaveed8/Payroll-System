import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  country: { type: String },
  city: { type: String }
}, { _id: false });

const changesSchema = new mongoose.Schema({
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  fields: [{ type: String }]
}, { _id: false });

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'approve', 'reject', 'login', 'logout', 'export']
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: { type: String },
  userRole: { type: String },
  userEmail: { type: String },
  changes: { type: changesSchema },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  location: { type: locationSchema },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'auditlogs'
});

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

