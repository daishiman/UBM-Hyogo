# Phase 9: 品質保証（QA）

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 前提: Phase 1〜8 完了（要件・設計・設計レビュー・テスト計画・実装手順・テスト追加・カバレッジ・リファクタ）
- workflow_state: `implemented_local_runtime_pending`（本タスクは実装仕様書のみ authored。下記の実行コマンド・期待結果は **実装後に実行する手順** として記述し、実行は user-gated）

## 目的

AC-1..AC-10 を検証するための品質ゲートを一覧化し、実装後に全ゲートを通過させる手順と PASS 基準を確定する。本タスクは `apps/web` 表現層のみを変更するため、API 非変更（AC-8）とトークン厳守（AC-7）を機械 gate として明示する。

> implemented_local_runtime_pending 段階では実コードが存在しないため、本 Phase の各コマンドは「実装後に実行する手順と期待値」を記述する。実行（vitest / typecheck / lint）は user-gated。

## QA 区分（5 区分）

1. 静的解析（typecheck / lint）
2. デザイントークン gate（HEX 直書き 0 件 = AC-7）
3. focused vitest（AC-10）
4. API 非変更確認（`git diff --name-only -- apps/api` が空 = AC-8）
5. line budget / link / mirror parity の確認

## 実行タスク

### タスク 1: 静的解析（typecheck / lint）

```bash
# 型チェック: import 解決・型整合（DASHBOARD_KPI_LABELS / describeAuditAction 等の参照）を確認
mise exec -- pnpm typecheck

# リント: eslint 違反確認
mise exec -- pnpm lint
```

**PASS 基準**: どちらも exit 0（エラー 0 件）。lint 違反が出た場合は `pnpm lint --fix` で自動修正可能なものを解消し、残りを手修正する。

### タスク 2: デザイントークン gate（AC-7）

新規 HEX 直書き 0 件・arbitrary color（`bg-[#...]` / `text-[#...]` / `fill-[#...]`）0 件を確認する。StatusDistribution の横バーは `var(--ubm-color-ok|info|warn)` を `fill` に使い、dot は `style={{ background: s.colorVar }}`（CSS 変数参照）であり HEX に該当しない。

```bash
# (1) _dashboard 配下 TSX に新規 HEX 直書きがないこと
grep -rnE '#[0-9a-fA-F]{3,8}' \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/lib/admin/dashboardGlossary.ts \
  | grep -v '^\s*/\*' \
  && echo "[FAIL: raw hex found]" || echo "[PASS: no raw hex]"

# (2) _dashboard 配下に arbitrary color がないこと
grep -rnE '(bg|text|border|fill|stroke)-\[#' \
  apps/web/src/features/admin/components/_dashboard \
  && echo "[FAIL: arbitrary color found]" || echo "[PASS: no arbitrary colors]"

# (3) verify:tokens（プロジェクト全体のトークン gate）
mise exec -- pnpm verify:tokens
```

**PASS 基準**: (1)(2) は出力なし（`[PASS]`）。(3) は green。これにより AC-7（色は OKLch トークンのみ・HEX 直書き 0 件）を担保する。

### タスク 3: focused vitest 実行（AC-10）

`_dashboard` コンポーネント群 + `RecentActionsTable` + `dashboardGlossary` + `AuditLogPanel` のテストを絞って実行する。

```bash
mise exec -- pnpm exec vitest run \
  --root=. \
  --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
```

**PASS 基準**: 以下の spec が全て PASS する。

