# Phase 10: 実行前レビュー

## 10.1 不変条件の実行前再確認

| # | 条件 | 確認 |
|---|---|---|
| 1 | 既存 API endpoint surface のみ利用 | ◯ API patch なし |
| 2 | OKLch token 正本 / HEX 直書き禁止 | Phase 11 の grep-gate で確認 |
| 3 | chart dep 追加禁止 | Phase 11 の git diff / package diff で確認 |
| 4 | `apps/web` → D1 直接アクセス禁止 | API / D1 binding を触らない方針を確認 |
| 5 | `StatusDistribution.tsx` ロジック不変 | 一時編集対象を caller に限定 |
| 6 | fixture 注入の revert | Phase 11 完了条件として確認 |

## 10.1.1 commit/push/PR の user-gated 境界

- Phase 11 完了時点で working tree には次の差分のみが残る:
  - `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/` 配下 13 phase + index + artifacts.json + outputs/
  - `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-{chart,placeholder}.png` の置換
  - `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/main.md` 更新
  - `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-12/main.md` 更新
  - `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-12/unassigned-task-detection.md` 更新
  - `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md` consumed 化
- commit / push / PR 作成は Phase 13 で **ユーザー承認後のみ** 実行

## 10.2 AC 実行前チェックリスト

| AC | 検証コマンド / 観察 | 期待 |
|---|---|---|
| AC-1 | placeholder PNG 目視 | Phase 11 で "分布データは現在集計対象外です" を確認 |
| AC-2 | chart PNG 目視 | Phase 11 で bar 3 本 (ok / info / warn) を確認 |
| AC-3 | `file` / `ls -la` | Phase 11 で size ≤ 500KB / ≥ 200x100 を確認 |
| AC-4 | `git status apps/web/ apps/api/` | Phase 11 で clean を確認 |
| AC-5 | 親 phase-11/12 main.md grep | Phase 11 後に `runtime_completed` 行存在 |
| AC-6 | `unassigned-task-detection.md` grep | Phase 11 後に `issue-819` consumed 行存在 |
| AC-7 | unassigned-task spec status 行 | Phase 11 後に `consumed` |
| AC-8 | typecheck / lint / vitest / build / grep-gate | Phase 11 で全 pass |

## 10.3 残課題

- Phase 8 で記録した改善候補（あれば）をユーザーに報告

## 10.4 Gate-B (pre-runtime-review) 推進判定

10.1 / 10.2 / 10.3 の準備項目に blocker がなければ Phase 11 へ進む。Phase 11 の runtime evidence が揃うまで `runtime_completed`、AC 完了チェック、PR 作成可能のいずれも宣言しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 実行前に blocker がないことを確認する。

## 実行タスク

- user-gated 境界を確認する。
- AC を未完了状態として Phase 11 へ引き渡す。

## 参照資料

- `phase-9-qa.md`
- `phase-11-manual-test.md`
- `phase-13-pr.md`

## 成果物

- pre-runtime review
- Phase 11 引き渡し条件

## 完了条件

Phase 11 完了前に runtime completed を宣言しないことが明記されている。

- [ ] Phase 11 完了前に runtime completed を宣言しない境界が明記されている

## 統合テスト連携

Phase 11 の全 verification logs が揃った後に最終判定へ進む。
