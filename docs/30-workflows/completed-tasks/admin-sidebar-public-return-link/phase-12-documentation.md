# Phase 12: ドキュメント更新（strict 7 outputs）

**[実装区分: 実装仕様書]**

## Part 1: 中学生レベル説明（What & Why）

管理画面の左側にあるメニュー（サイドバー）に、**「公開サイトに戻る」というリンクを追加**します。

今までは「ホーム」というラベルで、管理画面の上のほうに置いてありました。でも「ホーム」だと、管理画面のホーム（`/admin`）と紛らわしいですよね。だから:

1. ラベルを **「公開サイトに戻る」** に変えます
2. 場所を一番下（ログアウトボタンの上）に移します
3. テストで「ちゃんと存在するか」を確認できるよう、`data-role="public-return"` という目印を付けます

これで、管理者の人が **「公開ページに戻りたいな」と思ったときに迷わない** ようになります。

## Part 2: 技術者レベル説明

### 変更サマリ

| 領域 | 変更 |
|------|------|
| `AdminSidebar.tsx` GROUPS | `{ href: "/", label: "ホーム" }` を Public セクションから削除 |
| `AdminSidebar.tsx` JSX | `<footer>` 直前に `<a data-role="public-return" aria-label="公開サイトに戻る">` を追加 |
| `AdminSidebar.spec.tsx` | T1〜T11 regression test を追加 |
| Component props | 変更なし（`AdminSidebarProps` 互換維持） |
| Playwright visual fixture | `outputs/phase-11/screenshots/` に overview / hover / focus を保存 |

### Phase 12 strict 7 outputs（このサイクルでの配置）

| # | output | path |
|---|--------|------------------------|
| 1 | main | `outputs/phase-12/main.md` |
| 2 | implementation-guide | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` |
| 7 | phase12-task-spec-compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

> 本 wave で実コード・focused test・local visual screenshot・strict 7 outputs を物理配置し、`implemented_local_evidence_captured` へ再分類する。staging runtime / commit / push / PR のみ user-gated として残す。

## System spec 同期対象（実装時に更新）

| 正本 | 更新内容（予定） |
|------|----------------|
| `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin sidebar の最下段に「公開サイトに戻る」が存在することを正本化 |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-sidebar-public-return-link-artifact-inventory.md` | 新規 workflow 登録 |

## Unassigned task detection

| # | 候補 | 判定 |
|---|------|------|
| 1 | `AdminSidebarNavItem` に `dataRole` prop を一般化する | **却下**: Phase 8 でリファクタ不要と判定済。共通プリミティブ化はメリットなし |
| 2 | `SidebarShell` 統一へのマイグレーション | **却下**: 別 workflow `unified-sidebar-shell-public-and-admin` 既存 |
| 3 | `<Link prefetch>` 化 | **却下**: layout 境界跨ぎは full reload が安全 |

→ unassigned-task 起票数: **0 件**

## Skill feedback

| 観点 | 内容 |
|------|------|
| テンプレ改善 | 単独タスク（1 ファイル + 1 spec 編集）の場合の Phase 5/6 最小テンプレが有用との想定。本 spec の差分形式を pattern 化候補に追加可 |
| ワークフロー改善 | 既存 grep ヒット → ラベル変更 + `data-role` 付与の 3 操作セットは「既存 nav item リラベル」パターンとして lessons-learned に追加可 |
| ドキュメント改善 | task-f source spec の §2 差分判定方式（ヒット分岐）は他タスクへも転用可。pattern 化対象 |

## Documentation changelog

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/` | new | Phase 1〜13 仕様書一式 |
| `apps/web/src/components/layout/AdminSidebar.tsx` | edit | `/` nav item を footer 直前の `public-return` anchor へ移動 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | edit | `public-return` DOM / a11y / footer 直前配置 regression を追加 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | edit | legacy skipped test を active supersession pointer へ変更 |

## Compliance check（self）

| 項目 | 判定 |
|------|------|
| canonical 9 headings 整合 | ✓ |
| `## 4. Phase 11 evidence file inventory` 表 path 列存在 | ✓（Phase 11 ファイル） |
| workflow root 内 path 限定 | ✓（`outputs/phase-11/...`） |
| status enum (`present` / `pending` / `n/a`) | ✓ |
| implemented_local_evidence_captured への再分類 | ✓ |

## 完了条件

- Part 1 / Part 2 が本ファイルに揃っている
- strict 7 outputs の配置先と内容方針が確定
- unassigned-task / skill-feedback / changelog セクションが埋まっている
