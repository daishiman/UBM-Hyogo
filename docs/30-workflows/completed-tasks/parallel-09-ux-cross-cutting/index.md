# parallel-09-ux-cross-cutting - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/src` 配下に新規 UI primitive (`FormField` / `Pagination` / `Breadcrumb` / `Icon`) を追加し、`useAdminMutation` hook の編集と `globals.css` `@layer components` への CSS 規則追加を伴うコード実装タスク。設定ファイル単独・ドキュメント単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | PARALLEL-09-UX |
| タスク名 | 19 routes 横断 UX primitives 統一 (G9-1〜G9-9) |
| ディレクトリ | docs/30-workflows/parallel-09-ux-cross-cutting |
| 親ワークフロー | docs/30-workflows/ui-prototype-alignment-mvp-recovery |
| 原典 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | implemented_local_runtime_pending |
| タスク種別 | implementation / VISUAL_ON_EXECUTION |
| 優先度 | HIGH (parallel-01〜08 全 spec の前提となる primitive 提供) |
| GitHub Issue | (未起票・commit / push / PR / Issue 操作はユーザー明示承認後のみ) |

> **今回サイクルの境界**: 本 wave は Phase 1〜13 の実装契約に加え、`apps/web` の共通 primitive 実装と local typecheck を完了させる。Playwright visual evidence はローカルディスク不足 (`ENOSPC`) で未完了。commit、push、PR、GitHub Issue 操作、19 routes 各画面への primitive 適用はユーザー明示承認後に行う。

