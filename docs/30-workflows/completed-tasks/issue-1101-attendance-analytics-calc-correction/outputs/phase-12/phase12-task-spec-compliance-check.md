# Phase 12 Task Spec Compliance Check

root evidence として残す準拠チェック（issue-1101-attendance-analytics-calc-correction）。
canonical 9 見出しは `phase12-compliance-check-template.md` の `Required Sections`（1..9）に逐語準拠する。

## 1. Summary verdict

総合判定: `implemented_local_evidence_captured / implementation / VISUAL / staging visual user-gated`。

本タスクは出席分析の計算意味論（zone 境界バグ・延べ/unique rate）是正の **実装仕様書**である。
workflow_state は `implemented_local_evidence_captured`。`apps/api` / `packages/shared` / `apps/web` / `docs` への実変更と focused vitest は **本サイクルで取得済み**。
主証跡は focused vitest（component / repository test）。staging 認証済み視覚証跡・commit / push / PR は user-gated のため未実行。issue #1101 は CLOSED のまま維持する。

## 2. Changed-files classification

以下は本 wave で実際に変更したファイル分類。

| 分類 | 対象 |
| --- | --- |
| apps/api repository | `apps/api/src/repository/attendance-analytics.ts`（zoneFromCount 境界修正 / normalizeZone 互換 / unique 集計 / zone order SSOT） |
| apps/api filter parser | `apps/api/src/lib/parse-attendance-filter.ts`（旧矢印 query の新キー互換正規化） |
| packages/shared schema | `packages/shared/src/zod/admin-attendance.ts`（AttendanceZoneZ 再設計 / Ext additive field） |
| apps/web lib | `apps/web/src/features/admin/attendance/lib/format-attendance.ts`, `read-attendance-filter.ts`（ZONE_LABEL / SELECTABLE_ZONES / ZONE_HELP / 旧矢印 query 互換） |
| apps/web component | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx`（unique KPI タイル追加） |
| apps/web Playwright fixture/evidence | `apps/web/playwright/fixtures/auth.ts`, `apps/web/playwright/tests/issue-1101-attendance-analytics-calc-correction.spec.ts`（新 zone key mock + local screenshot evidence） |
| apps/api focused tests | `attendance-analytics-internals.spec.ts` / `attendance-analytics.repository.spec.ts` / `parse-attendance-filter.spec.ts` |
| apps/web focused tests | `format-attendance.spec.ts` / `KpiPanel.spec.tsx` / `AttendanceZoneDistributionChart.spec.tsx` / `buildExportUrl.spec.ts` |
| docs | `docs/00-getting-started-manual/specs/01-api-schema.md`（Zone 派生 / 集計母数 / overview shape / query 互換） |
| task-specification-creator skill | `references/patterns-validation-and-audit.md`, `references/patterns-lessons-and-pitfalls.md`, `SKILL-changelog.md`（SF-1 promotion） |
| aiworkflow-requirements | quick-reference / resource-map / task-workflow-active / artifact inventory / changelog |
| workflow docs（本 wave で作成） | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/outputs/**` |
| apps/api routes / migrations | **変更なし**（AC-8・不変条件 #1 #5）。`git diff --name-only -- apps/api/migrations apps/api/src/routes` は空 |
| 別ドメイン UBM 成長フェーズ zone | **変更なし**（`byZone.ts` / `AboutUbm.tsx` / `MemberFilters.client.tsx` / `SelectedFiltersBar.client.tsx`） |

## 3. `workflow_state` and phase status consistency

| Source | Value |
| --- | --- |
| `index.md` workflow_state | `implemented_local_evidence_captured` |
| Phase 11 | completed（focused vitest present。staging 視覚証跡は user-gated） |
| Phase 12 | completed（6 成果物を実体配置） |
| Phase 13 | pending_user_approval（commit / push / PR / staging deploy は user-gated） |
| issue #1101 | CLOSED のまま（状態変更なし） |

drift なし: workflow root は `implemented_local_evidence_captured`、Phase 11 は local focused evidence present / staging 視覚証跡 pending、Phase 13 は user approval pending で分離されている。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| local focused vitest | outputs/phase-11/manual-test-result.md | present |
| local Playwright screenshot desktop | outputs/phase-11/screenshots/TC-11-issue1101-attendance-analytics-desktop.png | present |
| local Playwright screenshot mobile | outputs/phase-11/screenshots/TC-11-issue1101-attendance-analytics-mobile.png | present |
| local Playwright screenshot inventory | outputs/phase-11/screenshot-inventory.json | present |
| staging authenticated screenshot | outputs/phase-11/manual-test-result.md | pending |

