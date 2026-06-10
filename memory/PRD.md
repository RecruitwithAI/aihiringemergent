# PRD — Bestpl.ai (Recruiting Leaders Community Platform)

## Original Problem Statement
A community platform for recruiting leaders combining AI-powered tools (JD Builder, Talent Scout, Candidate/Client Research, Search Strategy, Candidate Dossier) with community challenges, gamified XP, and a leaderboard. Recent focus: modular AI Tools architecture, global theme system, and reliable file downloads (PDF/DOCX/CSV/TXT).

## Architecture
- **Frontend**: React 18, modular feature-based at `/app/frontend/src/features/ai-tools/` (registry-driven via `toolRegistry.js`, shared hooks `useAIGeneration`/`useFileUpload`/`useDownload`/`useHistory`, shared `ToolShell` wrapper). Global `ThemeContext` for light/dark mode.
- **Backend**: FastAPI + MongoDB. Routers in `/app/backend/routers/`.
- **3rd-party**: OpenAI GPT-4o (user or SuperAdmin key), Emergent-managed Google Auth.

## Completed
- ✅ Phases 1–7 AI Tools refactor (modular features dir, shared hooks/components, 6 tools migrated, legacy `AITools.js` + `components/ai_tools/` deleted)
- ✅ **Jun 10, 2026 — DB Optimization Phase 1**: Declarative `INDEX_REGISTRY` + idempotent `ensure_indexes()` in `/app/backend/utils/indexes.py`, runs on FastAPI startup. 19 indexes across 6 collections incl. TTL auto-cleanup on `user_sessions.expires_at` (auth.py now stores it as BSON datetime). Documented in `/app/aboutindexes.md`. 21/21 backend regression tests passed. NOTE: DB was wiped on container restart — see updated `/app/memory/test_credentials.md`.
- ✅ **Jun 10, 2026 — P0 bug fix: "Generation failed" in AI tools**: Phase 1 index `uniq_user_date` on `api_usage` didn't match the real schema (docs store `timestamp`, not `date`) → `date:null` collision → 2nd `/ai/generate` per user crashed with DuplicateKeyError *after* the LLM call. Replaced with non-unique `ix_user_masterkey_ts`; verified 3 consecutive JD Builder generations 200 OK. OpenAI key is now funded — live generation works.
- ✅ **Jun 10, 2026 — SuperAdmin Prompt Management** (32/32 backend tests): new `tool_prompts` collection (tool_id, system_prompt, status active/old/draft, version, updated_by) with partial-unique "one active per tool" index; defaults moved to `utils/default_prompts.py`, idempotently seeded on startup (`utils/prompt_store.py`); `ai_generate` reads ACTIVE prompt from DB (hardcoded fallback) — edits live instantly, no restart. Superadmin endpoints under `/api/admin/prompts` (list/draft/edit/activate/restore/delete-draft/reset). Frontend `/admin/prompts` (`pages/PromptManager.js` + `components/admin/prompts/PromptToolCard.js`): per-tool expandable cards, editor with Save as Draft / Save & Activate / Reset to Default, drafts + version history with restore; linked from AdminPanel header.
- ✅ **Jun 10, 2026 — Frontend component splits (deferred from code review)**: `Dashboard.js` 406→~90 lines (`components/dashboard/`: constants, DashboardHeader, StatsRow, ResumeSession, QuickActions, RecentChallenges, ActivityFeed); `AdminPanel.js` 591→~195 lines (`components/admin/`: badges, UserFilters, UserTable, UserRowActions, UserActivityModal, UserEditModal); `ArchitectureDocs.js` 475→~100 lines (`components/architecture/`: DocsCard + 9 section components). Markup/classes/data-testids preserved exactly; page components keep state/handlers, children are presentational. Webpack compiles clean; dashboard render verified post-login. `AITools.backup.js` untouched per user.
- ✅ **Jun 10, 2026 — SuperAdmin Architecture Docs updated to v2.0.0** (`routers/users.py :: get_architecture_docs`): live DB counts (users/sessions/challenges/etc. + per-role counts via aggregation), accurate 19-index registry per collection (incl. TTL), corrected model GPT-4o (was GPT-5.2), real endpoint list (save-api-key/delete-api-key/usage, challenges upvote+answers, dashboard/leaderboard/profile), N+1 removed from known_issues, modular frontend + new utils in file_structure, Diamond badge tier, seed_superadmin.py noted. Frontend renderer keys preserved (no UI changes needed).
- ✅ **Jun 10, 2026 — DB Optimization Phase 2+3** (16/16 regression tests passed): GET /challenges → 1 `$lookup` aggregation (authors + answer counts; was up to 201 queries/load); GET /challenges/{id} → 2 aggregations; dashboard `user_rank` via indexed `count_documents(points $gt)` (competition ranking, was loading 1000 users); `recent_challenges` + `activity_feed` via `$lookup` (was ~20 queries → 2). Shared `AUTHOR_LOOKUP`/`finalize_author` in `utils/helpers.py`. MongoDB 7.0.
- ✅ **Jun 10, 2026 — Code Review Fixes (Option C scope)**:
  - Backend refactors (behavior-preserving, 12/12 regression tests passed): `utils/file_extraction.py` (per-type extract handlers), `utils/document_export.py` (`markdown_to_docx`/`markdown_to_pdf` decomposed), `routers/dashboard.py` stats split into helpers; `ai_tools.py` slimmed 828→~470 lines. TEST_USER_PASSWORD moved to backend/.env.
  - Frontend safe fixes: `src/lib/logger.js` (dev-aware logger, replaced 30+ console.*), hook dependency fixes (Challenges/ChallengeDetail/AdminPanel via useCallback; AdminPanel uses searchRef to keep explicit-submit search behavior), ThemeContext `applyTheme` hoisted to module scope, empty catches now logged (App.js logout, useDownload blob parse), 12 index-as-key → stable keys, JSX unescaped entities fixed. Webpack compiles clean.
  - NOT changed (documented decisions): `is None`/`is True` flags were false positives (correct Python idioms); `AITools.backup.js` kept untouched per user; large frontend component splits deferred (next sprint per report); react-compiler strict rules (set-state-in-effect/purity/immutability) on pre-existing event-handler/render patterns left as-is — project ESLint passes.
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
- ~~DB Optimization Phase 2/3~~ DONE Jun 10, 2026 (see Completed). Remaining optional: switch challenge search from `$regex` to `$text` (index `txt_title_description` ready; note `$text` is whole-word matching — would change partial-match behavior).
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