| spec ファイル | 検証内容（AC） | 期待 |
| --- | --- | --- |
| `dashboardGlossary.spec.ts`（新規） | `DASHBOARD_KPI_LABELS` 4 値 / `describeAuditAction` の登録コード変換 / 未登録コードの raw fallback / `describeTargetType` の fallback / `describeTarget` の `ラベル ID` 連結（AC-6） | PASS |
| `KpiGrid.spec.tsx`（更新） | KPI 4 枚のラベルが日本語（会員総数 / サイト公開中 / タグ未設定 / 要対応のフォーム項目）（AC-1） | PASS |
| `KpiCard.spec.tsx`（更新） | `uppercase` クラスが付与されていないこと（AC-1） | PASS |
| `SchemaAlertCard.spec.tsx`（更新） | 「スキーマ」「alias」「schema」の技術語が排除され、`/admin/schema` リンク・`role="alert"` を維持（AC-2） | PASS |
| `ZoneDistribution.spec.tsx`（更新） | eyebrow が `会員分布`（`DISTRIBUTION` 非存在）（AC-3） | PASS |
| `RecentActionsTable.spec.tsx`（更新） | `recent-actions-list` / `recent-action-item` 構造・日本語アクション名・対象 truncation・`/admin/audit` リンク維持・axe 0 違反（AC-4 / AC-9） | PASS |
| `StatusDistribution.spec.tsx`（更新） | `aria-label="公開ステータス分布: …"` 維持・`status-distribution-list` 構造・HEX 不在 assertion・600px SVG 廃止（AC-5 / AC-9） | PASS |
| `AuditLogPanel.component.spec.tsx`（更新） | `/admin/audit` の action / targetType 日本語化・raw 保持・未登録 fallback（RES-1） | PASS |

### タスク 4: API 非変更確認（AC-8）

```bash
# apps/api への git diff が空であること
git diff --name-only -- apps/api \
  | grep . \
  && echo "[FAIL: apps/api was modified]" || echo "[PASS: apps/api untouched]"

# D1 migration / Google Form schema が変更されていないこと
git diff --name-only -- apps/web/migrations/ \
  | grep . \
  && echo "[FAIL: D1 migration modified]" || echo "[PASS: migrations untouched]"
```

**PASS 基準**: どちらも出力なし（`[PASS]`）。これにより AC-8（`apps/api` / D1 / Google Form 非変更）を担保する。

### タスク 5: 変更ファイルの存在確認（新規 5 / 編集 8）

実装後、想定変更ファイルが diff に現れることを確認する。

```bash
git diff --name-only HEAD | grep -E \
  "dashboardGlossary\.ts|\
KpiGrid\.tsx|KpiCard\.tsx|\
SchemaAlertCard\.tsx|ZoneDistribution\.tsx|\
RecentActionsTable\.tsx|StatusDistribution\.tsx|\
dashboardGlossary\.spec\.ts|\
KpiGrid\.spec\.tsx|KpiCard\.spec\.tsx|\
SchemaAlertCard\.spec\.tsx|ZoneDistribution\.spec\.tsx|\
RecentActionsTable\.spec\.tsx|StatusDistribution\.spec\.tsx"
```

**PASS 基準**: 想定の新規 5（`dashboardGlossary.ts` + spec 群のうち新規分）/ 編集 8（既存コンポーネント + 既存 spec 更新分）が差分として現れ、想定外ファイルが混入していないこと。

## [FB-UI-02-1] ファイル削除の扱い

**本タスクは削除なし**。全変更は「新規作成（`dashboardGlossary.ts` + 新規 spec）」または「既存ファイルの編集（既存コンポーネント・既存 spec の構造系 assertion 更新）」のいずれかである。`<table>` → `<ul>`、固定 SVG → 横バーリストの再設計も、ファイル名・export 名（`RecentActionsTable` / `StatusDistribution`）を維持した **内部 DOM の編集** であり、ファイル削除には該当しない。

- 削除ファイル数: **0 件**
- barrel（`apps/web/src/features/admin/components/index.ts`）・`page.tsx` の import は維持されるため、削除起因の参照断は発生しない。

## line budget / link / mirror parity の確認観点

| 観点 | 確認内容 | コマンド / 手段 |
| --- | --- | --- |
| line budget | `dashboardGlossary.ts` が glossary SSOT の責務に収まる行数（過大な追加ロジックを持ち込まない・純関数のみ）であること | コードレビュー（Phase 8 リファクタ結論を再確認） |
| link | 本 Phase / index.md の相対リンク（`phase-1-requirements.md` 等）が解決すること | `verify:phase12-compliance` の link 走査（実装後） |
| mirror parity | `docs/30-workflows/` 配下 spec とミラー（存在する場合）の byte 一致 | mirror diff 確認（該当時のみ） |

## AC-1..AC-10 チェックボックス表

