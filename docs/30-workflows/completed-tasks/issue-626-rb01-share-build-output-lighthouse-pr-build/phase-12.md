# Phase 12: Phase 12 strict 7 files


## 目的

Issue #626 RB-01 の Phase 12 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 12 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 必須 6 タスク + strict 7 files（task-specification-creator skill 準拠）

| Task | 出力 | 必須 |
| --- | --- | --- |
| Phase 12 main | `outputs/phase-12/main.md` | ✅ |
| 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術者レベル） | ✅ |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力必須） | ✅ |
| 12-5 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力必須・3 観点固定） | ✅ |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

## Task 12-1 implementation-guide.md 構成

### Part 1（中学生レベル）

- 「2 つのアルバイトが同じ料理を 2 回作っていた問題」を 1 つの厨房で 1 回作って 2 人で分け合う比喩で説明
- なぜ build を 2 回やっていると遅いのか、artifact = 「作ったものを保管する箱」、`needs:` = 「順番待ち」

### Part 2（技術者レベル）

- 採用案アーキテクチャ図（Phase 02 §「採用アーキテクチャ」を再掲）
- artifact 命名規約と retention
- trust 境界の説明
- branch protection contexts との不変条件

## Task 12-3 documentation-changelog.md 必須エントリ

- `.github/workflows/pr-build-test.yml`（編集）
- `.github/workflows/lighthouse.yml`（削除）
- `docs/30-workflows/e2e-quality-uplift/backlog.md`（RB-01 status 更新）
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260512-131439-wt-5/docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/index.md`（新規）
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260512-131439-wt-5/docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/artifacts.json`（新規）
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260512-131439-wt-5/docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/outputs/artifacts.json`（新規）
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260512-131439-wt-5/docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/phase-01.md` 〜 `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260512-131439-wt-5/docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/phase-13.md`（新規 13 ファイル）

各エントリは canonical absolute path で列挙すること（相対 path 禁止）。

## Task 12-4 unassigned-task-detection.md

- backlog.md `RB-02` / `RB-03` / `RB-04` / `EXT-X1` / `OBS-01` は本タスクとは別件として既に登録済であり、unassigned ではない（先送り扱いではない）
- 本タスクから派生する真に未タスクなものがあれば `docs/30-workflows/unassigned-task/u-issue-626-followup-NNN.md` として起票し、本ファイルにリンクする
- 0 件の場合も「0 件である根拠」を明示記載

## Task 12-5 skill-feedback-report.md（3 観点固定）

1. **テンプレ改善**: 本タスクで使った Phase テンプレで不足を感じた箇所
2. **ワークフロー改善**: 設計→実装→evidence の流れで改善余地
3. **ドキュメント改善**: skill reference / 仕様書テンプレで補強したい箇所

改善点なしでも各観点に 1 行は記載（「特になし。根拠: ...」）。

## Task 12-6 compliance check 観点

- strict 7 files の存在
- placeholder token 0 件（`token-sized` / `09b-token-value` / `token-mix` 等の禁止語 grep）
- §99 必須項目 content check（実コマンド + exit code）
- `apps/` / `packages/` dirty diff 検証（本タスクは `.github/workflows/` のみ変更想定 → dirty 0 件 expect）
- branch protection drift = 0 件（`outputs/phase-11/branch-protection/diff.txt` を参照）
- workflow_state alias 統一（`PASS` 単独表記禁止）
- `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 12 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- Phase 2 (`phase-02.md`)
- Phase 5 (`phase-05.md`)
- Phase 6 (`phase-06.md`)
- Phase 7 (`phase-07.md`)
- Phase 8 (`phase-08.md`)
- Phase 9 (`phase-09.md`)
- Phase 10 (`phase-10.md`)
- Phase 11 (`phase-11.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-12.md`
- Phase 12 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] strict 7 files が `outputs/phase-12/` に存在
- root `artifacts.json` と `outputs/artifacts.json` の `metadata.workflow_state` / `phases[].status` / root `status` が同値
- `artifacts.json` の Phase 12 status は strict 7 files 作成時に `completed`、root workflow state は runtime evidence 未取得なら `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`、G1〜G4 完了後のみ `completed` に更新
