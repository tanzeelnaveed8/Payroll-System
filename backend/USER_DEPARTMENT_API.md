# User and Department Management API

## ✅ Implementation Complete

### User Management API

**Base Route:** `/api/users`

#### Endpoints

1. **GET /api/users**
   - List users with filters, pagination, and sorting
   - **Access:** Admin only
   - **Query Parameters:**
     - `page` (default: 1)
     - `limit` (default: 10, max: 100)
     - `sort` (name, email, role, department, status, createdAt, joinDate)
     - `order` (asc, desc)
     - `search` (searches name, email, employeeId)
     - `role` (admin, manager, employee)
     - `status` (active, inactive, on-leave, terminated)
     - `employmentType` (full-time, part-time, contract, intern)
     - `departmentId` (ObjectId)
     - `department` (string)
   - **Response:** Paginated list of users

2. **GET /api/users/:id**
   - Get user by ID
   - **Access:** Admin only
   - **Response:** User details with populated department and manager

3. **POST /api/users**
   - Create new user
   - **Access:** Admin only
   - **Body:** User data (email, password, name, role, etc.)
   - **Response:** Created user

4. **PUT /api/users/:id**
   - Update user
   - **Access:** Self (profile fields only) or Admin (all fields)
   - **Body:** Fields to update
   - **Response:** Updated user

5. **DELETE /api/users/:id**
   - Soft delete user (sets status to terminated)
   - **Access:** Admin only
   - **Response:** Success message

6. **GET /api/users/profile**
   - Get current user profile
   - **Access:** Authenticated users
   - **Response:** Current user details

7. **PUT /api/users/profile**
   - Update own profile
   - **Access:** Authenticated users
   - **Body:** Profile fields (name, phone, photo, bio, address, preferences, etc.)
   - **Response:** Updated profile

8. **GET /api/users/roles**
   - Get unique roles
   - **Access:** Admin only
   - **Response:** Array of unique roles

9. **GET /api/users/departments**
   - Get unique departments
   - **Access:** Admin only
   - **Response:** Array of unique department names

### Department Management API

**Base Route:** `/api/departments`

#### Endpoints

1. **GET /api/departments**
   - List departments
   - **Access:** Authenticated users
   - **Query Parameters:**
     - `page` (default: 1)
     - `limit` (default: 10, max: 100)
     - `sort` (name, createdAt)
     - `order` (asc, desc)
     - `search` (searches name, code, description)
     - `status` (active, inactive)
   - **Response:** Paginated list of departments

2. **GET /api/departments/:id**
   - Get department by ID
   - **Access:** Authenticated users
   - **Response:** Department details with populated manager and parent

3. **POST /api/departments**
   - Create department
   - **Access:** Admin only
   - **Body:** Department data (name, code, description, managerId, etc.)
   - **Response:** Created department

4. **PUT /api/departments/:id**
   - Update department
   - **Access:** Admin only
   - **Body:** Fields to update
   - **Response:** Updated department

5. **DELETE /api/departments/:id**
   - Delete department
   - **Access:** Admin only
   - **Validation:** Cannot delete if has employees or child departments
   - **Response:** Success message

6. **GET /api/departments/:id/employees**
   - Get department employees
   - **Access:** Authenticated users
   - **Query Parameters:**
     - `page` (default: 1)
     - `limit` (default: 10)
     - `status` (active, inactive, on-leave, terminated)
   - **Response:** Paginated list of employees

## Features

### ✅ Implemented

- **Pagination:** All list endpoints support page and limit
- **Sorting:** Configurable sort field and direction
- **Search:** Full-text search across relevant fields
- **Filtering:** Multiple filter options (role, status, department, etc.)
- **Validation:** Comprehensive input validation
- **Authorization:** Role-based access control
- **Self-Access:** Users can update their own profiles
- **Audit Logging:** All admin actions are logged
- **Department Sync:** Employee counts auto-updated
- **Populate References:** Department and manager data included
- **Error Handling:** Professional error messages

### Files Created

1. **Validators:**
   - `src/validators/userValidator.js` - User validation rules
   - `src/validators/departmentValidator.js` - Department validation rules

2. **Controllers:**
   - `src/controllers/userController.js` - User CRUD operations
   - `src/controllers/departmentController.js` - Department CRUD operations

3. **Routes:**
   - `src/routes/userRoutes.js` - User routes with middleware
   - `src/routes/departmentRoutes.js` - Department routes with middleware

4. **Utilities:**
   - `src/utils/auditLogger.js` - Audit logging helper

### Database Collections Used

- **Users** - User data
- **Departments** - Department data
- **AuditLogs** - Audit trail

## Testing

### Example Requests

**Create User (Admin):**
```bash
POST /api/users
Authorization: Bearer <admin_token>
{
  "email": "newuser@example.com",
  "password": "Password123",
  "name": "New User",
  "role": "employee",
  "departmentId": "...",
  "position": "Developer"
}
```

**List Users with Filters:**
```bash
GET /api/users?page=1&limit=10&role=employee&status=active&search=john
Authorization: Bearer <admin_token>
```

**Update Own Profile:**
```bash
PUT /api/users/profile
Authorization: Bearer <user_token>
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "bio": "Updated bio"
}
```

**Create Department (Admin):**
```bash
POST /api/departments
Authorization: Bearer <admin_token>
{
  "name": "Engineering",
  "code": "ENG",
  "description": "Engineering Department",
  "managerId": "..."
}
```

**Get Department Employees:**
```bash
GET /api/departments/:id/employees?page=1&limit=10
Authorization: Bearer <token>
```

## Security

- ✅ All routes require authentication
- ✅ Admin-only routes protected
- ✅ Self-access validation for profile updates
- ✅ Input validation on all endpoints
- ✅ Audit logging for admin actions
- ✅ Password never returned in responses
- ✅ Professional error messages (no sensitive data leaked)

## Next Steps

The User and Department management APIs are complete and production-ready. All endpoints are tested and working with proper validation, authorization, and error handling.

