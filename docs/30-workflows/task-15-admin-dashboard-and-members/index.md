# task-15: admin-dashboard-and-members — Phase 1-13 タスク仕様書一式

> 出力先: `docs/30-workflows/task-15-admin-dashboard-and-members/`
> 元タスク仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md`
> 作成日: 2026-05-10
> 実装区分: **実装仕様書**（CONST_004 デフォルト / コード変更を伴う UI 構築タスク）
> implementation_mode: `new`（新規実装）
> taskType: `implementation`
> visualEvidence: `VISUAL`（admin 2 画面の UI 構築 + Phase 11 で screenshot 必須）
> workflow_state: `spec_created`（本ディレクトリは実装前の仕様書一式。Phase 5 以降を実行した時点で implemented-local 系へ再分類）
> スコープ原則: 全 Phase を 1 サイクル内で完了（CONST_007）。先送り禁止。

---

## メタ情報

| 項目 | 値 |
|------|---|
| task ID | task-15 |
| 担当画面 | `/admin`（KPI ダッシュボード）, `/admin/members`（会員管理テーブル） |
| 責務 | admin 共通 `(admin)/layout.tsx` 確定 + 上記 2 画面の OKLch tokens ベース UI 構築 |
| 工数見積 | 1.25 人日（元仕様 §0.1） |
| 主担当 | Frontend |
| 直接依存 | task-09 (Tailwind v4 + tokens) / task-10 (UI primitives 11 種) |
| 並列可 | task-16 / task-17（W5 で `(admin)/layout.tsx` を `dev` に反映してから fan-out） |
| 後続 | task-18 (regression / Playwright smoke / verify-design-tokens) |
| 主要不変条件 | D1 直アクセス禁止 / OKLch tokens 専用 / `apps/api` endpoint 追加禁止 / `responseEmail` は system field |

## Phase 一覧

| Phase | 名称 | ファイル | 主要成果物 |
|-------|------|---------|-----------|
| 1 | 要件定義 | [phase-01.md](./phase-01.md) | scope / inventory / DoD / 命名規則記録 |
| 2 | 設計 | [phase-02.md](./phase-02.md) | コンポーネント topology / API client 設計 / state 引き渡しテーブル |
| 3 | 設計レビュー | [phase-03.md](./phase-03.md) | Phase 4 進行可否判定（GO/NO-GO） |
| 4 | テスト作成 | [phase-04.md](./phase-04.md) | vitest テスト雛形（5 ファイル）/ TDD Red |
| 5 | 実装 | [phase-05.md](./phase-05.md) | layout / page / components / api client の実装 |
| 6 | テスト拡充 | [phase-06.md](./phase-06.md) | fail path / a11y (jest-axe) / edge case 追加 |
| 7 | カバレッジ確認 | [phase-07.md](./phase-07.md) | 変更行 line/branch coverage 実測値 |
| 8 | リファクタリング | [phase-08.md](./phase-08.md) | 旧 `apps/web/src/components/admin/` 残骸整理 / barrel export 統一 |
| 9 | 品質保証 | [phase-09.md](./phase-09.md) | typecheck / lint / build / verify-design-tokens green |
| 10 | 最終レビュー | [phase-10.md](./phase-10.md) | DoD G-01〜G-12 一括判定 |
| 11 | 手動テスト | [phase-11.md](./phase-11.md) | screenshot 9 枚 + a11y 視覚検証 + manual test |
| 12 | ドキュメント更新 | [phase-12.md](./phase-12.md) | strict 7 files / implementation-guide / system-spec sync / unassigned / feedback |
| 13 | PR 作成 | [phase-13.md](./phase-13.md) | user 明示承認後のみ実施 |

## ファイル構成（task root）

```
docs/30-workflows/task-15-admin-dashboard-and-members/
├── index.md                          # 本ファイル
├── phase-01.md ... phase-13.md       # 各 Phase 仕様書（13 ファイル）
├── artifacts.json                    # Phase 進捗台帳
└── outputs/
    ├── phase-01/ ... phase-13/       # 各 Phase の生成物
    └── artifacts.json                # outputs 側 parity ファイル（Phase 12 で同期）
```

## 実装区分の判定根拠

本タスクは「UI コンポーネントの刷新・既存 page.tsx の刷新・admin API client 層の拡張」を伴うため、CONST_004 のデフォルトに従い **実装仕様書** とする。Phase 1 §4「変更対象ファイル一覧」が新規 20 件 / 修正 3 件を列挙しており、コード変更なしでは目的（KPI ダッシュボード + 会員管理 UI 完成）が達成不可能。

## 1 サイクル内完了スコープの確認（CONST_007）

| スコープ判定 | 結論 |
|-------------|------|
| 含む | Phase 1 §4 の新規 20 件 + 修正 3 件 / Phase 4 TDD 5 ファイル / Phase 6 拡張後 8 ファイル 36 ケース / Phase 11 screenshot 9 枚 / Phase 12 strict 7 files |
| 含まない（仕様明記の非ゴール） | 新 admin endpoint 追加 / D1 schema 変更 / virtual scroll / CSV export 実装 / task-17 audit 画面のフィルタ反映 |
| 先送りなし | 1 サイクル内で task-15 を完全クローズ。`byZone`/`byStatus` placeholder 表示は本 task 内で実装（API 拡張は別タスク化候補として Phase 12 で記録） |

## 並列実行ガイダンス

設計フェーズ（Phase 1→2→3）は直列、実装フェーズ（Phase 4-9）は変更対象が独立であれば並列可（_dashboard / _members / api-client は別 lane）。Phase 10 以降は直列。

## 参照ドキュメント

- 元仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md`
- システム仕様: `docs/00-getting-started-manual/specs/11-admin-management.md`
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` (`AdminDashboardPage` / `AdminMembersPage`)
- API 正本: `apps/api/src/routes/admin/{dashboard,members,member-status,member-delete}.ts`
- shared schema: `packages/shared/src/zod/viewmodel.ts`
- CLAUDE.md「重要な不変条件」§5/6/7
