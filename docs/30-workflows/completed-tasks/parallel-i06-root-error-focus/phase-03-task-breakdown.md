---
phase: 3
title: タスク分解
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. 実行単位

| ID | 単位 | 対象 | 差分量 | 依存 |
|----|------|------|--------|------|
| T-01 | `useRef` import を追加 | `apps/web/app/error.tsx` L4 | +1 行（既存 import 行を編集） | なし |
| T-02 | コンポーネント先頭で `headingRef` を生成 | `apps/web/app/error.tsx` L13 直後 | +1 行 | T-01 |
| T-03 | useEffect 内で `focus({ preventScroll: true })` を追加 | `apps/web/app/error.tsx` 既存 useEffect | +1 行 | T-02 |
| T-04 | h1 に `ref={headingRef} tabIndex={-1}` を付与 | `apps/web/app/error.tsx` 既存 h1 | +1 行（既存 h1 開始タグを編集） | T-02 |
| T-05 | spec ファイル新規作成 | `apps/web/app/error.spec.tsx` | 新規（約 25 行） | T-01..T-04 |

合計差分: コード 4 行（編集 2 + 追加 2）+ test ファイル 1 件。

## 2. 並列性

T-01〜T-04 は同一ファイル内編集のため **直列**。
T-05 は T-01..T-04 完了後に検証として実行。

サブワークフロー分割は行わない（CONST_007: 単一サイクルで完結）。

## 3. 影響範囲

| パス | 種別 | 影響 |
|------|------|------|
| `apps/web/app/error.tsx` | 編集 | 4 行 |
| `apps/web/app/error.spec.tsx` | 新規 | 1 ファイル |
| その他 | 影響なし | — |

## 4. 完了順序

```
T-01 (import) → T-02 (ref生成) → T-03 (focus呼び出し) → T-04 (h1 attr) → T-05 (spec)
                                                                    ↓
                                                  pnpm typecheck / lint / test
```

## 5. 未タスク候補

なし。本タスクは source spec の DoD を 1 サイクルで完結させる。
