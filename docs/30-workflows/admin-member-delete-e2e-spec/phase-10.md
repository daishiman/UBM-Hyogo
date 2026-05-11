# Phase 10: デプロイ準備

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. デプロイ対象

**なし**（spec ファイル追加のみ。runtime artifact / Cloudflare Workers deploy 影響なし）。

| 観点 | 判定 |
|------|------|
| Cloudflare Workers deploy 必要性 | 不要 |
| D1 migration | なし |
| Secret rotation | なし |
| Variables 追加 | なし |
| `wrangler.toml` 変更 | なし |

## 2. CI への影響

| # | gate | 影響 |
|---|------|------|
| 1 | `pnpm typecheck` | spec ファイル含めて pass 維持 |
| 2 | `pnpm lint` | pass 維持 |
| 3 | E2E test job | spec 1 ファイル追加で実行時間が +30〜60 秒程度増える想定 |
| 4 | `verify-design-tokens` | 影響なし（spec で色値直書きなし） |
| 5 | `verify-indexes-up-to-date` | 影響なし（skill indexes 変更なし） |
| 6 | E2E lines coverage gate（>= 80%） | 維持または向上（active 5 test の追加） |

## 3. ロールバック方針

| 症状 | 対応 |
|------|------|
| spec が flaky で CI 不安定 | 対象 spec を `test.describe.fixme` で一時無効化せず、原因特定後に修正 PR を再投入。CONST_007 により先送り skip 禁止 |
| 422 mock が UI 側仕様変更で外れる | UI 側 error handler 仕様の変更点を確認し spec 側 mock を更新 |

## 4. 事前確認コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium
```

すべて exit 0 を確認後 Phase 11 へ進む。
