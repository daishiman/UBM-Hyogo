# Phase 4 サマリ — テスト戦略

[実装区分: 実装仕様書]

## ピラミッド

| 層 | 件数 | 対象 |
| --- | --- | --- |
| unit | 18 | renderTemplate / buildRunbookPermalink / saveEvidence / mode switch / log mask / Slack API error handling |
| integration | 4 | CLI 一気通貫（dryrun/production） / GitHub Actions 模倣 / evidence dir 自動作成 |
| e2e | 1 | 実 Slack dryrun channel への post（手動 / CI manual trigger 限定） |

## テストファイル

- `scripts/notify/__tests__/slack-incident-runbook.test.ts`
- `scripts/notify/__tests__/render-template.test.ts`
- `scripts/notify/__tests__/save-slack-evidence.test.ts`
- `scripts/notify/__tests__/mode-switch.test.ts`
- `scripts/notify/__tests__/permalink.test.ts`
- `scripts/notify/__tests__/dryrun-smoke.e2e.ts`

## Mock 戦略

`@slack/web-api` の `WebClient` を Vitest `vi.mock` で stub。`postMessage` / `getPermalink` を `vi.fn().mockResolvedValue(...)` で固定値返却。Phase 6 で WebClient を DI 引数化する場合は `webClient: stub` での直接注入も可。

## カバレッジ目標

- `render-template.ts` / `save-slack-evidence.ts`: line ≥95% / branch ≥90% / function 100%
- `slack-incident-runbook.ts`: line ≥85% / branch ≥80% / function ≥90%

## 主要 case ハイライト

- U-07: dryrun mode で production channel id 変数が読まれないことを assert（誤配信ガード）
- U-09 / U-16: token 文字列が log / evidence に出ないことを assert
- U-15: evidence JSON が required 9 keys を満たすことを schema validate
- U-17: permalink 取得失敗時に `permalink: null` で exit 0

## ローカル実行

`mise exec -- pnpm vitest run scripts/notify/__tests__ --coverage`

e2e dryrun smoke は `bash scripts/with-env.sh mise exec -- pnpm vitest run scripts/notify/__tests__/dryrun-smoke.e2e.ts`。

## 引き渡し

Phase 5 へ: 実行コマンド一覧、Slack workspace / 1Password / GitHub Secrets 前提、WebClient DI 実装方針。
