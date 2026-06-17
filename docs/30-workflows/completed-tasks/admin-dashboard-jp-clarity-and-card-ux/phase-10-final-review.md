# Phase 10: 最終レビュー

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 前提: Phase 1（AC-1..AC-10）/ Phase 2（glossary・コンポーネント再設計）/ Phase 3（設計レビュー PASS・MINOR 0 件）/ Phase 4-8（テスト計画・実装手順・テスト追加・カバレッジ・リファクタ）/ Phase 9（QA gate）
- workflow_state: `implemented_local_runtime_pending`（apps/web 実装・focused vitest は完了。authenticated staging 視覚証跡・commit・PR は user-gated）
- visualEvidence: `VISUAL`（視覚確認は Phase 11 で user-gated として実施）
- 本 Phase の責務: AC-1..AC-10 を検証 Phase へ trace し、blocker 無しを確定し、DoD を明示する

## 目的

Phase 1〜9 の成果（要件・設計・テスト計画・QA gate）が AC-1..AC-10 へ漏れなく trace されていることを最終確認し、本タスクが「実装済みローカル PASS」であることを判定する。本タスクは implemented_local_runtime_pending 段階のため、各 AC は local 実装と focused tests で green 化済み として記述し、視覚依存項目は Phase 11 の user-gated 視覚確認境界を併記する。

## 実行タスク

### 1. AC-1..AC-10 trace 表

判定列の語彙: `spec_authored`（仕様として確定・実装後に green 化）/ `runtime_pending`（staging 視覚確認が user-gated で未実施・実装後）。

| AC | 主担当の変更点（C1-C5） | 検証 Phase | 判定 |
| --- | --- | --- | --- |
| AC-1 KPI 日本語化 | C1: `KpiGrid.tsx` を `DASHBOARD_KPI_LABELS` 参照へ・`KpiCard.tsx` の `uppercase` 撤廃 | Phase 9（KpiGrid / KpiCard spec） | `spec_authored` |
| AC-2 用語平易化 | C2: `SchemaAlertCard.tsx` の「スキーマ/alias/schema」言い換え | Phase 9（SchemaAlertCard spec） | `spec_authored` |
| AC-3 eyebrow 日本語化 | C2: `ZoneDistribution.tsx` の `DISTRIBUTION` → `会員分布` | Phase 9（ZoneDistribution spec） | `spec_authored` |
| AC-4 直近のアクション再設計 | C3: `RecentActionsTable.tsx` を `<table>` → カード型 `<ul>/<li>`・日本語化・対象 truncation | Phase 9（RecentActionsTable spec）+ Phase 11 視覚 | `spec_authored` ／ 視覚は `runtime_pending` |
| AC-5 公開ステータス再設計 | C4: `StatusDistribution.tsx` を 600px 固定 SVG → コンパクト横バーリスト | Phase 9（StatusDistribution spec）+ Phase 11 視覚 | `spec_authored` ／ 視覚は `runtime_pending` |
| AC-6 用語 SSOT 新設 | C5: `dashboardGlossary.ts` 新設・fallback 保持 | Phase 9（dashboardGlossary spec） | `spec_authored` |
| AC-7 トークン厳守 | 全色 `var(--ubm-color-*)` 経由・HEX 直書き 0 件 | Phase 9（タスク 2: 3 コマンド全 PASS） | `spec_authored` |
| AC-8 API 非変更 | `apps/api` / D1 / Google Form を変更しない | Phase 9（タスク 4: `git diff --name-only -- apps/api` 空） | `spec_authored` |
| AC-9 既存テスト契約維持 | StatusDistribution の `aria-label` / RecentActionsTable の `/admin/audit` リンク・axe 維持しつつ構造 assertion 更新 | Phase 9（StatusDistribution / RecentActionsTable spec） | `spec_authored` |
| AC-10 focused vitest PASS | dashboardGlossary + dashboard components + RecentActionsTable + AuditLogPanel | Phase 9（タスク 3: 7 files / 77 tests PASS） | `implemented_local_pass` |

