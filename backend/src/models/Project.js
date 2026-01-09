import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  baseUrl: { type: String },
  authType: {
    type: String,
    enum: ['api-key', 'token', 'oauth']
  },
  apiKey: { type: String },
  token: { type: String },
  tokenExpiresAt: { type: Date },
  lastSyncAt: { type: Date }
}, { _id: false });

const kpiSchema = new mongoose.Schema({
  users: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  activity: { type: Number, default: 0 },
  growth: { type: Number, default: 0 }
}, { _id: false });

const healthSchema = new mongoose.Schema({
  uptime: { type: Number },
  engagement: { type: Number },
  risk: {
    type: String,
    enum: ['low', 'medium', 'high']
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  owner: { type: String },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'connected', 'pending', 'archived']
  },
  connection: { type: connectionSchema },
  kpi: { type: kpiSchema },
  trend: {
    type: String,
    enum: ['up', 'down', 'neutral']
  },
  trendPercentage: { type: Number },
  health: { type: healthSchema },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: false,
  collection: 'projects'
});

projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ ownerId: 1 });

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Project = mongoose.model('Project', projectSchema);

export default Project;