## 目的

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/` 配下 19 routes (公開 6 + 会員 2 + 管理 8 + 共通 3) 全体に
横断する UI primitives (form validation, empty state, pagination, icon size, breadcrumb, mobile responsive,
focus-visible, concurrent mutation guard, form state preserve) を一元化する。各 parallel spec 実装側が
即座に参照できる共通 primitive と CSS 規則を `apps/web/src` 配下に配置し、UI fragmentation を防止する。

これにより:
- parallel-01〜08 の各 spec は本 task の primitive を import するだけで UX 一貫性を担保できる
- HEX 直書きや独自 form validation pattern の散在を CI gate (`verify-design-tokens`) と組み合わせて防止できる
- 既存 `apps/web/src/components/ui/EmptyState.tsx` 等の primitive を破壊せず拡張できる

## スコープ

### 含む

- `apps/web/src/components/ui/FormField.tsx` 新規（G9-1: form validation wrapper）
- `apps/web/src/components/ui/Pagination.tsx` 新規（G9-3: meta + cursor UI）
- `apps/web/src/components/ui/Icon.tsx` 新規（G9-4: icon size convention）
- `apps/web/src/components/admin/Breadcrumb.tsx` 新規（G9-5: breadcrumb trail）
- `apps/web/src/lib/useAdminMutation.ts` 編集（G9-8/9: mutation guard + form state preserve）
- `apps/web/src/styles/globals.css` 編集（G9-1/6/7 の `@layer components` 追加）
- `apps/web/src/components/ui/EmptyState.tsx` 編集（G9-2: 既存 EmptyState の API 拡張）
- 各 primitive の Vitest unit test
- a11y test (`jest-axe` / `axe-core`) によるアクセシビリティ違反 0 確認
- Playwright visual smoke による各 primitive の見た目確認

### 含まない

- API endpoint 追加・変更（既存 `apps/api/src/routes/` を呼び出すのみ）
- D1 schema 変更
- Google Form schema 変更
- state management ライブラリ導入（既存 React state / Server Action のみ使用）
- 19 routes 各画面の primitive 適用は本 task のスコープ外（後続 parallel-01〜08 の各 spec で行う）
- 新規 design token 追加（既存 `--ubm-color-*` / `--ubm-spacing-*` / `--ubm-text-*` / `--ubm-ease-*` のみ使用）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md | 原典タスク仕様 (G9-1〜G9-9 の設計案) |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 19 routes 範囲・正本順位 |
| 必須 | docs/00-getting-started-manual/specs/design-tokens.md | OKLch token 正本 (task-08) |
| 必須 | apps/web/src/styles/tokens.css | 実装側 token 正本 (task-09) |
| 必須 | apps/web/src/styles/globals.css | `@layer components` 編集対象 |
| 必須 | apps/web/src/components/ui/EmptyState.tsx | 既存 primitive (G9-2 拡張対象) |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/ | UI primitives 正本順位 (3位) |
| 必須 | CLAUDE.md | 「UI prototype alignment / MVP recovery」セクション・不変条件 |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-* | `@layer components` 同時編集の競合範囲 |
| 参考 | https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ | Breadcrumb ARIA pattern |
| 参考 | https://developer.mozilla.org/ja/docs/Web/CSS/:focus-visible | focus-visible 仕様 |

## 受入条件 (AC)

- **AC-1**: `apps/web/src/components/ui/FormField.tsx` が `aria-invalid` / `aria-describedby` を正しく注入し、error 表示と OKLch token (`--ubm-color-danger`) で border/helper text を彩色する設計が `outputs/phase-02/g9-1-form-validation-design.md` に確定している。
- **AC-2**: `apps/web/src/components/ui/EmptyState.tsx` の API 拡張（icon / title / description / action 4 props）が後方互換を保ったまま `outputs/phase-02/g9-2-empty-state-design.md` に記載されている。
- **AC-3**: `apps/web/src/components/ui/Pagination.tsx` の関数シグネチャ (`current` / `total?` / `hasNext` / `hasPrev` / `onNext` / `onPrev`) が `outputs/phase-02/g9-3-pagination-design.md` に確定している。
- **AC-4**: `apps/web/src/components/ui/Icon.tsx` の `IconSize = "sm" | "md" | "lg" | "xl"` (12/16/20/24px) 規約が `outputs/phase-02/g9-4-icon-size-design.md` に確定している。
- **AC-5**: `apps/web/src/components/admin/Breadcrumb.tsx` が `nav[aria-label="breadcrumb"]` + `ol` で構築され、最終項目は `aria-current="page"` を付与する仕様が `outputs/phase-02/g9-5-breadcrumb-design.md` に確定している。
- **AC-6**: Tailwind 既定 breakpoint (sm/md/lg/xl) に基づく responsive contract が `outputs/phase-02/g9-6-mobile-responsive-design.md` に確定している。
- **AC-7**: `globals.css` の `:focus-visible` 統一規則と `prefers-reduced-motion` 対応の同居設計が `outputs/phase-02/g9-7-focus-visible-design.md` に確定している。
- **AC-8**: `apps/web/src/lib/useAdminMutation.ts` の concurrent mutation guard (isLoading 中の 2nd call 拒否 + toast 通知) 仕様が `outputs/phase-02/g9-8-mutation-guard-design.md` に確定している。
- **AC-9**: mutation 失敗時に form state を保持する hook 拡張仕様が `outputs/phase-02/g9-9-form-state-preserve-design.md` に確定している。
- **AC-10**: 設計レビュー結果（GO / NO-GO 判定）が `outputs/phase-03/design-review.md` に記録され、parallel-03 (`@layer components` 同時編集) との競合解消方針が確定している。

## Phase 一覧（本仕様書の対象範囲）

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/g9-{1..9}-*-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/{task-breakdown,critical-path}.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | VISUAL evidence | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,...}.md |
| 13 | PR・振り返り | phase-13.md | completed | outputs/phase-13/pr-summary.md |

> 本サイクル（task-specification-creator 起動分）では Phase 1-13 の仕様書、共通 primitive 実装、focused tests、local typecheck evidence を作成する。Visual evidence は `ENOSPC` 解消後に同じ Playwright spec で取得する。Phase 13 の commit / push / PR はユーザー明示承認後に行う。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物 (4 論点・既存資産・スコープ) |
| ドキュメント | outputs/phase-02/g9-1-form-validation-design.md | G9-1 設計 (AC-1) |
| ドキュメント | outputs/phase-02/g9-2-empty-state-design.md | G9-2 設計 (AC-2) |
| ドキュメント | outputs/phase-02/g9-3-pagination-design.md | G9-3 設計 (AC-3) |
| ドキュメント | outputs/phase-02/g9-4-icon-size-design.md | G9-4 設計 (AC-4) |
| ドキュメント | outputs/phase-02/g9-5-breadcrumb-design.md | G9-5 設計 (AC-5) |
| ドキュメント | outputs/phase-02/g9-6-mobile-responsive-design.md | G9-6 設計 (AC-6) |
| ドキュメント | outputs/phase-02/g9-7-focus-visible-design.md | G9-7 設計 (AC-7) |
| ドキュメント | outputs/phase-02/g9-8-mutation-guard-design.md | G9-8 設計 (AC-8) |
| ドキュメント | outputs/phase-02/g9-9-form-state-preserve-design.md | G9-9 設計 (AC-9) |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー (AC-10) |
| ドキュメント | outputs/phase-04/task-breakdown.md | T1〜T11 サブタスク分解 |
| ドキュメント | outputs/phase-05/implementation-plan.md | 変更対象・型・順序・リスク |
| ドキュメント | outputs/phase-06/implementation-steps.md | 実装手順 |
| ドキュメント | outputs/phase-07/test-plan.md | テスト計画 |
| ドキュメント | outputs/phase-08/docs-updates.md | ドキュメント更新計画 |
| ドキュメント | outputs/phase-09/acceptance.md | 受入確認 |
| ドキュメント | outputs/phase-10/refactor-summary.md | リファクタ判断 |
| ドキュメント | outputs/phase-11/main.md | VISUAL_ON_EXECUTION 境界 |
| ドキュメント | outputs/phase-12/main.md | Phase 12 正本同期 |
| ドキュメント | outputs/phase-13/pr-summary.md | PR / commit user gate |
| 管理 | artifacts.json | root workflow state / Phase 1-13 status |

## 不変条件

1. **既存 API のみ接続**: `apps/api/src/routes/` 配下の現行 endpoint surface のみ利用。新 endpoint 追加・D1 schema 変更・Google Form 仕様変更は禁止。
2. **OKLch token 正本化**: 色は `apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/design-tokens.md` が正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` / `border-[#xxx]` / `focus:[#xxx]` 禁止。`verify-design-tokens` CI gate (task-18) で fail 判定。
3. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止（既存条件継続）。
4. **正本順位**: SCOPE.md → spec.md (parallel-09) → `docs/00-getting-started-manual/specs/*.md` → prototype。衝突時は上位優先。
5. **新規 design token 禁止**: 既存 `--ubm-color-*` / `--ubm-spacing-*` / `--ubm-text-*` / `--ubm-ease-*` のみ参照する。
6. **既存 primitive 破壊禁止**: `EmptyState.tsx` 拡張は後方互換を保つ。既存 caller の動作を変えない。
7. **新規 test ファイル命名**: `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止）。CLAUDE.md 不変条件 8 に従う。
8. **本サイクル完結**: 仕様書 Phase 1-13、strict outputs、共通 primitive 実装、local typecheck evidence を本サイクル内で完了する。visual evidence は local `ENOSPC` により `runtime_pending` として明示する。commit、push、PR、19 routes 各画面への適用はユーザー承認後に実行する。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `globals.css` `@layer components` を parallel-03 と同時編集して merge conflict が発生 | G9-{1,6,7} と parallel-03 の規則を `@layer components` 内で明確に分離し、設計時に section コメント (`/* === parallel-09 G9-1 form validation === */`) を必須化。Phase 03 設計レビュー観点 R-7 で確認 |
| 既存 `EmptyState.tsx` の API 拡張で caller を破壊 | props を全て optional + 既存 children pattern を維持。既存 caller が `<EmptyState>テキスト</EmptyState>` 形式なら継続動作するよう型 union を設計 |
| `Icon.tsx` が既存 `apps/web/src/components/ui/icons.ts` 等と命名衝突 | 既存 icons.ts を `IconName` 型のソースとして残し、`Icon.tsx` は size convention wrapper として責務分離。Phase 01 既存資産インベントリで現状調査 |
| `useAdminMutation.ts` 編集で既存 caller の挙動変更 | 既存シグネチャを維持しつつ `isLoading` ガードを内部追加。`onError` callback は既存通り invoke される設計 |
| OKLch token に該当する色が不足 | `--ubm-color-danger-soft` / `--ubm-color-text-secondary` 等の参照前に tokens.css を Phase 01 で確認。不足が判明した場合は task-09 へ feedback (Phase 12 unassigned-task として記録) |
| Breadcrumb 最終項目を `<a>` で出力すると現在ページに自分自身リンクが発生 | `href` が undefined の項目は `<span aria-current="page">` で render する仕様を AC-5 で固定 |
| Pagination の `total` 未提供 (cursor-only API) | `total` を optional とし、未提供時は meta 表示を省略。AC-3 で挙動確定 |
| concurrent mutation guard が user の意図的な再送信を阻害 | 2nd call 拒否は **同一 hook instance 内の onging mutation 中のみ**。toast で「既に保存中です」を出して user に状態通知 |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (設計 / 9 設計を並列に成果物化)
  ├─ outputs/phase-02/g9-1-form-validation-design.md
  ├─ outputs/phase-02/g9-2-empty-state-design.md
  ├─ outputs/phase-02/g9-3-pagination-design.md
  ├─ outputs/phase-02/g9-4-icon-size-design.md
  ├─ outputs/phase-02/g9-5-breadcrumb-design.md
  ├─ outputs/phase-02/g9-6-mobile-responsive-design.md
  ├─ outputs/phase-02/g9-7-focus-visible-design.md
  ├─ outputs/phase-02/g9-8-mutation-guard-design.md
  └─ outputs/phase-02/g9-9-form-state-preserve-design.md
       │
       ▼
phase-03 (設計レビュー / GO・NO-GO 判定)
  └─ outputs/phase-03/design-review.md
       │
       ▼
phase-04〜13 (実装〜PR / 後続サイクル)
```

## 注意点

- 本仕様書は Phase 1-13 の作成、共通 primitive 実装、focused tests、local typecheck evidence が本サイクルのスコープ。visual evidence は `ENOSPC` 解消後に取得する。
- parallel-01〜08 各 spec は本 task の primitive 提供を前提に設計しているため、本 task の Phase 03 GO 判定が後続 spec 群の実装着手条件となる。
- VISUAL タスクのため Phase 11 では primitive 単位のスクリーンショットを `outputs/phase-11/screenshots/` に保存する。現時点では local `ENOSPC` により未取得。
