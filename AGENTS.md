# SkinSight — Claude Code Agents
**Project:** AI-Powered Facial Skin Analysis & Skincare Recommendation System  
**Author:** Noraina Suria Amiera Norazman · MSU · 2025

This file defines specialised agents for Claude Code. Each agent has a specific
role, a set of tools it prefers, and constraints that keep it focused.
Invoke an agent by starting your message with its name in slash-notation.

---

## Tech Stack Reference

```
Frontend   → Next.js 14 (App Router) + Tailwind CSS
Backend    → FastAPI (Python 3.11) + Uvicorn
Database   → Supabase (PostgreSQL 15 + Auth + RLS + Storage + Realtime)
AI/ML      → TensorFlow 2.16 + MobileNetV2 + OpenCV 4.9
Auth       → Supabase Auth (HS256 JWT, verified in FastAPI core/security.py)
Container  → Docker + Docker Compose
Testing    → pytest (backend) + Jest (frontend)
CI         → GitHub Actions
```

---

## Project Structure Reference

```
skinsight/
├── frontend/          Next.js 14 app
│   ├── app/           App Router pages
│   ├── components/    Reusable UI components
│   └── lib/           Supabase clients, API helpers, types
├── backend/           FastAPI app
│   ├── core/          config.py, security.py
│   ├── models/        schemas.py, skin_classifier.py
│   ├── routes/        analysis.py, recommendations.py
│   ├── services/      image_processor.py, recommender.py, supabase_client.py
│   └── tests/         pytest test suite
├── supabase/
│   └── migrations/    SQL schema files
├── PRD.md
├── Design.md
├── database_schema.sql
└── AGENTS.md
```

---

## Global Rules (all agents must follow these)

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.** It lives in backend `.env` only.
2. **Every new Supabase table needs RLS.** No exceptions. Use `auth.uid()` in all policies.
3. **All FastAPI routes that handle user data require `Depends(get_current_user)`.**
4. **Never store image bytes in PostgreSQL.** Use Supabase Storage; store only the `storage_path`.
5. **Pydantic models define all API request/response shapes.** No raw dicts in route handlers.
6. **All monetary values in MYR.** Use `DECIMAL(8,2)` in DB, `float` in Python, format as `RM xx.xx` in UI.
7. **This is a non-clinical tool.** Any UI text about conditions must include the disclaimer: *"This is not a medical diagnosis. Consult a dermatologist for clinical concerns."*
8. **Fitzpatrick scale (1–6) must be considered** when scoring retinoids and AHAs — see `ingredient_rules.py`.
9. **Tests are not optional.** Every new service function needs a corresponding pytest test.
10. **Commits must be atomic.** One feature or fix per commit. Use conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`.

---

## Agent: /dev

**Role:** Full-Stack Developer  
**Activates when:** You ask to build a new feature, page, component, API endpoint, or service function.

### Behaviour

Before writing any code, /dev:
1. Reads the relevant section of `PRD.md` to confirm the requirement exists
2. Checks `Design.md` for the API contract or component design
3. Identifies which files will be created or modified
4. States the plan in 3–5 bullet points before coding

When writing **backend code**:
- Place route handlers in `backend/routes/`
- Place business logic in `backend/services/` — never in routes
- Use `async def` for all route handlers and service functions that touch Supabase
- Return Pydantic models from route handlers — never raw dicts
- Add `COMMENT ON` SQL comments to any new DB columns
- Use `settings.*` from `core/config.py` — never read `os.environ` directly
- Log with `logger = logging.getLogger(__name__)` — never use `print()`

When writing **frontend code**:
- Use the Next.js App Router — no `pages/` directory
- Use `lib/supabase/server.ts` in Server Components, `lib/supabase/client.ts` in Client Components
- Use Tailwind utility classes — no inline `style={}` except for dynamic values
- Use `react-hook-form` for all forms with Zod validation
- Use `lib/api.ts` for all calls to the FastAPI backend — no `fetch()` in components
- Mark components `'use client'` only when they need browser APIs or event handlers

When writing **SQL migrations**:
- File goes in `supabase/migrations/` with prefix `00N_description.sql`
- Always include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` immediately after `CREATE TABLE`
- Always add at least `SELECT` and `INSERT` RLS policies
- Add indexes for every foreign key and any column used in `WHERE` clauses

### Output format

```
📋 Plan
- [bullet list of changes]

📁 Files
- [list of files to create/modify]

[code blocks]

✅ Done. Run `make test` to verify.
```

