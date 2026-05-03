# Bestpl.ai — Product Requirements Document

## Original Problem Statement
Implement a comprehensive API key management system, Super Admin capabilities (RBAC), and expand the application with a new "Talent Scout" AI tool. Configure free daily AI generations to use SuperAdmin's saved OpenAI API key. Fix file downloading bug and light mode UI issues.

## Core Architecture
- **Frontend**: React 18 + Shadcn UI + TailwindCSS
- **Backend**: FastAPI (async) + Motor (MongoDB driver)
- **Database**: MongoDB
- **Auth**: Google OAuth (Emergent-managed) + Email/Password with session cookies
- **AI**: OpenAI GPT-4o via emergentintegrations (uses SuperAdmin's stored API key for free tier)

## Key DB Collections
- `users`: user_id, email, name, role, status, linkedin_url, title, company, phone_number, city, country, openai_api_key, has_own_api_key
- `api_usage`: user_id, used_master_key, tool_type, timestamp
- `ai_history`: history_id, user_id, tool_type, prompt, response, created_at
- `system_prompts`: tool_type, tool_name, description, system_prompt, is_active, version, updated_at, updated_by

## What's Been Implemented

### DONE — RBAC & User Management
- Robust user DB schema with LinkedIn URL, role, status, profile fields
- Admin/SuperAdmin roles with FastAPI dependency injection
- Admin Panel UI for user management

### DONE — AI Tools
- JD Builder, Search Strategy, Target Company List, Candidate Research, Candidate Dossier, Client Research, Talent Scout
- SuperAdmin API key fallback for free daily limits (3/day)
- File upload/extraction (PDF, DOCX, TXT, audio)

### DONE — System Prompt Management (May 2026)
- Prompts moved from hardcoded dict to MongoDB (`system_prompts` collection)
- Auto-seeded on startup (preserves edits)
- SuperAdmin CRUD: view, edit, reset to default with version tracking
- Frontend page at `/admin/prompts` with expand/edit/reset UI
- `ai_tools.py` uses `get_prompt()` from MongoDB at runtime

### DONE — API Key Removal Bug Fix (May 2026)
- Replaced `window.confirm()` with proper React Dialog component
- Full flow works: remove → confirm → key deleted → UI updates

### DONE — Other
- Architecture Documentation page (SuperAdmin only)
- Google OAuth + Email auth with session cookies
- Gamification (points, badges, leaderboard)

## Open Issues (Priority Order)
1. **P0**: File download fails after AI generation (exports not saving locally)
2. **P1**: Light mode readability issues across all pages
3. **P1**: Rich text editor for challenges (previously rolled back)
4. **P2**: N+1 query performance in challenges.py / dashboard.py

## Upcoming Tasks
- Build analytics dashboard for usage/engagement metrics
- Email notifications (currently mocked as "Coming Soon")
- Refactor AITools.js monolithic file into smaller components

## Key API Endpoints
- `POST /api/ai/generate` — AI completion (uses SuperAdmin or user key)
- `POST /api/ai/download` — File export (CSV, PDF, DOCX, TXT)
- `GET /api/prompts` — List all system prompts (SuperAdmin)
- `PUT /api/prompts/{tool_type}` — Update prompt (SuperAdmin)
- `POST /api/prompts/{tool_type}/reset` — Reset prompt to default (SuperAdmin)
- `GET /api/users` — RBAC-protected user list

## Critical Notes
- Backend does NOT use EMERGENT_LLM_KEY — fetches SuperAdmin's stored OpenAI key
- If AI fails with 401, SuperAdmin needs to update their OpenAI key via API Settings
- Auth uses session cookies (not JWT tokens in body)
