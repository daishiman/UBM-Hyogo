# issue-832-admin-topbar-primitive-extraction

> Source issue: [#832](https://github.com/daishiman/UBM-Hyogo/issues/832)（CLOSED のまま仕様書化）
> Parent workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`（AppShell 3 layout は完了）
> Predecessor one-pager: `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction.md`
> 実装区分: **実装仕様書**
> implementation_mode: `new`（current branch / dev に AdminTopbar 実装は未存在）
> 状態: `implemented_local_evidence_captured`（コード実装・focused test・Phase 12 strict 7・正本同期まで完了。commit / push / PR は user-gated）
> task_type: `implementation` / VISUAL_ON_EXECUTION
> 作成日: 2026-05-23

## 調査サマリ（CLOSED 状態の妥当性検証）

issue #832 は CLOSED だが、コードベースを確認した結果 **未実装**であることを確認した。CLOSED は「parallel-03 で deferred 宣言したため別タスクへ送った」記録に過ぎず、実装は完了していない。

| 項目 | 現状（current branch = `dev` 先端 `0e8272121`） | 判定 |
|---|---|---|
| `apps/web/src/components/layout/AdminTopbar.tsx` | **存在しない** | ✗ 未実装 |
| `apps/web/app/(admin)/layout.tsx` の topbar slot | `<header data-shell="topbar">` の inline JSX（35-46 行） | ✗ primitive 未抽出 |
| AdminTopbar 単体 spec | 存在しない | ✗ 未作成 |
| 兄弟 primitive | `AdminSidebar.tsx` / `MemberHeader.tsx`（`components/layout/`）、`PublicHeader.tsx` / `PublicFooter.tsx`（`components/public/`） | ✓ 整備済み（参照元） |

**他タスクでの解決有無**: `git grep`・ディレクトリ探索の結果、`AdminTopbar` を実装する commit / PR は dev に存在しない。本 issue は**まだ実装が必要**である。

### issue 記載と現コードの乖離（最新コードへ最適化した点）

| issue #832 body の記載 | 現コードの実態 | 本仕様での採用（最適化後） |
|---|---|---|
| 追加先 `apps/web/src/components/admin/AdminTopbar.tsx` | 兄弟 primitive `AdminSidebar` は `components/layout/` に配置 | `apps/web/src/components/layout/AdminTopbar.tsx`（layout primitive の配置規約に整合） |
| `(admin)/layout.tsx` line 33-44 | 現行は **35-46 行**（行番号がずれている＝issue 作成後にコードが進んだ） | 行番号に依存せず「`data-shell="topbar"` の `<header>` ブロック」で同定する |
| spec ファイルの場所未指定 | layout primitive の spec は `components/layout/__tests__/` 配下（`AdminSidebar.component.spec.tsx` / `MemberHeader.spec.tsx`） | `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` |
| `PublicHeader`/`PublicFooter` を `components/layout/` と記載（unassigned-task spec） | 実際は `components/public/` 配下 | 配置参照は実コードに合わせる（本タスクの変更対象外） |

**結論**: Issue は CLOSED のまま、`<header data-shell="topbar">` を `AdminTopbar` primitive へ抽出する実装を行う。PR 文言は `Refs #832` を使う（`Closes` は使わない）。

## 概要

`apps/web/app/(admin)/layout.tsx` に inline で直書きされている admin AppShell の topbar（`<header data-shell="topbar">`）を、兄弟 primitive（`AdminSidebar` / `PublicHeader` / `PublicFooter` / `MemberHeader`）と対称な Server Component `AdminTopbar` へ抽出する。既存の data-* 契約・OKLch トークン参照・`(admin)/layout.spec.tsx` の契約検証を 100% 維持し、primitive 単体 spec を新規追加する。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（VISUAL_ON_EXECUTION 証跡） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（中学生レベル概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 承認後） |

## 変更対象ファイル

| ファイル | 種別 | 内容 |
|---|---|---|
| `apps/web/src/components/layout/AdminTopbar.tsx` | **新規** | topbar primitive 本体（Server Component） |
| `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` | **新規** | primitive 単体契約 spec（既定描画 / slot 注入 / OKLch / axe） |
| `apps/web/app/(admin)/layout.tsx` | 修正 | inline `<header data-shell="topbar">` を `<AdminTopbar />` 呼び出しに置換 |
| `apps/web/app/(admin)/layout.spec.tsx` | 無修正（検証のみ） | data-* 契約検証が修正なしで pass することを確認済み |

## スコープ外（本仕様内では新規バックログ化しない）

- breadcrumb 実データ統合（slot は placeholder / props のまま）— 別 admin 機能タスク
- topbar actions の具体ボタン実装（sign-out 等）— admin 機能側の別タスク
- 他 layout（public / member）の primitive 再抽出
- 新規 design token / 新規 visual 仕様の追加
- D1 / API / Google Form schema 変更

> 上記は今回サイクルで実装すると「責務外の新 design 追加」になるため分離する。AdminTopbar 抽出自体は本サイクルで完結済み。

## 不変条件

1. `data-shell="topbar"` は AdminTopbar 内部 root `<header>` に付与する（shell slot 識別は primitive 責務）。`data-route-group="admin"` / `data-theme="cool"` は layout.tsx の wrapper `<div>` に残す（route group 識別は AppShell wrapper 責務）。
2. `data-component="admin-breadcrumb-slot"` / `data-component="admin-topbar-actions"` は primitive 内部 DOM に保持する。`(admin)/layout.spec.tsx` の selector が抽出後も同一 DOM に出現すること。
3. OKLch トークン正本化（CLAUDE.md UI 不変条件2）: 色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入しない。
4. プロトタイプ正本順位（CLAUDE.md UI 不変条件3）: 新規 primitive・新規 visual 仕様を持ち込まない。既存 inline JSX のトークン参照・class をそのまま移植する。
5. Server Component 境界維持: `(admin)/layout.tsx` は `async` Server Component。AdminTopbar に client-only API（`onClick` / `useState` 等）を持ち込まない。
6. テストファイル拡張子は `*.spec.tsx` のみ（CLAUDE.md 不変条件 #8。`*.test.*` 禁止）。
7. `apps/web` から D1 直接アクセス禁止（既存不変条件 #5 継続。本タスクはデータアクセスを伴わない）。
