# Phase 12 Main — ut-17-followup-002-alert-relay-dedup-kv

## サマリ

UT-17 follow-up 002 を implementation / NON_VISUAL workflow として local 実装完了。alert-relay の dedup state を isolate ローカルの `Map<string, number>` から Cloudflare KV namespace `ALERT_DEDUP_KV` に移行した。

本サイクルでは以下を完了:

- コード変更（`Env` / `AlertRelayEnv` への KV 必須プロパティ追加、handler の `seenAlerts` 削除と KV `get`/`put` 置換、`buildFormsClient` の env 型 narrowing）
- KV stub helper 新規作成（`apps/api/test/helpers/kv-stub.ts`）
- テスト 21 ケース PASS（既存 10 + 新規 11）。Slack 失敗後 retry が dedup されない回帰テストを追加
- `apps/api/wrangler.toml` への user-gated KV namespace binding block テンプレート追加（実 id 取得まではコメント化）
- runbook 月次ヘルスチェックに Step 4b 追記

`workflow_state` は `implemented-local-runtime-pending`。コード実装と local evidence は本サイクルで完了。KV namespace 作成 / 実 namespace id 反映 / deploy / Slack runtime smoke / commit / push / PR は user-gated。

## Strict 7 状態

| Output | Status |
|--------|--------|
| `implementation-guide.md` | present（Part 1/2 構成、KV 必須化と型整合の副次変更を反映） |
| `system-spec-update-summary.md` | present |
| `documentation-changelog.md` | present |
| `unassigned-task-detection.md` | present |
| `skill-feedback-report.md` | present |
| `phase12-task-spec-compliance-check.md` | present |
| `main.md` | present |

## 4 条件

| 条件 | 結果 | 根拠 |
|------|------|------|
| 矛盾なし | PASS_WITH_EXTERNAL_OPS_PENDING | 状態語彙を `implemented-local-runtime-pending` に統一。KV eventual consistency は「実用上大幅低減」として統一 |
| 漏れなし | PASS_WITH_EXTERNAL_OPS_PENDING | Strict 7 / `outputs/artifacts.json` mirror parity / Phase 1-11 全成果物存在。Slack 失敗後 retry 回帰を追加 |
| 整合性あり | PASS_WITH_EXTERNAL_OPS_PENDING | テストパス `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` で実装と整合、21/21 PASS |
| 依存関係整合 | PASS_WITH_EXTERNAL_OPS_PENDING | Cloudflare 側 ops は user-gated。active TOML に placeholder id を置かない |

## 検証コマンドと結果

| コマンド | 結果 |
|---------|------|
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api lint` | PASS |
| `pnpm exec vitest run apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | 21 PASS / 0 FAIL |
| `grep -rn "seenAlerts" apps/api/src/` | 0 件 |
