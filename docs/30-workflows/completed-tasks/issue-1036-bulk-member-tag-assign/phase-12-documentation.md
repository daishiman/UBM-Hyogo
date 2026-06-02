# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| workflow_state | `implemented_local_runtime_pending`（実装済み・staging 実機確認/commit/PR は user-gated） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 前提 | Phase 1-11 完了 |

## 目的

タスク仕様書パッケージの Phase 12（ドキュメント更新）入口。strict 7 成果物を
`outputs/phase-12/` に物理生成し、各 task のドキュメント影響と未タスク検出を確定する。
本 wave で apps/api / apps/web / docs の実装・検証を完了した。**commit・PR・issue 操作は行わない**。

## Task 12-1..12-6（計画）

| Task | 名称 | 内容 | 成果物 |
| --- | --- | --- | --- |
| 12-1 | Phase 12 entry / summary | strict 7 の入口・状態サマリ | `outputs/phase-12/main.md` |
| 12-2 | 実装ガイド作成 | Part 1（中学生レベル）+ Part 2（技術者）+ 視覚証跡。bulk endpoint / repository / UI の技術詳細 | `outputs/phase-12/implementation-guide.md` |
| 12-3 | system spec 反映判定 | Step 1-A/1-B/1-C + Step 2（新規 interface の system spec 反映候補判定） | `outputs/phase-12/system-spec-update-summary.md` |
| 12-4 | documentation changelog | workflow-local 変更 + global skill sync を別ブロックで記録 | `outputs/phase-12/documentation-changelog.md` |
| 12-5 | 未タスク検出 | current cycle 必須未タスク（0 件）+ scope-out 候補（#913/#1035/pagination） | `outputs/phase-12/unassigned-task-detection.md` |
| 12-6 | skill feedback + compliance | テンプレ/ワークフロー/ドキュメント観点 feedback + Phase 12 compliance check | `outputs/phase-12/skill-feedback-report.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## strict 7 成果物リンク

| File | Path |
| --- | --- |
| main | `outputs/phase-12/main.md` |
| implementation guide | `outputs/phase-12/implementation-guide.md` |
| system spec summary | `outputs/phase-12/system-spec-update-summary.md` |
| documentation changelog | `outputs/phase-12/documentation-changelog.md` |
| unassigned task detection | `outputs/phase-12/unassigned-task-detection.md` |
| skill feedback report | `outputs/phase-12/skill-feedback-report.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## task 別ドキュメント影響

| task | ドキュメント影響 | 反映先 |
| --- | --- | --- |
| task-A | bulk endpoint / tag master read endpoint / audit batchId 相関を system spec 候補として記録 | Step 2 判定（system spec summary に実装済み境界として記録） |
| task-B | BulkActionBar tag picker の UI 契約。新規 primitive を生やさず TagPill 再利用 | implementation-guide Part 2 |
| task-C | 不変条件 #13 の第3経路（bulk admin write）再定義 | memberTags.ts 先頭コメント（実装済み） |

## 実行タスク

1. strict 7 を `outputs/phase-12/` に物理生成（本 wave で完了）
2. root `artifacts.json` と `outputs/artifacts.json` の parity を確認
3. 未タスク検出を 0 件として確定し、scope-out 候補を記録
4. compliance check を canonical 見出し構造で生成
5. Phase 11 local fixture screenshot 4 点を保存し、staging 実機 baseline の user-gated 境界を明記

## 成果物

- `outputs/phase-12/main.md` ほか strict 7（本書からリンク）

## 完了条件

- [x] strict 7 が物理生成されている
- [x] Task 12-1..12-6 の計画とリンクが記述されている
- [x] task 別ドキュメント影響が確定している
