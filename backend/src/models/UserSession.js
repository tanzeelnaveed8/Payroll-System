import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  country: { type: String },
  city: { type: String },
  coordinates: [{ type: Number }]
}, { _id: false });

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  },
  browser: { type: String },
  os: { type: String },
  location: { type: locationSchema },
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  loginAttempts: { type: Number, default: 0 },
  suspiciousActivity: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  loggedOutAt: { type: Date }
}, {
  timestamps: false,
  collection: 'usersessions'
});

userSessionSchema.index({ sessionToken: 1 }, { unique: true });
userSessionSchema.index({ refreshToken: 1 }, { unique: true });
userSessionSchema.index({ userId: 1, isActive: 1 });
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
userSessionSchema.index({ lastActivity: 1 });
userSessionSchema.index({ ipAddress: 1 });

const UserSession = mongoose.model('UserSession', userSessionSchema);

export default UserSession;

