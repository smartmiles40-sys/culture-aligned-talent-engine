

## Current State

**Dados Pessoais step** has these fields:
- **Nome Completo** — marked with `*`, validated in button disabled logic ✅
- **Email** — marked with `*`, validated in button disabled logic ✅  
- **Telefone** — NOT marked as required, NOT validated ❌

The "Próximo" button only checks `!formData.name || !formData.email` — phone is optional.

**Stage questions** — each question has `is_required` from the database, the label shows `*` but there's NO validation preventing the user from advancing without filling required questions.

**CV step** — validated (button disabled if no file) ✅

## Plan

### 1. Make phone required on personal step
- Add `*` to the Telefone label
- Add `!formData.phone` to the disabled condition on the "Próximo" button for the personal step

### 2. Add required question validation for stage steps
- Before advancing from a stage step, check all questions with `is_required === true` have non-empty values in `formData`
- Add validation state to show error messages on empty required fields
- Disable the "Próximo" / "Enviar" button when required stage questions are not filled

### 3. Add validation before final submit
- On `handleSubmit`, verify all required stage questions are answered before proceeding
- Show toast error if any required field is missing

