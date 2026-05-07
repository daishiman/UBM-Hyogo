# Phase 13: PR 作成 / 承認チェックリスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計 |
| Phase 番号 | 13 / 13 |
| 前 Phase | 12（ドキュメント更新） |
| 状態 | **pending_user_approval** |
| 実装区分 | ドキュメントのみ |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| user_approval_required | **true** |
| GitHub Issue | #497（CLOSED 据え置き / reopen 禁止） |
| ブランチ名 | `docs/issue-497-post-release-dashboard-30day-feedback` |
| 変更対象ファイル / 関数シグネチャ / unit/integration/e2e tests | **N/A（コード変更なし）** |

## 目的

実 Git 操作（commit / push / PR 作成）の実行ゲート。`git commit` / `git push` / `gh pr create` は **ユーザーの明示承認があるまで実行しない**。

## 前提条件

- Phase 11 で 6 Phase 11 evidence（post-release-dashboard-30d.json / conclusion-distribution.md / log-failed-*.log / consecutive-failure-window.md / redaction-grep.log / failure-rate-decision.md）配置済み
- Phase 12 で 7 必須成果物配置済み（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- skill references 追記済み（`.claude/skills/aiworkflow-requirements/references/deployment-gha.md`）
- changelog 反映済み（`changelog/20260506-issue497-30day-feedback.md`）
- 親タスク 351 unassigned-task-detection.md U-1 + 起票元 unassigned task spec への trace 追記済み
- 機微情報混入ゼロ確認（`redaction-grep.log` 0 件もしくは `[REDACTED]` 化済）

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 緩和策 |
| --- | --- | --- |
| 1 | `Refs #497, Refs #351` と `Closes #497` の取り違え | HEREDOC テンプレ固定 + 事前 grep で `Closes #497` / `Closes #351` を検出 |
| 2 | Phase 11 raw evidence の機微情報露出 | 承認ゲートで `redaction-grep.log` 0 件確認を必須化 |
| 3 | indexes 再生成判断ミスで CI `verify-indexes-up-to-date` FAIL | Phase 12 の判定結果を再確認し、必要時のみ `mise exec -- pnpm indexes:rebuild` 実行 |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 30 日実測 feedback を本番ライン（dev）に反映 |
| 実現性 | PASS | docs-only / `git` + `gh pr create` で完結 |
| 整合性 | PASS | branch protection（solo dev）と CI gate に整合 |
| 運用性 | PASS | hook 通過確認 / `--no-verify` 不使用 / `Refs #497, Refs #351` 採用 |

## 受入条件

- PR が base = `dev` に作成済 / title・body が本仕様書テンプレと一致 / `Refs #497, Refs #351` のみ採用 / `Closes` 不使用
- declared files が docs-only 範囲（仕様書 + skill references + changelog + 親 351 / 起票元 trace）に閉じる
- CI（typecheck / lint / build / verify-indexes-up-to-date / link check）green
- マージ後 `gh issue comment 497` で PR / 仕様書リンク追加（reopen しない / 再 close もしない）

## 承認ゲート【必須事前確認】

| # | 項目 | 条件 |
| --- | --- | --- |
| 1 | Phase 10 / 11 / 12 完了 | 30 日 gate PASS / 6 Phase 11 evidence / 必須 7 成果物 / compliance check 全 PASS |
| 2 | workflow_state | `completed_pending_pr` / `docsOnly=true` / `github_issue_state=CLOSED` |
| 3 | Issue #497 | CLOSED 維持 / `Refs #497, Refs #351` のみ |
| 4 | 機密情報非混入 | `redaction-grep.log` 0 件もしくは `[REDACTED]` 化済 |
| 5 | aiworkflow-requirements 同期 | references 追記 + changelog + indexes（必要時） |
| 6 | hook | pre-commit / pre-push PASS（`--no-verify` 不使用） |
| 7 | branch protection | solo dev（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true`） |
| 8 | **user 明示承認** | 「Phase 13 を実行してよい」旨の明示指示（**待機**） |

> 1〜7 が PASS していても、8（user 承認）が無い限り commit / push / PR 作成は実行しない。

## PR 草案

### PR Title（67 文字 / 70 文字以内）

```text
docs: post-release-dashboard 30-day schedule conclusion feedback (issue-497)
```

### PR Body 構造（HEREDOC で渡す）

- `## Summary`: 3 bullet（30 日 feedback 正本化 / failure rate 判定 / changelog 反映）
- `## 30 日実測 feedback サマリ`: conclusion 分布 / 連続 failure 区間 / failure rate / 次アクション（`>=10%` 時は起票 issue 番号）
- `## 変更ファイル`: deployment-gha.md / changelog/20260506-issue497-30day-feedback.md / 仕様書配下 / workflow-local close-out / 親 351 trace / 起票元 trace
- `## Test plan`: `gh run list` 再現 / `jq empty` JSON validation / redaction grep / link check / CI verify-indexes-up-to-date
- `## 関連`: `Refs #497`（CLOSED 維持） / `Refs #351`（親タスク）
- 末尾: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

