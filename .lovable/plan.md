

## Problem

The public form submits as `anon` role. The INSERT policies are now permissive, but the code does:

```typescript
await supabase.from("candidates").insert([...]).select().single();
```

The `.select().single()` requires a **SELECT** policy for the `anon` role on `candidates`. Currently only `authenticated` has SELECT access. This causes the RLS violation.

## Plan

### 1. Database migration: Add SELECT policy for anon on candidates (own row only)

Add a permissive SELECT policy for anon on `candidates` that returns the just-inserted row. A simple `WITH CHECK (true)` on INSERT + a scoped SELECT is safest, but since we only need the row back from the insert, we can either:

- **Option A**: Add `SELECT` policy for anon (limited scope) -- exposes candidate data to unauthenticated users
- **Option B** (preferred): Remove `.select().single()` from the insert call and instead get the candidate ID from the insert response without requiring SELECT

### Chosen approach: Option B

Modify `PublicApplicationForm.tsx` to avoid needing SELECT after INSERT:

```typescript
const { data: candidate, error } = await supabase
  .from("candidates")
  .insert([{ ... }])
  .select()  // <-- remove this
  .single(); // <-- and this
```

Instead, generate the candidate ID client-side using `crypto.randomUUID()` and pass it in the insert, so we already know the ID for subsequent operations (candidate_responses insert and CV analysis).

### 2. Update PublicApplicationForm.tsx

- Generate `candidateId = crypto.randomUUID()` before insert
- Include `id: candidateId` in the insert payload
- Remove `.select().single()` from the candidates insert
- Use the pre-generated `candidateId` for `candidate_responses` insert and `analyze-cv` invocation
- Remove `.select().single()` pattern to avoid needing SELECT permission

