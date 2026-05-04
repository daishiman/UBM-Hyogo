# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## 5 必須タスク + Task 6（compliance）

### Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` を作成。

- **Part 1（中学生レベル）**: なぜ staging で screenshot を撮るのか / どうやって安全に撮るのか / 撮った後どうするか
- **Part 2（技術者レベル）**: D1 seed の reversible pattern、env guard、redaction、Playwright storageState 戦略、親 workflow への evidence link 構造

### Task 12-2: システム仕様書更新

| 対象 | 更新内容 | 種別 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/` | Issue #399 artifact inventory / lessons / task-workflow-active を追加 | Step 1-A 補強 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 今回は未更新。D1 schema / manual DB contract の新規変更がないため対象外 | N/A |

### Task 12-3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md` に本 workflow 起票・親 workflow への evidence link 反映を記録。

### Task 12-4: 未タスク検出レポート作成

`outputs/phase-12/unassigned-task-detection.md` を必ず出力（0 件でも出力必須）。想定される未タスク候補:

- staging seed 投入の CI 自動化（現状は手動）
- Playwright capture script の他 admin UI 系 workflow 共通化

判断: いずれも本 workflow scope 外、別 issue として記録するか「不要」と明記する。

### Task 12-5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` を必ず出力。task-specification-creator skill に対するフィードバック:

- VISUAL_ON_EXECUTION の seed 系タスクで env guard helper の boilerplate を skill 側に追加候補
- screenshot 番号付き命名規約（`NN-state-name.png`）を VISUAL 系 reference に追加候補

### Task 12-6: phase12 compliance check

`outputs/phase-12/phase12-task-spec-compliance-check.md` を作成し、Task 12-1〜12-5 の 5 ファイル + 本 compliance file の計 7 ファイル実体を `ls outputs/phase-12/` で確認した結果を記録。

## 親 workflow への evidence link 反映

`docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/outputs/phase-12/implementation-guide.md` に以下を追記する diff を本 Phase で確定:

```markdown
### Visual evidence (delegated → captured)

- staging visual evidence: [issue-399 outputs/phase-11/screenshots](../../../../issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/screenshots/)
- capture metadata: [phase11-capture-metadata.json](../../../../issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/phase11-capture-metadata.json)
- redaction check: [redaction-check.md](../../../../issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/redaction-check.md)
```

> 注: 本 diff の **適用** は Phase 11 evidence 取得完了後に実装サイクルで行う（implementation-prepared 段階では link 先が未存在のため）。仕様書側では diff 内容と適用条件を確定するに留める。

## workflow_state ルール

| 段階 | workflow_state | phases[].status |
| --- | --- | --- |
| 実装準備完了（本 Phase 12 完了時） | `implementation-prepared` | Phase 01〜10 / 12 = `completed`、Phase 11 = `pending`、Phase 13 = `blocked` |
| runtime evidence 完了後 | `implemented-local` または `completed` に昇格 | 全 Phase `completed` |

`implementation-prepared` 段階では root workflow state を `completed` に書き換えない。実 screenshot PASS は Phase 11 runtime evidence 完了後だけ記録する。

## 完了条件

- [ ] `outputs/phase-12/` 配下に 7 ファイル実体存在（`main.md` + Task 12-1〜12-5 + Task 12-6）
- compliance check で 7 ファイル PASS
- 親 workflow への evidence link 反映 diff が確定

## 目的

Phase 12 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 12 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-12/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。

## 苦戦箇所と教訓 (lessons-learned link)

参照: [`lessons-learned-issue-399-admin-queue-visual-evidence-2026-05.md`](../../../.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-399-admin-queue-visual-evidence-2026-05.md)

- L-I399-001: VISUAL_ON_EXECUTION は planned evidence と runtime evidence を分け、Phase 11 は `PENDING_RUNTIME_EVIDENCE` / Phase 12 は `DOC_PASS` として分離する。
- L-I399-002: staging seed 識別は D1 schema 変更を避け、既存 schema に収まる synthetic ID prefix (`ISSUE399-`) を採用する。
- L-I399-003: 親 implementation-guide への evidence link 適用は Phase 11 runtime evidence 完了後の runtime cycle に限定し、stale link を残さない。
- L-I399-004: Phase 12 strict 7 files は `implementation-prepared` 段階でも実体化し、`phase12-task-spec-compliance-check.md` で `ls outputs/phase-12/` 結果を直接記録する。
- L-I399-005: synthetic ID prefix は seed / cleanup SQL と focused Vitest で同じ正本を共有し、prefix 不一致と「prefix なし行が cleanup 対象に入らない」両方を assert する。