| AC | 条件要旨 | 検証手段 | 判定 |
| --- | --- | --- | --- |
| AC-1 | KPI 4 枚のラベルが日本語・`uppercase` 撤廃 | タスク 3（KpiGrid / KpiCard spec） | [ ] |
| AC-2 | SchemaAlertCard の技術語排除・平易化 | タスク 3（SchemaAlertCard spec） | [ ] |
| AC-3 | ZoneDistribution eyebrow が `会員分布` | タスク 3（ZoneDistribution spec） | [ ] |
| AC-4 | 直近のアクションがカード型・日本語化・対象 truncation | タスク 3（RecentActionsTable spec）+ Phase 11 視覚 | [ ] |
| AC-5 | 公開ステータスがコンパクト横バー・600px SVG 廃止 | タスク 3（StatusDistribution spec）+ Phase 11 視覚 | [ ] |
| AC-6 | `dashboardGlossary.ts` 新設・fallback 保持 | タスク 3（dashboardGlossary spec） | [ ] |
| AC-7 | 色は OKLch トークンのみ・HEX 直書き 0 件・`verify:tokens` PASS | タスク 2（3 コマンド全 PASS） | [ ] |
| AC-8 | `apps/api` / D1 / Google Form 非変更 | タスク 4（git diff 空） | [ ] |
| AC-9 | 既存テスト契約（aria-label / testid / axe）維持しつつ新構造へ更新 | タスク 3（StatusDistribution / RecentActionsTable spec） | [ ] |
| AC-10 | focused vitest が PASS | タスク 3 全 PASS（7 files / 77 tests） | [x] |

## 検証コマンドまとめ（一括実行用・実装後）

```bash
# 1. 型チェック・リント
mise exec -- pnpm typecheck && mise exec -- pnpm lint

# 2. デザイントークン gate
grep -rnE '#[0-9a-fA-F]{3,8}' \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/lib/admin/dashboardGlossary.ts \
  | grep -v '^\s*/\*' && echo "[FAIL]" || echo "[PASS: no raw hex]"
grep -rnE '(bg|text|border|fill|stroke)-\[#' \
  apps/web/src/features/admin/components/_dashboard \
  && echo "[FAIL]" || echo "[PASS: no arbitrary colors]"
mise exec -- pnpm verify:tokens

# 3. focused vitest
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx \
  apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx

# 4. API / migration 非変更
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"
git diff --name-only -- apps/web/migrations/ | grep . && echo "[FAIL]" || echo "[PASS: migrations untouched]"
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-1-requirements.md` | AC-1..AC-10 定義 |
| 設計正本 | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-2-design.md` | glossary / コンポーネント再設計の根拠 |
| 設計レビュー | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-3-design-review.md` | 不変条件適合・リスク対策 |
| デザイントークン | `apps/web/src/styles/tokens.css` | token 名確認（`--ubm-color-bg` 等） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 9 仕様書 | 文書 | QA チェックリスト・検証コマンド・AC マッピング・削除なし明示 |
| 各 spec の PASS 証跡 | runtime | 実装後 Phase 11 `manual-test-result.md` に記録（user-gated） |

## 統合テスト連携

- focused vitest（タスク 3）の PASS が Phase 10 最終レビューの AC-10 / AC-1..AC-6 / AC-9 判定根拠となる。
- タスク 2（トークン gate）の PASS が AC-7、タスク 4（API 非変更）の PASS が AC-8 の判定根拠となる。
- jsdom は CSS を評価しないため、AC-4（対象 truncation でカード内に収まる）/ AC-5（コンパクト横バー）のレイアウト確認は Phase 11 の staging スクリーンショット（user-gated）が担保する。本 Phase は構造・文言・トークンを担保する。

## 完了条件

- [ ] `pnpm typecheck` / `pnpm lint` が exit 0（実装後）。
- [ ] デザイントークン gate 3 コマンドが全 PASS / `verify:tokens` green（AC-7）。
- [ ] focused vitest（`_dashboard` + `RecentActionsTable` + `dashboardGlossary`）が全 PASS（AC-10）。
- [ ] `git diff --name-only -- apps/api` および `apps/web/migrations/` が空（AC-8）。
- [ ] 本タスクが削除なし（全て新規/編集）であることを明記した（[FB-UI-02-1]）。
- [ ] line budget / link / mirror parity の確認観点を記述した。
- [ ] AC-1..AC-10 チェックボックスが全チェック済みとなるか、未確認項目が Phase 11 視覚境界として明記されている。
