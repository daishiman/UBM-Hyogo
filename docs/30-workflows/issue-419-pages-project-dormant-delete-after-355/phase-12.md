[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| 親 Issue | #355 (CLOSED) — `Refs #355` のみ使用 |

## 目的

task-specification-creator skill の Phase 12 必須 6 タスクを完遂し、本ワークフローの実行ガイド / 仕様 drift / changelog / 未タスク検出 / skill フィードバック / compliance check を `outputs/phase-12/` に集約する。`spec_created` 段階のため、aiworkflow-requirements の実書き換え（runtime cycle で実施）はアクションリストとして特定するに留める。

## 入力

- Phase 01〜11 の成果物
- `.claude/skills/aiworkflow-requirements/references/` 配下の Pages 言及 grep 結果
- `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/`（実装ガイド / skill-feedback の参照）

## 変更対象ファイル一覧

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ（DOC_PASS / spec_created 維持） |
| `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル） |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements の Pages 言及候補一覧と更新差分案 |
| `outputs/phase-12/documentation-changelog.md` | 本ワークフロー作成 / aiworkflow-requirements 更新の sync wave 記録 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件でも出力必須） |
| `outputs/phase-12/skill-feedback-report.md` | テンプレ / ワークフロー / ドキュメント の 3 章固定 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 7 ファイル実体確認チェックリスト |

## 6 必須タスク

### Task 12-1: 実装ガイド作成（`implementation-guide.md`）

- **Part 1（中学生レベル）**
  - なぜ Pages を消す前に 2 週間待つのか（rollback の戻り先を残すため）
  - 「戻れる場所を残す」とは何か（Workers が壊れたら旧 Pages へ DNS を戻して復旧する仕組み）
  - destructive かつ revert 不可とは何か（削除した Pages プロジェクトは元に戻せない）
- **Part 2（技術者レベル）**
  - rollback path の二段構え: (1) Workers の前 VERSION_ID rollback / (2) Pages dormant プロジェクトへの DNS 戻し
  - dormant evidence schema: `state` / `date` / `operator` / `redaction` / `runtime_pass` / `ac_link`
  - `bash scripts/cf.sh` ラッパー契約（op run + esbuild + mise exec）と `wrangler` 直接呼び出し禁止理由
  - Phase 11 の `PENDING_RUNTIME_EXECUTION` 契約と「設計 PASS / runtime PASS」分離の意義
  - 親 Issue #355 が CLOSED の場合の `Refs #355` 限定運用

### Task 12-2: システム仕様書更新（`system-spec-update-summary.md`）

aiworkflow-requirements の Pages 言及候補を grep ベースで列挙し、更新差分案を記録する。

```bash
rg -n "Cloudflare Pages|pages\.dev|cloudflare-pages" .claude/skills/aiworkflow-requirements/references/
rg -n "Cloudflare Pages|pages\.dev|cloudflare-pages" docs/00-getting-started-manual/
```

| 対象パス | 現状記述 | 更新差分案 | 適用タイミング |
| --- | --- | --- | --- |
| （grep 結果を埋める） | （現行文） | `Cloudflare Pages（削除済み YYYY-MM-DD）` 注記追加 | runtime cycle（削除完了同 wave） |

> 注: 本サイクル（spec_created）では **書き換え実施しない**。grep ベースの候補一覧と diff 案を確定するに留める。実適用は runtime cycle が AC-6 を満たすために行う。

### Task 12-3: ドキュメント更新履歴（`documentation-changelog.md`）

- 本ワークフロー（issue-419）の起票
- formalize 元 unassigned-task からの移行記録
- 親 issue #355 完了直後の sync wave 位置付け
- aiworkflow-requirements 更新は runtime cycle で実施することの明記

### Task 12-4: 未タスク検出レポート（`unassigned-task-detection.md`）

0 件でも出力必須。本タスク自体が unassigned からの formalize 結果のため、新規未タスクは原則 0 件と想定。検出した場合の候補:

- `bash scripts/cf.sh pages project delete` ラッパーサブコマンドの整備（現状 `bash scripts/cf.sh deploy` 系のみ存在の場合）
- aiworkflow-requirements の Pages 言及自動検出 CI 化

判断: 各候補を「本 workflow scope 外 / 別 issue 起票」または「不要」と明記する。

### Task 12-5: スキルフィードバックレポート（`skill-feedback-report.md`）

3 章固定で task-specification-creator skill にフィードバックする。

- **テンプレ改善**: destructive ops + dormant 観察期間 + parent CLOSED issue の三重条件 reference を skill 側に追加候補
- **ワークフロー改善**: `PENDING_RUNTIME_EXECUTION` 契約の skeleton ファイル数（本タスクは 8）を Phase 11 declared outputs にチェックリスト化する候補
- **ドキュメント改善**: `Refs #` と `Closes #` の使い分け（CLOSED 親 issue 配下の follow-up）を skill reference に明文化する候補

### Task 12-6: phase12 compliance check（`phase12-task-spec-compliance-check.md`）

`ls outputs/phase-12/` で 7 ファイル（main + Task 12-1〜12-5 の 5 + Task 12-6 自身）の実体存在を直接記録する。

```bash
ls outputs/phase-12/
# main.md
# implementation-guide.md
# system-spec-update-summary.md
# documentation-changelog.md
# unassigned-task-detection.md
# skill-feedback-report.md
# phase12-task-spec-compliance-check.md
```

## workflow_state ルール

| 段階 | workflow_state | phases[].status |
| --- | --- | --- |
| 本 Phase 12 完了時（spec_created） | `spec_created` を維持 | Phase 01〜10 / 12 = `completed`、Phase 11 = `pending`、Phase 13 = `blocked` |
| runtime cycle（削除実行・aiworkflow 更新完了後） | `implemented` または `completed` に昇格 | 全 Phase `completed` |

destructive ops + dormant pending 中であるため、本サイクルで `workflow_state` を昇格しない。

## 関数・型・モジュール

無し（ドキュメント整備のみ）。

## 入出力・副作用

- 入力: Phase 01〜11 の成果物、aiworkflow-requirements 配下の grep 結果
- 出力: `outputs/phase-12/` 7 ファイル
- 副作用: 無し（aiworkflow-requirements の実書き換えは runtime cycle）

## テスト方針

- compliance check で 7 ファイル実体を `ls` 直接記録（決定論的）
- `system-spec-update-summary.md` の grep 候補は手動レビューで完備性を担保

## ローカル実行コマンド

```bash
# 6 必須タスクの作成
mkdir -p outputs/phase-12
# 各 markdown を作成

# Task 12-2 grep
rg -n "Cloudflare Pages|pages\.dev|cloudflare-pages" .claude/skills/aiworkflow-requirements/references/

# Task 12-6 compliance
ls outputs/phase-12/
```

## 完了条件（DoD checklist）

- [ ] `outputs/phase-12/` 配下に 7 ファイル実体存在
- [ ] compliance check で 7 ファイル PASS
- [ ] aiworkflow-requirements drift がアクションリストとして特定（実書き換えは runtime cycle）
- [ ] root `workflow_state` を `spec_created` のまま維持
- [ ] skill-feedback-report.md が 3 章固定（テンプレ / ワークフロー / ドキュメント）

## 実行タスク

1. Task 12-1〜12-6 を順に作成する。
2. aiworkflow-requirements 配下の Pages 言及を grep し候補一覧を Task 12-2 へ集約する。
3. compliance check で 7 ファイル実体を確認する。
4. `outputs/phase-12/main.md` に `state: DOC_PASS` / `workflow_state: spec_created` を記録する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)
- 親仕様 Phase 12: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/phase-12.md`
- 構造参考: `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/phase-12.md`

## 成果物

- `outputs/phase-12/main.md`（他 6 ファイルは Task 12-1〜12-6 で同時実体化）

## 統合テスト連携

- 本 Phase はドキュメント整備のため、focused Vitest は不要。
