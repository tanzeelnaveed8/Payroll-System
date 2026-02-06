import dotenv from 'dotenv';
import mongoose from 'mongoose';
import RolePermission from '../models/RolePermission.js';

dotenv.config();

const migrateRoles = async () => {
  try {
    console.log('🔄 Starting roles migration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Define permissions for each role
    const managerPermissions = [
      {
        resource: 'dashboard',
        actions: ['view']
      },
      {
        resource: 'team',
        actions: ['view', 'get_details']
      },
      {
        resource: 'timesheets',
        actions: ['view_pending', 'approve', 'reject']
      },
      {
        resource: 'leave_requests',
        actions: ['view_pending', 'approve', 'reject']
      },
      {
        resource: 'performance_updates',
        actions: ['view', 'create', 'update']
      },
      {
        resource: 'settings',
        actions: ['view', 'update']
      },
      {
        resource: 'sessions',
        actions: ['view']
      }
    ];

    const deptLeadPermissions = [
      {
        resource: 'dashboard',
        actions: ['view']
      },
      {
        resource: 'team',
        actions: ['view']
      },
      {
        resource: 'timesheets',
        actions: ['view_own_department']
      },
      {
        resource: 'leave_requests',
        actions: ['view_own_department']
      },
      {
        resource: 'reports',
        actions: ['view']
      }
    ];

    const employeePermissions = [
      {
        resource: 'dashboard',
        actions: ['view']
      },
      {
        resource: 'timesheets',
        actions: ['view_own', 'submit']
      },
      {
        resource: 'leave_requests',
        actions: ['view_own', 'create', 'cancel']
      },
      {
        resource: 'paystubs',
        actions: ['view_own']
      },
      {
        resource: 'leave_balance',
        actions: ['view_own']
      }
    ];

    // Define role data
    const roles = [
      {
        roleId: 'manager',
        roleName: 'Manager',
        description: 'Can manage team members, approve timesheets and leave requests, create performance updates',
        permissions: managerPermissions,
        features: [
          'team_management',
          'approval_workflow',
          'performance_tracking',
          'settings_management'
        ],
        restrictions: {
          canViewAllDepartments: false,
          canManageSettings: false,
          canExportData: false,
          canDeleteRecords: false,
          canApprovePayroll: false,
          canViewFinancials: false
        }
      },
      {
        roleId: 'dept_lead',
        roleName: 'Department Lead',
        description: 'Can view team members in own department, view department timesheets and leave requests',
        permissions: deptLeadPermissions,
        features: [
          'team_overview',
          'department_reports',
          'department_timesheets',
          'department_leave'
        ],
        restrictions: {
          canViewAllDepartments: false,
          canManageSettings: false,
          canExportData: false,
          canDeleteRecords: false,
          canApprovePayroll: false,
          canViewFinancials: false
        }
      },
      {
        roleId: 'employee',
        roleName: 'Employee',
        description: 'Can view own dashboard, submit timesheets, create and cancel own leave requests',
        permissions: employeePermissions,
        features: [
          'personal_dashboard',
          'timesheet_management',
          'leave_management',
          'paystub_access'
        ],
        restrictions: {
          canViewAllDepartments: false,
          canManageSettings: false,
          canExportData: false,
          canDeleteRecords: false,
          canApprovePayroll: false,
          canViewFinancials: false
        }
      }
    ];

    // Check existing roles and update if needed
    const existingRoles = await RolePermission.find({});
    const existingRoleIds = existingRoles.map(r => r.roleId);

    for (const roleData of roles) {
      const existingRole = existingRoles.find(r => r.roleId === roleData.roleId);

      if (existingRole) {
        // Update existing role if permissions or features have changed
        const permissionsChanged = JSON.stringify(existingRole.permissions) !== JSON.stringify(roleData.permissions);
        const featuresChanged = JSON.stringify(existingRole.features) !== JSON.stringify(roleData.features);

        if (permissionsChanged || featuresChanged) {
          await RolePermission.updateOne(
            { roleId: roleData.roleId },
            {
              roleName: roleData.roleName,
              description: roleData.description,
              permissions: roleData.permissions,
              features: roleData.features,
              restrictions: roleData.restrictions,
              isActive: true,
              updatedAt: new Date()
            }
          );
          console.log(`🔄 Updated role: ${roleData.roleId}`);
        }
      } else {
        // Create new role
        await RolePermission.create(roleData);
        console.log(`✅ Created role: ${roleData.roleId}`);
      }
    }

    console.log('\n✅ Roles migration completed successfully!');
    console.log('📋 Roles are now available in the RolePermission collection');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error in roles migration:', error.message);
    process.exit(1);
  }
};

migrateRoles();