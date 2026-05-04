# Phase 13: commit / PR 承認ゲート

## 状態

PENDING_USER_APPROVAL。本タスク実行プロンプトは CONST_002 により commit / push / PR 作成を禁止する。
ユーザー明示承認を得たうえで `/ai:diff-to-pr` 等で PR 化する想定。

## 完了済み事項

- 実装: `apps/api/src/jobs/cap-alert.ts` 新規 / `sync-forms-responses.ts` 統合 / `_shared/sync-jobs-schema.ts` schema 拡張 / `env.ts` 型追加 / `wrangler.toml` binding 追加 / `__fixtures__/d1-fake.ts` SQL fake 拡張
- テスト: `cap-alert.test.ts` 新規 11 ケース / `sync-forms-responses.test.ts` 4 ケース追加（合計 26 / 26 PASS）
- ドキュメント: SSOT (`deployment-cloudflare.md`) v1.4.0 追記 / outputs/phase-12/{implementation-guide.md, runbook-per-sync-cap-alert.md} 更新

## 未実施

- staging dry-run (`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`)
- production deploy
- Issue #199 へのクローズ判断
- 05a-parallel-observability-and-cost-guardrails への hand-off
