# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-16 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

i01-toastprovider-root-mount の必要性・スコープ・受入条件を確定し、Phase 2 設計に渡す入力を固定する。
本 Phase で次の 3 つの真の論点を明文化する:

1. `ToastProvider` を Next.js 16 App Router の **どこに置くか**（root layout / per-segment / per-route）
2. `Toast.tsx` が server-side import 可能か（`"use client"` の有無で wrapper の要不要が決まる）
3. SSR streaming と context provider の **hydration 安全性** を担保できる import 経路はどれか

## 真の論点

### 論点 1: ToastProvider の配置場所

選択肢:
- **(A) root layout (`apps/web/app/layout.tsx`)**: 全 route で利用可能。admin / profile / public いずれからも `useToast()` 呼び出し可。**第一推奨**。
- **(B) (admin) segment 限定 (`apps/web/app/(admin)/admin/layout.tsx`)**: scope 最小化。ただし profile (request dialog) で toast を使う場合に context 不在で再発する → **不採用**。
- **(C) 各 page で個別 wrap**: 重複多すぎ・破綻 → **不採用**。

→ **(A) root layout 配置** を採用。

### 論点 2: Toast.tsx の client directive 状態

実コード確認手順（Phase 2 で実施）:
- `head -1 apps/web/src/components/ui/Toast.tsx` で `"use client"` の有無を確認
- `export function ToastProvider` の宣言が React `createContext` を使うため、本質的に client component である

ケース分岐:
- **(i) `"use client"` あり**: `import { ToastProvider } from "@/components/ui/Toast"` で root から直接 import 可能。RSC root から client subtree を埋め込む形（Next.js 16 標準パターン）。
- **(ii) `"use client"` なし**: server context に置けず build fail。`apps/web/src/components/ui/ToastProviderClient.tsx` を 1 行 wrapper として新設。

→ Phase 2 で実態を確認の上、(i) を default、(ii) を fallback として決定する。

### 論点 3: hydration 安全性

`ToastProvider` が初期 state を持つ場合（`useState([])` 等）、SSR と client で初期値が一致する必要がある。
既存 `Toast.tsx` を Phase 2 で確認し、初期 state が server snapshot と一致するかを検証する。
不一致がある場合は wrapper で `useEffect` 経由で client-only mount に倒す（最終手段）。

## スコープ確定

### 含む
- `apps/web/app/layout.tsx` への `ToastProvider` 配置
- `Toast.tsx` client directive 確認 → wrapper 要否決定
- 既存 `useAdminMutation.spec.tsx` の再実行確認
- dev で admin route から toast を意図的に発火させる visual smoke

### 含まない
- Toast variant / a11y 設定変更
- admin 以外で toast 利用を新規追加
- API endpoint / D1 変更

## 受入条件 (AC)

index.md の AC-1〜AC-7 を本 Phase で固定。Phase 2 以降で各 AC に対応する成果物を生成する。

## 実行タスク

1. `apps/web/app/layout.tsx` の現状を Read で確認
2. `apps/web/src/components/ui/Toast.tsx` の冒頭 + `ToastProvider` export を Read で確認
3. `useAdminMutation.ts` で `useOptionalToast()` / `useToast()` の呼び出し有無を grep で確認
4. 上記 3 点を `outputs/phase-01/requirements.md` に固定する

## 参照資料

| パス | 用途 |
| --- | --- |
| docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i01-toastprovider-root-mount/spec.md | 原典 |
| docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md | p-08 DoD |
| apps/web/app/layout.tsx | 変更対象 |
| apps/web/src/components/ui/Toast.tsx | Provider 実体 |

## 多角的チェック観点

- システム系: root layout で context を flat に配置することで、admin / profile / public の各 route が単一の toast queue を共有する → 状態所有権が ToastProvider に集約される
- 戦略系: 「全 route 共通の通知 surface を作る」価値と「scope が広がるリスク」のトレードオフ。serial-05 unblock 価値が支配的
- 問題系: 真の論点は配置場所ではなく **client boundary の整合**。Phase 2 で `Toast.tsx` の directive を fact 確認することで論点が解消する

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-01/requirements.md | 要件定義主成果物（AC / 真の論点 / スコープ） |

## 完了条件

- [x] AC-1〜AC-7 が確定
- [x] 真の論点 1〜3 の解決方針が outputs/phase-01/requirements.md に固定
- [x] Phase 2 に渡す入力（`Toast.tsx` directive 状態の確認方法）が記載されている

## タスク 100% 実行確認【必須】

- [x] index.md と AC が一致
- [x] 真の論点 3 件すべて記載
- [x] スコープ含む/含まないが明示

## 次 Phase

Phase 2: 設計（client boundary decision / wrapper strategy）
