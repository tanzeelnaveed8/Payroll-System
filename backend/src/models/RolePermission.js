import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  resource: { type: String, required: true },
  actions: [{ type: String, required: true }]
}, { _id: false });

const restrictionsSchema = new mongoose.Schema({
  canViewAllDepartments: { type: Boolean, default: false },
  canManageSettings: { type: Boolean, default: false },
  canExportData: { type: Boolean, default: false },
  canDeleteRecords: { type: Boolean, default: false },
  canApprovePayroll: { type: Boolean, default: false },
  canViewFinancials: { type: Boolean, default: false }
}, { _id: false });

const rolePermissionSchema = new mongoose.Schema({
  roleId: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'manager', 'employee']
  },
  roleName: { type: String, required: true },
  description: { type: String },
  permissions: [permissionSchema],
  features: [{ type: String }],
  restrictions: { type: restrictionsSchema },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: false,
  collection: 'rolespermissions'
});

rolePermissionSchema.index({ roleId: 1 }, { unique: true });
rolePermissionSchema.index({ isActive: 1 });

rolePermissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);

export default RolePermission;

