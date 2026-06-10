# MongoDB Index Reference — Bestpl.ai

> **Last updated:** Phase 1 of DB optimization (index foundation).
> **Source of truth:** `/app/backend/utils/indexes.py` → `INDEX_REGISTRY`
> Indexes are created **automatically on every backend startup** via the FastAPI
> `startup` event in `/app/backend/server.py`. The process is idempotent — running
> it repeatedly is safe and free (no-op when an identical index exists).

---

## 1. How the system works

```
server.py (startup event)
   └── utils/indexes.py :: ensure_indexes()
          └── iterates INDEX_REGISTRY {collection → [index specs]}
                 ├── create_index(keys, **options)        ← no-op if identical
                 ├── on name conflict: drop + recreate    ← automatic migration
                 └── on any other error: log & continue   ← never blocks startup
```

Design rules:
- **Every index has an explicit `name`** — this makes definition changes detectable
  and enables the automatic drop/recreate migration path.
- **Failures never crash the app.** A broken index definition logs an error;
  the API still boots.
- The old manual script `migrate_user_schema.py` is superseded by this registry
  for index management (kept only for its data-migration logic).

## 2. How to add / change an index (future reference)

1. Edit `INDEX_REGISTRY` in `/app/backend/utils/indexes.py`:
   ```python
   "my_collection": [
       {"keys": [("field_a", ASCENDING), ("field_b", DESCENDING)],
        "options": {"name": "ix_fielda_fieldb"}},
   ]
   ```
2. `sudo supervisorctl restart backend` — startup log prints
   `MongoDB indexes ensured: {...}` confirming the result.
3. Update the tables in this file.

Naming convention: `uniq_*` (unique), `ix_*` (regular/compound), `txt_*` (text),
`ttl_*` (TTL). Compound names list fields in key order.

To **change** an existing index: keep the same `name`, change the keys/options —
`ensure_indexes()` detects the conflict, drops the old one by name, and recreates it.
To **remove** an index: delete from registry **and** drop manually once
(`db.collection.dropIndex("name")`) — the registry never deletes unlisted indexes.

## 3. Current indexes (post Phase 1)

### `users`
| Name | Keys | Options | Why |
|---|---|---|---|
| `uniq_user_id` | `user_id ↑` | unique | App-level UUID; resolved on **every authenticated request** (`get_current_user`) and all author lookups |
| `uniq_email` | `email ↑` | unique | Login lookup + duplicate-registration guard |
| `ix_role` | `role ↑` | | Admin user-list filter (superadmin/admin/user) |
| `ix_status` | `status ↑` | | Admin user-list filter (active/suspended/banned) |
| `ix_points_desc` | `points ↓` | | Leaderboard sort; rank computation |
| `ix_created_desc` | `created_at ↓` | | Admin list default sort |

### `user_sessions`  ← hottest collection
| Name | Keys | Options | Why |
|---|---|---|---|
| `uniq_session_token` | `session_token ↑` | unique | **Every API request** validates the session token here |
| `ix_user_id` | `user_id ↑` | | Per-user session management / logout-all |
| `ttl_expires_at` | `expires_at ↑` | `expireAfterSeconds: 0` | Mongo auto-deletes expired sessions — no cron needed |

> ⚠️ **TTL requirement:** `expires_at` must be a **BSON Date** (Python `datetime`),
> not an ISO string. `routers/auth.py` stores it as datetime (changed in Phase 1).
> TTL on string fields silently does nothing. The reader in `utils/auth.py`
> handles both formats for backward compatibility.

### `challenges`
| Name | Keys | Options | Why |
|---|---|---|---|
| `uniq_challenge_id` | `challenge_id ↑` | unique | Detail page / upvote / answer-creation lookups |
| `ix_created_desc` | `created_at ↓` | | Challenge list default sort (newest first) |
| `ix_author_created` | `author_id ↑, created_at ↓` | | "My challenges", dashboard last-posted (prefix covers author-only queries) |
| `ix_tags` | `tags ↑` | multikey | Tag filtering (`$in`) |
| `txt_title_description` | `title, description` TEXT | weights: title 10, description 5 | Ready for `$text` search; current `$regex` search still works and can be migrated later (Phase 2+) |

