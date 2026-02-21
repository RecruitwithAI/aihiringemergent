# Bestpl.ai — Product Requirements Document & Build Plan
**Version:** 1.0  
**Date:** Feb 2026  
**Author:** Product Head / Software Architect  
**Stakeholder:** Saba, Founder

---

## 1. PRODUCT VISION

**Bestpl.ai** is a community platform for recruiting leaders who practice the **Hybrid Intelligence** method — combining AI tools with human judgement to hire optimal leaders.

**Core Value Proposition:**  
One platform where recruiting leaders can (a) use AI-powered hiring tools, (b) crowdsource solutions through community challenges, and (c) level up through gamified training.

---

## 2. USER PERSONAS

| Persona | Description | Primary Need |
|---------|-------------|-------------|
| **The Active Recruiter** | Daily user, runs executive searches | AI tools (JD Builder, Search Strategy, Dossiers) |
| **The Knowledge Seeker** | Newer to leadership hiring | Training content, reading challenge answers |
| **The Community Expert** | Senior recruiter, loves sharing knowledge | Answering challenges, earning recognition |
| **The Lurker** | Browses content, occasionally engages | Reading challenges, using AI tools |

---

## 3. FEATURE BREAKDOWN

### 3.1 Authentication
- **Google OAuth** via Emergent Auth (social login)
- **Email/Password** via JWT + bcrypt
- Session-based with httpOnly cookies (7-day expiry)
- Protected routes — all app pages require auth

### 3.2 AI Tools Hub (5 Tools)
| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| **JD Builder** | Generate professional Job Descriptions | Role details, company info | Structured JD with sections |
| **Search Strategy Maker** | Plan candidate sourcing approach | Role + constraints | Strategy with channels, booleans, timeline |
| **Candidate Researcher** | Deep-dive on a candidate profile | Candidate description | Background analysis, red flags, interview tips |
| **Candidate Dossier** | Client-presentation-ready document | Candidate details | Executive summary, career overview, recommendation |
| **Client Researcher** | Research potential client companies | Company name/description | Company overview, decision makers, approach strategy |

- All powered by **OpenAI GPT-5.2** via Emergent Integrations
- Each use saves to history and earns **+2 XP**

### 3.3 Community Challenges (Q&A)
- Members post **Challenges** (questions/problems)
- Other members post **Answers**
- Both challenges and answers can be **upvoted**
- Tags for categorization
- Sorted by recency (feed) or upvotes

### 3.4 Points & Gamification System
| Action | Points |
|--------|--------|
| Post a Challenge | +5 XP |
| Answer a Challenge | +10 XP |
| Receive an Upvote | +3 XP |
| Use an AI Tool | +2 XP |

**Badge Tiers:**
| Badge | Threshold |
|-------|-----------|
| Bronze | 0 - 99 XP |
| Silver | 100 - 199 XP |
| Gold | 200 - 499 XP |
| Diamond | 500+ XP |

### 3.5 Leaderboard
- Community-wide ranking by XP
- Shows name, badge, points, rank

### 3.6 Training Section
- Cards linking to **TagMango** platform (placeholder URL for now)
- Organized as training modules with titles + descriptions
- External redirect on click

### 3.7 User Profile
- View own stats: challenges posted, answers given, AI tools used
- XP progress bar showing distance to next badge tier
- Current badge and rank

---

## 4. ARCHITECTURE

### 4.1 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Tailwind CSS + Shadcn/UI |
| Backend | FastAPI (Python) |
| Database | MongoDB (via Motor async driver) |
| AI | OpenAI GPT-5.2 via `emergentintegrations` library |
| Auth | Emergent Google OAuth + JWT email/password |
| Hosting | Kubernetes container (Emergent platform) |

### 4.2 System Architecture
```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│  Landing ─ Dashboard ─ AI Tools ─ Challenges         │
│  Training ─ Profile ─ Leaderboard                    │
│          Uses REACT_APP_BACKEND_URL                  │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS (via K8s Ingress)
                     │ All API calls prefixed /api
┌────────────────────▼────────────────────────────────┐
│                  BACKEND (FastAPI)                    │
│  /api/auth/*     ─ Authentication                    │
│  /api/challenges/* ─ Community Q&A                   │
│  /api/ai/*       ─ AI Tool generation                │
│  /api/leaderboard ─ Rankings                         │
│  /api/profile/*  ─ User stats                        │
│  /api/dashboard/* ─ Dashboard data                   │
└───────┬──────────────────────┬──────────────────────┘
        │                      │
   ┌────▼────┐          ┌──────▼──────┐
   │ MongoDB │          │ GPT-5.2 API │
   │ (Motor) │          │ (Emergent)  │
   └─────────┘          └─────────────┘
```

