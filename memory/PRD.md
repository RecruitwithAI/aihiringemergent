# Bestpl.ai — Product Requirements Document

## Original Problem Statement
Implement a comprehensive API key management system, Super Admin capabilities (RBAC), and expand the application with a new "Talent Scout" AI tool. Configure free daily AI generations to use SuperAdmin's saved OpenAI API key. Fix file downloading bug and light mode UI issues.

## Core Architecture
- **Frontend**: React 18 + Shadcn UI + TailwindCSS
- **Backend**: FastAPI (async) + Motor (MongoDB driver)
- **Database**: MongoDB
- **Auth**: Google OAuth (Emergent-managed) + Email/Password with session cookies
- **AI**: OpenAI GPT-4o via emergentintegrations (uses SuperAdmin's stored API key for free tier)

## Frontend Component Structure
```
src/
├── pages/
│   └── AITools.js              (20 lines — routing only)
├── hooks/
│   └── useAITools.js           (state + handlers hook)
├── components/
│   └── ai-tools/
│       ├── ToolSelector.js     (tool grid)
│       ├── ToolWorkspace.js    (tool layout)
│       ├── ToolForm.js         (prompt/context form)
│       ├── FileUploader.js     (chunked upload)
│       ├── OutputDisplay.js    (result + edit + download)
│       ├── OutputTypeSelector.js (search strategy toggle)
│       ├── HistoryPanel.js     (sliding history panel)
│       └── TalentScoutTool.js  (multi-step candidate search)
```

## Key DB Collections
- `users`: user_id, email, name, role, status, linkedin_url, title, company, phone_number, city, country, openai_api_key, has_own_api_key
- `api_usage`: user_id, used_master_key, tool_type, timestamp
- `ai_history`: history_id, user_id, tool_type, prompt, response, created_at
- `system_prompts`: tool_type, tool_name, description, system_prompt, is_active, version, updated_at, updated_by

## What's Been Implemented (All DONE)
- RBAC & User Management (Admin Panel, user schema, role enforcement)
- 7 AI Tools (JD Builder, Search Strategy, Target List, Candidate Research, Dossier, Client Research, Talent Scout)
- SuperAdmin API key fallback for free daily limits (3/day)
- System Prompt Management (MongoDB-backed, SuperAdmin CRUD, versioned)
- File download fix (removed target=_blank, proper blob handling)
- Light mode readability fix (theme-aware classes, CSS overrides)
- Rich text editor for challenge answers (Tiptap)
- API Key removal bug fix (proper React Dialog)
- AITools.js refactored from 540-line monolith into modular components + custom hook
- Improved error messages for OpenAI failures (quota, auth)

## Open/Upcoming Tasks
1. **P2**: N+1 query optimization in challenges.py / dashboard.py
2. **P2**: Build analytics dashboard for usage/engagement metrics
3. **P3**: Challenge categories/pinning for admins
4. **P3**: Email notifications (currently mocked)
5. **P3**: Prompt version history for SuperAdmin audit trail

## Key API Endpoints
- `POST /api/ai/generate` — AI completion
- `POST /api/ai/download` — File export (CSV, PDF, DOCX, TXT)
- `GET /api/prompts` — List system prompts (SuperAdmin)
- `PUT /api/prompts/{tool_type}` — Update prompt
- `POST /api/prompts/{tool_type}/reset` — Reset prompt to default

## Critical Notes
- Backend fetches SuperAdmin's stored OpenAI key (NOT Emergent LLM key)
- Auth uses session cookies (not JWT tokens in body)
- If AI fails: 401 = bad key, 429 = quota exceeded
