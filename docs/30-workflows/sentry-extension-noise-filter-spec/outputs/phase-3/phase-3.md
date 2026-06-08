# Phase 3: 設計レビュー（Phase 4 進行可否判定）

## 判定: ✅ PASS（Phase 4 へ進行可）

## レビュー観点

| 観点 | 判定 | 根拠 |
|------|------|------|
| 真の論点が 1 文で固定されているか | ✅ | Phase 1 §1。「Sentry へのノイズ流入を止める／拡張バグそのものは直せない事実を取り違えない」 |
| 責務境界 | ✅ | 判定（pure module）と SDK 起動（instrumentation-client）を分離（Phase 2 §1） |
| fail-open 保証（実エラーを失わない） | ✅ | AC-2 / AC-6。判定不能時は event を残す（Phase 2 §3） |
| 既存制約との整合 | ✅ | client SDK-only / fail-soft / `*.spec.ts` / 命名規則すべて踏襲 |
| テスト可能性 | ✅ | 型のみ依存の pure module。SDK 起動なしで検証可（AC-5） |
| スコープの正直さ | ✅ | 到達不能ノイズ（OUT-1）を「直せる」と誤標榜しない。Phase 1 §4 / index.md に明記 |
| 1 サイクル完了（CONST_007） | ✅ | 1 module + 1 配線 + 1 spec。先送りなし |

## MINOR 指摘（未タスク化判断は Phase 10 / Phase 12 で確定）

| ID | 指摘 | 対応方針 |
|----|------|----------|
| MINOR-1 | `import type` の alias（`@/` vs 相対）は実ファイルに合わせ Phase 5 で確定 | Phase 5 実装手順に明記済み。未タスク化不要（実装時に解決する設計内事項） |
| MINOR-2 | `denyUrls` の最終フレーム依存の穴 | `beforeSend` 全走査で補完済み（Phase 2 §5）。残課題なし |
| MINOR-3 | 除外パターンの将来追加 | 同 module 定数追記で閉じる設計。恒常的な拡張点として許容。未タスク化不要 |

> 到達不能ノイズ（OUT-1）は「実装余地が存在しない」ため未タスク化対象外（Phase 12 で 0 件根拠として記録）。

## ライブラリ選定確認

- 新規依存追加なし。既存 `@sentry/nextjs ^10.51.0` の `ignoreErrors` / `denyUrls` / `beforeSend` API のみ使用。
- `beforeSend` の v10 signature: `(event: ErrorEvent, hint: EventHint) => ErrorEvent | null | PromiseLike<...>`。本実装は同期 `ErrorEvent | null` を返す（PromiseLike 不使用）。

## ゲート結論

設計に blocker なし。Phase 4（テスト作成）へ進む。
