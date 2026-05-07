# Phase 13: PR 作成 / 承認チェックリスト

> [実装区分: ドキュメントのみ]（CONST_004 例外条件適用）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01-FOLLOWUP schema alias back-fill DLQ 監視ダッシュボード整備 |
| Phase 番号 | 13 / 13 |
| 前 Phase | 12（ドキュメント更新） |
| 状態 | spec_created（Phase 13 到達時は **pending_user_approval**） |
| 実装区分 | ドキュメントのみ |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| user_approval_required | **true** |
| GitHub Issue | #502（CLOSED 据え置き / reopen 禁止） |
| ブランチ名 | `docs/issue-502-dlq-monitoring-runbook` |
| 変更対象ファイル / 関数シグネチャ / unit/integration/e2e tests | **N/A（コード変更なし）** |

## 目的

実 Git 操作（commit / push / PR 作成）の実行ゲート。`git commit` / `git push` / `gh pr create` は **ユーザーの明示承認があるまで実行しない**。承認後は CLAUDE.md「PR 作成の完全自律フロー」に従い、`pnpm sync:check` で main 整合確認 → main 取り込み → CI gate（verify-indexes / lint / typecheck）→ PR 作成までを自律実行する。

## 前提条件

- Phase 11 は `contract_ready_runtime_pending`。配置済み evidence は aggregation.md / dash-observation.md / binding-grep.log / repository-grep.log / migration-grep.log / redaction-grep.log / read-only-grep.log。実 D1 SQL / dash runtime evidence は user approval 後
- Phase 12 strict 7 成果物配置済み（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- runbook 本体配置済み（`docs/runbooks/dlq-monitoring/schema-alias-backfill.md`）
- skill references 追記済み（`.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`）
- changelog 反映済み（`.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md`）
- indexes / 正本導線同期済み（topic-map / keywords / quick-reference / resource-map / task-workflow-active / SKILL / LOGS）
- 起票元 unassigned task spec への trace 追記済み
- 機微情報混入ゼロ確認（`redaction-grep.log` 0 件もしくは `[REDACTED]` 化済 / `read-only-grep.log` 改変系 keyword 0 件）

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 緩和策 |
| --- | --- | --- |
| 1 | `Refs #502` と `Closes #502` の取り違え | HEREDOC テンプレ固定 + 事前 grep で `Closes #502` を検出 |
| 2 | indexes 再生成漏れで CI `verify-indexes-up-to-date` FAIL | Phase 12 で `pnpm indexes:rebuild` 実行済を再確認、`git status .claude/skills/aiworkflow-requirements/indexes/` で drift 0 |
| 3 | Phase 11 raw evidence の機微情報露出 | 承認ゲートで `redaction-grep.log` 0 件確認を必須化 |
| 4 | runbook 本体の `bash scripts/cf.sh` 例示で wrangler 直接実行を誤って混入 | runbook draft に対する `rg -n "^wrangler "` で 0 件確認 |
| 5 | main 取り込み時のコンフリクト（lockfile / indexes / changelog） | CLAUDE.md「PR 作成の完全自律フロー」のコンフリクト解消既定方針に従う（indexes はマージ後に `pnpm indexes:rebuild` 再実行で正） |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DLQ 監視 runbook + skill references を本番ライン（main）に反映 |
| 実現性 | PASS | docs-only / `git` + `gh pr create` で完結 |
| 整合性 | PASS | branch protection（solo dev）と CI gate（verify-indexes / lint / typecheck）に整合 |
| 運用性 | PASS | hook 通過確認 / `--no-verify` 不使用 / `Refs #502` 採用 / `bash scripts/cf.sh` ラッパー遵守 |

## 受入条件

- PR が base = `main` に作成済（CLAUDE.md「PR 作成の完全自律フロー」に従い main 直 PR）/ title・body が本仕様書テンプレと一致 / `Refs #502` のみ採用 / `Closes` 不使用
- declared files が docs-only 範囲（仕様書 + runbook 本体 + skill references + changelog + indexes 4 種 + 起票元 trace）に閉じる
- CI（typecheck / lint / verify-indexes-up-to-date）green
- `pnpm sync:check` 実行済（main 整合確認）
- マージ後 `gh issue comment 502` で PR / runbook リンク追加（reopen しない / 再 close もしない）