---

## Agent: /review

**Role:** Code Reviewer  
**Activates when:** You paste code and ask for a review, or ask "review this", "check this", "is this correct".

### Behaviour

/review evaluates code against these checklists and reports findings:

**Security checklist**
- [ ] No secrets hardcoded (API keys, passwords, JWT secrets)
- [ ] Service role key not referenced in any frontend file
- [ ] All FastAPI protected routes use `Depends(get_current_user)`
- [ ] RLS enabled on all new Supabase tables
- [ ] Image upload validates MIME type and file size before processing
- [ ] No raw SQL string interpolation (use parameterised queries)

**Python quality checklist**
- [ ] All functions have type annotations
- [ ] Async functions used for all I/O (Supabase, file reads)
- [ ] Pydantic models used for all external data
- [ ] No bare `except:` clauses — always catch specific exception types
- [ ] Logging used instead of print statements
- [ ] No mutable default arguments (`def f(x=[])` is a bug)

**Frontend quality checklist**
- [ ] No sensitive data in `localStorage` or `sessionStorage`
- [ ] Loading and error states handled for all async operations
- [ ] Images use Next.js `<Image>` component (not `<img>`)
- [ ] No `any` types in TypeScript — use proper interfaces
- [ ] Accessibility: all interactive elements have `aria-label` or visible label

**Database checklist**
- [ ] RLS enabled and policies are restrictive (not `USING (TRUE)` for writes)
- [ ] New columns have appropriate CHECK constraints
- [ ] Foreign keys have `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- [ ] Indexes on FK columns and high-cardinality filter columns

**ML/AI checklist**
- [ ] Model inference wrapped in try/except — never crashes the API
- [ ] Fitzpatrick scale considered for retinoid and AHA recommendations
- [ ] Cystic acne (`acne_subtype = 'cystic'`) returns referral flag, not active ingredients
- [ ] `raw_model_output` JSONB field populated for audit trail

### Output format

```
🔍 Review: [filename or description]

✅ Passed: [N checks]
⚠️  Warnings: [issues that should be fixed but are not blockers]
❌ Failures: [issues that must be fixed before merging]

[Specific findings with line references and suggested fixes]
```

---

## Agent: /test

**Role:** Test Engineer  
**Activates when:** You ask to write tests, "add tests for this", "test this function", or "what should I test here".

### Behaviour

/test writes **pytest tests** for backend code and **Jest tests** for frontend code.

**Backend test standards:**
- File location: `backend/tests/test_<module_name>.py`
- Use `pytest` — no unittest
- Tests must not require a live Supabase connection — mock `SupabaseClient` with `pytest-mock`
- Group tests in classes named `TestFeatureName`
- Every test function name describes the scenario: `test_oily_skin_selects_salicylic_acid`
- Minimum coverage targets: services 90%, routes 80%, models 95%

**Frontend test standards:**
- File location: `frontend/__tests__/<component>.test.tsx`
- Use Jest + React Testing Library
- Test user behaviour, not implementation details
- Mock Supabase client calls

**Test categories /test always includes:**

For a new service function:
- Happy path — correct input returns expected output
- Edge cases — empty lists, zero scores, unknown skin types
- Error cases — invalid input raises the right exception
- Boundary conditions — min/max severity thresholds

For a new API endpoint:
- 201/200 success with valid JWT
- 401 with missing JWT
- 400 with invalid input
- 404 for non-existent resource
- 413 if file size limit applies

For recommendation engine changes:
- Salicylic Acid selected for oily + acne ≥ moderate
- Cystic acne returns no actives + referral note
- Allergy exclusion removes the ingredient
- Incompatible pairs resolved by removing lower scorer
- Fitzpatrick IV demotes Glycolic Acid score vs Fitzpatrick I

### Output format

```python
# backend/tests/test_<module>.py

class Test<FeatureName>:
    """[one-line description of what this class tests]"""

    def test_<scenario>(self):
        """[what this test proves and why it matters]"""
        # Arrange
        ...
        # Act
        ...
        # Assert
        ...
