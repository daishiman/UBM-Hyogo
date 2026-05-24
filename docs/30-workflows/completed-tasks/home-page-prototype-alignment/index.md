---
workflow_id: home-page-prototype-alignment
workflow_state: implemented
visualEvidence: VISUAL
taskType: implementation
created_at: 2026-05-23
owner: daishiman
scope: single-cycle
---

# Home Page Prototype Alignment

公開トップ `/` がプロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）と大きく乖離している現状を、CSS rule 追加と少量のコンポーネント整理で 1 サイクル内に解消する。

## 背景

- staging URL: <https://ubm-hyogo-web-staging.daishimanju.workers.dev/>
- 観測: ヘッダーが縦並び、Stats / ZoneIntro / Timeline / PublicFooter / MemberGrid が「ほぼ未スタイル」状態で表示される
- 根本原因（事前調査済み）: `apps/web/src/components/public/*.tsx` が emit する `data-component` / `data-role` / `data-zone` / `data-stat` selector に対する CSS rule が `apps/web/src/styles/legacy-public.css` に存在しない
- 既存 CSS: Hero / stat-card / member-card / call-to-action-cta / profile-hero / register-callout / form-preview-sections は実装済。Stats（親）/ ZoneIntro / Timeline / PublicHeader / PublicFooter / MemberGrid は **未実装**

## スコープ（CONST_007 1 サイクル完了）

| ID | タスク | 並列性 | 実装区分 |
| --- | --- | --- | --- |
| task-01 | 公開トップ用 CSS rule 追加（PublicHeader / Stats / ZoneIntro / Timeline / PublicFooter / MemberGrid） | ベース | 実装仕様書 |
| task-02 | CallToActionCTA className ハイブリッド整理 | task-01 後（同一 CSS 共有のため直列） | 実装仕様書 |

両 task とも今回 1 サイクル（1 PR）で完了させる。先送り無し。

## 正本順位

1. `docs/30-workflows/home-page-prototype-alignment/phase-{1,2,3}-*.md` / `tasks/*.md`
2. `docs/30-workflows/home-page-prototype-alignment/outputs/phase-12/*.md`
3. `docs/00-getting-started-manual/claude-design-prototype/styles.css` / `pages-public.jsx`
4. `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
5. `apps/web/src/styles/tokens.css`（OKLch design token 正本）
6. `apps/web/src/styles/legacy-public.css`（既存 selector 群との整合）

## 不変条件

1. HEX 直書き禁止。色は `tokens.css` の OKLch CSS variable 経由のみ
2. コンポーネントの TSX 構造（`data-component` / `data-role` / `data-zone` / `data-stat` の attribute 名）は変更しない（テスト snapshot を壊さない）
3. D1 直接アクセス禁止（無関係だが CLAUDE.md 不変条件 #5）
4. `apps/web/src/styles/globals.css` の `@layer base` / `@layer components` の責務境界を維持
5. test suffix は `*.spec.{ts,tsx}` のみ

## 完了条件

- すべてのタスク仕様書が単独で実装可能な粒度になっていること
- 各仕様書冒頭に `[実装区分: 実装仕様書]` が明記されていること
- CONST_005 の必須 6 項目（変更対象ファイル / シグネチャ / 入出力 / テスト / 実行コマンド / DoD）を全 task が満たすこと
- Phase 12 strict 7 と root/output `artifacts.json` parity が物理配置されていること
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory / lessons / changelog / LOGS に同一 wave で反映されていること

## Phase 成果物

| Phase | 状態 | 成果物 |
| --- | --- | --- |
| [Phase 1 — 要件定義](phase-1-requirements.md) | completed | topology / 不足 selector punch list |
| [Phase 2 — 設計](phase-2-design.md) | completed | CSS rule 設計 / token マッピング |
| [Phase 3 — 設計レビューゲート](phase-3-design-review.md) | completed | 2 タスク分解（[task-01](tasks/task-01-public-home-css-rules.md) / [task-02](tasks/task-02-cta-classname-cleanup.md)） |
| [Phase 4 — テスト作成](phase-4-test-creation.md) | completed | CTA data-role contract regression guard 追加 |
| [Phase 5 — 実装](phase-5-implementation.md) | completed | task-01 / task-02 実コード反映 |
| [Phase 6 — テスト拡充](phase-6-test-expansion.md) | completed | focused component assertions 追加 |
| [Phase 7 — テストカバレッジ確認](phase-7-coverage.md) | completed | public component / token boundary 確認 |
| [Phase 8 — リファクタリング](phase-8-refactoring.md) | completed | CTA className 残存除去 / CSS scope 確認 |
| [Phase 9 — 品質保証](phase-9-quality-assurance.md) | completed | typecheck / lint / test / build 記録 |
| [Phase 10 — 最終レビューゲート](phase-10-final-review.md) | completed | 仕様差分照合済み |
| [Phase 11 — 手動テスト検証](outputs/phase-11/manual-test-result.md) | completed | local runtime screenshot 取得済み |
| [Phase 12 — ドキュメント更新](outputs/phase-12/phase12-task-spec-compliance-check.md) | completed | strict 7 / spec sync / skill feedback |
| Phase 13 — PR作成 | blocked | ユーザー明示承認後のみ |

> 本 workflow は `implemented` 状態。task-01 / task-02 の実コード変更、focused test、local runtime visual evidence、Phase 12 正本同期まで同一サイクルで完了済み。commit / push / PR 作成のみユーザー明示承認待ち。
