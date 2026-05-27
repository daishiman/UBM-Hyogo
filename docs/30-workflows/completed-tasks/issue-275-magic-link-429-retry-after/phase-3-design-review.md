# Phase 3: 設計レビュー

> 実装区分: **実装仕様書**

## 1. 整合性チェック

| 観点 | 結果 | 根拠 |
|---|---|---|
| CLAUDE.md 不変条件 #5（apps/web から D1 直接禁止） | ✓ | 本変更は client / form のみ。API は既存 proxy 経由のまま |
| CLAUDE.md 不変条件 #9（admin mutation 統一） | ✓ | admin 配下外 |
| `apps/web` env アクセス不変条件 | ✓ | `process.env.*` 直参照を追加しない |
| 既存 `instanceof MagicLinkRequestError` 判定との後方互換 | ✓ | `MagicLinkRateLimitedError` は継承関係を保つため両方 true |
| URL state を 429 時に勝手に `sent` へ遷移しない | ✓ | catch 内 early return で `replaceLoginState` を呼ばない |
| Phase 12 evidence 表 / canonical 9 headings | ✓ | Phase 12 で対応 |

## 2. 4 条件 verdict（task-specification-creator 必修）

| 条件 | 判定 | 根拠 |
|---|---|---|
| 必要十分 | PASS | typed error / 解析優先順位 / catch 分岐 / spec 追加の最小 4 要素のみ。reload 永続化や a11y 追加は scope 外と明記 |
| 単一責務 | PASS | `magic-link-client.ts` は 429 解析の責務追加のみ。`MagicLinkForm.client.tsx` は catch 分岐のみ。cooldown timer 実装は既存を再利用 |
| 依存最小 | PASS | 新規 import / 新規 npm 依存なし。既存 `setCooldown` setter / 既存 `MagicLinkRequestError` 階層を再利用 |
| テスト容易 | PASS | client spec は fetch mock のみで 4 ケース、form spec は既存 fetch mock + fake timer pattern で 2 ケース追加で完結 |

## 3. リスク再評価

| リスク | 影響 | 対策 | 残存 |
|---|---|---|---|
| `Retry-After` が HTTP date 形式（RFC 7231）で返るケース | 中 | 本 API は `buildRateLimitedResponse` で常に sec の整数文字列を返す（`String(retryAfterSec)`）。HTTP date 形式は不採用、numeric only 前提を spec に明記 | 低 |
| 429 body parse が空文字や非 JSON で fail | 低 | `.catch(() => null)` で吸収し header / default fallback で `MagicLinkRateLimitedError` を必ず throw | 低 |
| 既存 60s cooldown と server-truth 値の衝突 | 中 | 429 時は server 値で上書き、200 時は固定 60s。混在しても timer は単一のため race なし | 低 |
| typed error の継承で既存 catch ロジックの後方互換性が崩れる | 高 | `MagicLinkRateLimitedError` は `MagicLinkRequestError` を継承し `status=429` を保つ。既存 `instanceof MagicLinkRequestError` を見ている呼び出しは全て true 維持 | 低 |
| catch 早期 return で `setSubmitting(false)` がスキップされるリスク | 高 | `finally { setSubmitting(false) }` に既に閉じ込められているため、early return しても submitting flag は確実にリセット | 低 |
| 既存固定 60s cooldown を server-truth で短縮されるとブロックが短くなり攻撃に弱くなる | 中 | server-truth は常に server の rate-limit window から算出される値であり、client 固定値より信頼性が高い。攻撃面は server 側のみで担保 | 低 |

## 4. 既存 60s cooldown との関係整理

| シナリオ | client 表示 cooldown | URL state |
|---|---|---|
| 200 OK / state=sent | 60s 固定（既存） | `sent` |
| 202 Accepted | 60s 固定（既存） | `sent` |
| 429 + Retry-After: N | N 秒（server-truth） | `input`（変更なし） |
| 429 + header 無し + body retryAfterSec=N | N 秒 | `input` |
| 429 + 両欠 | 60 秒（default） | `input` |
| 4xx / 5xx（非 429） | cooldown 起動しない（既存） | `error` |

## 5. レビュー判定

**承認**: Phase 4 へ進む。
