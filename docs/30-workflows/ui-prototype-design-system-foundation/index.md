---
workflow_id: ui-prototype-design-system-foundation
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-18
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_RUNTIME_PENDING
implementation_mode: greenfield-foundation
implementation_status: local_static_evidence_captured_runtime_visual_pending
prototype_coverage: PROTOTYPE-COVERAGE.md
---

# UI Prototype Design System Foundation

## 目的

`docs/00-getting-started-manual/claude-design-prototype/` で凍結された UI プロトタイプの「画面背景・サーフェス階層・カードの陰影・余白リズム・タイポスケール・配色の雰囲気」を、**全画面（公開・会員・管理・ログイン・エラー・notFound・loading）で機械的に再現される仕組み**として `apps/web` に実装するための workflow root。

現状は OKLch トークン正本化（`apps/web/src/styles/tokens.css`）と Tailwind v4 bridge（`apps/web/src/styles/globals.css`）に加え、parallel-01 の P1-1〜P1-5 selector contract と admin shell width hook が `runtime_pending` まで実装済み。残る未完は **AppShell data binding・blueprint からの page.tsx 生成・Form response → 個別プロフィール表示・serial-07 visual runtime evidence** である。

本 workflow はこの 4 つの欠落を埋め、プロトタイプ未掲載画面（管理画面群・register・privacy・terms・login・error・not-found）も同じ primitives と rhythm で構成される共通基盤を作る。

## Prototype Coverage SSOT

プロトタイプ情報の全反映確認は `PROTOTYPE-COVERAGE.md` を正本とする。対象は `claude-design-prototype/{app.jsx,data.jsx,icons.jsx,index.html,pages-admin.jsx,pages-member.jsx,pages-public.jsx,primitives.jsx,styles.css}` と `specs/09a..09h` で、各情報を以下に分類する。

| 分類 | 反映先 |
|------|--------|
| tokens / rhythm / CSS selector | `parallel-01-globals-css-rhythm/`, `parallel-02-prototype-css-rules-port/` |
| app shell / fallback / fixture | `parallel-03-appshell-layouts/`, `parallel-04-shared-page-chrome/`, `serial-07-regression-evidence/` |
| page blueprint / route binding | `serial-05-page-routes-blueprint-binding/` |
| form response / member detail binding | `serial-06-form-response-binding/` |
| visual proof / regression | `serial-07-regression-evidence/` |

現行コードの物理配置は `PROTOTYPE-COVERAGE.md` の `current_app_path` を優先する。特に `/login` / `/profile` / `/privacy` / `/terms` は route group ではなく root 配下の既存ファイルを編集対象とする。

## スコープ

| 含む | 含まない |
|------|---------|
| `globals.css` の `@layer components` で page background / surface / card / typography rhythm を機械化 | 新規 API endpoint 追加 |
| プロトタイプ CSS の selector ベース規則（tag pill / member card hover / `[data-visibility]` marker）の移植 | D1 schema 変更 |
| 3 系統の AppShell layout（`(public)` / `(admin)` / `(member)`）作成 | Google Form 仕様変更 |
| `app/error.tsx` / `not-found.tsx` / `loading.tsx` / root `app/layout.tsx` | 既存 primitives の API 変更 |
| 19 routes 全 page.tsx を 09e/f/g blueprint + primitives で生成 | プロトタイプ自身の修正 |
| `/(public)/members/[id]` で API response_fields を MemberDetail カードに描画 | |
| Playwright visual evidence + verify-design-tokens regression | |

## 不変条件（CLAUDE.md UI prototype alignment セクションを継承）

1. 既存 API endpoint surface のみ接続。`apps/api/src/routes/` に新規 endpoint を追加しない。
2. OKLch トークン正本化。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。
3. プロトタイプ正本順位。primitives + tokens + rhythm をデザイン言語の正本とする。プロトタイプ未掲載画面も同じ primitives 群で構成し、新規 primitive を生やさない。
4. `apps/web` から D1 binding 直接アクセス禁止。

## サブワークフロー構成（責務ごと・直列/並列をディレクトリ名で表現）

| ディレクトリ | 種別 | 責務 | 依存 |
|-------------|------|------|------|
| `serial-00-design/` | 直列・前提 | Phase 1-3 設計書（要件・アーキ・タスク分解） | なし |
| `parallel-01-globals-css-rhythm/` | 並列 | globals.css `@layer components` で page background / surface / card / typography rhythm 翻訳、admin shell width 調整（runtime_pending） | serial-00 |
| `parallel-02-prototype-css-rules-port/` | 並列 | tag pill / member card hover / `[data-visibility]` marker など selector 規則を globals.css に転記 | serial-00 |
| `parallel-03-appshell-layouts/` | 並列 | `(public)/layout.tsx` / `(admin)/layout.tsx` / `(member)/layout.tsx` 共通 chrome | serial-00 |
| `parallel-04-shared-page-chrome/` | 並列 | root `app/layout.tsx`（ToastProvider 配置）/ `error.tsx` / `not-found.tsx` / `loading.tsx` | serial-00 |
| `serial-05-page-routes-blueprint-binding/` | 直列 | 19 routes 全 page.tsx を blueprint + primitives で生成 | parallel-01..04 |
| `serial-06-form-response-binding/` | 直列 | `/(public)/members/[id]` で response_fields → MemberDetail 描画接続 | serial-05 |
| `serial-07-regression-evidence/` | 直列 | Playwright visual + verify-design-tokens regression | serial-06 |

`serial-00-design/` は Phase 1-3 の設計前提だけを持つ非実行 preface とする。実装サブワークフロー（`parallel-01..04`, `serial-05..07`）は Phase 1〜13 の md ファイルを配置する。

## 正本順位

1. 本 workflow root の `SCOPE.md` および `serial-00-design/` Phase 1-3
2. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` の既存 SCOPE / improvements 仕様
3. `docs/00-getting-started-manual/specs/09a..09h-*.md`
4. プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/`
5. Google Form 仕様 `docs/00-getting-started-manual/google-form/`

衝突時は上位を優先する。

## CONST_007 適合宣言

本 workflow の全サブワークフローは、後続の実装プロンプト（`03.実装.md`）の **1 サイクル内で完了**できるスコープに収めている。先送り前提のサブワークフローは存在しない。

## 関連 workflow

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` — 既存の UI 復旧 workflow。本 workflow はその「全画面共通の雰囲気反映の仕組み」を補完する位置づけ。
