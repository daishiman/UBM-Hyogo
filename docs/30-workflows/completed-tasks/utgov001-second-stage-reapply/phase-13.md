# Phase 13: PR 作成 / 後追い再 PUT 実行ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 / 後追い再 PUT 実行ゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了） |
| 状態 | spec_created |
| タスク分類 | implementation / governance / NON_VISUAL（approval gate + 実 PUT 実行 + PR 作成） |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true（最重要）** |
| Issue | #202 (CLOSED — 再オープンしない / `Refs #202` で参照のみ) |
| タスク状態 | spec_created（実 PUT は本 Phase の user 承認後にのみ実行） |

## 重要な前置き（実行可否の明示 / 最優先）

> **本タスクの Phase 13 は「ユーザー承認ゲート」と「branch protection 後追い再 PUT の実 実行ゲート」と「PR 作成ゲート」の三役を兼ねる。**
> 仕様書段階（本ファイル作成時点）では実 PUT・push・PR 作成・commit を **一切行わない**。
> Phase 13 仕様書自体は手順を記述するが、実行は **user の明示承認後** に限る（AC-13）。
>
> Claude Code は本 Phase の以下を **絶対に自走実行しない**:
> 1. `gh api -X PUT .../branches/{dev,main}/protection`（実 PUT）
> 2. `git commit` / `git push` / `gh pr create`
> 3. `gh issue comment 202`（仕様書化完了の Phase 12 コメントを除く / 実 PUT 完了の二段階目コメントは Phase 13 ゲート後）
>
> user が「UT-GOV-001 second-stage の実 PUT を実行してよい」と明示指示した場合に限り、ステップ 5 以降を順に実行する。
> 曖昧な合意では実行しない。

## 目的

Phase 1〜12 の成果物（仕様書 13 Phase + index + outputs + artifacts.json + skill 同期 + Phase 12 必須 7 成果物）に基づき、**ユーザー明示承認** を経て:

1. 適用前 GET（dev / main）を取得・保全し、
2. dev / main 独立 PUT で `required_status_checks.contexts` を UT-GOV-004 由来の実在 context に書き換え、
3. 適用後 GET を取得・保全して期待 contexts と集合一致を検証し、
4. drift 最終確認を行い、
5. PR を作成して CI gate / branch protection 動作確認のうえ user 操作で merge する

までを単一 Phase で完結させる。Issue #202 は CLOSED のまま扱い、PR body では `Refs #202` として参照する（`Closes #202` は使用しない）。

## 本 Phase でトレースする AC