> **重要**: `Closes #497` / `Closes #351` は **使用禁止**。`Refs #497, Refs #351` のみ。

## declared files

| 種別 | パス |
| --- | --- |
| skill references | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` |
| skill changelog | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` |
| 仕様書 + outputs | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/**` |
| LOGS | `docs/30-workflows/workflow-local close-out` |
| trace（親 / 起票元） | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`、`docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` |
| indexes（条件付き） | `.claude/skills/aiworkflow-requirements/indexes/**`（新キー追加時のみ） |

> 実装ファイル（`apps/api/**` / `apps/web/**` / `.github/workflows/**`）は declared files に **含めない**。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| local check | `outputs/phase-13/local-check-result.md` | user approval 後の local verification 結果 |
| change summary | `outputs/phase-13/change-summary.md` | PR 前の変更要約 |
| PR info | `outputs/phase-13/pr-info.md` | PR URL / base / head 記録 |
| PR result | `outputs/phase-13/pr-creation-result.md` | PR 作成結果 |

## コミット粒度（3 単位推奨）

| # | コミット範囲 | message |
| --- | --- | --- |
| 1 | docs: 仕様書 + outputs/phase-11 + outputs/phase-12 | `docs(issue-497): add post-release-dashboard 30-day conclusion task spec and evidence` |
| 2 | spec sync: aiworkflow-requirements references / changelog / indexes（条件付き） | `docs(spec): sync aiworkflow-requirements deployment-gha.md with issue-497 30-day feedback` |
| 3 | trace: 親 351 / 起票元 unassigned task / LOGS | `docs(trace): formalize issue-351 U-1 to issue-497 and update LOGS` |

## 実行手順（user 承認後のみ）

```bash
# 事前確認
git branch --show-current  # 期待: docs/issue-497-post-release-dashboard-30day-feedback
rg -n -E "token|bearer|secret|Authorization|ya29\.|ghp_|ghs_" \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/ \
  || echo "OK: no secrets"

# 3 単位コミット（HEREDOC テンプレ / Refs #497, Refs #351 を含める）→ push → PR 作成
git push -u origin docs/issue-497-post-release-dashboard-30day-feedback
gh pr create --base dev \
  --head docs/issue-497-post-release-dashboard-30day-feedback \
  --title "docs: post-release-dashboard 30-day schedule conclusion feedback (issue-497)" \
  --body "$(cat <<'EOF'
（PR Body 構造セクションの内容を HEREDOC で貼り付け / Refs #497, Refs #351）
EOF
)"

# マージ後（reopen 禁止 / 再 close 不要）
gh issue comment 497 --body "PR <PR URL> でマージ済み。仕様書: docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/"
```

## 禁止事項

- 承認前に commit / push / PR 作成を実行しない
- `Closes #497` / `Closes #351` を使わない
- Issue #497 を reopen しない
- `--no-verify` で hook を skip しない
- 実装ファイル（`apps/api/**` / `apps/web/**` / `.github/workflows/**`）を declared files に含めない
- 実 token / database_id / 実会員 PII を commit / PR body に含めない

## 完了条件チェックリスト

- [ ] PR が base = `dev` に作成済 / title・body テンプレ一致 / `Refs #497, Refs #351` 採用
- [ ] declared files が docs-only 範囲に閉じる / 3 単位コミット粒度
- [ ] hook + CI PASS（`--no-verify` 不使用）
- [ ] PR URL を user に提示済 / Issue #497 CLOSED 維持・マージ後 comment 追加済
- [ ] branch protection 整合確認済
- [ ] 不変条件 # 1〜7 影響なし（コード変更なし / docs-only）

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |
