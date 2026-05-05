# Phase 13: PR 作成 / 承認チェックリスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / 承認チェックリスト |
| 作成日 | 2026-05-01 |
| 前 Phase | 12（ドキュメント更新） |
| 状態 | **pending_user_approval** |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local（PR merge 前まで維持。実装 PR merge 後に repository integration completed 相当へ昇格） |
| user_approval_required | **true** |
| GitHub Issue | #293（CLOSED 維持 / reopen 禁止） |
| ブランチ名 | `feat/issue-293-ut-07b-schema-alias-hardening-task-spec`（既に作成済み） |

## 目的

Phase 13 は **実 Git 操作（commit / push / PR 作成）の実行ゲート** であり、本仕様書はその草案・境界・承認条件・コミット粒度・hook 通過確認を文書化する。`git commit` / `git push` / `gh pr create` は **ユーザーの明示承認があるまで実行しない**。本仕様書記載のテンプレートを user 承認後にそのまま使う設計とする。

## 実行タスク

1. Phase 10 GO / Phase 11 NON_VISUAL evidence / Phase 12 7 成果物を再確認する。
2. `git status --short` で本タスク範囲外の変更を stage しないことを確認する。
3. user の明示承認後に限り、仕様書 / implementation / tests / spec sync の単位で commit する。
4. user の明示承認後に限り、feature branch を push する。
5. user の明示承認後に限り、`Refs #293` のみを使って PR を作成する。
6. PR 作成後、Issue #293 は reopen せず、必要な場合は comment で仕様書リンクを残す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/index.md` | task scope / status |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/artifacts.json` | workflow_state / phase status |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance gate |
| 必須 | `CLAUDE.md` | branch / hook / no bypass policy |
| 必須 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | post-merge task workflow sync |

## 承認ゲート【必須事前確認】

| # | 項目 | 条件 | 判定 |
| --- | --- | --- | --- |
| 1 | Phase 10 GO | `outputs/phase-10/go-no-go.md` が GO | 要事前確認 |
| 2 | Phase 11 evidence | `main.md` / `manual-evidence.md` / `link-checklist.md` が存在し、screenshots/ 不在 | 要事前確認 |
| 3 | Phase 11 10k 実測 | 10,000 行 fixture の実測数値が manual-evidence.md に記録済 | 要事前確認 |
| 4 | Phase 12 必須 7 成果物 | implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check / main | 要事前確認 |
| 5 | Phase 12 compliance check 12 項目 | 全 PASS | 要事前確認 |
| 6 | workflow_state | root / outputs とも `implemented-local` / `docsOnly=false` / `github_issue_state=CLOSED` | 要事前確認 |
| 7 | Issue #293 | CLOSED 維持、`Refs #293` のみ採用、`Closes #293` 不使用 | 要事前確認 |
| 8 | 不変条件 #5 | migration / repository / workflow / route がすべて `apps/api/` 配下 | 要事前確認 |
| 9 | same-wave sync | aiworkflow references 3 + indexes 4 + 原典 unassigned + LOGS.md | 要事前確認 |
| 10 | 機密情報非混入 | 実 token / database_id / 実会員 PII 0 件 | 要事前確認 |
| 11 | hook 通過 | pre-commit `staged-task-dir-guard` / pre-push `coverage-guard` / lint / typecheck / test PASS | 要事前確認 |
| 12 | **user の明示承認** | 「Phase 13 を実行してよい」旨の明示指示 | **待機** |

> 1〜11 が PASS していても、12（user 承認）が無い限り commit / push / PR 作成は実行しない。

## PR 草案

### PR Title

```text
feat(ut-07b): harden schema alias apply with DB constraint, resumable backfill, and retryable contract
```

- 70 文字以内目安。詳細は body に記載する。
- prefix は `feat`（implementation タスクのため）。

### PR Body

```markdown
## Summary
- Add partial UNIQUE index on `schema_questions(revision_id, stable_key)` to enforce same-revision collision rejection at DB layer (excluding `__extra__:*` and NULL).
- Split alias confirmation and back-fill responsibilities; back-fill now carries resumable state (`processed_offset` etc.) and supports idempotent retry.
- Define `backfill_cpu_budget_exhausted` as a retryable HTTP continuation contract on `POST /admin/schema/aliases` (HTTP 202 + structured body).
- Validate behavior with 10,000+ row fixture on staging D1 / Workers; record batch count, CPU time, and retry count in Phase 11 evidence.

## Scope
- migration: 2-step (data conflict resolution → partial UNIQUE index addition)
- repository: collision pre-check kept as first-line defense, DB constraint as second-line
- workflow: alias confirmation / back-fill split with resumable state
- route: retryable failure body schema fixed
- tests: unit / route / workflow tests cover collision / retryable failure / idempotent retry / CPU budget
- docs: spec-only updates to aiworkflow-requirements `api-endpoints.md` / `database-schema.md` / `task-workflow-active.md`

## Out of scope (delegated)
- Production D1 migration apply (post-merge operational runbook in Phase 5)
- Queue / cron split for >50,000 rows (follow-up if Phase 11 evidence shows persistent CPU budget overrun)
- Admin UI error labels / monitoring threshold revisions

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test` (unit / route / workflow) PASS
- [ ] Phase 11 evidence: 2-step migration applied on staging
- [ ] Phase 11 evidence: 10,000-row fixture back-fill completes (with retry count recorded)
- [ ] Phase 11 evidence: `backfill_cpu_budget_exhausted` returned with HTTP 202 + body schema
- [ ] Phase 11 evidence: idempotent retry (no duplicate `audit_log` rows)
- [ ] Phase 11 evidence: partial UNIQUE index rejects same-revision duplicate INSERT