- AC-3（適用前 GET の dev / main 個別取得・保全）
- AC-5（dev / main 独立 PUT 成功 + 応答 JSON 保存）
- AC-6（適用後 GET の contexts が期待 contexts と完全一致）
- AC-13（ユーザー承認なしに実 PUT・push・PR 作成を行わない原則）
- 関連: AC-7（drift 最終確認）/ AC-8（rollback 経路）/ AC-10（admin block 回避）

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜12 完了確認 | 全 Phase の成果物 + artifacts.json `spec_created` | 要確認 |
| 4 条件 PASS | 価値性 / 実現性 / 整合性 / 運用性（Phase 1 / 3 / 10）| 要確認 |
| 30 種思考法 MAJOR 0 件 | Phase 3 + Phase 10 補完 | 要確認 |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 manual evidence | NON_VISUAL の `manual-verification-log.md` 採取済み | 要確認 |
| Phase 12 必須 7 成果物 | main / implementation-guide / system-spec-update-summary / changelog / unassigned-task-detection / skill-feedback / compliance-check | 要確認 |
| Phase 12 compliance check | 全 PASS | 要確認 |
| Phase 12 same-wave sync | workflow LOG / SKILL ×2 / resource-map / active guide | 要確認 |
| Phase 12 二重 ledger 同期 | root + outputs の artifacts.json（`taskType=implementation` / `visualEvidence=NON_VISUAL`） | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| 上流タスク完了 | UT-GOV-001 Phase 13（初回適用）/ UT-GOV-004（実在 context 確定）| 要確認 |
| UT-GOV-004 成果物の存在 | `required-status-checks-contexts.{dev,main}.json` が `outputs/phase-02/contexts-source.json` に取り込まれている | 要確認 |
| 期待 contexts の確定 | `outputs/phase-02/expected-contexts-{dev,main}.json` が dev / main 別配列で確定 | 要確認 |
| rollback payload の存在 | UT-GOV-001 完了タスクの `outputs/phase-05/rollback-payload-{dev,main}.json` が即時参照可能 | 要確認 |
| admin token 取得経路 | `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope）が当該 shell で利用可 | 要確認 |
| Phase 11 事前 open PR 確認 | 実 PUT 直前に dev / main を target とする open PR の check-run 進行状況を再確認 | 要確認 |
| 機密情報の非混入 | admin token 値 / op:// 解決値が docs / 仕様書に無い | 要確認 |
| Issue #202 ステータス | CLOSED のまま / 再オープンしない | 要確認 |
| **user 明示承認（最重要）** | 「UT-GOV-001 second-stage の実 PUT と PR 作成を実行してよい」旨の明示指示 | **承認待ち** |

> **本ゲートが PASS するまで `gh api -X PUT` / `git commit` / `git push` / `gh pr create` を一切実行しない**（厳守）。
> approval は明示的指示で取得する。曖昧な合意では実行しない。

## 実行タスク（仕様書として手順を記述するのみ。実行は user 承認後）

1. 承認ゲートを通過する（user に change-summary + 実 PUT plan を提示し、明示承認を取得する）。
2. ローカル検証（lint / type / build / spec validate）を実行・記録する（ドキュメントのみのため `outputs/phase-13/local-check-result.md` に「該当なし」+ spec validate のみ記述）。
3. 機密情報 grep + implementation 境界 grep を実行する。
4. 適用前 GET 取得（dev / main）→ `outputs/phase-13/branch-protection-current-{dev,main}.json` 保全。
5. dev PUT 実行 → 検証 GET → `outputs/phase-13/branch-protection-applied-dev.json` 保全 + 集合一致確認。
6. main PUT 実行 → 検証 GET → `outputs/phase-13/branch-protection-applied-main.json` 保全 + 集合一致確認。
7. drift 最終確認（CLAUDE.md / deployment-branch-strategy.md vs 適用後 GET 6 値）。
8. change-summary（PR description 草案）を作成。
9. **user 承認後**、ブランチ作成 → コミット粒度ごとに commit → push → PR 作成を実行。
10. CI 確認と branch protection 動作確認（実在 context が走り、merge block が機能するかを実 PR で確認）。
11. Issue #202 への二段階目クローズアウトコメント追記（実 PUT 完了 + 適用後 GET 集合一致 + PR URL）。
12. PR merge 後のクローズアウト動線記録（completed-tasks への移動 / artifacts.json `completed` 化 / 関連 unassigned-task の起票）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-05/apply-runbook-second-stage.md | 後追い再 PUT 実 実行 runbook（本 Phase はこの runbook を逐次実行する） |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-02/expected-contexts-{dev,main}.json | 期待 contexts |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-payload-{dev,main}.json | PUT payload（Phase 13 の適用前 GET から生成する実行証跡） |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-09/drift-check.md | drift 検査の最終確認根拠 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | PR タイトル / 説明根拠 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目 rollback payload の location |
| 必須 | CLAUDE.md | ブランチ戦略 / Secret hygiene / scripts/cf.sh ルール |
| 必須 | docs/00-getting-started-manual/deployment-branch-strategy.md（または同等） | drift 検査の正本 |

## 実行手順（user 承認後にのみ実行）

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 1〜12 完了 / 4 条件 PASS / MAJOR 0 件 / Phase 10 GO / Phase 12 全 PASS を確認。
2. `validate-phase-output.js` / `verify-all-specs.js` が exit 0 であることを再確認。
3. 上流（UT-GOV-001 Phase 13 完了 / UT-GOV-004 完了）を再確認。
4. change-summary + 実 PUT plan（dev / main の期待 contexts 配列 / rollback payload location / admin block 回避策）を user に提示し、**明示承認** を待つ。
5. 承認取得後にステップ 2 へ進む。否承認 / 保留時はここで close-out（`spec_created` を維持）。

> **Claude Code は user 明示承認前にステップ 4 以降を実行しない**。
> ステップ 2 / 3 (read-only) は user 承認後に PR 作成ワークフロー全体の一部として実行する。

### ステップ 2: ローカル検証（`outputs/phase-13/local-check-result.md`）

本タスクは branch protection の REST API 操作 + 仕様書追加のみで、`apps/` / `packages/` 配下のコード差分は無い。lint / type / build は **該当なし**（ドキュメントのみ）として `local-check-result.md` に記述する。spec validate のみ実行する。

```bash
# 仕様書 ledger / spec validate（必須）
node scripts/validate-phase-output.js --task utgov001-second-stage-reapply
node scripts/verify-all-specs.js

