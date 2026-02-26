

## Problem

Two issues prevent the CV analysis from working:

1. **Parameter mismatch**: The form sends `fileName` but the edge function expects `cvPath`. The function also needs `jobArea`, `requiredSkills`, and `behavioralProfile` which are not being passed.

2. **Results not saved**: The `analyze-cv` edge function returns the analysis JSON but never saves it back to the `candidates.cv_analysis` column in the database.

## Plan

### 1. Fix PublicApplicationForm.tsx - correct parameter names and pass full job data

Update the `analyze-cv` invocation (line ~195-197) to pass the correct parameters:

```typescript
supabase.functions.invoke("analyze-cv", {
  body: {
    cvPath: formData.__cv_url,
    candidateId,
    jobTitle: job.title,
    jobArea: job.area,
    requiredSkills: job.required_skills,
    behavioralProfile: job.behavioral_profile,
  },
}).catch(() => {});
```

### 2. Update analyze-cv edge function - save results to database

After getting the AI analysis, add a step to update `candidates.cv_analysis` with the result using the service role client:

```typescript
// After parsing analysis successfully
await supabase.from("candidates").update({ cv_analysis: analysis }).eq("id", candidateId);
```

Also extract `candidateId` from the request body (it's already being sent but not used).

### Technical details

- The edge function already has `supabase` initialized with `SUPABASE_SERVICE_ROLE_KEY`, so it can bypass RLS to update the candidate row.
- The `cv_analysis` column is `jsonb` type, matching the analysis object structure.

