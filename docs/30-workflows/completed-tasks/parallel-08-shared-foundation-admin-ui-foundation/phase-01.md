# Phase 1: 要件定義

## メタ情報

- taskId: `parallel-08-shared-foundation-admin-ui-foundation`
- phase: 1 / 13
- 実装区分: **実装仕様書**
- 判定根拠: root layout 変更（modify）+ hook ファイル 2 個新規作成（create）。confirm のみのファイルも存在するが、create/modify が含まれる以上は実装仕様書として扱う。

## 目的

serial-05/step-01〜07 が暗黙に依存する **admin UI 共通基盤**を明示的に整備し、後続 step の `import { useAdminMutation } from "@/features/admin/hooks"` を unblock する。本 Phase では既存 inventory の実測と Acceptance Criteria の確定までを行う。

## 実行タスク

1. P50 チェック（自己完結性 / 単一サイクル完了性）
2. 既存資産 inventory の実測 evidence 取得
3. 変更対象ファイルの種別確定（create / modify / confirm）
4. Acceptance Criteria（AC-1〜AC-7）の確定
5. 制約条件の宣言

## 参照資料

- ソース spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`
- CLAUDE.md `UI prototype alignment / MVP recovery` セクション
- CLAUDE.md `apps/web env アクセス不変条件`

## P50 チェック

| 観点 | 判定 | 根拠 |
|------|------|------|
| 単一責務 | PASS | "admin UI 共通基盤の明示化" の1責務 |
| 1サイクル完了性 | PASS | hook skeleton + layout wrap + confirm のみで closed |
| 副作用範囲 | PASS | `apps/web` 内・root layout の context 追加のみ |
| 既存契約破壊 | PASS | ToastProvider は追加レイヤ・既存 children は不変 |
| 並列性 | PASS | parallel-01..07 と独立 |
| 先送り表現 | PASS | "後続で実装" は serial-05/step-01 への明示的 hand-off のみ |

## 既存 Inventory（実測 evidence）

| Path | Lines | 状態 | 備考 |
|------|-------|------|------|
| `apps/web/app/layout.tsx` | 16 | 存在・要 modify | `<body>{children}</body>` のみ。Provider 未配置 |
| `apps/web/src/components/ui/Toast.tsx` | 42 | 存在 | `ToastProvider` / `useToast()` を export 済み。`useToast` は scope 外で throw |
| `apps/web/middleware.ts` | 86 | 存在 | matcher `["/admin/:path*", "/profile/:path*"]`、isAdmin=false で 403 |
| `apps/web/app/(admin)/admin/error.tsx` | 10 | 存在 | `"use client"` + role=alert + reset() button |
| `apps/web/src/features/admin/hooks/` | - | **未作成** | ディレクトリごと新規作成必要 |
| `apps/web/src/features/admin/components/` | - | 存在 | hooks と兄弟ディレクトリとして並置 |

> ソース spec 内の `apps/web/app/(admin)/error.tsx` は誤記。実体は `apps/web/app/(admin)/admin/error.tsx`。本仕様書は実体パスを正とする。

## Acceptance Criteria

| ID | 内容 | 検証方法 |
|----|------|----------|
| AC-1 | root `<body>` 直下が `ToastProvider` で wrap されている | Phase 4 contract test / Playwright DOM 検査 |
| AC-2 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` が存在し、`useAdminMutation` / `AdminMutationOptions` / `AdminMutationResult` を export | Vitest type import |
| AC-3 | `useAdminMutation` 本体は `throw new Error("implementation in step-01")` で skeleton 状態 | grep + ランタイム throw 確認 |
| AC-4 | `apps/web/src/features/admin/hooks/index.ts` が hook と型を re-export し、`@/features/admin/hooks` で import 可能 | Vitest dynamic import |
| AC-5 | `(admin)/admin/error.tsx` が reset button + error.message を表示する既存実装のまま | inventory snapshot |
| AC-6 | `middleware.ts` の `/admin/:path*` matcher と isAdmin guard が現状維持 | inventory snapshot |
| AC-7 | API error response の既存 shape を棚卸しし、step-01 の `useAdminMutation` 実装が `{ error: string }` と `{ ok: false, error: string }` の両方を扱う契約にする | Phase 2 で list 化 / Phase 4 contract |

## 入出力 / 副作用（要件レベル）

- **Input**: ソース spec / 既存ファイル
- **Output**: 上記 3 ファイル（create 2, modify 1）
- **副作用**: `useToast()` scope が全ルート (`/`, `/login`, `/admin/*`, `/profile/*`, `/(public)/*`) に拡張される。`useToast` が無 Provider 環境で throw する既存実装は wrap により全ルートで安全に呼び出し可能になる。

## 制約

| 制約 | 出典 |
|------|------|
| 新規 API endpoint 追加禁止 | CLAUDE.md 不変条件 |
| D1 schema 変更禁止 | 同上 |
| `apps/web` から D1 直接アクセス禁止 | 不変条件 #5 |
| OKLch tokens 直書き HEX 禁止 | task-09 / verify-design-tokens CI gate |
| `*.test.{ts,tsx}` 命名禁止（`*.spec.{ts,tsx}` のみ） | CLAUDE.md 不変条件 #8 |
| serial-05/step-01 より**前**に完了 | 依存関係 |

## 統合テスト連携

- Phase 4 で Playwright `/admin` page load + error catch + toast の 3 観点を pin する
- contract test として `useAdminMutation` 関数 export と型 export の存在を Vitest で固定
- serial-05/step-01 開始前に `pnpm -F "@ubm-hyogo/web" tsc --noEmit` が green であることを確認

## 多角的チェック観点（AI 判断）

- ToastProvider が `"use client"` 境界を持つことで root layout の Server Component 性が壊れないか → `ToastProvider` を import するだけなら問題なし（子 component が client/server を選べる Next.js App Router 仕様）
- `useToast` を呼ぶ component は client 限定。skeleton hook 自体も client hook 扱い
- middleware 経由でアクセスする `/admin` に到達できない non-admin が UI 共通基盤に触れる経路はない（防御層が前段）

## サブタスク管理

- [ ] inventory 実測（完了）
- [ ] AC 確定
- [ ] 制約宣言
- [ ] Phase 2 への hand-off 項目列挙

## 成果物

- 本 phase-01.md（要件・制約・AC 確定済み）
- artifacts.json `phases[0].status = pending → in_progress → done` 遷移

## 完了条件 (DoD)

- [ ] AC-1〜AC-7 が確定している
- [ ] 既存 inventory の実測値（line 数・存在/未存在）が反映済み
- [ ] 制約一覧が CLAUDE.md と整合
- [ ] ソース spec の誤記（`(admin)/error.tsx`）が正規化済み

## タスク100%実行確認【必須】

- [ ] P50 チェックを全観点で通過
- [ ] 変更対象ファイル一覧と種別（create/modify/confirm）が確定
- [ ] AC が機械検証可能な粒度で記述されている
- [ ] 先送り表現なし（"後続で〜" は serial-05 への hand-off のみ）

## 次 Phase

Phase 2（設計）: concern 別 target topology / validation matrix / import 経路 4 層整合表