# lint / type / build は本タスクで該当なし（ドキュメントのみ）
# ただし pre-commit hook 実行のため pnpm install が走った直後の状態を維持する
mise exec -- pnpm install --frozen-lockfile
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| validate-phase-output.js | exit 0 | outputs/phase-13/local-check-result.md §spec-validate |
| verify-all-specs.js | exit 0 | 同上 |
| lint / typecheck / build | 該当なし（ドキュメントのみ） | 同上に「N/A: docs and REST API only」と明記 |
| `git status` で意図せぬ変更が無い | clean | 同上 |
| pnpm install --frozen-lockfile | exit 0 | 同上 |

### ステップ 3: 機密情報 grep + implementation 境界 grep（必須）

```bash
# 機密情報の混入チェック（admin token / op:// 解決値）
git diff --cached | grep -nE "ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}" || echo "OK: secret leak none"

# 1Password vault 解決済み実値（op:// 参照は OK だが解決済み実値は NG）
git diff --cached | grep -nE "GITHUB_ADMIN_TOKEN=[A-Za-z0-9]{16,}" || echo "OK: env leak none"

# implementation 境界の確認: apps/ / packages/ / migrations/ / wrangler.toml の混入チェック
# （本タスクは branch protection のみで apps 差分なし想定）
git diff --cached --name-only | grep -E "^(apps/|packages/|migrations/|wrangler\.toml)" && echo "NG: code/migration/wrangler unexpectedly mixed" || echo "OK: implementation boundary intact"
```

- 期待: 機密情報 grep 0 件 / implementation 境界 grep 0 件。
- 検出時: 即時停止 / Phase 12 secret hygiene / 境界へ差し戻し。

### ステップ 4: 適用前 GET（dev / main）

```bash
# admin scope 確認
gh auth status

# 適用前 GET（dev）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-current-dev.json

# 適用前 GET（main）
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-current-main.json

# 内容確認
jq '.required_status_checks' outputs/phase-13/branch-protection-current-dev.json
jq '.required_status_checks' outputs/phase-13/branch-protection-current-main.json
```

- 期待: 両ファイルとも HTTP 200 応答 / `required_status_checks.contexts` が `[]`（または UT-GOV-004 同期前 contexts）であることを確認。
- 失敗時: 403 → admin scope token を再取得 / 404 → branch 存在確認 / その他 → 即時停止。

### ステップ 5: dev PUT → 検証 GET

```bash
# dev PUT
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-payload-dev.json

# 直後に検証 GET
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-dev.json

# 集合一致確認
diff <(jq -S '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-applied-dev.json) \
     <(jq -S '. | sort' outputs/phase-02/expected-contexts-dev.json)
```

- 期待: PUT 200 OK / 検証 GET の `required_status_checks.contexts` と `expected-contexts-dev.json` が集合一致（順序不問）。
- 失敗時:
  - 422（schema 不正 / typo context）→ UT-GOV-001 rollback payload で即時 revert / UT-GOV-004 成果物再点検タスクを起票。
  - admin block（実行直後 open PR が check 未走）→ rollback payload で即時 revert / Phase 11 事前確認再実施。

### ステップ 6: main PUT → 検証 GET

```bash
# main PUT（dev 検証完了後にのみ実行 / 同時 PUT 禁止）
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-payload-main.json

# 検証 GET
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-main.json

# 集合一致確認
diff <(jq -S '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-applied-main.json) \
     <(jq -S '. | sort' outputs/phase-02/expected-contexts-main.json)
```

- 期待: 同上。dev / main の片側失敗時は他方を維持し、失敗側のみ rollback。

### ステップ 7: drift 最終確認

| 確認項目 | 適用後 GET 期待値 | CLAUDE.md / deployment-branch-strategy.md |
| --- | --- | --- |
| `required_pull_request_reviews` | `null` | `null`（solo 運用） |
| `enforce_admins` | `true` | `true` |
| `allow_force_pushes` | `false` | `false` |
| `allow_deletions` | `false` | `false` |
| `required_linear_history` | `true` | `true` |
| `required_conversation_resolution` | `true` | `true` |
| `required_status_checks.contexts` | UT-GOV-004 由来の実在 context | references 反映は別タスク（AC-14） |

