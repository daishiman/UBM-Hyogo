# Phase 13: コミット・PR 作成 — Issue #408 Cloudflare Audit Logs 監視

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | blocked_pending_user_approval |
| Gate | **ユーザー承認必須**（自動実行禁止） |
| ブランチ | `docs/issue-408-cf-audit-logs-monitoring-task-spec`（既作成前提） |
| 想定 PR ベース | `dev` |
| 想定 PR 数 | 1（仕様書 + local 実装 + SSOT runtime pending 同期） |

## ⚠️ 実行禁止事項（ユーザー承認前）

本タスクは **タスク仕様書策定** が目的のため、Phase 13 でも以下のアクションは **ユーザーの明示承認 ("Phase 13 を実行してよい" 等) を得るまで絶対に実行してはならない**:

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] production Token 発行 / GitHub Secret 登録 / production D1 migration apply / 7 日 baseline 実測を、未実行のまま完了扱いで記録すること

## 実行解放条件

すべて満たした後にのみユーザー承認を求める:

- [x] Phase 1-12 仕様書が root および `outputs/phase-*/` 配下に実体配置
- [x] Phase 12 strict 7 ファイル + workflow-local `phase-12.md` 配置 + `phase12-task-spec-compliance-check.md` 全 PASS
- [x] `index.md` の `[実装区分: 実装仕様書]` 明記
- [x] `unassigned-task-detection.md` に follow-up 4 件記録
- [x] SSOT に `implemented_local / runtime pending` として監視 Token / audit-log alert 導線を同期
- [ ] **Gate**: ユーザーから "Phase 13 を実行してよい" 等の承認

## コミット粒度

本 PR は **仕様書策定 + workflow / scripts / D1 migration local 実装 + SSOT runtime pending 同期** を含む。production credential を伴う runtime green 化は Phase 11/production runbook で扱う。

