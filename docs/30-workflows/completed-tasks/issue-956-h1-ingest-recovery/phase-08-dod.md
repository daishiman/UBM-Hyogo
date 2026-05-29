# Phase 08 — Definition of Done

以下を **すべて** 満たした時点で本タスクを完了とみなし `completed-tasks/issue-956-h1-ingest-recovery/` へ移動する。

## 8.1 機能 DoD

- [ ] AC-1: `cf.sh secret list` 出力に `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` を確認
- [ ] AC-2: `snapshot-after.json.secretsReadiness.{googleServiceAccountEmail, googlePrivateKey, googleFormId}` 全 true
- [ ] AC-3: `snapshot-after.json.hypothesisFlags.H1_ingestNeverRanOrAllErrors === false`
- [ ] AC-4: `snapshot-after.json.latestSyncRuns` に `status:"success"` の run が 1 件以上
- [ ] AC-5: stale `running` row 0 件 (S6 結果)
- [ ] AC-6: `cron-tail.log` に `*/15 * * * *` 起動行が 1 件以上

## 8.2 品質 DoD

- [ ] `wrangler` 直叩き履歴 0 (G-CFSH)
- [ ] 実値の docs / log / commit / chat 転記 0 (G-SECRET)
- [ ] D1 schema 不変 (G-SCHEMA)
- [ ] コード変更 0 ファイル (本タスク区分が ドキュメントのみ である根拠を維持)

## 8.3 ドキュメント DoD

- [ ] `outputs/phase-11/` 配下に snapshot-before / after / cf-secret-list / wrangler-cron-grep / cron-tail / stale-lock-select (+該当時 stale-lock-reset) / snapshot-diff の各 evidence ファイルが揃う
- [ ] `outputs/phase-12/` 配下に `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` (canonical strict 7) を生成
- [ ] `artifacts.json` の zod schema 準拠 (gate-metadata pass)
- [ ] `phase-12-compliance.md` で未タスク検出を明示 (0 件 or 候補列挙)

## 8.4 運用 DoD

- [ ] 元 spec `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/unassigned-task-specs/google-form-reflection-diagnostics-followup-001-h1-ingest-recovery.md` を `completed-tasks/` 側へ吸収 (consume) または retention 判断記録
- [ ] `MEMORY.md` に runtime ops 完了 entry 追加 (実値不記載)
- [ ] Issue #956 のステータスは CLOSED のまま (refs 運用)
