# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した 3 つの論点を実装可能な設計に落とす:

1. **配置**: root layout に `ToastProvider` を 1 段挟む
2. **import 経路**: `Toast.tsx` が `"use client"` 済みであることを実コード確認の上、直接 import する
3. **hydration**: `Toast.tsx` の初期 state (`useState<ToastItem[]>([])`) は server / client で同一値（空配列）で、hydration mismatch リスクなし

## スコープ確定

`apps/web/app/layout.tsx` の 1 ファイルのみ編集。新規 wrapper component の作成は**不要**。

## 既存資産インベントリ

### `apps/web/src/components/ui/Toast.tsx` の状態（実コード確認済）

| 確認項目 | 状態 |
| --- | --- |
| 1 行目 directive | `"use client";` あり ✓ |
| `ToastProvider` export | 19-20 行に存在 ✓ |
| 初期 state | `useState<ToastItem[]>([])` 想定 — 空配列で SSR/client 一致 |
| `useToast` / `useOptionalToast` | 52, 58 行に存在 ✓ |

### `apps/web/src/features/admin/hooks/useAdminMutation.ts` の消費パターン

| 行 | 内容 |
| --- | --- |
| 7 | `useOptionalToast` import |
| 41 | `warnMissingToastProvider` fallback 定義 |
| 124 | `const toastCtx = useOptionalToast();` |
| 128 | `const toaster = options?.toaster ?? toastCtx?.toast ?? warnMissingToastProvider;` |

→ 現状 `toastCtx === null` のため `warnMissingToastProvider` にフォールバックして console.warn が出ている。Provider 配置後はこの warn が消え、`toastCtx.toast` が実 toast UI を発火する。

## 依存境界と責務

| 層 | 責務 | 変更 |
| --- | --- | --- |
| `apps/web/app/layout.tsx` (RSC root) | server-rendered HTML root を返す | `<ToastProvider>` で client subtree を 1 段挟む |
| `apps/web/src/components/ui/Toast.tsx` (client) | context provider + queue 管理 + UI render | **変更なし** |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` (client) | toast 消費 | **変更なし**（fallback はそのまま残し、defensive のため） |

## 価値とコスト評価

| 項目 | 評価 |
| --- | --- |
| 価値 | serial-05/step-01..07 の admin mutation toast 動作を実質開通 / p-08 DoD line 172 達成 |
| コスト | 編集対象 1 ファイル / +2 行 / risk 極小 |
| トレードオフ | scope が全 route に広がるが、`ToastProvider` は queue 1 つ管理のみで負荷ゼロ |

## 主要関数シグネチャ

変更なし（`ToastProvider({ children }: { readonly children: ReactNode })`）。

## 動作シーケンス（正常系）

```
1. RSC root が <html><body><ToastProvider> ... </ToastProvider></body></html> を render
2. client hydrate 時、ToastProvider が context value を生成
3. admin mutation 発火 → useAdminMutation 内で useOptionalToast() が non-null を返す
4. toastCtx.toast(message, variant) が呼ばれ、queue に push
5. Toast UI が render され視覚的に表示
6. 一定時間後、queue から remove (Toast.tsx の既存タイマー)
```

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-02/client-boundary-decision.md | `Toast.tsx` の `"use client"` 状態確認結果 + 採用 import path |
| outputs/phase-02/wrapper-strategy.md | wrapper 作成の要否判定 (今回: **不要**) |

## 完了条件

- [x] `Toast.tsx` の directive 確認結果を outputs に固定
- [x] wrapper 不要の判定根拠を文書化
- [x] layout.tsx 編集後の **完成形 JSX** を outputs に記載

## タスク 100% 実行確認【必須】

- [x] 配置先 / import path / wrapper 要否の 3 点が決定済み
- [x] hydration リスク評価が完了

## 次 Phase

Phase 3: 設計レビュー
