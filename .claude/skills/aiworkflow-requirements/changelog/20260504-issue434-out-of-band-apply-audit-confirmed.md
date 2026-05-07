# 2026-05-04 Issue #434 out-of-band production D1 apply audit (confirmed)

- `task-issue-359-production-d1-out-of-band-apply-audit-001` Phase 11 を read-only で実行し、`0008_schema_alias_hardening.sql` (`2026-05-01 08:21:04 UTC`) と `0008_create_schema_aliases.sql` (`2026-05-01 10:59:35 UTC`) の出所を `confirmed` に分類した。
- 出所は `.github/workflows/backend-ci.yml` の `deploy-production` job が main push 契機で実行した `wrangler d1 migrations apply ubm-hyogo-db-prod --env production --remote` step。
  - `0008_schema_alias_hardening.sql` ← Actions run `25207878876` (PR #364 merge / commit `9841e06a`)
  - `0008_create_schema_aliases.sql` ← Actions run `25211958572` (PR #365 merge / commit `2ced613d`)
  - 両 run の `Deploy Workers app` step は failure だが、`Apply D1 migrations` step は success で完了している。
- 親 workflow `task-issue-191-production-d1-schema-aliases-apply-001` の Phase 13 evidence (`outputs/phase-13/main.md` / `outputs/verification-report.md`) と artifact inventory に cross-reference を追記した（既存記述は改変せず append のみ）。
- production への write / 追加 apply / rollback / deploy / commit / push / PR / Issue 状態変更は本 audit では一切実行していない。Issue #434 / #359 は CLOSED のまま据え置き。
- secret 値混入は `outputs/phase-11/redaction-checklist.md` で 0 件確認済み。
- 結論が `confirmed` のため、Issue #299 (fallback retirement) / #300 (direct update guard) の判断材料として `attribution-decision.md` を参照可能。新 hook / approval gate 実装の follow-up は不要（現行 `backend-ci.yml` + GitHub `production` environment + PR review が approval gate として機能している）。
- 追加レビューで検出した migration success + deploy failure の partial operation 可視化漏れは同 wave で修正済み。`.github/workflows/backend-ci.yml` に `Record post-migration deploy failure` step を staging / production へ追加し、D1 migration 適用済み・Workers deploy 失敗時に GitHub Actions summary へ復旧注意を出す。