- 期待: 6 値すべて一致。drift 検出時は `outputs/phase-09/drift-check.md` を更新し、`task-utgov001-drift-fix-001`（Phase 12 unassigned-task-detection #2）を起票。

### ステップ 8: change-summary（PR description 草案）

`outputs/phase-13/change-summary.md` に記述。下記 PR テンプレと同等の文面を保存。

### ステップ 9: コミット粒度・branch / commit / push（user 承認後のみ）

コミット粒度は以下の単位で分離する。

| # | コミット | 含むファイル |
| --- | --- | --- |
| 1 | `docs(workflows): UT-GOV-001 second-stage reapply phase 1-13 specifications` | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/ 配下（phase-*.md / index.md / artifacts.json） |
| 2 | `docs(workflows): UT-GOV-001 second-stage reapply outputs (design / runbook / drift)` | outputs/phase-01..phase-12 配下 |
| 3 | `chore(governance): UT-GOV-001 second-stage applied protections (dev/main GET evidence)` | outputs/phase-13/branch-protection-current-{dev,main}.json + applied-{dev,main}.json + local-check-result.md |
| 4 | `docs(skills): UT-GOV-001 second-stage same-wave sync (SKILL x2 / resource-map / active guide)` | .claude/skills/aiworkflow-requirements/SKILL.md / indexes/resource-map.md / references/task-workflow-active.md / .claude/skills/task-specification-creator/SKILL.md |
| 5 | `docs(workflows): UT-GOV-001 second-stage LOGS.md completion row` | docs/30-workflows/LOGS.md |

```bash
git status
git branch --show-current  # feat/utgov001-second-stage-reapply 想定

# コミット例（コミット 1）
git add docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-*.md \
        docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md \
        docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/artifacts.json
git commit -m "$(cat <<'EOF'
docs(workflows): UT-GOV-001 second-stage reapply phase 1-13 specifications

UT-GOV-001 で採用した contexts=[] 暫定 fallback を、UT-GOV-004 完了後に
dev / main 独立 PUT で実在 context へ書き換え最終状態へ移行する後追い
適用タスクを Phase 1〜13 で仕様書化。base case = 案 A（MAJOR ゼロ・MINOR ゼロ）。

Refs #202

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 残りのコミットも粒度ごとに作成
# push（user 操作後のみ）
git push -u origin feat/utgov001-second-stage-reapply
```

### ステップ 10: PR 作成（user 承認後のみ）

```bash
gh pr create \
  --title "chore(governance): UT-GOV-001 second-stage contexts reapply (Refs #202)" \
  --base dev \
  --head feat/utgov001-second-stage-reapply \
  --body "$(cat <<'EOF'
## Summary

- UT-GOV-001 で採用した `required_status_checks.contexts=[]` 暫定 fallback を、UT-GOV-004 完了成果物から取得した実在 context（job 名 / check-run 名）に書き換え、dev / main 独立 PUT で最終状態へ移行
- base case = 案 A（UT-GOV-004 完了後の dev / main 独立 PUT / MAJOR ゼロ・MINOR ゼロ）
- 適用前 / 適用後 GET を `outputs/phase-13/branch-protection-{current,applied}-{dev,main}.json` として保全
- drift 最終確認（6 値: `required_pull_request_reviews=null` / `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history` / `required_conversation_resolution`）が CLAUDE.md と一致
- aiworkflow-requirements references（ci-cd.md / governance.md）への反映は別タスク（task-utgov001-references-reflect-001）として登録済

## Test plan

- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の `required_status_checks.contexts` が `expected-contexts-dev.json` と集合一致
- [ ] 同 main も集合一致
- [ ] drift 6 値が CLAUDE.md / deployment-branch-strategy.md と一致
- [ ] `node scripts/validate-phase-output.js --task utgov001-second-stage-reapply` exit 0
- [ ] `node scripts/verify-all-specs.js` exit 0
- [ ] `git status` で apps/ / packages/ / migrations/ / wrangler.toml 差分が 0
- [ ] `git diff --cached` に admin token 値 / op:// 解決値が 0
- [ ] Phase 12 必須 7 成果物が `outputs/phase-12/` に揃っている
- [ ] Issue #202 が CLOSED のまま（`Closes #202` を使用していない）

