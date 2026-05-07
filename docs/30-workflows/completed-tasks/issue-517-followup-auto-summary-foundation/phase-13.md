# Phase 13: PR 作成 / 承認チェックリスト（G1-G4 multi-stage approval gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / G1-G4 多段承認ゲート |
| 作成日 | 2026-05-07 |
| 前 Phase | 12（ドキュメント更新） |
| 次 Phase | なし（タスク完結） |
| 状態 | **pending_user_approval** |
| 実装区分 | **実装仕様書（CONST_004）** |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| docsOnly | false |
| user_approval_required | **true（G1〜G4 各段で必須）** |
| GitHub Issue | #517（CLOSED 据え置き / reopen 禁止 / `Closes #517` 不使用） |
| 作業ブランチ | `docs/issue-517-followup-auto-summary-task-spec`（spec only commit） / 実装段階で必要なら `feat/issue-517-followup-auto-summary` に move |
| target ブランチ | `main`（solo dev / docs+infra 系・project policy 準拠 / dev は経由しない） |
| 変更対象ファイル | 仕様書配下 + workflow YAML + shell scripts + skill references + changelog + README |

---

## 目的

実 Git 操作（commit / push / PR 作成 / merge / post-merge workflow_dispatch）の **G1〜G4 多段承認ゲート**。各段で user 明示承認が無い限り次段へ進まない。

---

## 前提条件

- Phase 11 で 9 evidence 配置済み（shellcheck / actionlint / test / dry-run / redaction / silent-skip / duplicate-skip / workflow_dispatch / Slack test post）
- Phase 12 で 6 必須成果物 + skill 同期 + LOGS / README / artifacts.json 更新済み
- aiworkflow-requirements indexes rebuild 済み（CI `verify-indexes-up-to-date` PASS 想定）
- `redaction-grep-audit.log` が `CLEAN` 表記
- workflow path existence gate 4 ファイル全 PASS

---

## branch 戦略

```
現行作業ブランチ:
  docs/issue-517-followup-auto-summary-task-spec
  ├─ 仕様書 + 6 必須成果物 + skill references + changelog + README + artifacts.json + LOGS
  └─ workflow YAML + shell scripts（実装段階で同 branch に追加）

target: main（solo dev / docs+infra 系・project policy / dev は経由しない）

> 実装フェーズで feature ブランチ別運用が望ましい場合は `feat/issue-517-followup-auto-summary` に
> rename / move する（branch protection は solo dev 設定のため move 後も merge 可能）。
```

---

## PR 草案

### PR Title（70 文字以内 / 実測 71 文字 → 短縮版を採用）

```text
feat(workflows): add post-release 30-day auto-summary foundation (Refs #517, #497, #351)
```

> 70 文字超過時の短縮版: `feat(workflows): add post-release 30-day auto-summary foundation`（Refs は body に記載）

### PR Body 構造（HEREDOC で渡す / `.claude/commands/ai/diff-to-pr.md` 規約準拠）