## Invariant compliance
- Invariant #5 (D1 access confined to `apps/api`): all migration / repository / workflow / route changes are within `apps/api/**`.

Refs #293
```

> **重要**:
>
> - `Closes #293` は **使用禁止**（Issue は CLOSED のまま維持し、reopen も close-twice もしない）。
> - `Refs #293` のみで履歴リンクを残す。
> - body は `gh pr create --body "$(cat <<'EOF' ... EOF)"` で HEREDOC 渡しすること（フォーマット保持）。

## コミット粒度（5 単位推奨）

implementation タスクのため、関連性が高い変更を 5 単位前後にまとめる。各コミットは独立 review 可能な粒度を保つ。

| # | コミット範囲 | 想定 message |
| --- | --- | --- |
| 1 | docs: タスク仕様書一式（13 phase + index + artifacts.json + outputs 雛形） | `docs(ut-07b): add schema alias hardening task specification (phase 1-13)` |
| 2 | migration: 衝突検出 SQL + partial UNIQUE index 追加 migration | `feat(api): add partial unique index on schema_questions(revision_id, stable_key)` |
| 3 | repository / workflow / route: 再開可能 back-fill + retryable contract 実装 | `feat(api): split alias confirmation and resumable backfill with retryable contract` |
| 4 | test: unit / route / workflow / 10k fixture | `test(api): cover collision, retryable failure, idempotent retry, and CPU budget` |
| 5 | spec sync: aiworkflow-requirements references 3 + indexes 4 + LOGS + 原典 unassigned status 更新 | `docs(spec): sync aiworkflow-requirements for ut-07b schema alias hardening` |

> Phase 11 の evidence ファイル（`outputs/phase-11/*.md`）は #1 または別コミット（`docs(ut-07b): add phase-11 manual evidence`）として分離してもよい。

### Commit message テンプレ（HEREDOC）

```bash
git commit -m "$(cat <<'EOF'
feat(api): add partial unique index on schema_questions(revision_id, stable_key)

Enforces same-revision collision rejection at the DB layer in addition to the
existing repository pre-check. The index is partial (excludes `__extra__:*` and
NULL) so that unconfirmed aliases remain insertable.

Refs #293

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## hook 通過確認（pre-commit / pre-push）

CLAUDE.md の方針に従い、`--no-verify` は **使用禁止**。hook が誤検知した場合は hook 自体を改善するか、sync-merge 専用の自動スキップ条件に該当するかを確認する。

### pre-commit

| hook | 期待挙動 | 失敗時の対応 |
| --- | --- | --- |
| staged-task-dir-guard | 本タスクの slug `ut-07b-schema-alias-hardening` 配下のみ stage | 他タスク dir が混入していたら unstage |
| lint-staged（lint / format） | PASS | 該当ファイルを修正して再 stage |
| typecheck | PASS | 型エラーを修正して再 stage |

### pre-push

| hook | 期待挙動 | 失敗時の対応 |
| --- | --- | --- |
| coverage-guard（`--changed` モード） | 変更ファイルのカバレッジ閾値 PASS | テスト追加で再 push |
| lint / typecheck（push 前再確認） | PASS | 修正して再 push |

> sync-merge コミットを含む push の場合、`coverage-guard` は自動スキップされる（CLAUDE.md「sync-merge 時の hook 挙動」参照）。本 PR は feature push のため通常 hook が動作する想定。

## 実行手順（user 承認後のみ）

### ステップ 1: 事前確認

```bash
# 現在のブランチ確認
git status
git branch --show-current

# 期待: feat/issue-293-ut-07b-schema-alias-hardening-task-spec

# 未追跡 / 未 stage を確認
git status --short
```

### ステップ 2: 5 単位コミット

```bash
# 例: コミット #1（docs 仕様書）
git add docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/
git commit -m "$(cat <<'EOF'
docs(ut-07b): add schema alias hardening task specification (phase 1-13)

