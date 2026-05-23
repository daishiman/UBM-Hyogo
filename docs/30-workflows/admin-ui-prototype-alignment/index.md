# admin-ui-prototype-alignment

> Branch: `feat/admin-ui-prototype-alignment`
> 実装区分: **実装仕様書** (CONST_004 デフォルト)
> 状態: `implemented_local_runtime_pending`
> 作成日: 2026-05-23
> task type: `UI task` / `VISUAL`
> implementation_mode: `new` (一部 `verify_existing` あり — Dashboard / Members / Schema)

## 背景

staging (`https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin`) で `/admin` 配下が「管理画面を表示できませんでした」というエラーバウンダリで停止しており、プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/`) で定義された admin UI/UX とも乖離している。

このワークフローでは、

1. `/admin` のサーバ side fetch 失敗時の **error boundary 動作 → 部分劣化レンダリング** へ切り替え、画面を表示可能にする
2. admin 配下 8 ルート (+ `[id]` 詳細・`schema/history` 含む) を **プロトタイプ正本** (`pages-admin.jsx` / `primitives.jsx` / `styles.css`) に整合させる
3. 画面横断で再利用される shell / page header / kpi / table / queue / drawer / empty-state / error-state を **`apps/web/src/features/admin/components/_shared/`** に集約しコンポーネント化する

をこの workflow の Phase 5〜12 で進める。現時点の
`implemented_local_runtime_pending` は「実コードとローカル検証は完了、
authenticated runtime screenshot / staging refresh / commit / push / PR は user-gated」
を表す。runtime PASS や PR 作成完了はまだ主張しない。

## スコープ

### スコープ内 (admin route 一覧)

| Route                              | プロトタイプ正本 (`pages-admin.jsx`)        | 現状                             | 作業区分          |
| ---------------------------------- | ------------------------------------------ | -------------------------------- | ----------------- |
| `/admin` (Dashboard)               | `AdminDashboardPage` L4-159                | 実装済 (task-15)                 | verify + 整合修正 |
| `/admin/dashboard/attendance`      | (派生)                                     | 実装済                           | 整合修正          |
| `/admin/members`                   | `AdminMembersPage` L162-366                | 実装済 (task-15)                 | verify + 整合修正 |
| `/admin/tags`                      | `AdminTagsPage` L369-505                   | 実装済 (panel + drawer)          | 整合修正          |
| `/admin/meetings` (+ `[id]`)       | (派生 / GAS prototype 参考)                | 一覧 + 詳細 panel あり           | 整合修正          |
| `/admin/schema` (+ `/history`)     | `SchemaDiffPage` L508-656                  | 実装済 (task-17)                 | verify + 整合修正 |
| `/admin/requests`                  | (派生)                                     | 実装済 (panel)                   | 整合修正          |
| `/admin/identity-conflicts`        | (派生)                                     | 実装済 (row)                     | 整合修正          |
| `/admin/audit`                     | (派生)                                     | 実装済                           | 整合修正          |
| `/admin/loading`, `/admin/error`, `/admin/not-found` | 共通                              | 実装済                           | 整合修正          |

### スコープ外 (本サイクル内で対応しない)

| 項目                                                 | 理由                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| 新規 API endpoint 追加 / D1 schema 変更              | CLAUDE.md 不変条件 #5 / UI alignment スコープ外                         |
| `/admin/meetings/[id]/出席 CSV import` の機能拡張    | 既存機能の UI 整合のみで完了。新機能追加は本 workflow の独立目的ではない                |
| `/login`・`/profile`・public ページ                  | 本タスク対象外。同サイクルの別 PR で扱わない                            |
| Google Form schema 変更                              | 不変条件 #1                                                             |
| Auth.js / middleware の認証ロジック変更              | error 原因が認証由来でも、本 workflow は UI degrade と表示継続を扱う。認証仕様そのものを変更しない |

## 不変条件 (本ワークフロー固有)

1. **既存 API のみ接続**: `apps/api/src/routes/admin/**` の現行 endpoint surface のみ。新 endpoint 禁止。
2. **OKLch トークン正本化**: `apps/web/src/styles/tokens.css` (`--ubm-color-*`) を正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。
3. **プロトタイプ正本順位**: `docs/00-getting-started-manual/claude-design-prototype/{pages-admin.jsx, primitives.jsx, styles.css}` の primitive + token + spacing をデザイン言語の正本とする。
4. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止 (CLAUDE.md #5)。
5. **FormField 経由必須**: admin form input は `FormField` 経由 (CLAUDE.md #9)。
6. **useAdminMutation 経由必須**: admin mutation は `@/features/admin/hooks/useAdminMutation` のみ (CLAUDE.md #10)。
7. **テスト命名**: `*.spec.{ts,tsx}` のみ (CLAUDE.md #8)。
8. **error boundary 方針**: 画面全体停止ではなく per-section error カードに degrade する (本ワークフローで新規導入)。

## 正本順位 (衝突時)

1. このワークフローの `phase-1-requirements.md` / `phase-2-design.md`
2. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
3. `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
4. プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/`)
5. `apps/web/src/styles/tokens.css`

## Phase 一覧

| Phase | File                                              | 内容                                                       |
| ----- | ------------------------------------------------- | ---------------------------------------------------------- |
| 1     | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 (inventory・命名規則・P50 チェック)               |
| 2     | [phase-2-design.md](phase-2-design.md)             | 設計 (共通コンポーネント設計・state 引き渡し・error 戦略)  |
| 3     | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー (gate)                                       |
| 4     | [phase-4-test-plan.md](phase-4-test-plan.md)       | テスト計画 (vitest / Playwright)                          |
| 5     | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 (lane A: shell, B: components, C: pages)        |
| 6     | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充 (fail path / regression)                      |
| 7     | [phase-7-coverage.md](phase-7-coverage.md)         | カバレッジ確認 (変更ブロック単位)                          |
| 8     | [phase-8-refactor.md](phase-8-refactor.md)         | リファクタ (重複削除 / navigation drift)                   |
| 9     | [phase-9-qa.md](phase-9-qa.md)                     | 品質保証 (typecheck / lint / build / verify-design-tokens) |
| 10    | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー                                              |
| 11    | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト (3 層評価 / VISUAL)                            |
| 12    | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント更新 (Part 1/2 + 5 必須成果物)               |
| 13    | [phase-13-pr.md](phase-13-pr.md)                   | PR 作成 (user 明示承認後)                                  |

## 変更対象ファイル (overview)

### 新規

- `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx`
- `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`
- `apps/web/src/features/admin/components/_shared/AdminEmptyState.tsx`
- `apps/web/src/features/admin/components/_shared/AdminStat.tsx`
- `apps/web/src/features/admin/components/_shared/AdminTable.tsx`
- `apps/web/src/features/admin/components/_shared/AdminQueuePanel.tsx`
- `apps/web/src/features/admin/components/_shared/index.ts` (barrel)
- 各 `*.spec.tsx` (上記 component の unit test)

### 修正

- `apps/web/app/(admin)/layout.tsx` (sidebar・shell 整合)
- `apps/web/app/(admin)/admin/error.tsx` (per-section degrade に対応するメッセージ整理)
- `apps/web/app/(admin)/admin/page.tsx` (fetch 失敗時に skeleton + section error へ degrade)
- `apps/web/app/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}/page.tsx`
- `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`
- `apps/web/app/(admin)/admin/schema/history/page.tsx`
- `apps/web/app/(admin)/admin/meetings/[id]/page.tsx`
- `apps/web/src/components/admin/{AuditLogPanel,Breadcrumb,MeetingPanel,RequestQueuePanel,SchemaDiffPanel,SchemaDiffHistoryPanel,TagQueuePanel,TagsQueueResolveDrawer,IdentityConflictRow,SchemaDiffBulkResolveModal}.tsx` (共通コンポーネント差し替え)
- `apps/web/src/styles/tokens.css` (不足トークンがあれば追加・既存値変更は禁止)

### 影響範囲

- 共通: `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` (再利用)
- 既存: `apps/web/src/components/ui/{Card,Button,Badge,Drawer,Toast,FormField,Input,Select,Switch,Segmented,KVList}.tsx` (流用のみ・変更禁止)

## 完了条件 (DoD overview)

1. staging deploy 後 `/admin` 配下 11 route が 200 を返し、白画面・全画面エラー画面にならない
2. プロトタイプ `pages-admin.jsx` の主要セクション (KPI / Zone / Members table / Tags queue / Schema diff) と視覚的に整合 (Phase 11 screenshot で 4 viewport × 5 key screen = 20 枚)
3. `pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm test --filter @ubm-hyogo/web` 全 PASS
4. `verify-design-tokens` (CI gate) が PASS (HEX 直書き 0 件)
5. Phase 12 strict 7 成果物 (`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`) が揃う

## 関連タスク

| Task                                                                                                                       | 状態          | 関連性                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md` | completed     | Dashboard / Members の前任 (本タスクで verify + 補正) |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-16-w6-par-admin-tags-meetings-requests.md` | completed     | Tags / Meetings / Requests の前任                   |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-17-w6-par-admin-schema-conflicts-audit.md` | completed     | Schema / Identity / Audit の前任                    |
| `docs/30-workflows/ui-prototype-design-system-foundation/`                                                                  | 進行中        | OKLch token / primitive 正本側                      |

## メモ

- 本ワークフローはコード実装を含む。`apps/web` の admin route / shared
  components / `safeServerFetch` 差分がこの branch の実装成果物である。
- Phase 1〜13 はすべて実装仕様書として作成。docs-only 例外なし。
