# Phase 13: PR 作成 / 承認チェックリスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / 承認チェックリスト |
| 作成日 | 2026-05-05 |
| 前 Phase | 12（ドキュメント更新） |
| 状態 | **pending_user_approval**（gate GO 時） / **skip**（gate NO-GO 時） / **deferred**（staging-deferred 時） |
| taskType | implementation（条件付き） |
| 実装区分 | 実装仕様書 |
| visualEvidence | NON_VISUAL |
| workflow_state | gate GO: `implemented-local`（PR merge 前まで） / NO-GO: `spec_created` 据え置き / staging-deferred: `spec_created` 据え置き |
| user_approval_required | **gate GO 時 true** / NO-GO 時 false（skip） |
| GitHub Issue | #361（CLOSED 維持 / reopen 禁止） |
| ブランチ名 | `feat/issue-361-ut-07b-fu-01-schema-alias-backfill-queue-cron-split`（gate GO 時） |

---

## 目的

Phase 13 は **実 Git 操作（commit / push / PR 作成）の実行ゲート**。本仕様書はその草案・境界・承認条件・コミット粒度・hook 通過確認を文書化する。`git commit` / `git push` / `gh pr create` は **ユーザーの明示承認があるまで実行しない**。

gate 判定（Phase 11）に応じた分岐:

- **gate GO**: 通常 PR 作成フロー実行（user_approval 必須）
- **gate NO-GO**: PR 作成を no-op で skip / 仕様書のみ将来再起動用に据え置き
- **staging-deferred**: PR 作成を deferred / credentials 取得後に Phase 11 から再着手

---

## 実行タスク

1. Phase 10 GO / Phase 11 gate 判定（GO / NO-GO / staging-deferred） / Phase 12 必須 7 成果物を再確認する。
2. `git status --short` で本タスク範囲外の変更を stage しないことを確認する。
3. **gate GO 時のみ**: user の明示承認後に限り、仕様書 / implementation / tests / spec sync の単位で commit する。
4. **gate GO 時のみ**: user の明示承認後に限り、feature branch を push する。
5. **gate GO 時のみ**: user の明示承認後に限り、`Refs #361` のみを使って PR を作成する。
6. PR 作成後、Issue #361 は reopen せず、必要な場合は comment で仕様書リンクを残す。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md` | task scope / status |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/artifacts.json` | workflow_state / phase status |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md` | gate 判定結果 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance gate |
| 必須 | `CLAUDE.md` | branch / hook / no bypass policy / solo 運用 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | post-merge task workflow sync |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 想定影響 | 緩和策 |
| --- | --- | --- | --- |
| 1 | gate NO-GO 時に Phase 13 を skip するが、artifacts.json の `phases[12].status` を誤って `completed` に書き換える誤操作 | 据え置きが破られ再起動できなくなる | NO-GO 時の `phases[12].status = skipped-not-needed` を仕様化し、本 Phase に明記 |
| 2 | declared files に gate GO / NO-GO で異なるリストを保持する必要があり、PR 作成スクリプトが分岐しない | 不要ファイルが PR に混入 / 実装ファイル漏れ | gate 別 declared files 表を本仕様書に明示。NO-GO 時は仕様書配下のみ stage |
| 3 | `Refs #361` と `Closes #361` の取り違え | Issue が誤って reopen / close 二重化 | コミットメッセージ / PR body の HEREDOC テンプレを本仕様書で固定し、ローカル grep で `Closes #361` を検出する事前 hook を運用 |
| 4 | 5 単位コミット粒度が gate GO 時の実装ボリューム次第で過小 / 過大になる | review 可能性低下 | コミット粒度の最小 / 最大ガイドを本仕様書に明示（仕様書 / migration 不要時は wrangler.toml + workflow / consumer / route / test / spec sync の 5 単位） |
| 5 | branch protection（`required_pull_request_reviews=null` / solo 運用）と CI gate（typecheck / lint / test / verify-indexes-up-to-date）の整合確認漏れ | merge ブロック / 不要再 push | 本 Phase の承認ゲートに「branch protection 実値確認（`gh api repos/.../branches/dev/protection` で `required_pull_request_reviews=null` 確認）」を含める |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | gate GO 時は実装を本番反映ライン（dev）に乗せ、NO-GO 時は据え置きで再起動可能 |
| 実現性 | PASS | `git` / `gh pr create` は `scripts/cf.sh` 不要のため solo dev 運用ポリシーで実行可能 |
| 整合性 | PASS | branch protection（solo dev / `required_pull_request_reviews=null`）と CI gate（CI required status checks）に整合 |
| 運用性 | PASS | hook（pre-commit `staged-task-dir-guard` / pre-push `coverage-guard`）通過確認 / `--no-verify` 不使用 |

