# Phase 12: ドキュメント整備（strict 7 files）

[実装区分: ドキュメントのみ]
判定根拠: 6 必須ドキュメントを `outputs/phase-12/` 配下に作成するのみ。コード変更なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント整備 |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 11（evidence） |
| 次 Phase | 13（PR 作成準備） |
| 状態 | completed |

## 目的

Phase 12 spec（task-specification-creator skill）が要求する strict 7 files を、本タスクの文脈（admin 8 routes blueprint 仕様化）に最適化して作成する。
本 Phase は「09g 仕様化が完了した状態」を前提とし、後続 task-15 / 16 / 17 / 親 ui-prototype-alignment-mvp-recovery / skill メンテへの handoff を文書化する。

## strict 7 files

| # | ファイル | 目的 |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 本体サマリ |
| 2 | `implementation-guide.md` | task-15 / 16 / 17 が 09g を正本として実装着手するためのガイド |
| 3 | `system-spec-update-summary.md` | docs/00-getting-started-manual/specs/ 群（特に 09 / 09a-09d）への影響と参照リンク追加点 |
| 4 | `documentation-changelog.md` | 09g 追加または repair / 親 workflow への参照差分 |
| 5 | `unassigned-task-detection.md` | 0 件でも必須。CONST_005 により今回サイクル内で直せる改善は未タスク化しない |
| 6 | `skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements skill への改善提案。改善なしでも必須 |
| 7 | `phase12-task-spec-compliance-check.md` | 本 task が strict 7 files / artifacts root-only / phase-template に compliant か self-check |

## 主要意思決定

- **決定 1**: 中学生レベルの概念説明を `implementation-guide.md` に必ず含める（"AdminSidebar とは何か" "派生ルールとは何か" "視覚値 0 件とはなぜ重要か" の 3 トピック）。
- **決定 2**: skill-feedback は「派生ルール正本転記」というパターンを skill 側にも反映可能か検討する観点で書く。
- **決定 3**: unassigned-task-detection は 0 件でも出力する。今回サイクル内で解ける lint / drift は Phase 3 / 11 の evidence command に吸収し、未タスク化しない。
- **決定 4**: `outputs/artifacts.json` は本ワークフローでは作成せず、root `artifacts.json` を唯一正本とする。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 11 | evidence / AC トレース | implementation-guide / changelog の根拠 |
| 下流 | Phase 13 | 6 ドキュメント | PR 本文への引用 |
| 下流 | task-15/16/17 | implementation-guide | 実装着手 baseline |

## 変更対象ファイル（C/R/M/D）

| 区分 | path |
| --- | --- |
| C | `outputs/phase-12/main.md` |
| C | `outputs/phase-12/implementation-guide.md` |
| C | `outputs/phase-12/system-spec-update-summary.md` |
| C | `outputs/phase-12/documentation-changelog.md` |
| C | `outputs/phase-12/unassigned-task-detection.md` |
| C | `outputs/phase-12/skill-feedback-report.md` |
| C | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 各ドキュメント要件

### 1. implementation-guide.md

- 概要（中学生レベル概念説明）: 「09g とは何か / AdminSidebar とは何か / 派生ルールとは何か / 視覚値 0 件とはなぜ重要か」
- task-15 / 16 / 17 の着手手順
- 09g § ↔ 実装ファイル対応マップ
- a11y / confirm Modal 実装注意点
- 二段確認 schema-apply の実装パターン

### 2. system-spec-update-summary.md

- `docs/00-getting-started-manual/specs/` 群の影響
- 09g 新規追加に伴う 09 / 09a / 09b / 09c / 09d / 09h との参照関係
- 親 ui-prototype-alignment-mvp-recovery への影響（task-15/16/17 着手可能化）
- aiworkflow-requirements same-wave sync 判定:
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  - 更新が必要な場合は同一 wave で反映し、不要な場合は `N/A` 理由を `system-spec-update-summary.md` と `phase12-task-spec-compliance-check.md` に記録する

### 3. documentation-changelog.md

- 新規: `09g-screen-blueprints-admin.md`（700〜1200 行）
- 既存への参照リンク追加候補（09 / 09a-09d 末尾）
- 親 workflow への完了通知

### 4. unassigned-task-detection.md

- 新規未タスク 0 件でも `0 件` と明記
- 今回サイクル内で実行済みの repair / lint gate を「未タスク化しない理由」として記録
- CONST_005 例外が必要な場合のみ、理由・実施時期・登録場所を明記し、ユーザーへエスカレーションする

### 5. skill-feedback-report.md

- task-specification-creator skill: 「派生ルール正本転記」パターンの phase-template への反映可能性
- aiworkflow-requirements skill: UI prototype alignment の task workflow / index 同期対象を確認し、同一 wave で必要最小限のみ更新

### 6. phase12-task-spec-compliance-check.md

- CONST_005 準拠（対象ファイル / 章構成 / 入出力 / テスト方針 / 実行コマンド / DoD が全 phase で揃う）
- strict 7 files の逐語ファイル名一致
- root-only artifacts parity: `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。
- phase-template-phase1〜13 セクション漏れチェック

## 実行タスク

- 本 Phase の目的に対応する文書作成・検証・記録を実行する。
- 実行結果は `outputs/phase-N/` 配下へ保存し、root `artifacts.json` の該当 Phase status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- 本 Phase の `outputs/phase-N/main.md` または同等の phase evidence。
- 必要に応じた補助ログ・差分・チェック結果。
- root `artifacts.json` の phase status 更新。

## 入力 / 出力

- 入力: Phase 11 evidence、本 task index.md / phase-01〜11.md
- 出力: 7 ファイル（main.md + 6 必須）

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-12
# 6 ファイルを順次 Write
```

## DoD

- [ ] strict 7 files 全て配置
- [ ] implementation-guide に中学生レベル概念説明 3 トピック
- [ ] compliance-check で CONST_005 / CONST_007 / phase-template の全項目チェック完了
- [ ] skill-feedback に 2 skill への提案が存在
- [ ] unassigned-task-detection は 0 件でも出力し、未タスク化が必要な場合のみ CONST_005 例外理由を記載

## 完了条件チェック

- [ ] outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md 配置
- [ ] artifacts.json の phase 12 を completed
- [ ] root `artifacts.json` のみを正本とする parity 文言を compliance-check に記載
- [ ] aiworkflow-requirements indexes / references の更新要否を実体確認し、更新済み or N/A 理由を記載
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- task-21 §8 DoD
- Phase 11 evidence

## 実行手順

### ステップ 1: implementation-guide.md
中学生レベル概念説明 + task-15/16/17 着手手順 + § ↔ 実装対応マップ。

### ステップ 2: system-spec-update-summary.md
09 / 09a-09d / 09h への参照関係を表形式で。

### ステップ 3: documentation-changelog.md
新規 / 既存への影響 / 親 workflow 通知を時系列で。

### ステップ 4: unassigned-task-detection.md
CI lint 候補を 2 件以上列挙。

### ステップ 5: skill-feedback-report.md
2 skill への提案を 1 件ずつ以上。

### ステップ 6: phase12-task-spec-compliance-check.md
全 phase の必須セクション存在を check 表で。

## 次 Phase

- 次: Phase 13（PR 作成準備）
- 引き継ぎ: 6 ドキュメント / compliance check 結果
- ブロック条件: いずれか欠落なら Phase 13 不可。
