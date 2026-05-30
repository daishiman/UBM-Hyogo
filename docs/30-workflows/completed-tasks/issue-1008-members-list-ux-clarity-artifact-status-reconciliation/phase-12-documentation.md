# Phase 12: ドキュメント / Skill 反映

## 概要（中学生にもわかる説明）

このタスクは「すでに完成している作業の記録カードに、まだ『作業中』のハンコが押されたまま
だったので、『完了（地元テスト済み・本番手前まで）』のハンコに押し直す」というもの。
新しい機能を作るわけではなく、台帳の記録を実態に合わせて直すだけ。だから直すのは記録ファイル
（`artifacts.json`）と、レビュー表のチェックボックスだけで、アプリのコード（`apps/`）には
一切触らない。

## strict 7 成果物（`outputs/phase-12/` に揃える）

> Phase 12 では以下 7 ファイルを `outputs/phase-12/` 配下に配置する。docs-only タスクでも
> strict 7 は省略しない。

| # | ファイル | 本タスクでの内容 |
|---|----------|------------------|
| 1 | `implementation-guide.md` | 補正対象 6 ファイルの before/after status マトリクスと補正手順（jq / Edit）、検証コマンド一式。canonical 9 見出しを充足 |
| 2 | `system-spec-update-summary.md` | システム仕様変更の有無 = **なし**（tracking メタデータの整合補正のみ。API / schema / D1 不変）|
| 3 | `documentation-changelog.md` | 補正した 6 ファイルと aiworkflow register 確認結果の dated 変更履歴 |
| 4 | `unassigned-task-detection.md` | 補正後の未タスク再走査結果（現時点の見込み = 0 件。MINOR の表記不統一はスコープ内で解消）|
| 5 | `skill-feedback-report.md` | `[Feedback TASK-UI-04]`（実装完了後に `artifacts.json` が `spec_created` のまま放置される漏れ）への対応報告と再発防止メモ |
| 6 | `phase12-task-spec-compliance-check.md` | canonical 9 見出し逐語 / Phase 11 evidence 表（NON_VISUAL）/ workflow root scan の compliance 検証 |
| 7 | `main.md` | Phase 12 main（canonical 9 headings 本体。補正実行後に生成）|

> Phase 11 evidence 表は NON_VISUAL のため status を `present` / `pending` / `n/a` の enum で記述し、
> スクリーンショット PNG への参照は持たせない（`phase-11-manual-test.md` の NON_VISUAL 宣言と整合）。

## aiworkflow-requirements 反映先

| Skill / Doc | 反映内容 |
|-------------|---------|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | issue-1008 reconciliation entry の確認（members-list-ux-clarity の state が `implemented_local_runtime_pending` で整合済みか）|
| `.claude/skills/aiworkflow-requirements/references/workflow-members-list-ux-clarity-artifact-inventory.md` | inventory の state 表記が実 `artifacts.json` と一致することを確認（AC-7）|
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | dated エントリ（status reconciliation の記録）|
| `.claude/skills/aiworkflow-requirements/LOGS/<date>-issue-1008-members-list-ux-clarity-artifact-status-reconciliation.md` | summary headline |
| `.claude/skills/aiworkflow-requirements/lessons-learned/L-MLUCREC-001..005.md` | 後述の新規 Lessons 候補 |

## 新規 Lessons Learned 候補

- **L-MLUCREC-001**: 実装 + evidence + Phase 12 strict 7 が同一 commit でマージされても、`artifacts.json` の `status` は自動更新されない。close-out で status reconciliation を独立 wave として必ず行う。
- **L-MLUCREC-002**: root / outputs / sub-task A/B/C と複数の `artifacts.json` が存在する workflow では、status を 1 ファイルだけ直すと parity drift が残る。同 wave で全 artifacts を補正し `diff -u` parity 0 を DoD 化する。
- **L-MLUCREC-003**: aiworkflow register が先に `implemented_local_runtime_pending` を主張し実 `artifacts.json` が `spec_created` のまま、という register 先行 drift は、artifacts 側を正に補正して解消する（register は従属台帳）。
- **L-MLUCREC-004**: docs-only の status reconciliation は NON_VISUAL であり、スクリーンショットではなく `jq` / `diff` / `gate-metadata:validate` を主証跡とする。視覚的 evidence の不正流用（Feedback 4 / WEEKGRD-03）を避ける。
- **L-MLUCREC-005**: gate を `passed` に補正する前に evidence_path の実在を確認する。`gate-metadata:validate` が path 実在を検査するため、存在しない path を指すと ERROR で fail する。

## docs-only タスクに後からコード実装が入った場合の再判定ルール

> 本タスクは **コード変更なし（docs-only）で確定** している（`apps/` / `packages/` 差分 0 を Phase 11
> で保証）。よって以下の再判定ルールには **該当しない**。記録として方針のみ明示する。

- もし後続で `apps/` 配下の実装変更が混入した場合、CONST_004 の docs-only 判定は無効となり、
  taskType を `implementation` へ再分類し、Phase 11 を VISUAL / NON_VISUAL いずれかへ
  再判定し直す必要がある。
- その場合は本 Phase 12 の strict 7 を実装込みの内容へ差し替え、`system-spec-update-summary.md`
  に実コード変更点を記載する。

## Step 1-A / 1-B / 1-C / Step 2 の扱い

| ステップ | 内容 | 本タスクでの扱い |
|----------|------|------------------|
| Step 1-A | 実装サマリ / 変更ファイル列挙 | 補正 6 ファイルの before/after を `implementation-guide.md` に記載 |
| Step 1-B | システム仕様（spec）への反映要否 | 反映不要（メタデータ整合のみ。`system-spec-update-summary.md` で「変更なし」と明記）|
| Step 1-C | skill / lessons への反映 | aiworkflow register 確認 + 新規 Lessons L-MLUCREC-001..005 を反映 |
| Step 2 | 新規インターフェース（API / IPC / 型）追加時の契約反映 | **N/A** — 新規インターフェース追加なし（status フィールド補正のみ）|