### `answers`
| Name | Keys | Options | Why |
|---|---|---|---|
| `uniq_answer_id` | `answer_id ↑` | unique | Direct answer lookups (upvoting) |
| `ix_challenge_upvotes` | `challenge_id ↑, upvotes ↓` | | Challenge detail: answers per challenge sorted by upvotes — exact query+sort match; also covers `count_documents({challenge_id})` |
| `ix_author_created` | `author_id ↑, created_at ↓` | | "My answers", dashboard last-answered |
| `ix_created_desc` | `created_at ↓` | | Global activity feed |

### `ai_history`
| Name | Keys | Options | Why |
|---|---|---|---|
| `ix_user_created` | `user_id ↑, created_at ↓` | | Per-user AI history newest-first; per-user usage counts |

### `api_usage`
| Name | Keys | Options | Why |
|---|---|---|---|
| `ix_user_masterkey_ts` | `user_id ↑, used_master_key ↑, timestamp ↓` | | Daily free-tier limit count in `check_daily_usage()` (`user_id + used_master_key + timestamp >= today`). One doc per usage EVENT — must NOT be unique. |

> ⚠️ **Post-mortem (Jun 10, 2026):** the original Phase 1 index `uniq_user_date`
> (unique on `user_id + date`) was copied from the legacy migration script, but the
> actual write path stores `timestamp`, not `date` — so every doc indexed as
> `date: null` and the **second** `/ai/generate` per user failed with
> DuplicateKeyError ("Generation failed"). Lesson: always validate index
> definitions against the real insert/update code paths, not legacy scripts.

### `tool_prompts`  ← SuperAdmin-editable AI system prompts
| Name | Keys | Options | Why |
|---|---|---|---|
| `ix_tool_status` | `tool_id ↑, status ↑` | | Hot path: `ai_generate` fetches the active prompt per tool on every AI request |
| `uniq_prompt_id` | `prompt_id ↑` | unique | Direct version lookups (edit/activate/delete) |
| `uniq_active_per_tool` | `tool_id ↑` | unique, partial: `{status: "active"}` | DB-level invariant: at most one ACTIVE prompt per tool |

## 4. Notes & future candidates

- **Phase 2/3 (Jun 10, 2026):** the routers now use `$lookup` aggregations
  (`utils/helpers.py :: AUTHOR_LOOKUP`) — these joins hit `users.uniq_user_id`
  and `answers.ix_challenge_upvotes`; dashboard rank uses `users.ix_points_desc`
  via `count_documents({points: {$gt: …}})`.
- `created_at` fields (except session `expires_at`) are stored as **ISO-8601 strings**;
  lexicographic order == chronological order, so DESC index sorts work correctly.
  If they're ever migrated to BSON Dates, index definitions don't need changes.
- **Future candidates (revisit after Phase 2/3 aggregation refactor):**
  - Switch challenge search from `$regex` to `$text` (uses `txt_title_description`).
  - `challenges.upvotes ↓` if a "Top challenges" sort is added.
  - `users.name` / text index if user search by name becomes hot.
  - `answers.upvoted_by` / `challenges.upvoted_by` are unbounded arrays — fine at
    MVP scale; consider a separate `votes` collection at >10k votes per doc.
- **Verify live indexes at any time:**
  ```bash
  cd /app/backend && python -c "
  import asyncio, os
  from dotenv import load_dotenv; load_dotenv('.env')
  from motor.motor_asyncio import AsyncIOMotorClient
  async def m():
      db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
      for c in sorted(await db.list_collection_names()):
          print(c, sorted((await db[c].index_information()).keys()))
  asyncio.run(m())"
  ```
