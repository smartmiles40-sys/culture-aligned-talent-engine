

## Problems Identified

1. **CV Analysis is wrong**: The file uploaded (`800_Calorias_sem_restriA_A_o.pdf`) is a photo, not a CV. The AI hallucinated a score of 85 and fabricated strengths/weaknesses. This needs to be cleared.

2. **Stage scores are empty**: The candidate submitted text responses for Blocos C, D, and F, but no evaluations were created for those stages. Currently, scores are only filled manually by recruiters or by the CV analysis for Bloco B. There is no automatic AI scoring for the other stages based on candidate responses.

## Plan

### 1. Clear the invalid CV analysis for this candidate

Run a database update to set `cv_analysis` to null and delete the incorrect Bloco B evaluation for this candidate, since the uploaded file was not a real CV.

### 2. Add AI auto-scoring of candidate responses on submission

Create a new edge function `score-candidate-responses` that:
- Receives `candidateId` and `jobId`
- Fetches all candidate responses grouped by stage
- For each scorable stage (weight > 0), sends the questions + responses to the AI gateway
- AI returns a score (0-100) and brief justification
- Inserts evaluations into `candidate_evaluations` for each stage

### 3. Call the new function from PublicApplicationForm after submission

After the candidate record is created and responses are saved, invoke `score-candidate-responses` (fire-and-forget, same as `analyze-cv`).

### 4. Update analyze-cv to validate the file is actually a CV

Add a check in the AI prompt to detect if the uploaded file is not a real CV and return a low score with an appropriate warning instead of hallucinating.

### Technical Details

**New edge function `score-candidate-responses/index.ts`:**
- Uses Lovable AI (gemini-3-flash-preview) to score each stage
- System prompt instructs AI to evaluate responses against the job requirements
- Uses tool calling to extract structured `{ score: number, justification: string }`
- Inserts one `candidate_evaluations` row per stage with `evaluator_id = null` (AI)
- Deletes any existing AI evaluations first (same pattern as analyze-cv)

**PublicApplicationForm.tsx changes:**
- After successful submission, call `score-candidate-responses` with `candidateId` and `jobId`