> AC-4 / AC-5 の「カード内に収まる / コンパクトに見える」CSS の効きは jsdom で検証不能なため、Phase 11 staging スクリーンショットで `runtime_pending` として user-gated 確認する境界を残す。

### 2. blocker 判定 / MINOR 追跡

- **blocker: 0 件**。設計・テスト計画・QA gate に矛盾はなく、API 契約・トークン・既存テスト契約をすべて維持する。1 サイクル・1 PR・`apps/web` 表現層で完結する。
- **MINOR: 0 件**（Phase 3 設計レビューで MINOR 指摘なしと記録済み）。

| MINOR ID | 指摘内容 | 解決 Phase | ステータス |
| --- | --- | --- | --- |
| （なし） | — | — | 0 件 |

#### same-cycle follow-up

| ID | 内容 | 対応 / ステータス |
| --- | --- | --- |
| RES-1 | `/admin/audit`（`AuditLogPanel.tsx`）への glossary 適用 | automation-30 レビューで未タスク化の根拠不足を検出し、同サイクルで実装済み。`AuditLogPanel.component.spec.tsx` に日本語表示 / raw 保持 / fallback を追加 |
| OOS-2 | API 側アクションコード体系の再設計・i18n フレームワーク導入 | 不変条件 #1 #5 に抵触。本タスクは UI 表現層のみ |
| OOS-3 | ダッシュボード以外の管理画面の英語表記一斉点検 | 各画面固有の改善サイクルで扱う |

> automation-30 レビューで検出した RES-1 は未タスク化せず、本サイクル内で解消した。

### 3. 不変条件の最終適合確認（CLAUDE.md）

| 不変条件 | 最終判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ接続・endpoint 追加 / D1 / Form 変更禁止 | ✅ 適合 | 変更は `apps/web` の TSX/TS/test のみ。`recentActions` / `StatusSlice` の shape 不変。AC-8 で `git diff --name-only -- apps/api` 空を gate |
| #2 OKLch トークン正本・HEX 直書き禁止 | ✅ 適合 | 全色 `var(--ubm-color-*)` 経由。新色トークン追加なし。AC-7 で `verify:tokens` + grep gate |
| #5 D1 直接アクセス禁止（apps/web → D1） | ✅ 適合 | データ取得は既存 viewmodel 経由のまま。新規 D1 アクセスなし |
| #8 test は `*.spec.*` のみ | ✅ 適合 | 新規 test は `dashboardGlossary.spec.ts` 等すべて `*.spec.ts(x)`。`*.test.*` 不使用 |
| #9 admin form input は FormField 経由 | ✅ 影響なし | 本タスクは form input を追加しない（KPI / リスト / バーの表示のみ） |

### 4. 実装サイクルで green 化すべき項目（implemented_local_runtime_pending → 実装後 green）

| 対象 | spec の期待（実装後） | 対応 AC |
| --- | --- | --- |
| `dashboardGlossary.ts`（新規） | `DASHBOARD_KPI_LABELS` / `MEMBER_STATUS_LABELS` / `describeAuditAction` / `describeTargetType` / `describeTarget` を純関数で実装・未登録は raw fallback | AC-6 |
| `KpiGrid.tsx` / `KpiCard.tsx` | 英語直書き → glossary 参照・`uppercase` 撤廃 | AC-1 |
| `SchemaAlertCard.tsx` | 技術語を平易な日本語へ・`/admin/schema` リンク維持 | AC-2 |
| `ZoneDistribution.tsx` | `DISTRIBUTION` → `会員分布` | AC-3 |
| `RecentActionsTable.tsx` | `<table>` → カード型 `<ul>/<li>`・`describeAuditAction` / `describeTarget` 適用・`truncate` | AC-4 |
| `StatusDistribution.tsx` | 600px 固定 SVG → 横バーリスト・`aria-label` 維持・testid を `status-distribution-list` へ | AC-5 / AC-9 |
| 各 spec | 構造系 assertion を新 DOM に合わせ更新（既存契約は維持） | AC-9 / AC-10 |

