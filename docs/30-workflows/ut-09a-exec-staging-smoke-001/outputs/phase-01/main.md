# Phase 1: 要件定義 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| task_id | UT-09A-EXEC-STAGING-SMOKE-001 |
| phase | 1 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #339 (CLOSED) |
| scope | 09a staging smoke evidence replacement only; no production deploy; no commit / push / PR without explicit user approval |

## Schema / 共有コード Ownership 宣言

| 対象 | 本タスクでの編集権 | owner / 参照元 | 理由 |
| --- | --- | --- | --- |
| DB schema / migrations | no | U-04 / 03a / 03b | 本タスクは実測 evidence 取得のみで schema を変更しない |
| shared schema / packages/shared | no | upstream implementation tasks | API contract 変更を含まない |
| Playwright scaffold | no | 08b | 既存 scaffold を利用し、必要な実測 evidence を保存する |
| 09a parent evidence contract | no | 09a parent workflow | contract を変更せず `NOT_EXECUTED` を実測 path に置換する |
| aiworkflow-requirements index | yes, Phase 12 only | 本タスク | 09c blocker / discoverability の正本同期のみ |

## 目的

09a で `NOT_EXECUTED` placeholder のまま残っている staging deploy smoke /
UI visual smoke / Forms sync validation を、実 staging 環境で実測 evidence に
置換するために必要な scope / AC / 上流前提 / approval gate を確定する。

## 実行タスク

1. 09a 配下の `phase-11.md` runbook と `outputs/phase-12/implementation-guide.md`
   evidence contract を読み、置換対象の placeholder ファイル一覧を洗い出す。
   完了条件: 置換対象 placeholder ファイルが列挙される。
2. staging required secrets / Pages project / sync endpoint の前提条件を確定する。
   完了条件: secret 名のみが列挙され、値は記録されない。
3. user approval が必要な操作（commit / push / PR / production deploy）を分離する。
   完了条件: 自走禁止操作が明記される。
4. 09c blocker 更新条件を定義する。完了条件: PASS 時 / FAIL 時の更新差分が明確になる。

## 参照資料

- docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/implementation-guide.md
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/unassigned-task-detection.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
- scripts/cf.sh / scripts/with-env.sh
- apps/web/wrangler.toml / apps/api/wrangler.toml

## 実行手順

- 対象 directory: docs/30-workflows/ut-09a-exec-staging-smoke-001/
- 本仕様書作成では実 staging 実行・コード変更・commit / push / PR を行わない。
- 実 staging 実行・evidence 取得は Phase 5 / Phase 11 の runbook に従う。

## 統合テスト連携

- 上流: 08b Playwright scaffold, ut-27 secrets, ut-28 Pages project, U-04 Forms sync
- 下流: 09c production deploy（本タスクの実測 PASS が GO 判定の前提）

## 多角的チェック観点

- staging secret 値を stdout / artifact / log に記録しない（存在確認のみ）
- `NOT_EXECUTED` を PASS と扱わない
- screenshot に個人情報が含まれないよう redaction を行う
- 09a の runbook / evidence contract を変更しない
- 09c production deploy を本タスク完了まで GO 判定しない

## サブタスク管理

- [ ] 09a 配下の `outputs/phase-11/*` placeholder 一覧を洗い出す
- [ ] required secrets 名と Pages project 名を列挙する
- [ ] AC と evidence path の対応表を作成する
- [ ] approval gate 一覧を明記する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- 置換対象の `NOT_EXECUTED` placeholder ファイル一覧が確定している
- AC-1〜AC-6 と evidence path の対応表が確定している
- approval gate（commit / push / PR / production deploy）が分離されている
- 09c blocker 更新条件（PASS 時 / FAIL 時）が定義されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 09a 本体仕様の復活ではなく follow-up gate の仕様になっている
- [ ] 実 staging 実行・コード変更・commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、置換対象 placeholder 一覧、AC-evidence 対応表、approval gate、
09c blocker 更新条件を渡す。
