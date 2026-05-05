# Skill Feedback Report

state: completed

## テンプレ改善

docs-only / NON_VISUAL decision workflows that depend on external SaaS plan limits should require a Phase 9 constraints file with:

- official documentation URL
- checked date
- plan / dataset availability boundary
- runtime verification boundary

## ワークフロー改善

Phase 11 evidence for external authenticated dashboards should distinguish:

- representative schema sample
- runtime production sample
- redaction command evidence

This avoids falsely marking unavailable runtime data as captured while still making the evidence contract testable.

## ドキュメント改善

aiworkflow-requirements deployment docs benefit from a dedicated "Long-term analytics evidence" section so release ops can find the retention and PII policy without scanning 09c workflow outputs.
