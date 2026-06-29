# Test Credentials

## SuperAdmin (verified working, Jun 10 2026)
- Name: Noor us Saba Alam
- Email: `noorussaba.alam@gmail.com`
- Password: `#VibeCon2026`
- user_id: `user_84fd1eb2b631`
- Re-seed/reset anytime: `cd /app/backend && python seed_superadmin.py` (idempotent; credentials in backend/.env → SUPERADMIN_*)

## Regular User (created by testing agent, Jun 10 2026)
- Email: `regression_test_20260610_113725@bestpl.ai`
- Password: `SecurePass2026!`
- User ID: `user_334428e6e266`

> Note: No funded OpenAI key configured — AI generation returns 429/500 until a
> funded key is added (SuperAdmin Profile → API Key or per-user key).

## Security hardening (Feb 6, 2026)
- OpenAI API keys are **encrypted at rest** with Fernet — `users.openai_api_key`
  is prefixed `enc:v1:`. Key lives in `backend/.env` as `API_KEY_ENCRYPTION_KEY`.
- Login lockout: 5 failed attempts on the same email (lowercased) within 15 min
  → HTTP 429 for 15 min. To clear during testing:
  `MongoClient(MONGO_URL)[DB_NAME].login_attempts.delete_many({"email":"<lowercased>"})`.
