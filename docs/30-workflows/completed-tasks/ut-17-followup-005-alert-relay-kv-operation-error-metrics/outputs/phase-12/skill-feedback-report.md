# Skill Feedback Report

## テンプレ改善

- `@repo/api` のような stale package filter を防ぐため、Phase 2 validation matrix 作成前に `apps/api/package.json` の `name` を実測する gate を必須化する。
- NON_VISUAL evidence の canonical path は `.txt` / `.md` を優先する。`.log` は repository `.gitignore` により tracked evidence にならない。

## ワークフロー改善

- implementation task に `apps/` diff が入った場合、`spec_created` のまま close-out しない。`implemented_local_evidence_captured` へ同一 wave で再分類する。
- logging helper は observability path であっても fail-safe 契約を持つべきで、hash 失敗時の fallback schema を設計時点で固定する。

## ドキュメント改善

- runbook field table は implementation schema と同じ field 名を使い、`hash_error` のような fallback sentinel も明記する。
