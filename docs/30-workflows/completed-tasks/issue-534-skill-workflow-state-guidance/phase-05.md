# Phase 5: 実装ランブック

実行順序を厳守すること（reference 本体作成 → 既存 reference link → SKILL.md → changelog/LOGS → indexes 再生成）。

## Step 1: 親タスク Phase 12 成果物を読む

```bash
cat docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/skill-feedback-report.md
cat docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/phase12-task-spec-compliance-check.md
```

L9-13 の promotion target、compliance-check の観点と drift 事例を抽出する。

## Step 2: `references/workflow-state-vocabulary.md` を新規作成

Phase 2 §2.1 の章立てに従い以下を記述:
- 状態 5 値（spec_created / CONTRACT_READY_IMPLEMENTATION_PENDING / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implemented_local_evidence_captured / completed）の意味と直前条件 / 後続状態
- 状態 → 必要証跡マッピング表
- Phase 開始時 reclassify ルール（Phase 5 / 8 / 11 / 13）
- 禁止表記節（`PASS` 単独 / 状態混在 / phase-status と workflow-status の混在）
- 機械的強制が必要である旨（後続タスクへの引き渡し）
- 親タスク Phase 12 成果物への参照

## Step 3: `references/phase12-compliance-check-template.md` を新規作成

Phase 2 §2.2 の章立てに従い以下を記述:
- 観点リスト（状態 vs 実コード乖離検知 / outputs と code の整合 / docs-only / NON_VISUAL 判定整合 / SKILL-changelog.md / LOGS/_legacy.md sync / 禁止表記）
- 検証コマンド集（`rg`, `mise exec -- pnpm indexes:rebuild`, `git diff` 等）
- drift パターン例（親タスクの実例を 1 件入れる: 「outputs は spec-only を主張、実コードは完了済み」）
- 雛形（compliance-check ファイル生成時のテンプレ markdown）

## Step 4: `SKILL.md` References 表へ 2 行追加

`.claude/skills/task-specification-creator/SKILL.md` の References 表（120 行目付近）に以下を追加:

```markdown
| workflow_state 語彙 / 状態 → 必要証跡マッピング / reclassify ルール / 禁止表記 | [references/workflow-state-vocabulary.md](references/workflow-state-vocabulary.md) |
| Phase 12 compliance-check テンプレ（観点 / 検証コマンド / drift パターン例） | [references/phase12-compliance-check-template.md](references/phase12-compliance-check-template.md) |
```

挿入位置は既存 `Phase 12 skill feedback promotion` 行の直後を推奨。

## Step 5: 既存 3 reference へ link 追加

| ファイル | 追加箇所 | 追加文 |
| --- | --- | --- |
| `references/phase-12-spec.md` | 末尾「関連 reference」または相当節 | `> 状態語彙の定義は [workflow-state-vocabulary.md](workflow-state-vocabulary.md) を、compliance-check 観点は [phase12-compliance-check-template.md](phase12-compliance-check-template.md) を参照する。` |
| `references/phase12-skill-feedback-promotion.md` | promotion target が登場する節 | 同上 |
| `references/phase-template-phase11.md` | NON_VISUAL evidence や状態語彙が登場する節 | 同上 |

## Step 6: SKILL-changelog.md に version 行追記

`.claude/skills/task-specification-creator/SKILL-changelog.md` の既存最新 version 行の **上** に新規行を追加（過去行は変更しない）:

```
| v2026.05.08-skill-workflow-state-vocabulary | 2026-05-08 | issue #534 完了に伴い workflow_state 状態語彙と Phase 12 compliance-check テンプレを skill 本体へ昇格。`references/workflow-state-vocabulary.md` および `references/phase12-compliance-check-template.md` を新設し SKILL.md References 表へ登録。`phase-12-spec.md` / `phase12-skill-feedback-promotion.md` / `phase-template-phase11.md` から新 reference へリンクを追加。 |
```

## Step 7: LOGS/_legacy.md に usage log 追記

`.claude/skills/task-specification-creator/LOGS/_legacy.md` に以下を追記:

```
- 2026-05-08 — issue-534-skill-workflow-state-guidance — workflow_state vocabulary と phase12 compliance-check template を新設し References 表 / 既存 reference / changelog を同期。
```

## Step 8: indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes
git diff --stat .claude/skills/aiworkflow-requirements/indexes | tee docs/30-workflows/issue-534-skill-workflow-state-guidance/outputs/phase-11/evidence/indexes-diff.log
```

差分が発生した場合は同一コミットに含める。Issue #534 inventory と stale-reference gate のため、aiworkflow-requirements の ledger / indexes sync は本タスクのスコープ内とする。

## Step 9: Phase 11 evidence を保存

```bash
mkdir -p docs/30-workflows/issue-534-skill-workflow-state-guidance/outputs/phase-11/evidence
rg -n 'spec_created|CONTRACT_READY_IMPLEMENTATION_PENDING|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING|implemented_local_evidence_captured|completed' .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md > docs/30-workflows/issue-534-skill-workflow-state-guidance/outputs/phase-11/evidence/grep-vocabulary.log
grep -E 'workflow-state-vocabulary|phase12-compliance-check-template' .claude/skills/task-specification-creator/SKILL.md > docs/30-workflows/issue-534-skill-workflow-state-guidance/outputs/phase-11/evidence/link-reachability.log
grep -l workflow-state-vocabulary .claude/skills/task-specification-creator/references/{phase-12-spec.md,phase12-skill-feedback-promotion.md,phase-template-phase11.md} >> docs/30-workflows/issue-534-skill-workflow-state-guidance/outputs/phase-11/evidence/link-reachability.log
```

## Step 10: typecheck / lint

```bash
mise exec -- pnpm typecheck 2>&1 | tail -20
mise exec -- pnpm lint 2>&1 | tail -20
```

skill 文書のみの変更なので想定差分なし。失敗した場合は CONTEXT 由来でないことを確認。

## DoD（実装完了条件）

- [ ] Step 2-3 で 2 ファイルが新規作成され git status に Untracked として表れる
- [ ] Step 4-7 の 4 ファイル編集が git status に Modified として表れる
- [ ] Step 8 の indexes:rebuild が exit 0 で完了
- [ ] Step 9 の evidence 4 ログファイルが配置される
- [ ] Step 10 の typecheck / lint が現状維持で PASS

## 次フェーズへの引き渡し

Phase 6 ではコードレビュー観点（用語整合 / link 死活 / 状態語彙網羅）を確定する。