```markdown
## Summary

- 親 issue-497 の 30 日後 conclusion 集計を自動化する GHA workflow + shell script + Slack Webhook + 冪等 draft PR の基盤を導入。
- daily cron（UTC 01:00）で起動し、30 日 gate 不成立なら silent skip / 成立時は集計 markdown を draft PR 起票し Slack channel `w1618436027-ek2505248` に 5 行サマリ POST。
- redaction（`token` / `bearer` / `secret` / `Authorization`）と冪等規約（同月内既存 PR 検出時 silent skip）を実装。dry-run（local `--dry-run` / workflow_dispatch `dry_run: true`）で副作用なし検証可能。

## 変更対象ファイル

- `.github/workflows/post-release-30day-auto-summary.yml`（新規）
- `scripts/post-release-dashboard/30day-summary.sh`（新規）
- `scripts/post-release-dashboard/lib/aggregate.sh`（新規）
- `scripts/post-release-dashboard/__tests__/30day-summary.test.sh`（新規）
- `scripts/post-release-dashboard/README.md`（編集 / 新規 fallback）
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（編集 / 章追加）
- `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md`（新規）
- `.claude/skills/aiworkflow-requirements/SKILL.md`（編集 / changelog 表）
- `.claude/skills/aiworkflow-requirements/indexes/**`（rebuild 結果）
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` / `.claude/skills/task-specification-creator/LOGS/_legacy.md`（編集）
- `docs/30-workflows/issue-517-followup-auto-summary-foundation/**`（仕様書 + outputs）

## 受入条件マトリクス

| AC | 状態 | evidence |
| --- | --- | --- |
| AC-1 silent skip | PASS | `outputs/phase-11/evidence/silent-skip-exit0.log` |
| AC-2 集計 PR body | PASS | `outputs/phase-11/evidence/dry-run-stdout.log` |
| AC-3 Slack 通知 | PASS | `outputs/phase-11/evidence/slack-test-post.log` |
| AC-4 冪等 PR | PASS | `outputs/phase-11/evidence/duplicate-pr-skip.log` |
| AC-5 redaction | PASS | `outputs/phase-11/evidence/redaction-grep-audit.log` |
| AC-6 retry/alert 検討節 | PASS | `outputs/phase-11/evidence/dry-run-stdout.log`（fixture: failure 比率 >= 10%） |
| AC-7 workflow_dispatch | PASS | `outputs/phase-11/evidence/workflow-dispatch-dry-run.log` |
| AC-8 local dry-run | PASS | `outputs/phase-11/evidence/dry-run-stdout.log` |
| AC-9 Phase 12 必須成果物 | PASS | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| AC-10 4 条件評価 | PASS | 各 phase 末尾 4 条件評価表 |

## 検証エビデンス link

- Phase 11: `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/`
- Phase 12: `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-12/`

## Test plan

- [x] `shellcheck scripts/post-release-dashboard/*.sh scripts/post-release-dashboard/lib/*.sh` warning 0 件
- [ ] `actionlint .github/workflows/post-release-30day-auto-summary.yml` warning 0 件（local tool unavailable。`outputs/phase-11/evidence/actionlint.log` に fallback 境界を記録）
- [x] `bash scripts/post-release-dashboard/__tests__/run-all.sh` で TC-01〜TC-07 + TC-05b 全 PASS
- [x] `bash scripts/post-release-dashboard/30day-summary.sh --dry-run` で stdout 集計 / 副作用なし
- [x] redaction grep が `CLEAN` 表記
- [x] fixture（30 日未満）で silent skip exit 0
- [x] fixture（同月内既存 PR）で duplicate skip exit 0
- [x] `gh workflow run -f dry_run=true` で workflow_dispatch run success
- [x] Slack channel `w1618436027-ek2505248` test post HTTP 200 + 受信時刻記録
- [ ] post-merge: GitHub Secrets `SLACK_WEBHOOK_URL` 登録確認（G2 で実施）
- [ ] post-merge: 本番 environment での `workflow_dispatch -f dry_run=true` 手動実行（G4 で実施）
- [ ] post-merge: scheduled cron 初発火（時間依存 / `CONTRACT_READY_RUNTIME_PENDING` → `PASS` 昇格時に確認）

## リスク・残留リスク

- runtime 30 日 gate の本番初発火は親 issue-497 main merge 後 30 日経過時点で発生（時間依存）。本 PR では `CONTRACT_READY_RUNTIME_PENDING` 状態で merge され、scheduled runtime PASS は post-merge 後別途確認。
- Slack Webhook URL 失効時は手動再生成 + GitHub Secrets 更新が必要（automated rotation 未実装）。
- failure 比率 >= 10% 検出時は PR body に検討節を追記するのみで retry / alert は別 issue（CONST_007 単一責務）。

## 関連

- Refs #517（CLOSED 維持）
- Refs #497（親タスク）
- Refs #351（祖先タスク）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> **重要**: `Closes #517` / `Closes #497` / `Closes #351` は **使用禁止**。`Refs` のみ。Issue #517 は既に CLOSED のため reopen も禁止。

---

## G1〜G4 multi-stage approval gate

| Gate | 対象操作 | user 明示承認内容 |
| --- | --- | --- |
| **G1** | spec / docs / 実装 commit-push approval | 「Phase 13 G1 を実行してよい（commit + push）」 |
| **G2** | Slack channel bootstrap / GitHub Secret `SLACK_WEBHOOK_URL` 確認 approval（merge 前） | 「Slack channel / Incoming Webhook / GitHub Secret を確認し、必要なら登録・ローテーションしてよい」 |
| **G3** | PR merge approval（reviewer self-review） | 「PR をマージしてよい」 |
| **G4** | post-merge `workflow_dispatch -f dry_run=true` approval | 「本番 environment で workflow_dispatch dry-run を実行してよい」 |

> 各 Gate で承認が無い限り次段へ進まない。1〜4 の順序を守る。

---

## 承認ゲート詳細【必須事前確認】

### G1: spec / docs / 実装 commit-push

| # | 項目 | 条件 |
| --- | --- | --- |
| 1 | Phase 11 / 12 完了 | 9 evidence + 6 必須成果物 + skill 同期 |
| 2 | workflow_state | `completed_pending_pr` |
| 3 | Issue #517 | CLOSED 維持 |
| 4 | 機密情報非混入 | `redaction-grep-audit.log` `CLEAN` |
| 5 | aiworkflow-requirements 同期 | references + changelog + SKILL.md + indexes rebuild |
| 6 | hook | pre-commit / pre-push PASS（`--no-verify` 不使用） |
| 7 | branch protection | solo dev 整合（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true`） |
| 8 | LOGS | 2 skill 末尾追記済（canonical absolute path） |
| 9 | README | dry-run / Secrets / Slack channel 記載 |
| 10 | artifacts.json | `phases[10].runtime_state = "CONTRACT_READY_RUNTIME_PENDING"` 併記 |
| 11 | workflow path existence | 4 ファイル全 PASS |
| 12 | indexes drift | `verify-indexes-up-to-date` ローカル sim PASS |
| 13 | **user 明示承認** | 「G1 を実行してよい」（**待機**） |

### G2: Slack channel bootstrap / GitHub Secrets 確認（merge 前）

Phase 11 preflight で登録済みなら確認だけを行う。未登録または失効時のみ、user approval 後に 1Password 正本から GitHub Secret へ派生登録 / ローテーションする。

```bash
# channel / webhook URL 実値は出力しない
gh secret list --repo daishiman/UBM-Hyogo | grep SLACK_WEBHOOK_URL

# 未登録・失効時のみ user approval 後に実行
op run --env-file=.env -- bash -c '
  gh secret set SLACK_WEBHOOK_URL --body "$SLACK_WEBHOOK_URL_VALUE" --repo daishiman/UBM-Hyogo
'
gh secret list --repo daishiman/UBM-Hyogo | grep SLACK_WEBHOOK_URL
```

> 平文 webhook URL を Claude Code に貼らない。1Password 参照経由のみで GitHub Secrets に登録 / ローテーションする。Slack channel `w1618436027-ek2505248` の test post は Phase 11 evidence で確認済みにする。

### G3: PR merge

- CI 全 green（typecheck / lint / build / verify-indexes-up-to-date / actionlint / shellcheck）
- reviewer self-review（solo dev / `required_pull_request_reviews=null`）
- conversation resolution: 全件解決
- linear history 維持

### G4: post-merge workflow_dispatch dry-run

```bash
gh workflow run post-release-30day-auto-summary.yml -f dry_run=true --repo daishiman/UBM-Hyogo
gh run list --workflow=post-release-30day-auto-summary.yml --limit=1 --repo daishiman/UBM-Hyogo
```

- run conclusion = `success`
- silent skip log（30 日 gate 未達なので current state では silent skip 期待）
- Slack 通知が届かないこと（dry_run=true のため）

---

## post-merge アクション

| # | アクション | 実行タイミング | 検証 |
| --- | --- | --- | --- |
| 1 | Slack channel bootstrap / GitHub Secrets `SLACK_WEBHOOK_URL` 確認 | merge 前（G2） | channel test post evidence + `gh secret list` |
| 2 | 本番 `workflow_dispatch -f dry_run=true` 手動実行 | merge 直後（G4） | run success / silent skip 確認 |
| 3 | `gh issue comment 517` で PR / 仕様書リンク追加 | merge 直後 | comment 投稿確認 |
| 4 | 本番 silent skip 確認（scheduled） | 翌日以降の cron run | `gh run list` で daily run が exit 0 |
| 5 | scheduled runtime PASS 昇格 | 親 issue-497 main merge 後 30 日経過時点 | 初回 draft PR 起票 + Slack 通知到達 / `CONTRACT_READY_RUNTIME_PENDING` → `PASS` |
| 6 | failure 比率初観測 | runtime PASS 後初発火時 | `< 10%` / `>= 10%` で別 issue 起票要否判定 |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 自動化基盤を main にマージし起動可能性を確定 |
| 実現性 | PASS | implementation + docs / branch protection（solo dev）整合 / G1-G4 で安全 |
| 整合性 | PASS | AC-1〜AC-10 全 evidence 紐付け / `Refs #517, #497, #351` のみ |
| 運用性 | PASS | hook 通過 / `--no-verify` 不使用 / G1-G4 多段承認 / `CONTRACT_READY_RUNTIME_PENDING` で運用責任境界明示 |

---

## 受入条件

- PR が base = `main` に作成済 / title・body 本仕様書テンプレと一致 / `Refs #517, #497, #351` のみ
- declared files に新規 workflow + shell scripts + skill references + changelog + README + 仕様書を含む
- CI 全 green（typecheck / lint / build / verify-indexes-up-to-date / actionlint / shellcheck）
- merge 後 `gh issue comment 517` で PR / 仕様書リンク追加（reopen 禁止 / 再 close もしない）
- post-merge G4 dry-run run success

---

## declared files

| 種別 | パス |
| --- | --- |
| workflow | `.github/workflows/post-release-30day-auto-summary.yml` |
| script | `scripts/post-release-dashboard/30day-summary.sh` |
| script | `scripts/post-release-dashboard/lib/aggregate.sh` |
| test | `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` |
| README | `scripts/post-release-dashboard/README.md` |
| skill references | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` |
| skill changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` |
| skill SKILL.md | `.claude/skills/aiworkflow-requirements/SKILL.md` |
| skill indexes | `.claude/skills/aiworkflow-requirements/indexes/**` |
| LOGS | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` / `.claude/skills/task-specification-creator/LOGS/_legacy.md` |
| 仕様書 + outputs | `docs/30-workflows/issue-517-followup-auto-summary-foundation/**` |

---

## コミット粒度（4 単位推奨）

| # | コミット範囲 | message |
| --- | --- | --- |
| 1 | spec: phase-04〜13 仕様書 + outputs/phase-11 / phase-12 evidence | `docs(issue-517): add follow-up auto-summary foundation task spec and evidence` |
| 2 | impl: workflow YAML + shell scripts + tests + README | `feat(workflows): add post-release-30day-auto-summary workflow and scripts` |
| 3 | spec sync: aiworkflow-requirements references + changelog + SKILL.md + indexes rebuild | `docs(spec): sync aiworkflow-requirements deployment-gha.md with issue-517 30-day auto-summary` |
| 4 | meta: artifacts.json + LOGS（2 skill） | `docs(meta): update artifacts.json and skill LOGS for issue-517 phase 12 completion` |

---

## 実行手順（user 承認後のみ）

```bash
# === G1 開始（user 承認後） ===
git branch --show-current  # 期待: docs/issue-517-followup-auto-summary-task-spec

# 機微情報事前 grep
grep -rEn 'token|bearer|secret|Authorization' \
  docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/ \
  | grep -v 'CLEAN' \
  | grep -v 'redaction' \
  || echo "OK: no secrets"

# 4 単位 commit
git add docs/30-workflows/issue-517-followup-auto-summary-foundation/
git commit -m "$(cat <<'EOF'
docs(issue-517): add follow-up auto-summary foundation task spec and evidence

Refs #517, Refs #497, Refs #351

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git add .github/workflows/post-release-30day-auto-summary.yml \
        scripts/post-release-dashboard/30day-summary.sh \
        scripts/post-release-dashboard/lib/aggregate.sh \
        scripts/post-release-dashboard/__tests__/30day-summary.test.sh \
        scripts/post-release-dashboard/README.md
git commit -m "$(cat <<'EOF'
feat(workflows): add post-release-30day-auto-summary workflow and scripts

Refs #517, Refs #497, Refs #351

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git add .claude/skills/aiworkflow-requirements/
git commit -m "$(cat <<'EOF'
docs(spec): sync aiworkflow-requirements deployment-gha.md with issue-517 30-day auto-summary

Refs #517, Refs #497, Refs #351

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git add .claude/skills/task-specification-creator/LOGS/_legacy.md \
        docs/30-workflows/issue-517-followup-auto-summary-foundation/artifacts.json
git commit -m "$(cat <<'EOF'
docs(meta): update artifacts.json and skill LOGS for issue-517 phase 12 completion

Refs #517, Refs #497, Refs #351

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin docs/issue-517-followup-auto-summary-task-spec

# PR 作成
gh pr create --base main \
  --head docs/issue-517-followup-auto-summary-task-spec \
  --title "feat(workflows): add post-release 30-day auto-summary foundation (Refs #517, #497, #351)" \
  --body "$(cat <<'EOF'
（PR Body 構造セクションの内容を HEREDOC で貼り付け / Refs #517, #497, #351）
EOF
)"

# === G2: GitHub Secrets 登録（user 承認後 / merge 前）===
op run --env-file=.env -- bash -c '
  gh secret set SLACK_WEBHOOK_URL --body "$SLACK_WEBHOOK_URL_VALUE" --repo daishiman/UBM-Hyogo
'
gh secret list --repo daishiman/UBM-Hyogo | grep SLACK_WEBHOOK_URL

# === G3: PR merge（user 承認後）===
gh pr merge <PR番号> --squash --delete-branch

# === G4: post-merge workflow_dispatch dry-run（user 承認後）===
gh workflow run post-release-30day-auto-summary.yml -f dry_run=true --repo daishiman/UBM-Hyogo
sleep 10
gh run list --workflow=post-release-30day-auto-summary.yml --limit=1 --repo daishiman/UBM-Hyogo

# Issue #517 へ comment（reopen 禁止 / 再 close 不要）
gh issue comment 517 --body "PR <PR URL> でマージ済み。仕様書: docs/30-workflows/issue-517-followup-auto-summary-foundation/"
```

---

## 禁止事項

- G1〜G4 の各段で承認前に commit / push / PR 作成 / merge / workflow_dispatch を実行しない
- `Closes #517` / `Closes #497` / `Closes #351` を使わない
- Issue #517 を reopen しない / 再 close もしない
- `--no-verify` で hook を skip しない
- 平文 Slack Webhook URL を Claude Code に貼らない / commit / PR body に含めない
- 実 token / database_id / 実会員 PII を commit / PR body / evidence に含めない
- `outputs/phase-11/screenshots/` を作成しない（NON_VISUAL 整合）

---

## pre-merge チェックリスト（13 項目）

- [ ] PR base = `main` / title・body テンプレ一致 / `Refs #517, #497, #351` のみ採用
- [ ] declared files が 4 単位コミット粒度で構成
- [ ] CI green（typecheck / lint / build / verify-indexes-up-to-date / actionlint / shellcheck）
- [ ] hook PASS（`--no-verify` 不使用）
- [ ] branch protection 整合（solo dev）
- [ ] redaction `CLEAN` 表記
- [ ] aiworkflow-requirements indexes drift 0
- [ ] workflow path existence 4 ファイル全 PASS
- [ ] LOGS 2 skill 末尾追記済
- [ ] artifacts.json `completed_pending_pr` + `CONTRACT_READY_RUNTIME_PENDING`
- [ ] G1 user 承認取得済
- [ ] GitHub Secrets `SLACK_WEBHOOK_URL` 登録（G2 完了）
- [ ] 不変条件 #1〜#7 影響なし

---

## 完了条件チェックリスト

- [ ] PR が base = `main` に作成済 / title・body テンプレ一致 / `Refs #517, #497, #351` 採用
- [ ] declared files 4 単位コミット粒度
- [ ] CI 全 green
- [ ] PR URL を user に提示済 / Issue #517 CLOSED 維持・マージ後 comment 追加済
- [ ] G2: `SLACK_WEBHOOK_URL` 登録確認済
- [ ] G3: merge 完了
- [ ] G4: post-merge `workflow_dispatch -f dry_run=true` run success
- [ ] runtime 状態 `CONTRACT_READY_RUNTIME_PENDING` を artifacts.json に記録
- [ ] 不変条件 #1〜#7 影響なし

---

## 不変条件への影響

| # | 不変条件 | 影響 |
| --- | --- | --- |
| 1〜7 | 全項目 | **影響なし**（GHA + Shell + Slack Webhook のみ / D1 アクセスなし / Form schema 非対象） |

---

## 実行タスク

- 本 Phase の本文に定義済みの G1〜G4 多段承認ゲートに沿って判断・検証・実行する。
- G1〜G4 の各段で user 明示承認が無い限り次段へ進まない。
- runtime 30 日 gate 初発火確認は post-merge アクション #5 として時間依存で実行する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/index.md` | AC / scope 正本 |
| 必須 | `.claude/commands/ai/diff-to-pr.md` | PR body 規約 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 13 G1-G4 規約 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill 同期準拠 |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-13.md` | 親タスク Phase 13 対比 |
