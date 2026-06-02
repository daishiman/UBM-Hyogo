# Skill Feedback Report

## Template Improvements

`verify_existing + VISUAL_ON_EXECUTION` needs a clear state split: local deterministic evidence can be `implemented_local_evidence_captured`, while authenticated runtime screenshots remain `runtime_visual_pending_user_gate`.

## Workflow Improvements

A standalone spec created after a landed parent implementation must still produce Phase 11 and Phase 12 physical outputs. Leaving Phase files as instructions only creates false close-out.

## Documentation Improvements

Root `index.md`, root `artifacts.json`, and `outputs/artifacts.json` must use the same canonical workflow state. Non-canonical values such as `implemented` or `spec_created_for_landed_implementation` should be replaced with vocabulary-defined states.

## Promotion Result

Promoted to task-specification-creator in this cycle: `references/phase-12-documentation-guide.md` now requires `verify_existing + VISUAL_ON_EXECUTION + authenticated admin route` close-outs to record whether local static contract PNGs exist, whether authenticated runtime PNGs are still user-gated, and which skill history ledger was updated. This prevents a future zero-image VISUAL close-out from being marked as complete.

Also promoted: `lessons-learned/manual-form-resync-verify-existing-visual-runtime.md` (L-TASKB-001..005) capturing the blockers hit in this cycle — verify_existing state 2-axis split, mandatory Phase 11/12 physical outputs for landed-parent standalone specs, gate-metadata status enum (4 values only), phase12-compliance canonical 9 headings + `Classification|Path|Status` evidence table, and the compact `phase-N.md` generate-index.js detection fix.

## 30-Method Compact Evidence

| Category | Methods | Result |
|---|---|---|
| Logic | critical, deductive, inductive, abductive, vertical | State drift and missing physical outputs were the real blockers |
| Structure | decomposition, MECE, 2-axis, process | Split local evidence from runtime visual evidence |
| Meta | meta, abstraction, double-loop | Reframed from “spec-only package” to “landed implementation evidence package” |
| Expansion | brainstorm, lateral, paradox, analogy, if, beginner | Chose strict output creation over analysis-only notes |
| System | system, causality, causal loop | aiworkflow same-wave sync prevents future lookup drift |
| Strategy | trade-on, plus-sum, value proposition, strategic | Maximum compliance with minimal code risk; no apps/packages churn |
| Problem solving | why, improvement, hypothesis, issue, KJ | Root causes grouped into vocabulary, evidence, and index-sync gaps |