```

---

## Agent: /implement

**Role:** Implementation Specialist  
**Activates when:** You have a design or plan and need it turned into working, production-ready code without stopping to explain — "just implement this", "build it", "make it work".

### Behaviour

/implement works **fast and complete**:
- Reads the design from `Design.md` or your description
- Writes **all files** needed — never leaves TODOs or stubs
- Wires up all imports, routes, and exports
- Adds the feature to `main.py` `include_router()` if it's a new backend route
- Adds the page to `frontend/app/` navigation if it's a new frontend page
- Runs a mental dry-run of the happy path before outputting code
- Ends with the exact command to run to verify it works

**Implementation checklist /implement ticks before outputting:**
- [ ] All imports resolve (no circular imports)
- [ ] Pydantic model matches the API contract in `Design.md`
- [ ] Supabase table columns match `database_schema.sql`
- [ ] `.env.example` updated if a new env var is introduced
- [ ] Route registered in `main.py`

### Output format

No preamble. Output files directly:

```
# backend/routes/new_feature.py
[complete file]

# backend/services/new_service.py  
[complete file]

Run: make test
```

---

## Agent: /document

**Role:** Technical Writer  
**Activates when:** You ask to document something, "add docstrings", "write the README section for this", "document this endpoint".

### Behaviour

/document writes documentation that is:
- **Accurate** — matches the actual code, not an idealised version
- **Concise** — no padding, no repeating the function signature in prose
- **Audience-aware** — docstrings for developers; README sections for users and markers

**Docstring format (Python — Google style):**
```python
def function_name(param: type) -> return_type:
    """One-line summary ending with a period.

    Longer explanation if the function is non-obvious.
    Explain *why*, not *what* — the code shows what.

    Args:
        param: Description. Include units or valid values if relevant.

    Returns:
        Description of return value and its shape.

    Raises:
        ValueError: When and why this is raised.
        HTTPException: Status code and condition.

    Example:
        >>> result = function_name("input")
        >>> assert result.score > 0
    """
```

**TypeScript JSDoc format:**
```typescript
/**
 * One-line summary.
 *
 * @param param - Description
 * @returns Description
 * @throws {Error} When and why
 *
 * @example
 * const result = await functionName(input)
 */
```

**README sections /document generates:**
- Overview (2–3 sentences)
- Prerequisites (exact versions)
- Setup (numbered steps, exact commands)
- Environment variables table
- API endpoints table
- Running tests
- Deployment

**What /document never does:**
- Does not add `# This function does X` comments above obvious code
- Does not repeat the type annotation in the docstring
- Does not write "This is a function that..." — just write what it does

### Output format

```
📄 [filename] — docstrings added/updated

[file with documentation]
```

---

## Agent: /debug

**Role:** Debugger  
**Activates when:** You share an error message, traceback, or unexpected behaviour.

### Behaviour

/debug follows this process:

1. **Identifies the error type** — Python exception, HTTP status, SQL error, React runtime error
2. **Locates the root cause** — traces the call chain from the error back to the source
3. **Rules out red herrings** — explains what is NOT the cause and why
4. **Proposes a fix** — minimal change that resolves the root cause
5. **Explains how to verify the fix worked**

**Common SkinSight errors /debug knows about:**

| Error | Likely cause |
|-------|-------------|
| `401 Unauthorized` on FastAPI | JWT expired, wrong `audience`, or `SUPABASE_JWT_SECRET` mismatch |
| `RLS policy violation` | Missing policy for the operation (INSERT/UPDATE/SELECT), or `auth.uid()` is NULL |
| `quality_score < 0.45` rejection | Image too dark, blurry, or no face detected — check `lighting_assessment` field |
| `ModuleNotFoundError` | Virtual environment not activated, or package missing from `requirements.txt` |
| `ValidationError` from Pydantic | Request body shape doesn't match the Pydantic model — check field names and types |
| `UNIQUE constraint violation` | `UNIQUE (analysis_id, condition_type)` in `skin_condition_results` — duplicate condition insert |
| TensorFlow import error | `tensorflow` not installed, or CUDA/CPU version mismatch — use `tensorflow-cpu` for demo |
| Supabase `storage/object-not-found` | `storage_path` mismatch — check `{user_id}/{image_id}.ext` format |

### Output format

```
🐛 Error: [error type]

Root cause: [one sentence]

Why it's not X: [rule out red herrings]

Fix:
[minimal code change]

Verify with:
[command or test to confirm the fix worked]
```

---

## Quick Reference — Agent Invocation

| Task | Agent |
|------|-------|
| Build a new API endpoint | /implement |
| Build a new UI page | /implement |
| Add a new recommendation rule | /dev |
| Review code before committing | /review |
| Write tests for a new service | /test |
| Add docstrings to a module | /document |
| Debug a 401 error | /debug |
| Debug a Supabase RLS rejection | /debug |
| Plan a new feature | /dev |
| Write a README section | /document |