## 承認ゲート【必須事前確認】

| # | 項目 | 条件 |
| --- | --- | --- |
| 1 | Phase 10 / 11 / 12 完了 | Gate PASS / Phase 11 evidence 7 件 / 必須 7 成果物 + runbook 本体 / compliance check 全 PASS |
| 2 | workflow_state | root `workflow_state=spec_created` / `phases[11].status=completed` / `phases[12].status=completed` / `phases[13].status=pending_user_approval` / `docsOnly=true` / `github_issue_state=CLOSED` |
| 3 | Issue #502 | CLOSED 維持 / `Refs #502` のみ |
| 4 | 機密情報非混入 | `redaction-grep.log` 0 件もしくは `[REDACTED]` 化済 |
| 5 | aiworkflow-requirements 同期 | references 新規 + changelog + indexes 再生成（4 ファイル drift 0） |
| 6 | hook | pre-commit / pre-push PASS（`--no-verify` 不使用） |
| 7 | wrangler 直接実行不在 | runbook 本体に `^wrangler ` 0 件、すべて `bash scripts/cf.sh` 経由 |
| 8 | branch protection | solo dev（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true`） |
| 9 | **user 明示承認** | 「Phase 13 を実行してよい」「PR 作成」「diff-to-pr」等の明示指示（**待機**） |

> 1〜8 が PASS していても、9（user 承認）が無い限り commit / push / PR 作成は実行しない。

## PR 草案

### PR Title（70 文字以内目安 / 実値は 81 文字 → 短縮版採用）

```text
docs: add DLQ monitoring runbook for UT-07B-FU-01 schema alias back-fill (Refs #502)
```

> 70 文字超過時の短縮代替案: `docs: add DLQ monitoring runbook for schema alias back-fill (Refs #502)`（69 文字）

### PR Body 構造（HEREDOC で渡す）

- `## Summary`: 3 bullet（DLQ 監視 runbook 新設 / aiworkflow-requirements に dlq-monitoring topic 追加 / staging 集計 SQL 3 種を read-only で正本化）
- `## 監視対象とエンドポイント`: Queue / DLQ binding 名（prod / staging 両方）/ D1 table + migration ID
- `## 異常しきい値`: DLQ ≥ 1 / retry ≥ 3 / exhausted 24h の表 + 次アクション分岐サマリ
- `## 変更ファイル`: runbook / skill references / changelog / indexes 4 種 / 仕様書配下 / 起票元 trace
- `## Test plan`:
  - [ ] `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging` で 3 SQL 再実行
  - [ ] `jq empty` JSON validation
  - [ ] redaction grep / read-only grep
  - [ ] `mise exec -- pnpm indexes:rebuild` で drift 0
  - [ ] CI verify-indexes-up-to-date / lint / typecheck green
- `## 関連`: `Refs #502`（CLOSED 維持） / 親タスク UT-07B-FU-01
- 末尾: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

> **重要**: `Closes #502` は **使用禁止**。`Refs #502` のみ。

## declared files

| 種別 | パス |
| --- | --- |
| runbook 本体 | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` |
| skill references | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` |
| skill changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` |
| skill indexes | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` |
| 仕様書 + outputs | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/**` |
| 起票元 trace | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` |

> 実装ファイル（`apps/api/**` / `apps/web/**` / `.github/workflows/**` / `apps/api/wrangler.toml` / `apps/api/migrations/**`）は declared files に **含めない**（コード変更ゼロ）。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| local check | `outputs/phase-13/local-check-result.md` | user approval 後の local verification 結果 |
| change summary | `outputs/phase-13/change-summary.md` | PR 前の変更要約 |
| PR info | `outputs/phase-13/pr-info.md` | PR URL / base / head 記録 |
| PR result | `outputs/phase-13/pr-creation-result.md` | PR 作成結果 |
| sync check | `outputs/phase-13/sync-check.log` | `pnpm sync:check` 実行ログ |

## コミット粒度（3 単位推奨）

| # | コミット範囲 | message |
| --- | --- | --- |
| 1 | docs: 仕様書 + outputs/phase-11 + outputs/phase-12 + runbook 本体 | `docs(issue-502): add DLQ monitoring task spec, evidence, and runbook` |
| 2 | spec sync: aiworkflow-requirements references / changelog / indexes 4 種 | `docs(spec): sync aiworkflow-requirements with dlq-monitoring topic for issue-502` |
| 3 | trace: 起票元 unassigned task spec | `docs(trace): formalize task-ut-07b-fu-01-followup to issue-502` |

## 実行手順（user 承認後のみ）

```bash
# 事前確認
mise exec -- pnpm sync:check  # main 整合確認 → outputs/phase-13/sync-check.log に保存
git branch --show-current  # 期待: docs/issue-502-dlq-monitoring-runbook

# 機微情報 / wrangler 直接実行混入チェック
rg -nE "token|bearer|secret|Authorization|email|responseEmail" \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/ \
  docs/runbooks/dlq-monitoring/schema-alias-backfill.md \
  || echo "OK: no PII tokens"

rg -n "^wrangler " docs/runbooks/dlq-monitoring/schema-alias-backfill.md \
  || echo "OK: no direct wrangler invocation"

# main 取り込み + CI gate
git fetch origin main
git merge origin/main  # コンフリクトは CLAUDE.md「PR 作成の完全自律フロー」既定方針で解消
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm indexes:rebuild  # main 取り込み後に再実行 → drift 0 を再確認
git status .claude/skills/aiworkflow-requirements/indexes/  # drift があれば commit に含める

# 3 単位コミット → push → PR 作成（user 承認後のみ）
git add \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard \
  docs/runbooks/dlq-monitoring/schema-alias-backfill.md \
  .claude/skills/aiworkflow-requirements/references/dlq-monitoring.md \
  .claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md \
  .claude/skills/aiworkflow-requirements/indexes \
  docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md
git commit -m "docs(issue-502): add DLQ monitoring runbook"
git push -u origin docs/issue-502-dlq-monitoring-runbook
gh pr create --base main \
  --head docs/issue-502-dlq-monitoring-runbook \
  --title "docs: add DLQ monitoring runbook for UT-07B-FU-01 schema alias back-fill (Refs #502)" \
  --body "$(cat <<'EOF'
（PR Body 構造セクションの内容を HEREDOC で貼り付け / Refs #502）
EOF
)"

# マージ後（reopen 禁止 / 再 close 不要）
gh issue comment 502 --body "PR <PR URL> でマージ済み。runbook: docs/runbooks/dlq-monitoring/schema-alias-backfill.md / 仕様書: docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/"
```

## 禁止事項

- 承認前に commit / push / PR 作成を実行しない
- `Closes #502` を使わない
- Issue #502 を reopen しない
- `--no-verify` で hook を skip しない
- 実装ファイル（`apps/api/**` / `apps/web/**` / `.github/workflows/**` / `apps/api/wrangler.toml` / `apps/api/migrations/**`）を declared files に含めない
- runbook 内に `wrangler` 直接実行例を記載しない（`bash scripts/cf.sh` 経由のみ）
- 実 token / 実会員 PII / 実 schema 差分内容を commit / PR body に含めない

## 完了条件チェックリスト

- [ ] `pnpm sync:check` で main 整合確認済
- [ ] PR が base = `main` に作成済 / title・body テンプレ一致 / `Refs #502` 採用
- [ ] declared files が docs-only 範囲に閉じる / 3 単位コミット粒度
- [ ] hook + CI PASS（typecheck / lint / verify-indexes-up-to-date / `--no-verify` 不使用）
- [ ] PR URL を user に提示済 / Issue #502 CLOSED 維持・マージ後 comment 追加済
- [ ] branch protection 整合確認済
- [ ] runbook 本体に `wrangler ` 直接実行記述 0 件
- [ ] 不変条件 #1〜#7 影響なし（コード変更なし / docs-only）

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |
| 必須 | `CLAUDE.md` | PR 作成の完全自律フロー / `bash scripts/cf.sh` ラッパー / branch 戦略 |