### 4.3 Database Schema (MongoDB Collections)

**`users`**
```json
{
  "user_id": "user_a1b2c3d4e5f6",   // Custom UUID, NOT MongoDB _id
  "name": "Saba",
  "email": "saba@bestpl.ai",
  "password_hash": "$2b$...",         // null for Google OAuth users
  "picture": "https://...",           // Google avatar or null
  "points": 45,
  "created_at": "2026-02-15T10:00:00Z"
}
```

**`user_sessions`**
```json
{
  "user_id": "user_a1b2c3d4e5f6",
  "session_token": "session_abc123...",
  "expires_at": "2026-02-22T10:00:00Z",
  "created_at": "2026-02-15T10:00:00Z"
}
```

**`challenges`**
```json
{
  "challenge_id": "ch_x1y2z3...",
  "title": "How to assess cultural fit in remote hires?",
  "description": "We are struggling to...",
  "tags": ["culture-fit", "remote-hiring"],
  "author_id": "user_a1b2c3d4e5f6",
  "upvotes": 12,
  "upvoted_by": ["user_abc...", "user_def..."],
  "created_at": "2026-02-15T10:00:00Z"
}
```

**`answers`**
```json
{
  "answer_id": "ans_p1q2r3...",
  "challenge_id": "ch_x1y2z3...",
  "content": "In my experience, the best approach is...",
  "author_id": "user_g7h8i9...",
  "upvotes": 5,
  "upvoted_by": ["user_abc..."],
  "created_at": "2026-02-15T11:00:00Z"
}
```

**`ai_history`**
```json
{
  "history_id": "hist_m1n2o3...",
  "user_id": "user_a1b2c3d4e5f6",
  "tool_type": "jd-builder",
  "prompt": "VP of Engineering for...",
  "response": "## Job Description\n...",
  "created_at": "2026-02-15T12:00:00Z"
}
```

### 4.4 API Endpoints

**Auth:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Email/password registration |
| POST | `/api/auth/login` | Email/password login |
| GET | `/api/auth/session?session_id=X` | Exchange Google OAuth session |
| GET | `/api/auth/me` | Get current user (cookie or Bearer) |
| POST | `/api/auth/logout` | Clear session |

**Challenges:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challenges` | List all challenges (newest first) |
| POST | `/api/challenges` | Create challenge (+5 XP) |
| GET | `/api/challenges/{id}` | Get challenge with answers |
| POST | `/api/challenges/{id}/answers` | Post answer (+10 XP) |
| POST | `/api/challenges/{id}/upvote` | Toggle upvote on challenge |
| POST | `/api/answers/{id}/upvote` | Toggle upvote on answer |

**AI Tools:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate` | Generate AI content (+2 XP) |
| GET | `/api/ai/history` | User's AI generation history |

**Dashboard & Profile:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard overview data |
| GET | `/api/leaderboard` | Top 50 ranked users |
| GET | `/api/profile/stats` | Current user's detailed stats |

---

## 5. FRONTEND PAGES & ROUTES

| Route | Page | Auth Required | Description |
|-------|------|:------------:|-------------|
| `/` | Landing Page | No | Hero + auth forms (login/register/Google) |
| `/dashboard` | Dashboard | Yes | Bento grid: XP card, stats, quick actions, recent challenges |
| `/ai-tools` | AI Tools Hub | Yes | 5 tool cards → click to open tool workspace |
| `/challenges` | Challenges Feed | Yes | List of challenges + create new |
| `/challenges/:id` | Challenge Detail | Yes | Full challenge + answers + reply form |
| `/training` | Training | Yes | Cards linking to TagMango modules |
| `/profile` | Profile | Yes | User stats, XP progress, badge |
| `/leaderboard` | Leaderboard | Yes | Ranked list of community members |

---

## 6. DESIGN DIRECTION

**Theme:** "Solar-Punk Professional" — Light, warm, gamified  
**Background:** `#FAFAF9` (warm stone)  
**Primary Accent:** `#6366F1` (Electric Violet)  
**Fonts:** `Outfit` (headings) + `Plus Jakarta Sans` (body)  
**Buttons:** Pill-shaped (rounded-full)  
**Cards:** White with subtle borders, hover lift + shadow  
**Gamification:** XP bars (violet→fuchsia gradient), badge pills, rank displays  
**Nav:** Glassmorphic top bar (blur + semi-transparent)  

Full design tokens available in `/app/design_guidelines.json`.

---

## 7. BUILD PLAN (Sequential Steps)

