# admin-attendance-dashboard-ux-hierarchy-refine — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| ディレクトリ | docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine |
| 作成日 | 2026-06-08 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 担当 | web (apps/web 表現層) |
| 状態 | implemented_local_checks_pass_visual_capture_pending |
| タスク種別 | implementation |
| 実装区分 | 実装仕様書（VISUAL / コード変更を伴う） |
| 関連 issue | なし（staging UI/UX 観察起点・relatedIssue=null） |

## 目的

管理画面の出席ダッシュボード `/admin/dashboard/attendance` を、**Apple UI/UX エンジニアの視点で「パッと見て何を判断すべきか一目で分かる」情報階層へ再設計**する。現状は 8 セクションがフラットに縦積みされ視覚的階層・優先順位・焦点が欠如している（情報過多）。これを **PRIMARY / TREND / DETAIL の 3 層**に再構成し、最重要判断（全体出席率の健全性・要フォロー対象）を最上部のヒーローゾーンへ昇格、詳細テーブル群をタブ統合で段階的開示する。**API / D1 / Google Form schema / shared 型は一切変更せず、`apps/web` 表現層（コンポーネント再構成 + globals.css）のみで達成する。**

## スコープ

### 含む

- `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` — 8 セクション縦積み → 3 層レイアウト（PRIMARY/TREND/DETAIL）への再構成（本タスクの主役）
- `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` — PRIMARY ヒーロー（特大 primary KPI + secondary KPI）への再編
- `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx` — 要フォロー対象の PRIMARY 主役化（件数トーン強調）
- `apps/web/src/features/admin/attendance/components/{AttendanceTrendChart,AttendanceZoneDistributionChart}.tsx` — TREND ゾーンへの移設・カード化統一
- `apps/web/src/features/admin/attendance/components/{SessionAttendanceTable,MemberAttendanceTable,AttendanceTop10Ranking}.tsx` — DETAIL ゾーンの Segmented タブ統合
- DETAIL ゾーンのタブ統合ホスト（新規コンポーネント or AttendanceAnalyticsPage 内）— 既存 `Segmented` primitive 使用
- `apps/web/src/styles/globals.css` の `.attendance-*` 系 — 3 層レイアウト用クラス追加・リズム（余白/タイポ/トーン）調整
- 既存 `*.spec.tsx`（`__tests__/` 配下）の再構成追従 + 追加テスト
- フィルタバー（`AttendanceFilterBar.tsx`）の配置を PRIMARY 直上へ（内容は不変）

### 含まない

- API endpoint の追加・変更（`apps/api` 配下の diff ゼロ）
- D1 schema / migration の変更
- Google Form schema の変更
- `packages/shared` の型変更
- 新 endpoint を要する集計表示（会員ごとの直近 N 回セッション出席フラグ一覧、月別「出席率」のサーバ集計 等）— スコープ外として明記。Phase 12 で未タスク候補を判断
- 新規 UI primitive の追加（既存 primitive のみ使用）

## 受入条件 (AC)

- AC-1: PRIMARY ヒーローゾーンが最上部（フィルタバー直下）に配置され、①全体出席率（`--ubm-text-3xl`）+ 前期比 delta + ユニーク出席率、②要フォロー対象数を主役 2 枚として構成される
- AC-2: 視覚的階層が 3 層（PRIMARY / TREND / DETAIL）に明確化され、見出しレベル・余白・サーフェスで視覚的に区別される（h1 ページ > h2 ゾーン > h3 サブ）
- AC-3: DETAIL の 3 テーブル（セッション別 / 会員別 / TOP10）が既存 `Segmented` タブ切替で 1 領域に統合され、初期スクロール量が削減される
- AC-4: 要フォロー対象が PRIMARY で視覚強調され、件数で トーン変化（0 名 = neutral/ok、1+ = warn）。issue-1112 の `data-attendance-level` パターン踏襲、新規 token 追加なし
- AC-5: 全色が OKLch トークン経由。HEX / `bg-[#xxx]` / `text-[#xxx]` がゼロ（CI gate `verify-design-tokens` pass）
- AC-6: 新規 primitive 追加ゼロ（Card / Badge / Stat / Segmented / EmptyState / AdminSectionCard の再利用・invariant #3）
- AC-7: API / D1 / Form / shared 型の変更ゼロ。`apps/api`・`packages/shared` の diff ゼロ。`fetchAttendanceAnalyticsBundle` と 6 endpoint surface のまま利用
- AC-8: レスポンシブ維持（モバイル縦積み → デスクトップ多カラム）を既存 grid utility で成立
- AC-9: アクセシビリティ維持・向上（論理的見出し階層・aria-label・フォーカスリング・WCAG 2 AA コントラスト）
- AC-10: 既存全機能が挙動不変で温存（フィルタ / CSV エクスポート / ドリルダウン modal / テーブル内容 / フッター / SafeResult セクション degrade）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ui-prototype-alignment-mvp-recovery（design tokens / primitives 正本） | 色トークン・primitive を再利用する前提 |
| 上流 | issue-1112（出席バッジ 3 段階色強調） | 要フォロートーン強調の `data-attendance-level` パターン踏襲元 |
| 参照 | 既存 attendance API（02b / dashboard analytics endpoint） | データ供給元（変更しない） |
| 下流 | なし（本タスクは表現層に閉じる） | — |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/_shared-context.md | 調査結果・方針・AC の集約正本 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本 |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値 JSON 正本・HEX 禁止ルール |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog |
| 必須 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | admin 画面 contract |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | デザイン言語（primitives + rhythm）正本 |
| 参考 | apps/web/app/(admin)/admin/page.tsx | 既存 admin ダッシュボードの 3 層的レイアウト実例 |

## システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | UI/UX 設計指針・navigation 契約 |
| アーキテクチャ | `.claude/skills/aiworkflow-requirements/references/architecture-*.md` | apps/web / apps/api 境界 |
| API | `.claude/skills/aiworkflow-requirements/references/api-*.md` | endpoint surface（参照のみ） |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/{main,spec-extraction-map}.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{main,layout-blueprint,component-map}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト作成 | phase-04.md | completed | outputs/phase-04/{main,test-plan}.md |
| 5 | 実装 | phase-05.md | completed | outputs/phase-05/{main,runbook}.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-06/{main,failure-cases}.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-07/{main,ac-matrix}.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/{main,token-audit}.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動テスト | phase-11.md | pending_visual_capture | outputs/phase-11/{main,manual-test-result,screenshot-plan.json,...} |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/* 7 種 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/* 4 種 |

## 触れる不変条件

| # | 不変条件 | このタスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | `safeServerFetch` 経由のまま。D1 binding 不使用 |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-7 で保証 |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-5 で保証（`verify-design-tokens` gate） |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-6 で保証 |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-10 が Phase 7（AC マトリクス）/ Phase 10（最終レビュー）で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- apps/web 表現層の実装・focused tests・typecheck・lint・design token gate がローカルで成功している
- VISUAL evidence は `outputs/phase-11/screenshots/` の 8 canonical PNG 取得後に `implemented_local_evidence_captured` へ昇格する
- Phase 13（commit / PR）はユーザー明示承認なしでは実行しない

## 関連リンク

- 共有コンテキスト: ./_shared-context.md
- メタ: ./artifacts.json / ./outputs/artifacts.json
