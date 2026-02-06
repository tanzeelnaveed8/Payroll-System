import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  country: { type: String },
  city: { type: String },
  coordinates: [{ type: Number }]
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'payroll_processed',
      'leave_approved',
      'leave_rejected',
      'leave_submitted',
      'timesheet_approved',
      'timesheet_rejected',
      'pay_stub_available',
      'task_assigned',
      'task_completed',
      'task_overdue',
      'performance_update',
      'system_alert',
      'approval_required',
      'deadline_reminder'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedEntityType: { type: String },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: { type: String },
  actionLabel: { type: String },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  pushSent: { type: Boolean, default: false },
  pushSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, {
  timestamps: false,
  collection: 'notifications'
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ read: 1, priority: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