> `manual-test-result.md` は主証跡=focused vitest の結果、VISUAL だが component test を主証跡とする理由、staging 視覚証跡 user-gated を記録する。
> local fixture screenshot は Phase 11 証跡として present。staging スクリーンショットのみ Phase 13 user-gated として pending。

## 5. Phase 12 strict 7 file inventory

| Classification | Path | Status |
| --- | --- | --- |
| Phase 12 本体 | outputs/phase-12/main.md | present |
| Task 1 実装ガイド | outputs/phase-12/implementation-guide.md | present |
| Task 2 仕様更新サマリ | outputs/phase-12/system-spec-update-summary.md | present |
| Task 3 更新履歴 | outputs/phase-12/documentation-changelog.md | present |
| Task 4 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | present |
| Task 5 skill feedback | outputs/phase-12/skill-feedback-report.md | present |
| Task 6 compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | present |

### implementation-guide.md heading-only reject gate 実測

| Part | 本文行数（非空・見出し除く） | key sections | 判定 |
| --- | --- | --- | --- |
| Part 1: やさしい説明（中学生レベル） | 30+ | なぜ必要か / 何が壊れているか / 何をするか / 延べと実人数のちがい（例え話） / やること・やらないこと / 専門用語セルフチェック | PASS（3 行以上 + 例え話「たとえば」+ 用語表） |
| Part 2: 技術詳細（開発者レベル） | 60+ | 全体方針 / 型定義 / 関数シグネチャ / 定数一覧 / SQL・bind 順序 / 使用例 / エラーハンドリング / エッジケース・既知制限 / 検証コマンド | PASS（3 行以上 + 検証コマンド + 既知制限 + 型ブロック） |

両 Part とも本文 3 行以上かつ必須 key section を充足。見出し存在のみの strict PASS ではない。

## 6. Skill/reference/system spec same-wave sync

| Target | Status |
| --- | --- |
| task-specification-creator Phase 12 strict 成果物 | done（本 wave で main.md + 6 成果物 + Phase 11 evidence を実体配置） |
| system spec Step 2（新規 field / enum 再設計） | done（`01-api-schema.md` 更新済み。詳細は system-spec-update-summary.md） |
| aiworkflow-requirements indexes / LOGS / inventory | done（workflow inventory / quick-reference / resource-map / changelog / task-workflow-active を同 wave 同期） |
| skill-feedback routing | SF-1 を task-specification-creator へ同 wave promotion 済み / SF-2・SF-3 を no-op に routing（skill-feedback-report.md に evidence path 明記） |

## 7. Runtime or user-gated boundary

focused vitest（主証跡）・local Playwright screenshot・実コード差分は本サイクルで取得済み。`mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `pnpm verify:phase12-compliance` / `pnpm gate-metadata:validate --require-gates-for-changed ...` は PASS 済み。
staging 認証済みスクリーンショット・staging deploy・commit / push / PR は user 明示承認後に行う（Phase 13）。
staging runtime artifact を擬似生成せず、spec 証跡（focused vitest・実装サイクル取得）と staging visual 証跡（user-gated）を分離する。

## 8. Archive/delete stale-reference gate

| Item | Status |
| --- | --- |
| 削除 / 移動した workflow root | なし（本 wave で root 移動・削除は行わない） |
| 親タスクとのリンク | `admin-attendance-dashboard-ux`（#1108 merged）から分離された課題を formalize。親子の単方向リンクを維持 |
| stale 参照 | 検出なし。本 wave は新規ファイル作成のみで、live inventory / active workflow / consumed trace の破壊的書き換えなし |
| completed-tasks move | 未実施。Phase 13 は pending_user_approval のまま |

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented_local_evidence_captured` と「staging 視覚証跡 user-gated」が index / artifacts / Phase 11 / Phase 12 で整合 |
| 漏れなし | PASS | strict 成果物（main.md + 6 成果物）、Step 2 実更新、M-1/M-2 解消、skill-feedback promotion、aiworkflow 同期、Phase 11 focused evidence を記録 |
| 整合性あり | PASS | canonical 9 見出しが template `Required Sections` に逐語一致。workflow_state / Step 2 / 未タスク current=0 / 変更ファイル集合が各 outputs と同値 |
| 依存関係整合 | PASS | 親タスク（#1108）との単方向リンク維持。`apps/api` routes/migrations 非変更（AC-8）。別ドメイン zone 非変更。新 D1 schema 依存を追加しない |
