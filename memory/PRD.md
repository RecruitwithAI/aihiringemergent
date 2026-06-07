# PRD — Bestpl.ai (Recruiting Leaders Community Platform)

## Original Problem Statement
A community platform for recruiting leaders combining AI-powered tools (JD Builder, Talent Scout, Candidate/Client Research, Search Strategy, Candidate Dossier) with community challenges, gamified XP, and a leaderboard. Recent focus: modular AI Tools architecture, global theme system, and reliable file downloads (PDF/DOCX/CSV/TXT).

## Architecture
- **Frontend**: React 18, modular feature-based at `/app/frontend/src/features/ai-tools/` (registry-driven via `toolRegistry.js`, shared hooks `useAIGeneration`/`useFileUpload`/`useDownload`/`useHistory`, shared `ToolShell` wrapper). Global `ThemeContext` for light/dark mode.
- **Backend**: FastAPI + MongoDB. Routers in `/app/backend/routers/`.
- **3rd-party**: OpenAI GPT-4o (user or SuperAdmin key), Emergent-managed Google Auth.

## Completed
- ✅ Phases 1–7 AI Tools refactor (modular features dir, shared hooks/components, 6 tools migrated, legacy `AITools.js` + `components/ai_tools/` deleted)
- ✅ `ThemeContext` and `design-system/tokens.js`
- ✅ Centralized `useDownload` hook for PDF/DOCX/CSV/TXT exports
- ✅ **Feb 6, 2026** — Fixed frontend crash: removed dangling `@/pages/AITools` import in `App.js`, wired `AIToolsLayout` from new feature dir, removed broken `/ai-tools-old` route. Webpack compiles clean, landing page renders.
- ✅ **Feb 6, 2026** — Fixed P0 runtime crash `actualPrompt.trim is not a function` in JD Builder (and all other tools using InputSection):
  - Root cause: `onClick={onGenerate}` in `InputSection.js` passed React SyntheticEvent as `overridePrompt`, which propagated to `handleGenerate` → `event.trim()` crashed
  - Fix: `onClick={() => onGenerate()}` + defensive `typeof === 'string'` guards in `ToolShell.handleGenerateWithFiles` and `useAIGeneration.handleGenerate`
- ✅ **Feb 6, 2026** — Fixed API Key removal UX bug (`Unable to remove old API`):
  - Replaced blockable native `window.confirm()` with shadcn `AlertDialog` (`/app/frontend/src/pages/APIKeySettings.js`)
  - Added inline **Update Key** flow — users can replace an active key without removing first
  - Added data-testids on all buttons & dialog
- ✅ **Feb 6, 2026** — Verified file download flow end-to-end via curl + UI smoke test:
  - TXT: 200 OK, `text/plain`, client-side blob
  - PDF: 200 OK, `application/pdf`, valid `%PDF-1.3` magic, 1211B
  - DOCX: 200 OK, correct MIME, valid `PK\x03\x04` zip magic, 36KB
  - CSV: 200 OK, `text/csv`, properly flattens arrays for talent-scout export
  - Invalid format returns 400 with error detail
  - AI Tools page renders all 6 migrated tools with badges (File Upload / Interactive / CSV Export)

## Pending / Backlog
### P0
- Verify File Download fix (PDF/DOCX/TXT/CSV) end-to-end via UI on at least JD Builder.
- Add a funded OpenAI key in SuperAdmin Profile (current keys exhausted with 429).

### P1
- Validate global Light/Dark mode readability across Dashboard, Challenges, AI Tools.
- E2E test of all 6 refactored AI Tools (JD Builder, Talent Scout, Candidate Research, Client Research, Search Strategy, Candidate Dossier).
- Re-implement rich text editor for challenge answers + admin pinning/categories (previously rolled back).

### P2
- Fix N+1 queries in `routers/challenges.py` and `routers/dashboard.py` (use `$lookup`).
- Analytics dashboard for usage/engagement.

### P3
- Email notifications (currently MOCKED / "Coming Soon").

## Key Files
- `/app/frontend/src/App.js`
- `/app/frontend/src/features/ai-tools/AIToolsLayout.js`
- `/app/frontend/src/features/ai-tools/registry/toolRegistry.js`
- `/app/frontend/src/features/ai-tools/hooks/useDownload.js`
- `/app/frontend/src/contexts/ThemeContext.js`
- `/app/AI_TOOLS_REFACTOR_PLAN.md`

## Test Credentials
See `/app/memory/test_credentials.md`.
