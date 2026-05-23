---
phase: 6
title: Test Strategy
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 6: Test Strategy — SA key 失効監視

[実装区分: 実装仕様書]

## 1. テストレイヤと対象

| Layer | 対象 | ファイル（`*.spec.ts`） |
| --- | --- | --- |
| unit | classifier 純関数 | `apps/api/src/jobs/sheets-auth-classifier.spec.ts` |
| unit | logger 構造化出力 | `apps/api/src/jobs/sheets-auth-logger.spec.ts` |
| contract | healthcheck（fetch mock） | `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` |
| contract | alert-relay schema 拡張 | `apps/api/src/routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts` |
| regression | 既存 sync ジョブ rethrow | `apps/api/src/sync/backfill.spec.ts`、`manual.spec.ts`、`apps/api/src/jobs/sync-sheets-to-d1.contract.spec.ts`（既存ファイル拡張） |

## 2. unit: classifier（必須ケース）

| ケース | 入力 | 期待 code | isAuthFailure |
| --- | --- | --- | --- |
| 401 | `new SheetsFetchError('unauthorized', 401)` | `SHEETS_AUTH_401_KEY_INVALID` | true |
| 403 | `new SheetsFetchError('forbidden', 403)` | `SHEETS_AUTH_403_FORBIDDEN` | true |
| 500 | `new SheetsFetchError('server error', 500)` | `SHEETS_AUTH_OTHER` | false |
| 429 | `new SheetsFetchError('rate limit', 429)` | `SHEETS_AUTH_OTHER` | false |
| network | `new TypeError('fetch failed')` | `SHEETS_AUTH_OTHER` | false |
| 非 Error | `'string error'` | `SHEETS_AUTH_OTHER` | false |
| message trim | 600 文字の message | `length === 500` | - |

## 3. unit: logger

- `console.error` を vi.spyOn で捕捉し、payload key (`event`, `code`, `status`, `jobName`, `isolateId`, `ts`) が完全一致することを assert
- `isAuthFailure: true` で `event === 'sheets.auth.failure'`、false で `event === 'sheets.auth.transient'`
- `ts` 未指定時に ISO 8601 形式の string が入ること（regex 検証）

## 4. contract: healthcheck

- `globalThis.fetch` を vi.stubGlobal で mock し、以下を検証:
  - 200 OK → `{ ok: true, classification.code === 'SHEETS_AUTH_OTHER' }`、alert-relay POST されない
  - 401 → `{ ok: false, code: 'SHEETS_AUTH_401_KEY_INVALID' }`、alert-relay へ POST 1 回、payload に `category: 'sheets-auth'` を含む
  - 403 → 同上で `SHEETS_AUTH_403_FORBIDDEN`
  - 500 → alert-relay POST されない（isAuthFailure: false）
  - alert-relay POST が throw しても healthcheck は rethrow しない

## 5. contract: alert-relay schema 拡張

- `category: 'sheets-auth'` payload を受理し 200 を返す
- 既存 dedup KV キーが `alert:sheets-auth:SHEETS_AUTH_401_KEY_INVALID:<window>` 形式で書かれる
- 10 分窓内 3 回目以降は dedup により Slack/mail 送信が skip される

## 6. regression: 既存 sync ジョブ rethrow 維持

- `backfill` / `manual` / `sync-sheets-to-d1` で 401 を mock した場合、関数呼び出し側に **例外が伝播**する（既存挙動）
- かつ `console.error` が `event: 'sheets.auth.failure'` で 1 回呼ばれる

## 7. CI gate（Phase 7 と連携）

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm --filter @ubm/api test` で全 spec 緑
- カバレッジ: classifier / logger は branch 100%、healthcheck は 401/403/200/500 の 4 分岐を網羅

## 8. テスト命名規約

新規 test ファイルは `*.spec.ts` のみ。`*.test.ts` は禁止（lefthook `block-test-suffix` と GitHub Actions `verify-test-suffix` が reject）。