| # | コミット | 含むパス |
| --- | --- | --- |
| (a) | `feat(issue-408): Cloudflare Audit Logs 監視を local 実装` | `.github/workflows/cf-audit-log-monitor*.yml`, `scripts/cf-audit-log/**`, `scripts/cf.sh`, `apps/api/migrations/0014_create_cf_audit_log.sql` |
| (b) | `docs(issue-408): Cloudflare Audit Logs 監視 Phase 1-13 と SSOT を同期` | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/**`, `.claude/skills/aiworkflow-requirements/**`, `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |
| (c) | `docs(unassigned-task): U-FIX-CF-ACCT-01-DERIV-04 を consumed trace 化` | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` |

## 実行解放後の手順

```bash
# 1. ステータス確認
git status
git diff main...HEAD --name-only

# 2. (a) 仕様書一式コミット
git add docs/30-workflows/issue-408-cf-audit-logs-monitoring/

git commit -m "$(cat <<'EOF'
docs(issue-408): Cloudflare Audit Logs 監視 タスク仕様書 (Phase 1-13)

- 親 Issue #408 (CLOSED) のタスク仕様書を docs/30-workflows/issue-408-cf-audit-logs-monitoring/ 配下に策定
- 実装区分: 実装仕様書 (NON_VISUAL / taskType=implementation)
- 1 時間毎の Cloudflare Audit Logs 取得 → D1 蓄積 → HIGH/MEDIUM/LOW 判定 → GitHub Issue 自動起票
  までの fetcher / analyzer / watchdog 三層構成と D1 schema / migration / cf.sh 拡張を仕様化
- Phase 12 必須 8 成果物 (main / implementation-guide / changelog / unassigned-task-detection
  / skill-feedback / system-spec-update / compliance-check / phase-12) を実体配置
- runtime 実装（workflow / scripts / migration）は別タスク／別 PR で実施
- SSOT は `spec_created / runtime pending` として同期し、runtime 完了事実は未記録

Refs: #408
EOF
)"

# 3. (b) SSOT runtime pending 同期コミット
git add .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
  .claude/skills/aiworkflow-requirements/references/observability-monitoring.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
  .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
  docs/00-getting-started-manual/specs/15-infrastructure-runbook.md

git commit -m "$(cat <<'EOF'
docs(issue-408): audit log monitoring SSOT を runtime pending として同期

- 監視用 secret CF_AUDIT_TOKEN_PROD と Audit Logs:Read scope の分離を正本化
- observability / infrastructure runbook に Issue #408 audit-log HIGH alert 対応導線を追加
- runtime implementation / 7 日 baseline 完了は未記録のまま spec_created 境界を維持

Refs: #408
EOF
)"

# 4. (c) source unassigned-task status link 更新コミット
git add docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md

git commit -m "$(cat <<'EOF'
docs(unassigned-task): U-FIX-CF-ACCT-01-DERIV-04 status を in_progress に更新

- 仕様書策定が完了し本 PR で配置するため status を unassigned → in_progress に遷移
- task_link に docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md を双方向リンクとして追記
- consumed への遷移は実装 PR merge 時に実施 (本 PR では未実施)

Refs: #408
EOF
)"

# 5. push
git push -u origin docs/issue-408-cf-audit-logs-monitoring-task-spec

# 6. PR 作成
gh pr create --base dev --title "docs(issue-408): Cloudflare Audit Logs 監視 タスク仕様書策定" \
  --body "$(cat <<'EOF'
## Summary
- Issue #408 (CLOSED) の Cloudflare Audit Logs 1 時間毎監視 + D1 蓄積 + GitHub Issue 自動起票 仕組みについて、Phase 1-13 タスク仕様書を `docs/30-workflows/issue-408-cf-audit-logs-monitoring/` 配下に策定
- 実装区分: **実装仕様書** (CONST_004) — 本 PR は仕様書と local 実装を含み、production runtime green 化は外部 credential gate
- source unassigned-task `U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` の status を `in_progress` に更新、task_link を双方向化
- SSOT は `implemented_local / runtime pending` として同期済み。production Token 発行・Secret 登録・D1 apply・7日 baseline・runtime evidence は未完了

## 含まないもの (production runtime gate)
- `.github/workflows/cf-audit-log-monitor.yml` / `cf-audit-log-monitor-watchdog.yml` 実装
- `scripts/cf-audit-log/{fetch,analyze,baseline}.ts` 実装
- `apps/api/migrations/0014_create_cf_audit_log.sql`
- `scripts/cf.sh` の `audit-log` サブコマンド追加
- SSOT への runtime completed 記録
  - 未実装事実の完了扱いによる drift を避けるため、今回の SSOT は runtime pending 導線に限定

## Test plan
- [ ] `ls docs/30-workflows/issue-408-cf-audit-logs-monitoring/phase-*.md | wc -l` == 13
- [ ] `ls docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-12/ | wc -l` == 8
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` 全 PASS
- [ ] `index.md` に `[実装区分: 実装仕様書]` 文字列存在
- [ ] source unassigned-task の status が `in_progress`、task_link 双方向
- [ ] SSOT grep: `CF_AUDIT_TOKEN_PROD` / `issue-408-cf-audit-logs-monitoring` が正本仕様と indexes に存在

Refs: #408
EOF
)"
```

## DoD

- [ ] PR が `dev` を base に作成される
- [ ] CI green（`pnpm typecheck` / `pnpm lint` / `verify-indexes-up-to-date` / `coverage-gate` 等）
- [ ] solo policy により手動 review 不要（`required_pull_request_reviews=null`）。会話解決必須化と線形履歴は満たすこと
- [ ] PR merge 後、source unassigned-task の status を `consumed` に更新する手順は **実装 PR の DoD に引き継ぐ**（仕様書 PR merge 段階では `in_progress` のまま）

## Merge 後の引き継ぎ手順

1. 実装タスクを別ブランチ `feat/issue-408-cf-audit-log-monitor` で起票
2. 実装 PR で runtime implementation completed / 7 日 baseline evidence を SSOT に昇格 + `pnpm indexes:rebuild`
3. 実装 PR merge 時に source unassigned-task の status を `in_progress` → `consumed` に遷移
4. 7 日 baseline 学習完了後、`unassigned-task-detection.md` に列挙した FU-01〜FU-04 の起票要否を再評価

## Rollback

仕様書 PR は破壊的変更を含まない（実装ファイルなし / SSOT 編集なし）。万一 merge 後に方針変更が必要な場合は、別 PR で `index.md` の `状態` を `superseded` に変更し、後継 spec へのリンクを追記することで対応する。`git revert` は最終手段とする。
