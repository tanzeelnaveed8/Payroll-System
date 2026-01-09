import mongoose from 'mongoose';

const performanceUpdateSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: Date, required: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  summary: { type: String, required: true },
  achievements: { type: String },
  issues: { type: String },
  blockers: { type: String },
  nextDayFocus: { type: String },
  employeeName: { type: String },
  employeeDepartment: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'performanceupdates'
});

performanceUpdateSchema.index({ managerId: 1, date: -1 });
performanceUpdateSchema.index({ employeeId: 1, date: -1 });
performanceUpdateSchema.index({ date: -1 });
performanceUpdateSchema.index({ rating: 1 });
performanceUpdateSchema.index({ managerId: 1, employeeId: 1, date: -1 });

performanceUpdateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PerformanceUpdate = mongoose.model('PerformanceUpdate', performanceUpdateSchema);

export default PerformanceUpdate;

