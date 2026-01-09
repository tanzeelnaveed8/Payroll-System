import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'cancelled']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent']
  },
  dueDate: { type: Date, required: true },
  assignedDate: { type: Date, required: true, default: Date.now },
  completedDate: { type: Date },
  startDate: { type: Date },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedByName: { type: String },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  tags: [{ type: String }],
  category: { type: String },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileAttachment'
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'tasks'
});

taskSchema.index({ employeeId: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ employeeId: 1, createdAt: -1 });

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;

