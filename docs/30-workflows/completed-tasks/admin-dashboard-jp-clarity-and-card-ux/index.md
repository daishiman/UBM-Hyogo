# 管理ダッシュボード 日本語化＋カード型UI/UX是正 タスク仕様書

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は Phase 1 §実装区分判定を参照）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
- workflow_state: `implemented_local_runtime_pending`（Phase 1-13 実装仕様書を authored。apps/web 実装・focused vitest は完了。authenticated staging 視覚証跡・commit・PR は user-gated）
- スコープ: `apps/web`（管理ダッシュボード `/(admin)/admin`）の表現層のみ。API / D1 / Google Form 非変更（不変条件 #1 #5）

## 目的

staging `/(admin)/admin`（管理ダッシュボード）を、**エンジニアでない支部会運営者**が迷わず読める状態にする。具体的には次の4点を是正する。

1. 英語表記の KPI ラベル（`Total members` / `Public on site` / `Untagged` / `Schema issues`）と `DISTRIBUTION` eyebrow を日本語化する。
2. 「スキーマ」「alias」「schema」など技術用語を、非エンジニアに伝わる平易な日本語へ言い換える。
3. 「直近のアクション」を、生のアクションコード（`admin.member.status_updated`）と対象（`member:MEM-1...`）がカードからはみ出すテーブルから、**カード型アクティビティリスト**へ再設計する。
4. 「公開ステータス」を、600px 固定幅で横長になっている SVG 縦棒グラフから、**コンパクトな横バーリスト**へ再設計する。

## 根本原因（確定）

すべて `apps/web` 表現層の問題であり、API / D1 / Google Form は無関係。

1. **英語ラベル**: `KpiGrid.tsx:16-29` が英語文字列を直書きし、`KpiCard.tsx:27` の `uppercase` が全大文字化している。`ZoneDistribution.tsx:41,66` の `DISTRIBUTION` eyebrow も英語大文字。
2. **技術用語**: `SchemaAlertCard.tsx:17,27` の「スキーマ未解決」「schema 管理を開く」「alias」が非エンジニアに伝わらない。
3. **はみ出し**: `RecentActionsTable.tsx` が 4 列固定 `<table>` で、`row.action`（生コード）と `row.targetType`+`:targetId` を**変換せず raw 表示**し truncation も無いため、対象列がカード幅を超える。アクション/targetType の日本語化実装は存在しない。
4. **横長**: `StatusDistribution.tsx` が `VIEWBOX.width=600` 固定の SVG 縦棒グラフで、カード内で余白過多に横へ伸びる。

詳細は [phase-1-requirements.md](phase-1-requirements.md) を正本とする。

## スコープ（本サイクル完結＝AC-1..AC-10）

| 柱 | 内容 | 主な変更ファイル |
| --- | --- | --- |
| C1 KPI 日本語化 | KPI 4 枚のラベルを日本語化（用語 SSOT 経由）+ `uppercase` 撤廃 | `KpiGrid.tsx` / `KpiCard.tsx` |
| C2 用語平易化 | SchemaAlertCard 文言の平易化 + ZoneDistribution eyebrow 日本語化 | `SchemaAlertCard.tsx` / `ZoneDistribution.tsx` |
| C3 直近のアクション再設計 | テーブル廃止→カード型アクティビティリスト。アクション/targetType 日本語化 + 対象 ID truncation | `RecentActionsTable.tsx` |
| C4 公開ステータス再設計 | 600px 固定 SVG 縦棒→コンパクト横バーリスト | `StatusDistribution.tsx` |
| C5 用語 SSOT | KPI/アクション/targetType/ステータスのラベルを一元管理する glossary 新設 | `dashboardGlossary.ts`（新規） |
| テスト | glossary 単体 + 各コンポーネントの構造/文言/トークン検証 | `__tests__/*.spec.ts(x)` |

すべて `apps/web` 表現層・1 PR で完結する（CONST_007）。

## same-cycle follow-up（レビューで検出し本タスク内で解消）

`/admin/audit`（`AuditLogPanel.tsx`）も同じ生アクションコード / targetType を raw 表示していた。初期仕様では別サーフェスとして未タスク分離していたが、automation-30 レビューで未タスク化の根拠不足を検出したため、本サイクル内で `dashboardGlossary.ts` を適用済み。
経緯は `unassigned-task-specs/admin-audit-page-jp-action-labels.md` に resolved_same_cycle として残す。

## Acceptance Criteria

Phase 1 の AC-1..AC-10 を正本とする。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（glossary・コンポーネント再設計） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release | [phase-13-pr.md](phase-13-pr.md) |

## 完了条件

AC-1..AC-10 が全 Phase に trace され、`artifacts.json` に `taskType` / `visualEvidence` / `gates` が記録され、
audit 画面への glossary 適用まで同サイクルで完了し、本タスクが `apps/web` 表現層・1 サイクルで完結する実装仕様書として authored されていること。
apps/web 実装と focused Vitest は本サイクルで完了。authenticated staging 視覚証跡・commit・PR は user-gated。
