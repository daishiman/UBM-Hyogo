# Phase 3 — 設計レビュー

## 1. レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| Task A 依存の明示 | OK | Phase 1/2 で `getAuthView()` を Task A 導入物と明記 |
| 最小差分原則 | OK | `(public)` route group 移動を不採用、`page.tsx` 2 file + spec 2 file のみ |
| 既存 metadata / 本文の維持 | OK | DoD/AC で title/description/h1/h2/p の現状一致を固定 |
| OKLch token 正本 | OK | `var(--ubm-color-...)` のみ、HEX 直書きなし |
| 不変条件（D1 boundary / process.env / test suffix） | OK | 該当変更なし。spec は `*.spec.tsx` |
| 1 サイクル完結（CONST_007） | OK | 編集 4 file + DoD で完結、先送りなし |
| 回帰検出可能性 | OK | vitest spec 2 本で shell / header / footer / h1 / metadata を固定 |

## 2. 代替案と却下理由

| 代替案 | 採否 | 理由 |
|--------|------|------|
| `(public)` route group へ移動して `layout.tsx` でラップ | 却下 | route 変更が広範囲影響。最小差分原則と footer 整合のため `page.tsx` 直書き優先 |
| 専用 `PublicShell` primitive 抽出 | 却下 | 2 page のみで primitive 抽出は早計。Task D/E/F で広がれば後続で抽出検討 |
| LegalProse 本文更新を同梱 | 却下 | 法務確認待ち。本 Task のスコープ外 |
| `getAuthView()` 呼び出しを try/catch で包む | 却下 | fail-closed は Task A の責務。二重防御は責務漏洩 |

## 3. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| Task A が未完了の状態で本 Task に着手 | Phase 5 で `getAuthView()` import が解決できるかを最初に確認。未存在なら本 Task を block |
| spec が `getAuthView` を mock し忘れて Auth.js 実体に到達 | Phase 4 / 6 で `vi.mock("../../../src/lib/auth-view", ...)` を必須化 |
| metadata 変更の偶発的混入 | DoD で metadata 完全一致を grep verify |

## 4. 承認

- 設計レビュー結果: **approved**
- 次フェーズ: Phase 4 テスト作成