---

## 受入条件

- gate GO 時:
  - PR が staging 環境向け（base = `dev`）に作成済
  - PR title / body が本仕様書のテンプレと一致し、`Refs #361` のみ採用 / `Closes #361` 不使用
  - declared files が仕様書配下 + 実装ファイル（`apps/api/wrangler.toml` / queue consumer / route / workflow / repository / tests）を含む
  - CI（typecheck / lint / test / build / verify-indexes-up-to-date）が green
  - Issue #361 に PR / 仕様書リンクの `gh issue comment` を追加済
- gate NO-GO 時:
  - PR は作成しない / declared files に実装ファイルなし / blocked placeholder としてコミットしない
  - `phases[12].status = skipped-not-needed` で artifacts.json を更新し、`workflow_state = spec_created` 据え置き
  - Issue #361 に NO-GO 判定 evidence の link を comment（reopen しない）
- staging-deferred 時:
  - Phase 11 から再着手 / Phase 13 は実行しない

---

## 承認ゲート【必須事前確認 / gate GO 時】

| # | 項目 | 条件 | 判定 |
| --- | --- | --- | --- |
| 1 | Phase 10 GO | `outputs/phase-10/go-no-go.md` が GO | 要事前確認 |
| 2 | Phase 11 gate evidence | `main.md` / `before-evidence.md` / `gate-decision.md` / `after-evidence.md`（GO 時） / `staging-fixture-setup.md` / `link-checklist.md` / `manual-smoke-log.md` / `redaction-check.md` 揃い、screenshots/ 不在 | 要事前確認 |
| 3 | Phase 11 gate 判定 | gate-decision.md が **GO** | 要事前確認 |
| 4 | Phase 12 必須 7 成果物 | main / implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | 要事前確認 |
| 5 | Phase 12 compliance check | 全 PASS | 要事前確認 |
| 6 | workflow_state | root artifacts.json が `implemented-local` / `docsOnly=false` / `github_issue_state=CLOSED` | 要事前確認 |
| 7 | Issue #361 | CLOSED 維持 / `Refs #361` のみ採用 / `Closes #361` 不使用 | 要事前確認 |
| 8 | 不変条件 #5 | queue consumer / cron handler / route / workflow / repository すべて `apps/api/` 配下 | 要事前確認 |
| 9 | same-wave sync | aiworkflow references + indexes + 原典 + LOGS.md | 要事前確認 |
| 10 | 機密情報非混入 | 実 token / database_id / 実会員 PII 0 件 | 要事前確認 |
| 11 | hook 通過 | pre-commit `staged-task-dir-guard` / pre-push `coverage-guard` / lint / typecheck / test PASS | 要事前確認 |
| 12 | branch protection 整合 | solo dev 運用ポリシー（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true`） | 要事前確認 |
| 13 | **user の明示承認** | 「Phase 13 を実行してよい」旨の明示指示 | **待機** |

> 1〜12 が PASS していても、13（user 承認）が無い限り commit / push / PR 作成は実行しない。

---

## PR 草案

### PR Title

#### gate GO 時

```text
feat(api): UT-07B-FU-01 schema alias back-fill queue/cron split
```

#### gate NO-GO 時（skip 推奨だが、仕様書据え置きを記録する PR を作る場合のみ）

```text
docs(workflow): UT-07B-FU-01 spec_created with not-needed evidence
```

- 70 文字以内目安。詳細は body に記載する。

### PR Body

#### gate GO 時

```markdown
## Summary
- Split alias confirmation and back-fill responsibilities; back-fill is now driven by Cloudflare Queue / Cron with idempotent remaining-scan model.
- API response on `POST /admin/schema/aliases` now distinguishes `confirmed: true` (alias finalized in-request) from `backfill.status: pending|running|exhausted|completed` (queue/cron continuation).
- Add Cloudflare binding (Queue or Cron) to `apps/api/wrangler.toml` for staging and production with CI variables and runbook synced.
- Validated with staging 10,000+ rows fixture; before/after evidence shows persistent `backfill_cpu_budget_exhausted` resolved into `backfill.status: completed`.