### Phase 1: Foundation (Backend Core)
- [ ] **Step 1.1** — Update `backend/.env` with EMERGENT_LLM_KEY
- [ ] **Step 1.2** — Install backend dependencies (`emergentintegrations`, `httpx`, `bcrypt`)
- [ ] **Step 1.3** — Write `server.py` with:
  - MongoDB connection + collections
  - Pydantic models for all entities
  - Auth helper (get_current_user from cookie/Bearer)
  - Points helper (add_points)
  - All auth endpoints (register, login, session, me, logout)
  - All challenge endpoints (CRUD + upvote)
  - All AI tool endpoints (generate + history)
  - Dashboard stats, leaderboard, profile stats endpoints
- [ ] **Step 1.4** — Test all backend endpoints with curl

### Phase 2: Frontend Foundation
- [ ] **Step 2.1** — Update `index.css` with design tokens (CSS variables, fonts, animations)
- [ ] **Step 2.2** — Update `App.css` with custom utility classes
- [ ] **Step 2.3** — Rewrite `App.js` with:
  - AuthContext provider (user state, login, logout)
  - AuthCallback component (Google OAuth return handler)
  - ProtectedRoute wrapper
  - AppRouter with all routes
  - Navbar integration on protected pages

### Phase 3: Frontend Pages (All created in parallel)
- [ ] **Step 3.1** — `components/Navbar.js` — Glassmorphic nav with links + user menu
- [ ] **Step 3.2** — `pages/LandingPage.js` — Hero + feature cards + auth tabs (login/register/Google)
- [ ] **Step 3.3** — `pages/Dashboard.js` — Bento grid with XP, stats, quick actions, recent challenges
- [ ] **Step 3.4** — `pages/AITools.js` — Tool cards hub → tool workspace with input + AI output
- [ ] **Step 3.5** — `pages/Challenges.js` — Challenge feed + create new challenge dialog
- [ ] **Step 3.6** — `pages/ChallengeDetail.js` — Full challenge view + answers + reply form + upvoting
- [ ] **Step 3.7** — `pages/Training.js` — Training module cards with TagMango placeholder links
- [ ] **Step 3.8** — `pages/Profile.js` — User stats, XP progress, activity summary
- [ ] **Step 3.9** — `pages/LeaderboardPage.js` — Ranked member list with badges

### Phase 4: Testing & Polish
- [ ] **Step 4.1** — Backend curl tests for all auth + CRUD endpoints
- [ ] **Step 4.2** — Frontend screenshot to verify UI loads
- [ ] **Step 4.3** — End-to-end testing via testing agent (auth flow, challenges, AI tools)
- [ ] **Step 4.4** — Bug fixes from test results
- [ ] **Step 4.5** — Final verification

---

## 8. KEY TECHNICAL DECISIONS

1. **Single server.py** — All backend routes in one file for simplicity (no microservices needed at this scale)
2. **Custom user_id (UUID)** — Never expose MongoDB's `_id`; always project `{"_id": 0}`
3. **Session-based auth** — httpOnly cookie as primary, Bearer token as fallback (for API testing)
4. **Upvote toggle** — Upvoting again removes the upvote (and reverses points)
5. **AI history stored per-user** — Enables future "my generations" feature
6. **Points on user document** — `$inc` atomic operation, badge computed on read (not stored)
7. **No dark mode** — Light theme only per user preference

---

## 9. DEPENDENCIES

**Backend (Python):**
- `fastapi`, `uvicorn`, `motor` — API framework + async MongoDB
- `emergentintegrations` — GPT-5.2 via Emergent universal key
- `bcrypt` — Password hashing
- `httpx` — Async HTTP client for Emergent Auth session exchange
- `python-dotenv` — Environment variable loading
- `pydantic` — Request/response validation

**Frontend (JS):**
- `react`, `react-router-dom` — SPA routing
- `axios` — HTTP client
- `tailwindcss` + `shadcn/ui` — Styling + component library
- `lucide-react` — Icons
- `sonner` — Toast notifications
- `recharts` — Charts (if needed for future dashboard analytics)

---

## 10. WHAT'S DEFERRED (Post-MVP)

| Feature | Priority | Notes |
|---------|----------|-------|
| Search/filter challenges by tags | P1 | Simple filter, do after core works |
| AI chat history viewer | P1 | Show past generations per tool |
| Rich text editor for answers | P2 | Currently plain text |
| Challenge categories/pinning | P2 | Admin feature |
| Email notifications | P2 | Notify on answers to your challenges |
| Admin panel | P3 | User management, content moderation |
| Analytics dashboard | P3 | Usage stats, engagement metrics |
| Mobile-responsive polish | P1 | Basic responsiveness in MVP, polish later |
