# Admin 出席分析ページ UI/UX 全面刷新 + API 拡張 ワークフロー

> 実装区分: 実装仕様書 (CONST_004)
> implementation_mode: `new`（UI/UX 刷新は新規実装。一部既存 API は `verify_existing` 差分確認）
> task_classification: UI task (VISUAL)
> workflow_state: `implemented_local_runtime_pending` / staging visual pending
> 作成日: 2026-05-26 / current_ref: `7f651a083` / branch: detached worktree

## 背景

現状報告では staging の Admin「出席分析」ページは「出席ダッシュボード」というシンプルな3カード構成で、3つの admin API が 404 (`ADMIN_FETCH_404`) を返している。これは本仕様書作成時点では未実装・未再検証の runtime 仮説であり、Phase 5 冒頭で再現確認して RCA を確定する。

調査結果:

- 既存 API endpoint (`/admin/dashboard/attendance/overview|by-session|ranking`) は `apps/api/src/routes/admin/dashboard.ts:88-122` で**実装済み**。
- repository も `apps/api/src/repository/attendance.ts:455-563` に実装済み (`computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking`)。
- Zod schemas (`AttendanceOverviewZ` / `SessionAttendanceRowZ` / `MemberAttendanceRankingZ`) も `packages/shared/src/zod/viewmodel.ts` に存在。
- 404 はランタイム要因（D1 データ不在 / proxy / `INTERNAL_API_BASE_URL` 設定 / staging fixture 切替）の可能性が高い。
- 一方プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx:109-133` + 拡張) は KPI 4 枚 + 期間/区画フィルタ + トレンドグラフ + メンバー出席率テーブル + TOP10 ランキング + ドリルダウン + エクスポート を想定。

## スコープ (Full)

本ワークフローの実装実行サイクルでは、以下を同一サイクルで完了させる:

1. **404 原因特定と修正**（staging で 3 endpoints が 200 を返すまで）
2. **API 拡張**: `trend` (期間別出席推移) / `per-member rate with period filter` / `zone filter` / `meeting detail (drilldown)` / `export (CSV)`
3. **正本仕様更新**: `specs/01-api-schema.md` の Admin Dashboard Attendance API セクションに上記拡張を反映
4. **UI 全面刷新**: プロトタイプ準拠の出席分析ページ（KPI 4 / 期間+区画フィルタ / トレンドグラフ / セッション別テーブル / メンバー別テーブル / TOP10 ランキング / ドリルダウンモーダル / CSV エクスポート / 要フォローアップリスト）
5. **テスト**: contract (D1) / web vitest / Playwright visual

## スコープ一体化の判断

- 「Full UI（区画フィルタ・ドリルダウン・エクスポート含む）」は、既存3 APIの 404 RCA と UI刷新の責務境界を分けると型・テーブル・検証が重複するため同一 workflow に集約する。
- 区画フィルタ / ドリルダウン / エクスポート / 要フォローアップは「機能間で UX 整合が必要」かつ「テーブル基盤を共有する」ため、分割すると D1 クエリ・型・コンポーネント階層が二重実装になる。よって 1 サイクルで完了。
- 本サイクル外に積み残しを行う場合は Phase 12 `unassigned-task-detection.md` に明記。

## Phase 一覧

| Phase | 名称 | 状態 | 成果物 |
| ----- | ---- | ---- | ------ |
| 1     | 要件定義 | completed | `phase-1.md` + Phase 1 outputs (P50 / inventory / 命名規則 / タスク分類) |
| 2     | 設計     | completed | `phase-2.md` (UI 構造 / API DTO / state ownership / 責務境界 / トークン / 依存関係) |
| 3     | 設計レビュー | completed | `phase-3.md` (4条件評価 / ループ / KJ) |
| 4     | テスト作成 (RED) | completed | `phase-4.md` (contract / vitest / RTL / Playwright) |
| 5     | 実装 | completed | `phase-5.md` (404 修正 → API 拡張 → 型 → UI 実装) |
| 6     | テスト拡充 | completed | `phase-6.md` (fail path / 回帰 guard) |
| 7     | カバレッジ確認 | completed | `phase-7.md` (変更ファイル局所 coverage) |
| 8     | リファクタリング | completed | `phase-8.md` |
| 9     | 品質保証 | completed | `phase-9.md` (lint / tsc / build / mirror parity) |
| 10    | 最終レビュー | completed | `phase-10.md` (受入条件・blocker) |
| 11    | 手動テスト | completed | `phase-11.md` + `outputs/phase-11/runtime-evidence.md` (local evidence captured; staging visual pending) |
| 12    | ドキュメント更新 | completed | `phase-12.md` (Part 1/2 implementation guide / spec sync / unassigned / feedback / compliance check) |
| 13    | PR 作成 | pending | `phase-13.md` (ユーザー明示承認後のみ) |

## 命名規則（既存ベースで統一）

- TS 識別子: camelCase (`safeServerFetch`, `fetchAdmin`)
- React コンポーネント: PascalCase (`AdminSectionCard`)
- ファイル名: kebab-case (`safe-server-fetch.ts`) / page は Next.js 規約 (`page.tsx`)
- API パス: kebab-case + RESTful (`/admin/dashboard/attendance/trend`)
- Zod スキーマ: `XxxZ` suffix (`AttendanceTrendZ`)
- error code: `ADMIN_FETCH_[STATUS]` パターン維持
- Design Token: `--ubm-*` のみ、HEX 直書き禁止

## 参考リンク

- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`
- 正本 API 仕様: `docs/00-getting-started-manual/specs/01-api-schema.md:184-214`
- 正本 admin blueprint: `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- 正本 admin 管理: `docs/00-getting-started-manual/specs/11-admin-management.md:64-256`
- 既存 page: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`
- 既存 API: `apps/api/src/routes/admin/dashboard.ts:88-122`
- 既存 repo: `apps/api/src/repository/attendance.ts:455-563`
- Zod: `packages/shared/src/zod/viewmodel.ts`