## Scope
- workflow: alias confirmation / back-fill split
- consumer: queue or cron consumer (remaining-scan / idempotent update)
- route: response contract (`confirmed` / `backfill.status`)
- binding: `apps/api/wrangler.toml` (staging / production)
- tests: route / workflow / repository (duplicate enqueue / partial failure / batch boundary)
- docs: aiworkflow-requirements references / indexes sync

## Out of scope (delegated)
- admin UI progress display for `backfill.status` (UT-07B-FU-02)
- production migration apply approval gate (UT-07B-FU-03 / FU-04)
- queue dead-letter monitoring dashboard (recorded in unassigned-task-detection)

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test` (route / workflow / repository) PASS
- [ ] Phase 11 staging evidence: 10,000+ rows fixture before/after, `backfill.status: completed` 収束確認
- [ ] CI verify-indexes-up-to-date PASS

## Invariant compliance
- Invariant #5 (D1 access confined to `apps/api`): all queue consumer / cron handler / route / workflow / repository changes within `apps/api/**`.
- No breaking change to existing `POST /admin/schema/aliases` clients (backward-compatible response: `confirmed` field added, `backfill` object added).

Refs #361
```

#### gate NO-GO 時（PR を作る場合のみ）

```markdown
## Summary
- Phase 11 staging 10,000+ rows evidence shows `backfill_cpu_budget_exhausted` does not persist (gate NO-GO).
- No queue/cron implementation is required at this time. Specification is kept as `spec_created` for future re-activation.

## Scope
- docs: this task's spec (Phase 11 evidence + Phase 12 not-needed judgement)

## Re-activation condition
- If `backfill_cpu_budget_exhausted` becomes persistent in production observation, re-run Phase 11 from this spec.

Refs #361
```

> **重要**:
>
> - `Closes #361` は **使用禁止**（Issue は CLOSED のまま維持し、reopen も close-twice もしない）。
> - `Refs #361` のみで履歴リンクを残す。
> - body は `gh pr create --body "$(cat <<'EOF' ... EOF)"` で HEREDOC 渡しすること。

---

## declared files

### gate GO 時

| 種別 | パス（例） |
| --- | --- |
| 仕様書 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/**` |
| outputs | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/**` |
| 実装 | `apps/api/wrangler.toml` |
| 実装 | `apps/api/src/workflows/schemaAliasAssign.ts` |
| 実装 | `apps/api/src/workflows/schemaAliasBackfillBatch.ts`（新規） |
| 実装 | `apps/api/src/routes/admin/schema.ts` |
| 実装 | `apps/api/src/repository/schemaDiffQueue.ts` |
| テスト | `apps/api/test/routes/admin/schema.*.test.ts` / `apps/api/test/workflows/*.test.ts` / `apps/api/test/repository/*.test.ts` |
| spec sync | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` |
| spec sync | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| spec sync | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| spec sync | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |
| spec sync | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` |
| LOGS | `docs/30-workflows/LOGS.md` |

### gate NO-GO 時

| 種別 | パス |
| --- | --- |
| 仕様書 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/**` |
| outputs | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/**`（gate-decision.md / before-evidence.md / main.md） |
| outputs | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/**`（縮約版 7 ファイル） |
| LOGS | `docs/30-workflows/LOGS.md`（NO-GO close-out 行） |

> NO-GO 時は実装ファイルを declared files に含めない。blocked placeholder としてコミットしない。

---

## コミット粒度（gate GO 時 / 5 単位推奨）

| # | コミット範囲 | 想定 message |
| --- | --- | --- |
| 1 | docs: タスク仕様書一式（13 phase + index + artifacts.json + outputs 雛形 + Phase 11 evidence） | `docs(ut-07b-fu-01): add schema alias backfill queue/cron split task spec (phase 1-13)` |
| 2 | binding: `apps/api/wrangler.toml`（Queue / Cron binding 追加 / staging + production） | `feat(api): add cloudflare queue/cron binding for schema alias backfill` |
| 3 | workflow / consumer / route: alias 確定 + queue/cron consumer + response contract | `feat(api): split alias confirmation and queue/cron-driven backfill continuation` |
| 4 | test: route / workflow / repository（duplicate enqueue / partial failure / batch boundary） | `test(api): cover queue/cron backfill consumer (duplicate, partial failure, batch boundary)` |
| 5 | spec sync: aiworkflow-requirements references + indexes + LOGS | `docs(spec): sync aiworkflow-requirements for ut-07b-fu-01 queue/cron split` |

### Commit message テンプレ（HEREDOC）

```bash
git commit -m "$(cat <<'EOF'
feat(api): split alias confirmation and queue/cron-driven backfill continuation

Splits the alias confirmation (in-request) from the back-fill continuation
(queue or cron consumer with idempotent remaining-scan). API response now
returns `confirmed: true` and `backfill: { status: pending|running|exhausted|completed }`.
All changes confined to `apps/api/` (Invariant #5).

Refs #361

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## hook 通過確認（pre-commit / pre-push）

CLAUDE.md の方針に従い、`--no-verify` は **使用禁止**。hook が誤検知した場合は hook 自体を改善するか、sync-merge 専用の自動スキップ条件に該当するかを確認する。

### pre-commit

| hook | 期待挙動 | 失敗時の対応 |
| --- | --- | --- |
| staged-task-dir-guard | 本タスクの slug `ut-07b-fu-01-schema-alias-backfill-queue-cron-split` 配下のみ stage | 他タスク dir が混入していたら unstage |
| lint-staged（lint / format） | PASS | 該当ファイルを修正して再 stage |
| typecheck | PASS | 型エラーを修正して再 stage |

### pre-push

| hook | 期待挙動 | 失敗時の対応 |
| --- | --- | --- |
| coverage-guard（`--changed` モード） | 変更ファイルのカバレッジ閾値 PASS | テスト追加で再 push |
| lint / typecheck（push 前再確認） | PASS | 修正して再 push |

> 本 PR は feature push のため通常 hook が動作する想定。sync-merge コミットを含む場合は `coverage-guard` 自動スキップ。

---

## branch protection 整合（solo dev 運用ポリシー）

```bash
# 実行例（base = dev）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | grep -E "required_pull_request_reviews|lock_branch|enforce_admins"
```

期待:
- `required_pull_request_reviews=null`（solo 開発 / 必須レビュアー数 0）
- `lock_branch=false`
- `enforce_admins=true`
- `required_status_checks` に typecheck / lint / test / build / verify-indexes-up-to-date 含む

> drift があれば本 Phase を停止し、CLAUDE.md / `docs/30-workflows/ut-gov-001-*` に従って branch protection を是正してから Phase 13 を再開する。

---

## 実行手順（user 承認後のみ / gate GO 時）

### ステップ 1: 事前確認

```bash
# 現在のブランチ確認
git status
git branch --show-current

# 期待: feat/issue-361-ut-07b-fu-01-schema-alias-backfill-queue-cron-split

# 未追跡 / 未 stage を確認
git status --short
```

### ステップ 2: 5 単位コミット

```bash
# 例: コミット #1（docs 仕様書 + Phase 11 evidence）
git add docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/
git commit -m "$(cat <<'EOF'
docs(ut-07b-fu-01): add schema alias backfill queue/cron split task spec (phase 1-13)

Adds Phase 1-13 specifications and Phase 11 staging gate evidence for
splitting schema alias back-fill into queue or cron continuation when
`backfill_cpu_budget_exhausted` persists at 10,000+ rows. Issue #361 is kept
CLOSED; this task is a standalone follow-up of UT-07B.

Refs #361

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 以降コミット #2〜#5 を上記テンプレートに従って実行
```

### ステップ 3: push

```bash
git push -u origin feat/issue-361-ut-07b-fu-01-schema-alias-backfill-queue-cron-split
```

### ステップ 4: PR 作成

```bash
gh pr create \
  --base dev \
  --head feat/issue-361-ut-07b-fu-01-schema-alias-backfill-queue-cron-split \
  --title "feat(api): UT-07B-FU-01 schema alias back-fill queue/cron split" \
  --body "$(cat <<'EOF'
## Summary
- Split alias confirmation and back-fill responsibilities; back-fill is now driven by Cloudflare Queue / Cron with idempotent remaining-scan model.
- API response on `POST /admin/schema/aliases` now distinguishes `confirmed: true` from `backfill.status: pending|running|exhausted|completed`.
- Add Cloudflare binding to `apps/api/wrangler.toml` for staging and production with CI variables and runbook synced.
- Validated with staging 10,000+ rows fixture before/after evidence.

## Scope
- workflow / consumer / route / binding / tests within `apps/api/**`
- docs: aiworkflow-requirements references / indexes sync

## Out of scope (delegated)
- admin UI progress display (UT-07B-FU-02)
- production migration apply approval gate (UT-07B-FU-03 / FU-04)
- queue dead-letter monitoring dashboard

## Test plan
- [ ] typecheck / lint / test / build PASS
- [ ] verify-indexes-up-to-date PASS
- [ ] Phase 11 staging evidence (before/after / gate-decision)

## Invariant compliance
- Invariant #5: queue consumer / cron handler / route / workflow / repository within `apps/api/**`.

Refs #361
EOF
)"
```

### ステップ 5: PR URL を user に返却

`gh pr create` の stdout に表示される PR URL を user に提示し、CI / レビュー結果を確認する。

### ステップ 6: Issue #361 への comment（reopen 禁止）

```bash
gh issue comment 361 --body "UT-07B-FU-01 spec + impl PR: <PR URL> / spec: docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md"
```

---

## 実行手順（gate NO-GO 時）

1. `outputs/phase-12/main.md` で「実装不要」判定根拠を記録（Phase 11 before evidence の数値 / 基準への当てはめ）。
2. artifacts.json を更新: `phases[10].status = completed`、`phases[11].status = completed-not-needed`、`phases[12].status = skipped-not-needed`、`metadata.workflow_state = spec_created` 据え置き。
3. `docs/30-workflows/LOGS.md` に NO-GO close-out 行を追記。
4. Issue #361 に NO-GO 判定 evidence の link を `gh issue comment` で残す（reopen しない）。
5. PR は作成しない。再起動条件（CPU budget exhaustion 再発時）を `unassigned-task-detection.md` に記録済であることを確認。

---

## 実行手順（staging-deferred 時）

1. Phase 11 `staging-fixture-setup.md` に credentials 取得後の再実行手順が記録されていることを確認。
2. artifacts.json は `phases[10].status = completed`、`phases[11].status = staging-deferred`、`metadata.workflow_state = spec_created` 据え置き。
3. PR は作成しない。
4. Issue #361 に staging-deferred 状態と再着手条件を `gh issue comment` で残す（reopen しない）。

---

## 禁止事項

- **承認前に commit / push / PR 作成を実行しない**（Phase 13 の最重要制約）。
- `Closes #361` を body / commit message のいずれにも使わない。
- GitHub Issue #361 を **reopen しない**。
- `--no-verify` で hook を skip しない（誤検知時は hook を改善する）。
- gate NO-GO 時に declared files へ実装ファイルを含めない / blocked placeholder として実装ファイルをコミットしない。
- 5 単位コミットを 1 commit に潰さない（review 可能性が下がる）。
- `apps/web/` から D1 binding を直接参照する変更を含めない（不変条件 #5）。
- 実 database_id / 実 token / 実会員 PII を commit / PR body に含めない。

---

## 完了条件チェックリスト

### gate GO 時

- [ ] PR が staging 環境向け（base = `dev`）に作成済
- [ ] PR title / body が本仕様書テンプレと一致 / `Refs #361` 採用 / `Closes #361` 不使用
- [ ] declared files が仕様書 + 実装ファイル + spec sync を含む
- [ ] 5 単位コミット粒度が保たれている
- [ ] pre-commit / pre-push hook が PASS（`--no-verify` 不使用）
- [ ] CI（typecheck / lint / test / build / verify-indexes-up-to-date）が PASS
- [ ] PR URL が user に提示済
- [ ] GitHub Issue #361 が CLOSED のまま（reopen していない）
- [ ] Issue #361 に PR / 仕様書リンクの `gh issue comment` を追加済
- [ ] branch protection 整合（solo dev / `required_pull_request_reviews=null`）確認済

### gate NO-GO 時

- [ ] PR を作成していない
- [ ] artifacts.json の `phases[12].status = skipped-not-needed` / `metadata.workflow_state = spec_created` 据え置き
- [ ] 再起動条件が `unassigned-task-detection.md` に記録済
- [ ] Issue #361 に NO-GO 判定 evidence link を comment 済（reopen していない）

### staging-deferred 時

- [ ] PR を作成していない
- [ ] artifacts.json の `phases[11].status = staging-deferred` / `metadata.workflow_state = spec_created` 据え置き
- [ ] credentials 取得後の再実行手順が `staging-fixture-setup.md` に記録済
- [ ] Issue #361 に staging-deferred 状態を comment 済（reopen していない）

---

## 多角的チェック観点

- 価値性: gate GO 時の PR が後続の本番反映に確実につながり、NO-GO / staging-deferred 時の据え置きが再起動を阻害しないか。
- 実現性: solo dev branch protection（`required_pull_request_reviews=null`）下で CI gate のみで品質保証が成立するか。
- 整合性: declared files が gate GO / NO-GO で正しく分岐し、不要ファイル混入 / 実装ファイル漏れが起きないか。
- 運用性: `Refs #361` / `Closes #361` 取り違えを防ぐ HEREDOC テンプレが固定されているか。
- 認可境界: PR body に実 database_id / 実 token / 実会員 PII を含めない / `wrangler` 直呼び誘導をしない。
- Secret hygiene: コミット前に `rg` で機密情報非混入を再確認するチェックが含まれているか。
- Issue ライフサイクル: Issue #361 が CLOSED のまま、`gh issue reopen` を実行しない / `Closes #361` を使用しない。
- branch protection 整合: solo dev 運用ポリシーが gate GO / NO-GO の両方で維持されているか。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート 1〜12 事前確認 | 13 | spec_created | gate GO 時 |
| 2 | user 明示承認待ち | 13 | spec_created | 必須 |
| 3 | 5 単位コミット実行 | 13 | spec_created | gate GO 時のみ / HEREDOC テンプレ |
| 4 | feature branch push | 13 | spec_created | gate GO 時のみ |
| 5 | PR 作成（`Refs #361` 採用） | 13 | spec_created | gate GO 時のみ |
| 6 | Issue #361 への comment | 13 | spec_created | reopen 禁止 / 全 gate 共通 |
| 7 | gate NO-GO 時の skip 手順 | 13 | spec_created | artifacts.json 据え置き |
| 8 | staging-deferred 時の deferred 手順 | 13 | spec_created | credentials 取得後再着手 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| メタ | `artifacts.json`（root） | gate 別状態遷移（GO=PR merge 後 completed / NO-GO=skipped-not-needed / staging-deferred） |
| GitHub | PR（gate GO 時のみ） | base=dev / `Refs #361` |
| GitHub | Issue #361 comment | PR / 仕様書 link / gate 判定（reopen しない） |
| LOGS | `docs/30-workflows/LOGS.md` | close-out 行（gate 別文言） |

---

## タスク 100% 実行確認【必須】

- Phase 13 仕様書が `pending_user_approval` 状態である（gate GO 時）
- user 承認なしで Git 操作 / PR 作成を実行していない
- PR body / commit message が `Refs #361` のみ採用
- root `artifacts.json` の `phases[12].user_approval_required = true`（gate GO 時）
- 5 単位コミット粒度の指針が記述されている
- hook 通過確認の手順が記述されている
- 機密情報非混入の確認手順が記述されている
- gate 3 分岐（GO / NO-GO / staging-deferred）すべての実行手順が記述されている

---

## 次のアクション（PR merge 後 / gate GO 時）

- merge 後は本タスクの `metadata.workflow_state` を `completed` 相当へ昇格する。
- `task-workflow-active.md` から UT-07B-FU-01 を `completed-tasks` 表記へ移行（merge 完了後）。
- 本仕様書配下を `docs/30-workflows/completed-tasks/` へ移動する。
- 親タスク 07b の completed-tasks index に「UT-07B-FU-01 (spec + impl) merged」リンクを追記（双方向更新）。
- queue dead-letter 監視 dashboard / admin UI 進捗表示が必要となった場合、`unassigned-task-detection.md` に記録された候補を新規 follow-up として起票する判断を行う。

---

## ブロック条件

- 承認ゲート 1〜12 のいずれかが未 PASS
- user の明示承認が得られていない
- hook が FAIL（修正せずに `--no-verify` で回避してはいけない）
- CI（verify-indexes-up-to-date 含む）が FAIL
- PR body に `Closes #361` が混入
- Issue #361 が誤って reopen された
- 5 単位を超えた巨大コミットや、無関係な変更が混入
- gate NO-GO 時に実装ファイルを declared files に含めてしまった
- branch protection drift が解消されていない

---

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 11 | gate 判定（GO / NO-GO / staging-deferred）に応じた本 Phase の分岐 |
| Phase 12 | documentation-changelog の変更ファイル一覧 → PR description 草案の根拠 / compliance-check の PASS を承認ゲートに引き渡し |
| 関連タスク | UT-07B 親 / UT-07B-FU-02 / UT-07B-FU-03 / UT-07B-FU-04 へ merge 後リンク追記 |
| aiworkflow-requirements | merge 後 `task-workflow-active.md` を `completed-tasks` 表記へ移行 |