## Linked Issue

Refs #202 (CLOSED — 仕様書化と実 PUT のため再オープンせず参照のみ)

## Risk / 後方互換性

- 破壊的変更なし（branch protection の `required_status_checks.contexts` のみ書き換え / 他 6 値は維持）
- typo context 検出時は UT-GOV-001 rollback payload で即時 revert（`outputs/phase-05/apply-runbook-second-stage.md` 参照）
- admin block 検出時も同 rollback 経路で回避
- 03a / 03b / 04c / 09b 等の application implementation タスクへ影響なし

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

`outputs/phase-13/pr-info.md` に PR タイトル / body / labels を記録。`outputs/phase-13/pr-creation-result.md` に PR 番号 / URL / CI 状態を記録。

### ステップ 11: PR 作成後の CI gate / branch protection 動作確認

```bash
# CI 確認
gh pr checks <PR番号>

# 実在 context（UT-GOV-004 由来）が PR 上で走り、green になっているか確認
# branch protection が contexts に基づき merge block を機能させているか確認
gh pr view <PR番号> --json mergeStateStatus,statusCheckRollup
```

- 期待: 実在 context すべてが green / `mergeStateStatus` が CLEAN（admin / approved 後）。
- contexts に未走 check が含まれる場合 → typo / 廃止 check-run 名 / UT-GOV-004 同期不足のいずれか。即時 rollback 判断へ。

### ステップ 12: Issue #202 二段階目クローズアウトコメント

```bash
gh issue comment 202 --body "$(cat <<'EOF'
UT-GOV-001 second-stage reapply の実 PUT が完了しました。

- 適用前 GET: outputs/phase-13/branch-protection-current-{dev,main}.json
- 適用後 GET: outputs/phase-13/branch-protection-applied-{dev,main}.json
- 期待 contexts と集合一致確認: PASS（dev / main 双方）
- drift 6 値: CLAUDE.md / deployment-branch-strategy.md と一致
- PR: <PR URL>

aiworkflow-requirements references への最終状態反映は task-utgov001-references-reflect-001 で別途実施します。
Issue は CLOSED のまま。
EOF
)"
```

## rollback 判断基準

### PR merge **前** に発生した場合

| 事象 | 判断 | 操作 |
| --- | --- | --- |
| 適用後 GET の contexts 不一致 | ROLLBACK | UT-GOV-001 の `outputs/phase-05/rollback-payload-{branch}.json` で当該 branch を再 PUT |
| admin block（既存 PR が contexts 未走で merge 不能化）| ROLLBACK | 同上、即時実行 |
| 422 schema error | ROLLBACK | 同上 + UT-GOV-004 成果物再点検タスク起票 |
| dev OK / main NG | 部分 ROLLBACK | main のみ rollback、dev は維持 |
| drift 検出（6 値が CLAUDE.md と乖離）| 続行 + 別タスク | rollback せず `task-utgov001-drift-fix-001` 起票 |

### PR merge **後** に発生した場合

| 事象 | 判断 | 操作 |
| --- | --- | --- |
| 後発の typo context 検出 | 別タスク起票 | `task-utgov001-contexts-correction-001` を新規 unassigned-task として登録 / 同手順で再 PUT |
| references 反映による drift 検出 | 別タスク継続 | `task-utgov001-references-reflect-001` で吸収 |
| branch protection 自体は機能しているが UT-GOV-005〜007 で別 contexts 追加要請 | 別タスク起票 | UT-GOV-004 同期 → 本タスクと同手順の third-stage タスクを起票 |

> **rollback payload は再利用のみ・上書き禁止**（Phase 3 運用ルール 5）。

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `chore(governance): UT-GOV-001 second-stage contexts reapply (Refs #202)` |
| body | Summary / Test plan / Linked Issue / Risk（上記 HEREDOC） |
| reviewer | solo 開発のため 0（CLAUDE.md ブランチ戦略・CI gate のみで保護） |
| base | `dev`（推奨）→ 後段で `main` へ昇格 PR を別途作成 |
| head | `feat/utgov001-second-stage-reapply` |
| labels | `area:governance` / `task:UT-GOV-001-second-stage` / `wave:governance` / `type:implementation` |
| linked issue | #202（`Refs #202` のみ。`Closes #202` は使用しない / Issue は CLOSED のまま） |

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