> いずれも `apps/web` 内に閉じ、1 つの実装サイクルで green 化可能。実装後に Phase 9 の focused vitest / gate で全 PASS を確認する。

## DoD（Definition of Done）

本タスクが「完了」とみなされる条件（実装後・user-gated 含む）:

1. **ビルド成功**: `mise exec -- pnpm typecheck` / `pnpm lint` が exit 0。
2. **テストパス**: focused vitest（dashboardGlossary + dashboard components + RecentActionsTable + AuditLogPanel）が全 PASS（7 files / 77 tests, AC-10）。
3. **トークン厳守**: `verify:tokens` green・HEX 直書き 0 件（AC-7）。
4. **API 非変更**: `git diff --name-only -- apps/api` が空（AC-8）。
5. **想定動作の確認**（Phase 11 staging スクリーンショット・user-gated）:
   - **日本語表示**: KPI 4 枚が日本語ラベル、SchemaAlertCard が平易な日本語、eyebrow が `会員分布`、直近のアクションのアクション/対象が日本語化されていること（技術語の排除）。
   - **カード内収まり**: 直近のアクションがカード型リストで、対象 ID が truncation でカード幅を超えないこと（AC-4）。
   - **コンパクト横バー**: 公開ステータスが横バーリストで、600px 固定 SVG の横長余白が解消されていること（AC-5）。
6. **PR**: `dev` ブランチへの PR が作成され CI green（user-gated・Phase 13）。

> implemented_local_runtime_pending 段階のため、apps/web 実装・focused vitest は完了。staging 視覚証跡・commit・PR は user-gated。本 Phase は仕様としての PASS 判定までを行う。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-1-requirements.md` | AC-1..AC-10 定義・根本原因 |
| 設計 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-2-design.md` | glossary コード・C1-C4 Before/After |
| 設計レビュー | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-3-design-review.md` | MINOR 0 件・不変条件適合・リスク対策 |
| QA | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-9-qa.md` | gate コマンド・AC マッピング |
| 手動テスト計画 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-11-manual-test.md` | AC-4/5 の視覚確認（runtime_pending） |
| RES-1 経緯 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/unassigned-task-specs/admin-audit-page-jp-action-labels.md` | audit 画面の glossary 適用（同サイクル解消済み） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 10 仕様書 | 文書 | AC-1..AC-10 trace・blocker 0 件・MINOR 0 件・RES-1 同サイクル解消・DoD |
| 最終判定 | 判定 | 実装済みローカル PASS |

## 統合テスト連携

- 本 Phase の AC trace が Phase 12 compliance check の AC trace 節と一致すること。
- blocker 0 件 / MINOR 0 件が Phase 3 → Phase 10 → Phase 12 で一貫していること。
- 「実装サイクルで green 化すべき項目」が Phase 9 focused vitest と 1:1 で対応していること。
- AC-4 / AC-5 の視覚 `runtime_pending` 行が Phase 11 へ user-gated として引き継がれること。

## 最終判定

**実装済みローカル PASS**。blocker 0 件・MINOR 0 件。AC-1..AC-10 が検証 Phase へ trace され、不変条件 #1/#2/#5/#8/#9 に適合。視覚依存（AC-4/AC-5）は Phase 11 `runtime_pending` を明示して境界化。apps/web 実装・focused vitest は完了。staging 証跡・commit・PR は user-gated。

## 完了条件

- [ ] AC-1..AC-10 が検証 Phase へ trace され、視覚依存項目に `runtime_pending` 境界が併記されている。
- [ ] blocker 0 件・MINOR 0 件が確定し、Phase 3 と一致している。
- [x] RES-1（audit 画面 glossary 適用）が同サイクルで実装済みであることを確認した。
- [ ] 不変条件 #1/#2/#5/#8/#9 の最終適合が確認されている。
- [ ] DoD（ビルド成功・テストパス・想定動作の確認手順）が明示されている。
- [ ] コード実装 / vitest 実行 / staging 証跡 / PR が user-gated であることを明記した。
- [ ] 最終判定が「実装済みローカル PASS」である。
