import mongoose from 'mongoose';

const fileAttachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalFileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  filePath: { type: String },
  storageProvider: {
    type: String,
    enum: ['local', 's3', 'azure', 'gcs'],
    default: 'local'
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'paystub',
      'employee_document',
      'leave_attachment',
      'timesheet_attachment',
      'profile_photo',
      'company_logo',
      'report',
      'task_attachment'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByName: { type: String },
  isPublic: { type: Boolean, default: false },
  accessRoles: [{ type: String }],
  accessUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  description: { type: String },
  tags: [{ type: String }],
  category: { type: String },
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
}, {
  timestamps: false,
  collection: 'fileattachments'
});

fileAttachmentSchema.index({ entityType: 1, entityId: 1 });
fileAttachmentSchema.index({ uploadedBy: 1 });
fileAttachmentSchema.index({ status: 1 });
fileAttachmentSchema.index({ createdAt: -1 });
fileAttachmentSchema.index({ fileType: 1 });

const FileAttachment = mongoose.model('FileAttachment', fileAttachmentSchema);

export default FileAttachment;