## main マージ後のクローズアウト動線

1. `dev` → `main` 昇格 PR を作成（solo 運用 / reviewer 0 / CI gate + 線形履歴で保護）。
2. main マージ後、`docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` を `docs/30-workflows/completed-tasks/UT-GOV-001-second-stage-reapply.md` として移動・登録（Phase 12 documentation-changelog 通り）。
3. artifacts.json の全 Phase を `completed` に更新（root + outputs の二重 ledger 同期）。
   - `task.metadata.taskType = implementation` / `visualEvidence = NON_VISUAL` を維持。
   - `task.metadata.status = completed`。
4. Phase 12 unassigned-task-detection 6 件のうち実反映が必要なタスクを順次起票:
   - `task-utgov001-references-reflect-001`（aiworkflow-requirements references 反映 / AC-14）
   - `task-utgov001-drift-fix-001`（drift 検出時のみ条件発火）
   - `task-utgov-downstream-precondition-link-001`（UT-GOV-005〜007 への前提リンク追記）
5. UT-GOV-001 完了タスクの `§8.2 後追い再 PUT 経路` に本タスクへのリンクを追記。
6. Issue #202 は **CLOSED のまま**。クローズアウトは Phase 12 / Phase 13 の 2 段階コメントで完了。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | `apply-runbook-second-stage.md` の手順を逐次実行（ステップ 4〜7） |
| Phase 9 | drift-check.md の最終確認を実 GET で更新（ステップ 7） |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | manual-verification-log.md を実 PUT 直前 / 直後の証跡として更新 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 / unassigned-task-detection 6 件の連鎖発火を main マージ後に管理 |

## 多角的チェック観点

- 価値性: PR が contexts=[] 残留を解消し、必須 status checks 強制を最終状態に到達させているか。
- 実現性: 適用前 GET / dev PUT / main PUT / 適用後 GET / drift 確認の 5 ステップが順不同なく実行されたか。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: dev / main 独立 PUT が直列で実行され、片側失敗時の rollback 経路が runbook と一致するか。
- implementation 境界: コミット差分に `apps/` / `packages/` / `migrations/` / `wrangler.toml` が混入していないか（grep）。
- Secret hygiene: コミット差分 / 仕様書に admin token 値 / op:// 解決値が混入していないか。
- Issue 整合: `Closes #202` を使わず `Refs #202` で参照しているか。
- AC-13: ユーザー明示承認なしに実 PUT・push・PR 作成を実行していないか。
- AC-3 / AC-5 / AC-6: GET / PUT / 集合一致が証跡で確認できるか。
- rollback 経路: PR merge 前 / 後 で別の判断基準が runbook と一致するか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 明示承認必須（最重要）** |
| 2 | local-check（spec validate のみ / lint・type・build は N/A） | 13 | spec_created | docs + REST API only |
| 3 | 機密情報 grep + implementation 境界 grep | 13 | spec_created | 0 件 |
| 4 | 適用前 GET（dev / main） | 13 | spec_created | branch-protection-current-{dev,main}.json |
| 5 | dev PUT + 検証 GET + 集合一致 | 13 | spec_created | branch-protection-applied-dev.json / AC-3 / AC-5 / AC-6 |
| 6 | main PUT + 検証 GET + 集合一致 | 13 | spec_created | branch-protection-applied-main.json / 直列実行 |
| 7 | drift 最終確認（6 値） | 13 | spec_created | AC-7 |
| 8 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 9 | コミット粒度ごとに commit（5 単位） | 13 | spec_created | 承認後のみ |
| 10 | branch / push | 13 | spec_created | 承認後のみ |
| 11 | gh pr create | 13 | spec_created | base=dev / head=feat / `Refs #202` |
| 12 | CI 確認 + branch protection 動作確認 | 13 | spec_created | 実在 context が green |
| 13 | Issue #202 二段階目クローズアウトコメント | 13 | spec_created | 実 PUT 完了報告 |
| 14 | main マージ後クローズアウト動線記録 | 13 | spec_created | completed-tasks 移動 + unassigned 起票 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 証跡 | outputs/phase-13/branch-protection-current-dev.json | 適用前 GET（dev）/ AC-3 |
| 証跡 | outputs/phase-13/branch-protection-current-main.json | 適用前 GET（main）/ AC-3 |
| 証跡 | outputs/phase-13/branch-protection-applied-dev.json | 適用後 GET（dev）/ AC-5 / AC-6 |
| 証跡 | outputs/phase-13/branch-protection-applied-main.json | 適用後 GET（main）/ AC-5 / AC-6 |
| ドキュメント | outputs/phase-13/local-check-result.md | spec validate exit 0 / lint / type / build は N/A |
| ドキュメント | outputs/phase-13/change-summary.md | PR description 草案 + 変更ファイルリスト |
| ドキュメント | outputs/phase-13/pr-info.md | PR タイトル / body / labels / base / head |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 番号 / URL / CI 状態 / 承認ログ / クローズアウト動線 |
| PR | user 承認後に作成 | UT-GOV-001 second-stage reapply PR（`Refs #202`）|
| メタ | artifacts.json | 全 Phase 状態の更新（マージ後 completed） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む / AC-13）
- [ ] local-check-result が spec validate exit 0 / lint / type / build は N/A 明記
- [ ] 機密情報 grep が 0 件
- [ ] implementation 境界 grep が 0 件（apps/ / packages/ / migrations/ / wrangler.toml 差分なし）
- [ ] 適用前 GET（dev / main）が `outputs/phase-13/branch-protection-current-{dev,main}.json` に保全されている（AC-3）
- [ ] dev / main 独立 PUT が成功し `outputs/phase-13/branch-protection-applied-{dev,main}.json` に保存されている（AC-5）
- [ ] 適用後 GET の contexts が期待 contexts と集合一致（dev / main 双方 / AC-6）
- [ ] drift 6 値が CLAUDE.md / deployment-branch-strategy.md と一致（AC-7）
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #202 に `Refs #202` で紐付いている（Issue は CLOSED のまま）
- [ ] CI（`gh pr checks`）が green / 実在 context が走っている
- [ ] コミット粒度が 5 単位で分離されている
- [ ] Issue #202 二段階目クローズアウトコメントが追記されている
- [ ] マージ後、artifacts.json の全 Phase が `completed`
- [ ] main マージ後のクローズアウト動線（completed-tasks 移動 + 関連 unassigned-task 起票）が記録されている
- [ ] rollback 判断基準（PR merge 前 / 後）が runbook と一致している（AC-8 / AC-10）

