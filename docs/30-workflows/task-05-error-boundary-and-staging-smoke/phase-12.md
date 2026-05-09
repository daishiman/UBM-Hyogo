# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-12/main.md`

Phase 12 は task-specification-creator skill の **6 必須タスク** を実行する。最低 7 ファイルを実体生成する。

## Task 12-1: 実装ガイド作成（中学生 + 技術者）

出力: `outputs/phase-12/implementation-guide.md`

### Part 1: 中学生レベル（概念説明）

> Web ページが表示できないとき、ぼくたちは「ごめんね、いまは表示できないよ」という別の画面を出したいよね。
> Next.js では `error.tsx` という名前のファイルを置いておくと、ページの中でエラーが起きたときに自動でその画面が出てくる仕組みになってる。
> このタスクではその「ごめんね画面」「ページが見つからないよ画面」「読み込み中だよ画面」「最悪のときの画面」の 4 つをぜんぶ用意する。
> あわせて、staging（本番のひとつ前のテスト場所）にあるページが、ぜんぶ正しく開けるかをテストする仕組みも作る。

### Part 2: 技術者レベル（実装ポイント）

- App Router の階層別 boundary 仕様（`error.tsx` は layout を保持、`global-error.tsx` は最上位）
- `"use client"` directive 必須
- `useEffect` 依存配列 `[error]` で多重 capture を抑止
- Sentry 連携は `@/lib/logger` 経由に集約（task-04 / task-03 の boundary 一本化）
- `STAGING_BASE_URL` は test runner 側の `process.env` 直参照のみ許可。Workers ランタイム側の `process.env` 直参照は引き続き禁止

## Task 12-2: システム仕様書更新

出力: `outputs/phase-12/system-spec-update-summary.md`

更新対象:
- `docs/00-getting-started-manual/specs/09-ui-ux.md` — error / 404 / loading の文言基準・aria 属性の記載追加（既存節に追記、無ければ新節）
- `.claude/skills/aiworkflow-requirements/` の対象 reference（error boundary / staging smoke の正本記載があれば更新、なければ新規追加候補として 12-4 へ繋ぐ）
- `docs/00-getting-started-manual/specs/00-overview.md` — 02-runtime 完了状況を更新対象に含める場合は Step 1-C に根拠を記録

Step 1-A/B/C ルールに従い、本 task で確定した契約のみ反映し、未確定事項は 12-4 へ。

## Task 12-3: ドキュメント更新履歴

出力: `outputs/phase-12/documentation-changelog.md`

更新行（canonical absolute path 列挙）:
- `apps/web/app/error.tsx`（new）
- `apps/web/app/global-error.tsx`（new）
- `apps/web/app/not-found.tsx`（new）
- `apps/web/app/loading.tsx`（new）
- `apps/web/tests/e2e/staging-smoke.spec.ts`（new）
- `apps/web/playwright.config.ts`（mod）
- `apps/web/package.json`（mod）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`（new / 19 routes 正本）
- `docs/30-workflows/task-05-error-boundary-and-staging-smoke/**`（new spec set）
- `.claude/skills/task-specification-creator/SKILL.md` / `LOGS.md`（必要時）
- `.claude/skills/aiworkflow-requirements/LOGS.md`（必要時）

## Task 12-4: 未タスク検出レポート

出力: `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**）

検出対象:
- error UI の最終デザイン適用（→ task-15 が既に予約。新規 unassigned 起票不要）
- a11y axe / token grep gate（→ task-18 既存。新規不要）
- error injection fixture の production 除外仕組みが実装で破綻した場合 → 個別 follow-up を起票
- Sentry dashboard アクセス権限の steady-state 化（runbook 化）→ 既存 runbook で扱う or 起票判断

各候補について: 苦戦箇所 / リスクと対策 / 検証方法 / スコープ の 4 セクション必須。

## Task 12-5: スキルフィードバック

出力: `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**）

3 観点固定:
- テンプレ改善: error boundary spec 用テンプレが既存テンプレで十分かの評価
- ワークフロー改善: 02-runtime → 03-design-system → 18 regression の DAG 接続点として task-05 が checklist 正本と Phase 11 evidence path で staging smoke 引き継ぎを定義できているか
- ドキュメント改善: `staging-smoke-checklist.md` を 19 routes 正本として `aiworkflow-requirements` 側にも index 化すべきか

## Task 12-6: タスク仕様書コンプライアンスチェック

出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`

Phase 1〜11 の outputs / artifacts.json / index.md / 13 phase ファイル / evidence canonical path の実体存在を機械的に確認。FAIL 項目があれば本 task の Phase 11 まで戻す。

## state 据え置き規律

- `artifacts.json.metadata.workflow_state` を Phase 12 close-out で書き換えない
- runtime 未取得なら `implemented-local` または `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を維持
- 完了は staging smoke 実測 + Sentry 目視 evidence 揃い時のみ

## 完了条件

- [ ] 6 必須出力ファイルすべて生成
- [ ] `outputs/artifacts.json` が存在し、root `artifacts.json` と `cmp -s` で一致する
- [ ] 各 evidence path が canonical 規約と整合
- [ ] `phase12-task-spec-compliance-check.md` がテスト常時実行可能性 DoD 8 点を検証する
