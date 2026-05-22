---
phase: 3
title: タスク分解 — 4 ファイル × step 単位の WBS
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. WBS 概要

本サブワークフローは 4 ファイルを **編集（既存）** する。各ファイル 3〜5 step、合計 17 step。

| グループ | ファイル | step 数 |
|---------|---------|--------|
| G1 | `apps/web/app/layout.tsx` | 5 |
| G2 | `apps/web/app/error.tsx` | 4 |
| G3 | `apps/web/app/not-found.tsx` | 4 |
| G4 | `apps/web/app/loading.tsx` | 4 |

> **編集 vs 新規**: 4 ファイルは既に `apps/web/app/` 配下に存在する（Phase 1 §5 参照）。本サブワークフローは「既存ファイルを仕様準拠化する編集」として扱う。

## 2. G1 — `apps/web/app/layout.tsx`

| step | 内容 | 完了基準 |
|------|------|---------|
| G1-1 | css import を 2 行に整理し、`tokens.css` → `globals.css` の順で固定する | 冒頭 2 行で 2 ファイルが import される（順序固定） |
| G1-2 | `<html lang="ja" data-theme="warm">` に変更する | JSX 上で `data-theme="warm"` が読み取れる |
| G1-3 | `metadata` を `{ title: { default, template }, description }` 形式に再構成する | `metadata` export 1 つ |
| G1-4 | `viewport` export を追加する（`width / initialScale / themeColor`） | `viewport` export 1 つ |
| G1-5 | ToastProvider の配置を `<body>` 直下に維持し、子に `{children}` のみを渡す | JSX 構造が Phase 2 §1 と一致 |

## 3. G2 — `apps/web/app/error.tsx`

| step | 内容 | 完了基準 |
|------|------|---------|
| G2-1 | 冒頭 `"use client"` 維持。型 `Props = { error: Error & { digest?: string }; reset: () => void }` を inline 定義 | 型契約一致 |
| G2-2 | logger.error 呼び出しを `useEffect` 内に維持（FR-10） | render 中の副作用なし |
| G2-3 | JSX を Card primitive 派生に再構成する（`<Card>`/`<CardHeader>`/`<CardContent>`、ErrorCard 命名はファイル内 alias 不要） | Tailwind 直接 utility ではなく `ui-card-*` class が主体 |
| G2-4 | 「再試行する」ボタン / 「トップへ戻る」リンク 2 つを `<CardFooter>` 相当に配置 | reset() がボタン onClick に紐づく |

## 4. G3 — `apps/web/app/not-found.tsx`

| step | 内容 | 完了基準 |
|------|------|---------|
| G3-1 | Server Component 維持（`"use client"` 付けない） | directive なし |
| G3-2 | `<EmptyState>` を `<Card>` で囲む構造に変更（NotFoundCard 命名はファイル内 alias 不要） | Card + EmptyState 二段構成 |
| G3-3 | `title = "ページが見つかりません"` / `description = "URL をご確認ください"` / `action` に「トップへ戻る」「メンバー一覧へ」 | EmptyState props 経由で文字列指定 |
| G3-4 | `aria-labelledby` / `data-page="not-found"` / `data-testid="not-found"` を維持 | a11y 属性が JSX 上で確認可能 |

## 5. G4 — `apps/web/app/loading.tsx`

| step | 内容 | 完了基準 |
|------|------|---------|
| G4-1 | Server Component 維持 | directive なし |
| G4-2 | `role="status" aria-busy="true" aria-live="polite"` を維持 | a11y 属性が JSX 上で確認可能 |
| G4-3 | skeleton 矩形を `ui-card` または `ui-card-content` 派生の skeleton class で表現（globals.css 側の class 名は parallel-01 が定義） | bg-surface-2 直書きから class ベースへ移行 |
| G4-4 | `<span class="sr-only">読み込み中</span>` を維持 | スクリーンリーダー対応文言が存在 |

## 6. 依存関係

```
serial-00-design (Phase 1-3)
   ↓
parallel-01 / parallel-02 / parallel-03 / parallel-04（並列実装）
   ↓ (相互レビュー gate: ToastProvider 単一配置 / selector hook / skeleton rhythm)
serial-05-page-routes-blueprint-binding
```

並列性: parallel-01 / 02 / 03 / 04 は実装順序としては並列。依存関係は直列実装ではなく、契約確認 gate として扱う。ToastProvider は root layout の hard contract、`ui-card-*` / skeleton rhythm / selector hook は soft contract として Phase 4 に集約し、各並列 sub-workflow が相互レビューで確認する。

## 7. 工数見積（参考）

| step グループ | 想定時間 |
|--------------|---------|
| G1 (layout) | 20 分 |
| G2 (error) | 20 分 |
| G3 (not-found) | 15 分 |
| G4 (loading) | 15 分 |
| typecheck / lint / build | 10 分 |
| 合計 | 1.5 時間 |

## 8. リスクの先取り

| リスク | 対応 step |
|-------|----------|
| ToastProvider 二重ラップ | G1-5 で root 1 か所に固定。parallel-03 仕様レビュー時に再確認 |
| Card primitive が Workers bundle に乗らない | G2-3 / G3-2 で import path を `../src/components/ui/Card` に固定し、root Vitest と Next build の両方で検証 |
| viewport export 追加で既存 metadata 解釈が壊れる | G1-3 / G1-4 を順序遵守し、`pnpm build` で SSR 出力を確認 |
| `themeColor` の OKLch 表現を browser が解釈できない | meta tag の `themeColor` は OKLch サポートが古い browser で無視されるだけで build を fail させない。Phase 9 リスクで明記 |

## 9. 参照

- Phase 1 / Phase 2
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-03-task-breakdown.md`
- `apps/web/app/layout.tsx`（編集対象）
- `apps/web/app/error.tsx`（編集対象）
- `apps/web/app/not-found.tsx`（編集対象）
- `apps/web/app/loading.tsx`（編集対象）
