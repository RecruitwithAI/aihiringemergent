# 🗄️ User Database Schema & Super Admin Analysis

## Current User Schema

### **users** Collection

```javascript
{
  // Core Identity
  "user_id": "user_303792ae6930",           // String, unique identifier (generated)
  "email": "user@example.com",              // String, unique, indexed
  "name": "User Name",                      // String
  "password_hash": "bcrypt_hash...",        // String (only for email/password auth, null for Google OAuth)
  "picture": "https://...",                 // String | null (from Google OAuth)
  
  // API Key Management
  "openai_api_key": "sk-...",              // String | undefined (user's personal OpenAI key)
  "has_own_api_key": true,                  // Boolean (flag for quick checking)
  "api_key_updated_at": "2026-02-21T...",  // DateTime | undefined
  
  // Gamification
  "points": 42,                             // Number (default: 0)
  
  // Access Control
  "role": "superadmin",                     // String | undefined ("superadmin" only, no regular role system)
  
  // Timestamps
  "created_at": "2026-02-21T08:28:30.963Z" // ISO DateTime string
}
```

### Related Collections

#### **user_sessions** (for authentication)
```javascript
{
  "session_token": "sess_abc123...",
  "user_id": "user_303792ae6930",
  "expires_at": "2026-02-28T...",
  "created_at": "2026-02-21T..."
}
```

#### **api_usage** (for tracking master key usage limits)
```javascript
{
  "user_id": "user_303792ae6930",
  "date": "2026-02-21",                    // Date string (YYYY-MM-DD)
  "master_key_count": 2,                   // Number of master key uses today
  "own_key_count": 5,                      // Number of own key uses today
  "total_count": 7
}
```

#### **ai_history** (AI tool usage history)
```javascript
{
  "history_id": "hist_abc123...",
  "user_id": "user_303792ae6930",
  "tool_type": "jd-builder",
  "prompt": "Create a job description...",
  "response": "...",
  "created_at": "2026-02-21T..."
}
```

---

## Current Database Statistics

- **Total Users**: 15
- **Users with role field**: 1 (only SuperAdmin has this field)
- **Users with own API key**: 1
- **SuperAdmin**: noorussaba.alam@gmail.com

---

## Current Access Control System

### ✅ What EXISTS:
1. **SuperAdmin user exists** (noorussaba.alam@gmail.com with role: "superadmin")
2. **Role field** in schema (but only 1 user has it)
3. **API Key Management System** (users can add/remove their own OpenAI keys)
4. **Master Key Daily Limit** (3 free uses per day per user)
5. **Authentication** (Google OAuth + Email/Password)

### ❌ What's MISSING:
1. **No role-based access control (RBAC)** implementation
   - Role field exists but is NOT checked anywhere in the code
   - No middleware to protect admin routes
   - No distinction between regular users and admins

2. **No admin-specific endpoints**
   - No user management endpoints (list users, update users, delete users)
   - No ability to view/manage all users' API usage
   - No system-wide analytics dashboard

3. **No admin UI/features**
   - No admin panel in frontend
   - No user management interface
   - No system monitoring

4. **Missing user fields**
   - `status` (active, suspended, banned)
   - `created_by` (for audit trail)
   - `updated_at` (for tracking changes)
   - `last_login_at` (for activity monitoring)
   - `metadata` (for extensibility)

5. **No audit logging**
   - No tracking of who did what
   - No admin action logs

6. **Missing indexes** (performance concern)
   - No index on `role` field
   - No index on `email` (should be unique index)
   - No compound indexes for common queries

---

## Identified Issues & Concerns

### 🔴 Critical
1. **Role system not enforced**: Having a "superadmin" role field but not checking it anywhere means it's completely non-functional
2. **No user management**: Cannot manage users at all from admin perspective
3. **Inconsistent role assignment**: Only 1 user has role field; new users don't get any role

### 🟡 Important
1. **No status field**: Cannot suspend or ban users
2. **Missing audit trail**: No way to track admin actions
3. **No admin analytics**: Cannot see system-wide usage or metrics
4. **Performance**: Missing database indexes for role-based queries

### 🟢 Enhancement Opportunities
1. Add role hierarchy (superadmin > admin > user)
2. Add permissions system (granular access control)
3. Add user groups/organizations
4. Add bulk operations for user management
5. Add activity monitoring and alerts

---

## Architecture Review

### Current Auth Flow
```
User Login → Session Token → get_current_user() → Returns user object
                                                   (no role checking)
```

### What Should Happen for Admin Routes
```
User Login → Session Token → get_current_user() → require_role("superadmin")
                                                   → Admin Action
```

---

## Recommendations for Robustness

### Phase 1: Foundation (Critical)
1. ✅ Create admin middleware/decorators for role checking
2. ✅ Add user status field (active, suspended, banned)
3. ✅ Create admin endpoints (CRUD operations for users)
4. ✅ Add proper indexes to users collection
5. ✅ Ensure all new users get a default role ("user")

### Phase 2: User Management (Important)
1. ✅ Build admin panel UI
2. ✅ Add user list, search, filter capabilities
3. ✅ Add user detail view with edit capabilities
4. ✅ Add API usage monitoring per user
5. ✅ Add ability to reset user API keys

### Phase 3: Advanced Features (Enhancement)
1. Add audit logging system
2. Add role management (create/edit roles)
3. Add permissions system
4. Add bulk user operations
5. Add advanced analytics dashboard

---

## Security Considerations

1. **Current vulnerabilities**:
   - Anyone can call any endpoint (no role-based protection)
   - No rate limiting on sensitive operations
   - No audit trail for admin actions

2. **Recommendations**:
   - Implement role-based middleware on all admin routes
   - Add rate limiting for sensitive operations
   - Log all admin actions to separate audit collection
   - Add IP-based restrictions for admin panel access (optional)
   - Implement two-factor authentication for superadmin (future)

---

## Next Steps

Would you like me to:
1. Implement the Phase 1 foundation (role middleware + admin endpoints)?
2. Add missing user fields and indexes?
3. Build the admin panel UI?
4. All of the above in a prioritized manner?