## タスク 100% 実行確認【必須】

- 全実行タスク（14 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計になっている（AC-13 最優先）
- approval 取得前に commit / push / PR / 実 PUT を実行しない方針が明文化されている
- マージ操作・production deploy は user の領域として明確に分離されている
- Issue #202 を CLOSED のまま扱い、`Closes #202` を使わず `Refs #202` で参照する設計になっている
- artifacts.json の `phases[12].user_approval_required = true` / `status = spec_created`
- dev / main 独立 PUT（直列実行）の設計が runbook と一致
- rollback payload は UT-GOV-001 のものを再利用（上書き禁止）
- AC-3 / AC-5 / AC-6 / AC-13 が完了条件に明示

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - PR マージ後、Phase 12 unassigned-task-detection の 6 件を順次起票（references 反映 / drift 是正 / downstream リンク）。
  - `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` を `docs/30-workflows/completed-tasks/UT-GOV-001-second-stage-reapply.md` へ移動。
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）。
  - UT-GOV-001 完了タスクの §8.2 に本タスクへのリンクを追記。
  - 「Phase 13 = approval + execute」テンプレを task-specification-creator skill 改善（Phase 12 skill-feedback）として継続。
- ブロック条件:
  - user 承認が無い場合は実 PUT・PR 作成・push を一切実行しない（厳守 / AC-13）
  - 上流（UT-GOV-001 Phase 13 / UT-GOV-004）が未完了
  - local-check（spec validate）が FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - 機密情報 grep / implementation 境界 grep で 1 件以上検出
  - 適用前 GET 失敗（403 / 404）→ admin token 再取得 / branch 存在確認
  - dev PUT または main PUT が 422（schema 不正 / typo context）→ 即時 rollback / UT-GOV-004 成果物再点検
  - admin block 検出 → 即時 rollback / Phase 11 事前確認再実施
  - 適用後 GET の集合一致が NG → rollback 判断
  - Issue #202 を誤って再オープン / `Closes #202` で誤って再 close を試みた
  - apps/ や migrations/ の差分が本 PR に意図せず混入
