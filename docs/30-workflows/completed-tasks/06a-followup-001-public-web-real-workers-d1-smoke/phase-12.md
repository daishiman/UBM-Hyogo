# Phase 12: ドキュメント更新

## 目的

task-specification-creator skill が定める Phase 12 必須 5 タスク（Task 12-1〜12-5）と Task 6（compliance check）を実施し、本タスクで更新すべきドキュメントを正本に反映する。本 phase は **コード実装を伴わない**。すべて Markdown 更新と changelog 整備に閉じる。

## Phase 12 必須タスク一覧

| Task | 名称 | 出力ファイル |
| --- | --- | --- |
| 12-1 | implementation guide（中学生レベル + 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| 12-2 | system spec update summary | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | documentation changelog | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | unassigned task detection（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | skill feedback report（改善点なしでも必須） | `outputs/phase-12/skill-feedback-report.md` |
| 6 | Phase 12 必須 7 ファイル compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

> **Phase 12 main.md** (`outputs/phase-12/main.md`) は上記 6 ファイルの index として別途配置する（合計 7 ファイル）。

## 進め方

### Task 12-1: implementation guide

- Part 1（中学生レベル）: 「mock の偽データで OK と思っても、本番では D1 という本物の倉庫から商品を出してくるので、倉庫がちゃんと open しているか確認しないと当日棚が空っぽになる」という比喩で、なぜ実 binding smoke が必要かを説明する。
- Part 2（技術者レベル）: `scripts/cf.sh` の役割（op secret 注入 / `ESBUILD_BINARY_PATH` 解決 / `mise exec` 経路）、`PUBLIC_API_BASE_URL` 経路（apps/web SSR / RSC fetch → apps/api Hono → D1 binding）、D1 binding lookup の流れを記述する。

### Task 12-2: system spec update summary

- 更新対象（pending）:
  - `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（local + staging smoke 手順を Step 1-A/B/C として追記）
  - `docs/00-getting-started-manual/specs/08-free-database.md`（D1 binding smoke の確認観点を append）
- 本タスクは spec_created 段階のため **「pending: smoke 実施後に更新」** と明示。実更新は Phase 11 実行後に別 PR で行う。

### Task 12-3: documentation changelog

- 本タスクで作成した仕様書ファイル一覧（phase-01〜13.md および全 outputs）を spec_created 段階の changelog として記録。

### Task 12-4: unassigned task detection（必須出力）

- Issue #273 由来の苦戦領域（mock smoke 限界、esbuild mismatch、staging URL 設定）を点検し、本タスク以外で未タスク化されている項目があれば列挙する。
- **0 件でも本ファイルは必ず出力**し、点検した観点と「該当なし」の判定根拠を残す。

### Task 12-5: skill feedback report（必須出力）

- task-specification-creator skill / aiworkflow-requirements skill の本タスク作成時の使用感を記録。
- **改善点なしでも本ファイルは必ず出力**し、観察事項と「改善提案なし」を明記する。

### Task 6: Phase 12 必須 7 ファイル compliance check

- 本 phase 配下の 7 ファイル（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md 自身）が実体ファイルとして存在することをチェックリストで確認する。
- Phase 11 の `local-curl.log` / `staging-curl.log` / `staging-screenshot.png` は smoke 実行時に生成する planned evidence であり、spec_created PR の実体存在チェック対象に含めない。
- aiworkflow-requirements の current task inventory には、本 workflow を spec_created / implementation / NON_VISUAL として同一 wave で登録する。

## 不変条件 trace

- 不変条件 #5 を更新ドキュメントの該当章で再強調する（apps/web → apps/api → D1 の経路維持）。
- 不変条件 #6 に基づき、GAS prototype を本仕様の参照対象から除外していることを明記する。

## Issue #273 の取り扱い

- Issue #273 は **CLOSED のまま再オープンしない**。本仕様書は Issue 由来の苦戦箇所を taskspec 化したのみで、新たな Issue 操作は行わない。
- changelog / PR 本文では `Refs #273` と記載し、`Closes #273` は使用しない。

## 完了条件

- [ ] 既存の完了条件を満たす

- 7 ファイルが outputs/phase-12/ 配下に実体存在
- compliance check が 7/7 OK（Phase 12 ファイルのみ。Phase 11 planned evidence は未実行として分離）
- system spec の実更新は workflow inventory 登録済み、runtime runbook 反映は pending（Phase 11 実 smoke 後に別 PR で実施）
- skill feedback / unassigned detection が 0 件でも出力済み

## 不変条件 trace 詳細

| 不変条件 | 本 phase での扱い | 反映ファイル |
| --- | --- | --- |
| #5（apps/web → apps/api → D1 のみ） | implementation-guide / system-spec-update-summary 双方で経路図を維持 | implementation-guide.md, system-spec-update-summary.md |
| #6（GAS prototype 非昇格） | smoke 対象から GAS 経路を除外し runbook 反映候補からも外す | system-spec-update-summary.md |
| #1（フォーム schema 固定しすぎない） | 200 応答観測で extraFields 経路を破壊しないことを暗黙確認 | implementation-guide.md（言及のみ） |

## Issue #273 の取り扱い（再確認）

- Issue #273 は **CLOSED のまま再オープンしない**。
- changelog / PR 本文では `Refs #273` と記載し、`Closes #273` は使用しない。
- documentation-changelog.md と pr-template.md でこの方針を明示する。

## 完了条件（再掲・詳細版）

- 7 ファイルが outputs/phase-12/ 配下に実体存在
- compliance check の 7/7 OK 状態が `phase12-task-spec-compliance-check.md` に記録（Phase 12 outputs に限定）
- system spec の実更新は workflow inventory 登録済み、runtime runbook 反映は pending（Phase 11 実 smoke 後に別 PR で実施）
- skill feedback / unassigned detection が 0 件でも出力済み
- documentation-changelog.md に Phase 1〜13 全ファイル列挙済み

## 次フェーズへの引き継ぎ

- Phase 13 で changelog（spec_created 段階）と PR template を生成する際、本 phase の出力一覧を `change-summary.md` に取り込む。
- pr-template.md は本 phase の `documentation-changelog.md` の内容を要約形式で参照する。

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 12
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- implementation guide / system spec summary / changelog を更新する
- unassigned task / skill feedback / compliance check を出力する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-12/main.md`