Adds Phase 1-13 specifications for hardening the alias apply workflow with DB
constraint, resumable back-fill, retryable HTTP contract, and 10,000+ row
staging measurement. Issue #293 is kept CLOSED; this task is created as a
standalone follow-up specification.

Refs #293

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 以降コミット #2〜#5 を上記テンプレートに従って実行
```

### ステップ 3: push

```bash
git push -u origin feat/issue-293-ut-07b-schema-alias-hardening-task-spec
```

### ステップ 4: PR 作成

```bash
gh pr create \
  --base dev \
  --head feat/issue-293-ut-07b-schema-alias-hardening-task-spec \
  --title "feat(ut-07b): harden schema alias apply with DB constraint, resumable backfill, and retryable contract" \
  --body "$(cat <<'EOF'
## Summary
- Add partial UNIQUE index on `schema_questions(revision_id, stable_key)` to enforce same-revision collision rejection at DB layer (excluding `__extra__:*` and NULL).
- Split alias confirmation and back-fill responsibilities; back-fill now carries resumable state and supports idempotent retry.
- Define `backfill_cpu_budget_exhausted` as a retryable HTTP contract on `POST /admin/schema/aliases`.
- Validate with 10,000+ row fixture on staging D1 / Workers.

## Scope
- migration / repository / workflow / route / tests within `apps/api/**`
- docs: aiworkflow-requirements references / indexes sync

## Out of scope (delegated)
- Production D1 migration apply (post-merge runbook)
- Queue / cron split for >50,000 rows (follow-up if needed)
- Admin UI / monitoring threshold updates

## Test plan
- [ ] typecheck / lint / test PASS
- [ ] Phase 11 staging evidence (2-step migration / 10k fixture / retryable response / idempotent retry / UNIQUE reject)

Refs #293
EOF
)"
```

### ステップ 5: PR URL を user に返却

`gh pr create` の stdout に表示される PR URL を user に提示し、CI / レビュー結果を確認する。

## 禁止事項

- **承認前に commit / push / PR 作成を実行しない**（Phase 13 の最重要制約）。
- `Closes #293` を body / commit message のいずれにも使わない。
- GitHub Issue #293 を **reopen しない**。
- `--no-verify` で hook を skip しない（誤検知時は hook を改善する）。
- 5 単位コミットを 1 commit に潰さない（review 可能性が下がる）。
- `apps/web/` から D1 binding を直接参照する変更を含めない（不変条件 #5）。
- 実 database_id / 実 token / 実会員 PII を commit / PR body に含めない。

## 完了条件

- [ ] PR が staging 環境向け（base = `dev`）に作成済
- [ ] PR title / body が本仕様書と一致
- [ ] body に `Refs #293` のみ採用、`Closes #293` 不使用
- [ ] 5 単位コミットの粒度が保たれている
- [ ] pre-commit / pre-push hook が PASS（`--no-verify` 不使用）
- [ ] CI（typecheck / lint / test / verify-indexes-up-to-date）が PASS
- [ ] PR URL が user に提示済
- [ ] GitHub Issue #293 が CLOSED のまま（reopen していない）
- [ ] Issue #293 に PR / 仕様書リンクの `gh issue comment` を追加済

## タスク 100% 実行確認【必須】

- Phase 13 仕様書が `pending_user_approval` 状態である
- user 承認なしで Git 操作 / PR 作成を実行していない
- PR body / commit message が `Refs #293` のみ採用
- root `artifacts.json` の `phases[12].status = "pending_user_approval"` / `phases[12].user_approval_required = true`
- 5 単位コミット粒度の指針が記述されている
- hook 通過確認の手順が記述されている
- 機密情報非混入の確認手順が記述されている

## 次のアクション（PR merge 後）

- merge 後は本タスクの `metadata.workflow_state` を `completed` / `implemented` 相当へ昇格する。実装の本番 D1 反映は Phase 5 migration-runbook に従い別ステップで実行する。
- 親タスク 07b の completed-tasks index に「UT-07B (spec + impl) merged」リンクを追記（双方向更新）。
- Phase 11 で恒常的な CPU budget 超過が観察された場合、queue / cron 分離タスクを follow-up として `unassigned-task/` に新規起票する判断を行う。
- `task-workflow-active.md` から UT-07B を `completed-tasks` 表記へ移行する（merge 完了後）。

## ブロック条件

- 承認ゲート 1〜11 のいずれかが未 PASS
- user の明示承認が得られていない
- hook が FAIL（修正せずに `--no-verify` で回避してはいけない）
- CI（verify-indexes-up-to-date 含む）が FAIL
- PR body に `Closes #293` が混入
- Issue #293 が誤って reopen された
- 5 単位を超えた巨大コミットや、無関係な変更が混入
