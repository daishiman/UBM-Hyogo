# Phase 12: ドキュメント / 5 タスク + compliance check — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

Phase 11 の placeholder evidence、duplicate apply prohibition、既存 `database-schema.md` ledger fact を元に、aiworkflow-requirements の production already-applied verification boundary を同期し、task-specification-creator skill が要求する Phase 12 必須 5 タスク + compliance check（最低 7 ファイル）を作成する。fresh runtime evidence はユーザー承認後の read-only verification でのみ同期対象へ昇格する。

加えて、UT-07B-FU-03（runbook DOC_PASS）と本 FU-04（execution）の責務分離が完了している事実を `unassigned-task-detection.md` に明示する（formalization 完了の宣言）。

## 必須 5 タスク + Task 6 compliance

1. **実装ガイド作成**（Part 1 中学生レベル + Part 2 技術者レベル）
2. **システム仕様書更新**（aiworkflow-requirements の already-applied verification boundary 同期）
3. **ドキュメント更新履歴作成**
4. **未タスク検出レポート作成**（**0 件でも出力必須**、FU-03 → FU-04 分離完了宣言を含む）
5. **スキルフィードバックレポート作成**（**改善点なしでも出力必須**）
6. **compliance check**（最低 7 成果物の実体確認 + spec/runtime 状態の分離）

## 必須成果物 7 ファイル

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実装ガイドの構成（Part 1 中学生レベル）

- 「Cloudflare D1 とは」を「クラウド上の小さなノート（SQLite）」に例える
- 「migration」を「ノートに新しいページのフォーマットを追加する作業手順書」に例える
- 「production already-applied verification」を「本番のノートに、もう追加済みのページを二重に足さず、ページがあるかだけ確かめること」に例える
- 「physical rollback 不可」を「インクで書き込んだノートは消しゴムで消せない」に例える
- 「forward-fix」を「間違えたら、訂正ページを後ろに追加する」に例える
- 専門用語セルフチェック表（5 用語以上：D1 / migration / wrangler / apply / preflight / post-check / redaction / forward-fix）
- なぜを先行して説明し、どうを後に説明する

## 実装ガイドの構成（Part 2 技術者レベル）

- 変更ファイル一覧（コード変更なし、evidence + system spec のみ）
- 実行コマンド一覧（preflight / duplicate apply prohibition / post-check 各 1 行ずつ）
- evidence shape の固定 5 セクション
- AC ↔ evidence path 対応表（AC-1〜AC-7）
- DoD（unassigned task spec §4 のチェックリスト準拠）
- aiworkflow-requirements 同期対象 path

## システム仕様書更新先（aiworkflow-requirements 同期）

### Step 1-A: already-applied verification boundary の同期

- `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md`
  - FU-04 の成果物、placeholder evidence、duplicate apply prohibition、runtime verification user-gated 境界を専用 inventory として記録
  - `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/outputs/phase-11/apply.log` は apply 成功 evidence ではなく `FORBIDDEN / not_run_duplicate_apply_prohibited` の no-op evidence と明記
  - fresh runtime evidence は user-approved read-only verification 後にのみ追記

### Step 1-B: task-workflow-active.md への追加

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  - 本タスク entry を追加（task_id / status / Phase 11 PASS 後は `completed`、未実行段階では `spec_created`）

### Step 1-C: indexes 再構築

- 必要なら `mise exec -- pnpm indexes:rebuild` を実行し `.claude/skills/aiworkflow-requirements/indexes/` の drift をなくす
- CI `verify-indexes-up-to-date` が green になることを確認

## unassigned-task-detection.md の必須記載

- FU-03 / FU-04 分離方針が両 task spec で完結していることを明示
- post-check FAIL 時の forward-fix migration または正本 fact correction 候補を列挙（FAIL 時のみ）
- 0 件でも本ファイルは作成し、その旨を明記

## skill feedback 観点

- operations verification + runtime CLI evidence 型タスクの spec テンプレが skill 側に明示的に存在するか
- VISUAL_ON_EXECUTION_CLI（CLI redacted log）を `visualEvidence: NON_VISUAL` で扱う運用パターンを skill に追記すべきか
- already-applied verification / duplicate apply prohibition の approval-gate テンプレを skill にプロモートするか
- 改善点がなくても本ファイルは作成し、その旨を明記

## docs-only / spec_created の境界

- 本タスクは `taskType=implementation` だが Phase 11 を user 明示指示で実行する gate 設計
- `workflow_state` は Phase 11 PASS まで `spec_created` のまま据え置く
- Phase 12 close-out で `workflow_state` を勝手に `completed` に書き換えない
- spec_created 段階では `system-spec-update-summary.md` の決定記録は「初期同期済み箇所」と「Phase 11 PASS 後に完了昇格する箇所」を分離して明示する

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md`

## 多角的チェック観点

- 7 成果物すべてが実体として存在するか
- Part 1 が中学生レベルになっているか（専門用語 5 個以上のセルフチェック表）
- unassigned-task-detection / skill-feedback が 0 件でも出力されているか
- runtime evidence pending と spec completeness PASS が compliance-check で分離されているか
- `pnpm indexes:rebuild` 実行が必要なら明示記録されているか

## サブタスク管理

- [ ] 7 成果物を全て作成
- [ ] Part 1 / Part 2 の二段構成で implementation-guide を書く
- [ ] system-spec-update-summary に同期対象 path（Step 1-A/B/C）を明記
- [ ] documentation-changelog に変更ファイル一覧を記録
- [ ] unassigned-task-detection を 0 件でも出力（FU-03→FU-04 分離完了を明記）
- [ ] skill-feedback-report を改善なしでも出力
- [ ] compliance-check で 7 成果物の実体を確認
- [ ] 必要なら `pnpm indexes:rebuild` を実行

## 成果物

- 上記「必須成果物 7 ファイル」一式

## 完了条件

- 7 成果物が全て実体として存在
- artifacts.json parity が PASS
- system spec 同期（Step 1-A/B/C）が記録済み
- workflow_state が境界ルールに従って更新（または spec_created 据え置き）

## タスク100%実行確認

- [ ] 7 成果物が揃っている
- [ ] Part 1 が中学生レベルになっている
- [ ] unassigned-task / skill-feedback が 0 件でも出力されている
- [ ] runtime evidence pending と spec completeness PASS が compliance-check で分離されている
- [ ] secret 値・account_id 値を含めていない

## 次 Phase への引き渡し

Phase 13 へ、commit / push / PR 作成のための前提整理を渡す。実行は user 明示指示後。
## 実行タスク

1. Phase 12 strict 7 files を正規名で実体化する。
2. `references/database-schema.md` の既適用 fact と FU-04 の duplicate-apply prohibition を同期する。
3. `task-workflow-active.md` / `quick-reference.md` / `resource-map.md` に FU-04 entry を追加する。
4. runtime evidence pending と spec completeness を compliance check で分離する。

## 統合テスト連携

`validate-phase-output.js` / `verify-all-specs.js` / `git status` / `git diff --stat` を evidence とする。Cloudflare runtime verification はユーザー承認まで未実行として分離する。
