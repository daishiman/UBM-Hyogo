# Phase 10: リファクタ概要

## 適用したリファクタ

| # | 内容 | ファイル |
| --- | --- | --- |
| R1 | `RequestActionPanel.tsx` の `onSubmitted` から `router.refresh()` 重複呼び出しを削除 | `RequestActionPanel.tsx` |
| R2 | accepted bridge state を `useState<QueueAccepted \| null>` で受け、server reads（`/me/profile.pendingRequests`）が確定するまでの banner 表示橋渡しに限定 | `RequestActionPanel.tsx` |
| R3 | dialog 内 `useRouter()` は共通 util 化せず React idiom に従い各 dialog で個別 hook 呼び出し（無視可能なコスト・凝集度優先） | `VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx` |

## 採用しなかった案

- **shared util `useRefreshAfterMutation`**: 抽象化が早すぎる（2 callsite / 1 行 hook）。CONST_006 + Clean Code SRP の観点で見送り
- **楽観的 UI**: server state を正本とする MVP 方針に反するため不採用
- **`router.refresh()` を `requestAnimationFrame` で defer**: 不要な複雑化。React の state update batching で十分

## 残課題

- なし（local evidence 範囲内）
- Phase 11 で取得する VISUAL evidence によって Banner 即時表示の挙動を最終確認する
