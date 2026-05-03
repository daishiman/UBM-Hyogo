# System Spec Update Summary: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装 / implemented-local]

## 影響評価

本タスクは apps/web の auth/fetch/session lib に focused Vitest tests と test helper を追加し、production code の仕様・API・UI契約は変更しない。したがって `02-auth.md` / `13-mvp-auth.md` の機能仕様本文更新は不要。

| 正本仕様 | 影響 | 理由 |
| --- | --- | --- |
| docs/00-getting-started-manual/specs/02-auth.md | なし | unit test 追加のみで auth design に変更なし |
| docs/00-getting-started-manual/specs/13-mvp-auth.md | なし | login / session UX と runtime contract は不変 |
| .claude/skills/aiworkflow-requirements indexes/references | あり | implemented-local 状態、実測 coverage、root path、Phase 13 gate を同期 |

## 同期内容

- `ut-web-cov-03` を `spec_created / implementation_spec / remaining-only` から `implemented-local / test implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval` へ昇格。
- 実変更先を root `vitest.config.ts` として固定し、存在しない `apps/web/vitest.config.ts` 記述を撤回。
- `fetchPublicOrNotFound` の 404 契約を `null` ではなく `FetchPublicNotFoundError` throw として同期。

## 結論

システム仕様本文への機能差分は不要。正本インデックスと workflow inventory の状態同期は必要であり、本サイクルで更新済み。
