# Phase 13: PR 作成

> **【最重要 / 冒頭明記】コミット・push・PR 作成は本仕様書段階では一切禁止。**
> 本 Phase は仕様書のみを記述し、`git commit` / `git push` / `gh pr create` を含む実コマンドは Claude Code から実行しない。
> 実 PR 作成は user の **明示的な承認** 取得後に、user 指示の下でのみ行う。
> CLAUDE.md「solo 運用ポリシー」/ task-specification-creator skill の approval gate ルールに準拠する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production observability target diff script (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-05-02 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了 / 親 UT-06-FU-A の cutover ゲートで script を実運用する） |
| 状態 | pending_user_approval |
| タスク分類 | implementation（script + spec PR） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true** |
| ブランチ | `feat/ut-06-fu-a-logpush-target-diff-script-001-spec` |
| ベース | `main` |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 / `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| GitHub Issue | #329（CLOSED）→ `Refs #329` で関連付け（`Closes` は不使用） |

## 目的

Phase 1〜12 で実装完了した「production observability target diff script」（`bash scripts/cf.sh observability-diff` / `scripts/observability-target-diff.sh` / redaction module / unit & integration tests / 親 UT-06-FU-A runbook 追記）を、main ブランチへ取り込む PR の作成手順として仕様化する。現時点は `implementation_complete` かつ Phase 13 `pending_user_approval` であり、承認ゲート前のいかなる commit / push / PR 作成も禁止し、user 明示承認後にのみ自動同期手順へ進む。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜12 全完了 | 各 `outputs/phase-NN/main.md` 生成済 / `artifacts.json` の `phases[0..11].status = completed`。現時点では未実行 | 要確認 |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 NON_VISUAL evidence | golden 一致 + redaction grep + `bash scripts/cf.sh` 実行ログ（key 名のみ）が記録 | 要確認 |
| Phase 12 compliance check | 7 ファイル PASS。現時点では未生成 | 要確認 |
| typecheck / lint / shellcheck / test | 全 PASS。現時点では script 未実装のため未実行 | 要確認 |
| redaction grep audit | golden / 実 output に token-like 0 件 | 要確認 |
| no-secret-leak audit | diff に token / OAuth / API Key 0 件 | 要確認 |
| `wrangler` 直呼び grep | 0 件（`bash scripts/cf.sh` 一本化） | 要確認 |
| 親 UT-06-FU-A runbook 相互 link | 1 件以上維持 | 要確認 |
| change-summary レビュー | user が PR 内容（spec + script + tests / 実 deploy なし）を把握 | **user 承認待ち** |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check-result（typecheck / lint / shellcheck / verify-indexes / test / redaction audit）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. user 承認後、ブランチ確認 → commit → push → PR 作成を実行する（**仕様書記述のみ・本 Phase で実行しない**）。
5. CI 確認とマージ手順を記録する（マージ実行は user 操作）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-12/documentation-changelog.md` | PR 変更ファイル一覧の根拠 |
| 必須 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 承認ゲート前提 |
| 必須 | `outputs/phase-11/main.md` | NON_VISUAL evidence サマリー |
| 必須 | `outputs/phase-10/go-no-go.md` | GO 判定 |
| 必須 | `outputs/phase-09/secret-leak-audit.md` | redaction / no-secret-leak audit |
| 必須 | `index.md` | PR タイトル / 説明根拠 |
| 必須 | `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` | 原典 |
| 必須 | `CLAUDE.md` | ブランチ戦略 / solo 運用ポリシー / Cloudflare CLI 実行ルール |
| 参考 | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | Phase 13 テンプレ |
| 参考 | `.claude/skills/task-specification-creator/references/phase-template-phase13-detail.md` | Phase 13 詳細 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 1〜12 全 Phase 成果物が `outputs/phase-NN/main.md` として揃い、`artifacts.json` の `phases[0..11].status = completed` を確認する。
2. Phase 9 の audit 結果（typecheck / lint / shellcheck / test / redaction / no-secret-leak / cf.sh wrapper 監査）が全 PASS であることを、実装後に確認する。
3. Phase 10 GO 判定 / Phase 11 NON_VISUAL evidence / Phase 12 compliance check が PASS であることを、実成果物生成後に確認する。
4. `git diff --name-only main..HEAD` で `apps/web/wrangler.toml` / `apps/api/wrangler.toml` への変更が無いこと（observability binding 変更は親 UT-06 後続 PR）。
5. change-summary を user に提示し、**明示承認**を待つ。
6. 承認後にステップ 2 へ進む。承認が得られない場合は停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# shellcheck（script が bash の場合）
shellcheck scripts/observability-target-diff.sh

# verify-indexes drift
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes

# unit + golden test
mise exec -- pnpm test -- observability-target-diff

# redaction grep audit（golden / outputs に token-like 0 件）
grep -rEn 'ya29\.|^Bearer |sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}|eyJ[A-Za-z0-9_-]{10,}\.eyJ' \
  tests/golden/observability-target-diff/ \
  outputs/ \
  || echo "OK: redaction clean"

# no-secret-leak audit（diff）
git diff main..HEAD | grep -nE "ya29\.|sk-[A-Za-z0-9]{20,}|CLOUDFLARE_API_TOKEN=[^\s]+|-----BEGIN PRIVATE" \
  || echo "OK: no secrets"

# wrangler 直呼びチェック（CLAUDE.md ルール）
git diff main..HEAD | grep -nE '^\+\s*wrangler ' \
  | grep -v 'bash scripts/cf.sh' \
  && echo "BLOCKED: wrangler 直呼びが含まれる" \
  || echo "OK: scripts/cf.sh 一本化"

# 親 UT-06-FU-A runbook link 整合
grep -RIn "ut-06-fu-a-prod-route-secret-001-worker-migration-verification" \
  docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/ \
  | wc -l
# 期待: 1 件以上
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | `outputs/phase-13/main.md` §local-check |
| lint | exit 0 | 同上 |
| shellcheck | warning 0 | 同上 |
| verify-indexes | drift 0 | 同上 |
| unit + golden test | 全 PASS | 同上 |
| redaction grep | 0 件 | 同上 |
| no-secret-leak grep | 0 件 | 同上 |
| `wrangler` 直呼び grep | 0 件 | 同上 |
| 親 runbook link | 1 件以上 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` および `outputs/phase-13/pr-template.md` に以下構造で記述する。

#### 概要

UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 として、production deploy 後の障害観測漏れを防ぐため、`ubm-hyogo-web-production` と旧 Worker の observability target（Workers Logs / Tail / Logpush / Analytics Engine）の差分を **読み取り専用で出力する script** を `scripts/observability-target-diff.*` として追加する。secret / token / sink credential は redaction し、`bash scripts/cf.sh tail` と整合する検証導線を提供する。実 deploy 実行は本 PR に含めない（親 UT-06-FU-A 配下の cutover で実施）。

#### 動機

- GitHub Issue: #329（CLOSED 状態のため `Refs #329`）
- 親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 の Phase 12 unassigned-task-detection で発見された残課題
- observability target が tail sample template に閉じており、Logpush / Analytics target の旧 Worker 名固定が機械検証できなかったギャップを埋める
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 一本化 / `wrangler` 直呼び禁止）と secret 値非混入ポリシーの整合

#### 変更内容

**新規ファイル**:

- `scripts/observability-target-diff.*`（4 軸 inventory + redaction module）
- `tests/observability-target-diff/*.test.ts`（unit + golden）
- `tests/fixtures/observability-target-diff/*.json`（mock fixtures）
- `tests/golden/observability-target-diff/*.md`（redacted golden output）
- `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/index.md`
- `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/phase-01.md` 〜 `phase-13.md`
- `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/artifacts.json`
- `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-01/` 〜 `phase-13/`

**追記ファイル**:

- `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`配下 runbook（script への導線追加）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（observability diff script の節を追加）
- `.claude/skills/aiworkflow-requirements/indexes/{topic-map,resource-map,quick-reference,keywords}`（same-wave sync）
- `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md`（状態を `transferred_to_workflow / implementation_complete` に更新）

**含まないファイル（明示）**:

- `apps/web/wrangler.toml` の routes / secrets / observability binding 変更（親 UT-06-FU-A 後続 PR）
- `apps/api/wrangler.toml`（同上）
- `apps/web/src/**` / `apps/api/src/**`（アプリコードは別 PR）
- 実 secret 値 / `*.dev.vars` / `.env`（1Password 参照のみが正本）

#### 動作確認

- typecheck / lint / shellcheck / unit + golden test: 実装後に local-check-result へ記録
- redaction grep audit（golden / outputs に token-like 0 件）: 実装後に記録
- no-secret-leak audit（diff に CLOUDFLARE_API_TOKEN / OAuth / sk- prefix 0 件）: 実装後に記録
- `wrangler` 直呼び grep（`bash scripts/cf.sh` 一本化）: 実装後に記録
- script 単独 dry-run（mock fixture で実行）: 実装後に golden と比較

#### リスク・後方互換性

- **破壊的変更なし**（read-only script 追加 + spec ドキュメント追記）
- script は read-only（observability target を一覧表示するのみ。書き込み operation 0）
- 実 cutover は親 UT-06-FU-A 配下の手動 deploy で行うため、本 PR が merge されても production への影響なし

#### レビュー観点

- redaction module が token / sink credential / Authorization header / account ID 全パターンをカバーしているか
- 4 軸（Workers Logs / Tail / Logpush / Analytics Engine）の inventory 取得方法が plan 制限を考慮しているか
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合（`scripts/cf.sh` 一本化）
- 親 UT-06-FU-A runbook との相互 link 整合
- solo 運用ポリシー整合（required reviewers=0 / CI gate のみで保護）

### ステップ 4: PR 作成（user 承認後のみ・本 Phase では実行しない / 仕様としてコマンドのみ記述）

> **本コマンドは仕様書として記述するのみ**。Phase 13 内で Claude Code は **実行しない**。
> user の明示承認後の実行手順として参照する。

```bash
# 現在のブランチ確認
git status
git branch --show-current   # → feat/ut-06-fu-a-logpush-target-diff-script-001-spec

# 必要なファイルを明示的に add（git add . / git add -A は使わない）
git add scripts/observability-target-diff.* \
        tests/observability-target-diff/ \
        tests/fixtures/observability-target-diff/ \
        tests/golden/observability-target-diff/ \
        docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/ \
        docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md \
        docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ \
        .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
        .claude/skills/aiworkflow-requirements/indexes/

# コミット
git commit -m "$(cat <<'EOF'
feat(observability): production observability target diff script (Refs #329)

- scripts/observability-target-diff.* を追加: ubm-hyogo-web-production と旧 Worker の Workers Logs / Tail / Logpush / Analytics Engine target を read-only で diff 出力
- redaction module: token / sink credential / Authorization header / account ID を全 redact
- unit + golden tests を tests/observability-target-diff/ に追加
- docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/ に Phase 1〜13 仕様書一式
- 親 UT-06-FU-A runbook に script 導線追加
- aiworkflow-requirements indexes / deployment-cloudflare.md を same-wave sync
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」(scripts/cf.sh 一本化) 整合
- workflow_state は implementation_complete（実 cutover は親 UT-06-FU-A 配下で別途実施）

Refs #329
EOF
)"

# push
git push -u origin feat/ut-06-fu-a-logpush-target-diff-script-001-spec

# PR 作成
gh pr create \
  --title "[UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001] production observability target diff script" \
  --base main \
  --head feat/ut-06-fu-a-logpush-target-diff-script-001-spec \
  --body "$(cat <<'EOF'
## Summary
- production deploy 後の障害観測漏れ防止のため、`ubm-hyogo-web-production` と旧 Worker の observability target (Workers Logs / Tail / Logpush / Analytics Engine) の差分を read-only で出力する script を追加します。
- secret / token / sink credential は全 redaction し、`bash scripts/cf.sh tail` と整合する検証導線を提供します。
- 実 cutover は親 UT-06-FU-A 配下で別途実施します（本 PR には含めません）。

## 動機
- GitHub Issue: #329（CLOSED 状態のため `Refs #329`）
- 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 Phase 12 unassigned-task-detection 由来の残課題
- observability の機械検証導線整備（CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合）

## 変更内容
- 新規: `scripts/observability-target-diff.*`（4 軸 + redaction module）
- 新規: `tests/observability-target-diff/`（unit + golden）
- 新規: `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/`（13 Phase + outputs）
- 同期: `.claude/skills/aiworkflow-requirements/{references,indexes}` および親 UT-06-FU-A runbook

## 含まないもの（明示）
- `apps/web/wrangler.toml` の routes / secrets / observability binding 変更（親 UT-06-FU-A 後続 PR）
- アプリコード変更
- 実 secret 値（1Password 参照のみが正本）

## 影響範囲
- read-only script 追加 + docs / spec 追加。production 設定への影響なし

## リスク
- なし（read-only / docs-only に近い）

## レビュー観点
- redaction が token / Authorization / account ID 全パターンをカバー
- 4 軸の inventory 取得が plan 制限を考慮
- `scripts/cf.sh` 一本化整合
- 親 UT-06-FU-A runbook との相互 link 維持
- solo 運用ポリシー整合（required reviewers=0 / CI gate のみで保護）

## Test plan
- [ ] typecheck / lint / shellcheck / unit + golden test: 実装後に実行
- [ ] redaction grep audit（token-like 0 件）: 実装後に実行
- [ ] no-secret-leak audit（diff に secret 0 件）: 実装後に実行
- [ ] `wrangler` 直呼び grep 0 件（`scripts/cf.sh` 一本化）: 実装後に実行
- [ ] 親 UT-06-FU-A runbook 相互 link 1 件以上: 実装後に確認
- [ ] CI gate（typecheck / lint / verify-indexes / test）全 green を `gh pr checks` で確認
- [ ] reviewer による redaction module レビュー

## 関連 Issue
Refs #329
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `[UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001] production observability target diff script` |
| body | Summary / 動機 / 変更内容 / 含まないもの / 影響範囲 / リスク / レビュー観点 / Test plan / 関連 Issue |
| base | `main`（solo 運用 / `feature/* → main` 直 PR） |
| head | `feat/ut-06-fu-a-logpush-target-diff-script-001-spec` |
| reviewer | required reviewers=0（solo 運用 / CI gate のみ） |
| labels | `area:observability` / `task:UT-06-FU-A` / `wave:2-plus` / `area:scripts` |
| linked issue | #329（`Refs #329`、Issue は CLOSED のため `Closes` は不使用） |

## CI gate 通過条件

| gate | 条件 | 必須 |
| --- | --- | --- |
| typecheck | exit 0 | YES |
| lint | exit 0 | YES |
| shellcheck | warning 0 | YES（bash 採用時） |
| verify-indexes-up-to-date | drift 0 | YES |
| unit + golden test | 全 PASS | YES |
| codeowners 構文 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}` | 参考 |

## pre-merge チェックリスト

- [ ] Phase 12 same-wave sync 完了（aiworkflow-requirements references / indexes / 親 runbook / 原典 unassigned status）
- [ ] root `artifacts.json` と `outputs/artifacts.json` parity（drift 0）
- [ ] `metadata.workflow_state = "implementation_complete"` 維持
- [ ] PR 本文に `Refs #329`（Issue CLOSED のため `Closes` 不使用）
- [ ] `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / `apps/**/src/**` 変更 0 件
- [ ] redaction grep / no-secret-leak audit 0 件
- [ ] `wrangler` 直呼び grep 0 件
- [ ] CI gate 全 green
- [ ] Phase 11 NON_VISUAL evidence が PR 本文から辿れる
- [ ] 親 UT-06-FU-A runbook 相互 link 維持

## 承認後の自動同期手順（user 操作）

```bash
# CI 確認
gh pr checks <PR番号>

# user 承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

### タスク完了処理（merge 後）

- `artifacts.json` の `phases[0..11].status` を `completed` に更新
- `phases[12].status` は user 操作後に `completed` へ
- `metadata.workflow_state` は `implementation_complete` を維持（実 cutover は親 UT-06-FU-A 担当）
- LOGS:
  - `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / merge 日時を追記
  - `outputs/phase-13/pr-creation-result.md` に実行ログ追記
  - 親 UT-06-FU-A runbook に「observability diff script 完了」link back

## ロールバック手順（user 操作）

```bash
# 1. PR をクローズ（merge 前）
gh pr close <PR番号> --comment "rollback: <理由>"

# 2. リモートブランチ削除
git push origin --delete feat/ut-06-fu-a-logpush-target-diff-script-001-spec

# 3. ローカルブランチ削除
git branch -D feat/ut-06-fu-a-logpush-target-diff-script-001-spec
```

> merge 後の問題は新規 PR で revert（read-only script のため revert 影響は限定的）。

## 変数一覧

| 変数 | 値 |
| --- | --- |
| TASK_ID | `UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001` |
| BRANCH | `feat/ut-06-fu-a-logpush-target-diff-script-001-spec` |
| BASE | `main` |
| PR_TITLE | `[UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001] production observability target diff script` |
| ISSUE_LINK | `Refs #329`（CLOSED のため `Closes` 不使用） |
| LABELS | `area:observability` / `task:UT-06-FU-A` / `wave:2-plus` / `area:scripts` |
| 添付スコープ | `scripts/observability-target-diff.*` + `tests/observability-target-diff/` + `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/` + indexes + 親 runbook 追記 |
| 親タスク link | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| 除外スコープ | `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / `apps/**/src/**` / 実 secret 値 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | redaction / no-secret-leak audit を承認ゲートの前提として再利用 |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | NON_VISUAL evidence（golden 一致 / redaction grep / cf.sh wrapper 実行ログ）を PR Test plan に転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 |

## 多角的チェック観点

- 価値性: PR が Issue #329 の script 実装 + spec 全体を網羅しているか
- 実現性: local-check が typecheck / lint / shellcheck / test / redaction / no-secret-leak 全 PASS か
- 整合性: change-summary が `documentation-changelog.md` と一致 / 親 UT-06-FU-A runbook 相互 link 維持
- 運用性: PR description が後続 cutover 担当者に必要十分か
- 認可境界: diff に CLOUDFLARE_API_TOKEN / OAuth / sink token / dataset credential が混入していないか
- 後方互換性: read-only script + spec のみで実 deploy 影響無いことを diff で再確認
- 境界遵守: `apps/web` / `apps/api` への変更が 0 件
- CLI 統制: `wrangler ` 直呼び grep が 0 件

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 承認ゲート通過 | pending_user_approval |
| 2 | local-check-result | pending_user_approval |
| 3 | redaction grep audit | pending_user_approval |
| 4 | no-secret-leak audit | pending_user_approval |
| 5 | `wrangler` 直呼び grep | pending_user_approval |
| 6 | spec PR 境界 grep | pending_user_approval |
| 7 | 親 UT-06-FU-A runbook link 整合 | pending_user_approval |
| 8 | change-summary 作成 | pending_user_approval |
| 9 | branch / commit / push | pending_user_approval |
| 10 | gh pr create | pending_user_approval |
| 11 | CI 確認 | pending_user_approval |
| 12 | マージ手順記録（user 操作） | pending_user_approval |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/main.md` | local-check + change-summary + 承認ログ |
| テンプレ | `outputs/phase-13/pr-template.md` | PR title / body テンプレ + CI gate 一覧 |
| 結果 | `outputs/phase-13/pr-info.md` | PR URL / CI 結果（承認後のみ） |
| 結果 | `outputs/phase-13/pr-creation-result.md` | PR 作成プロセス実行ログ（承認後のみ） |
| PR | user 承認後に作成 | `Refs #329` |
| メタ | `outputs/artifacts.json` | 全 Phase 状態の更新（merge 後） |

## 完了条件

- [ ] 承認ゲート全項目 PASS（user 明示承認を含む）
- [ ] local-check-result（typecheck / lint / shellcheck / verify-indexes / test）全 PASS
- [ ] redaction grep audit / no-secret-leak audit 0 件
- [ ] `wrangler` 直呼び grep 0 件
- [ ] `apps/web` / `apps/api` 実コード混入 grep 0 件
- [ ] 親 UT-06-FU-A runbook 相互 link 1 件以上
- [ ] change-summary が PR body と一致
- [ ] PR が `Refs #329` で作成（`Closes` 不使用）
- [ ] CI（`gh pr checks`）green
- [ ] solo 運用ポリシー整合（required reviewers=0）
- [ ] merge 後 `phases[0..12].status` 更新 / `workflow_state = implementation_complete` 維持

## タスク100%実行確認【必須】

- 全実行タスク（12 件）が `pending_user_approval`
- 承認ゲートが他のすべての手順より先行する設計
- approval 取得前に commit / push / PR 作成しない方針が冒頭・承認ゲート・ステップ 1・ステップ 4 の 4 箇所で明文化
- 本 Phase では PR 作成コマンドを **記述のみ**（実行しない）
- マージ操作は user 領域として明確に分離
- `artifacts.json` の `phases[12].user_approval_required = true` / `status = pending_user_approval`
- `metadata.workflow_state = "implementation_complete"` 維持
- 実 cutover は親 UT-06-FU-A 配下で別途実施する旨を明示

## 次 Phase

- 次: なし（タスク仕様書としては完了）
- 引き継ぎ事項:
  - 実 cutover（`apps/web/wrangler.toml` の routes / secrets / observability binding 変更 + `bash scripts/cf.sh deploy`）は親 UT-06-FU-A 配下後続 PR / 手動 cutover で実施
  - script は cutover 直前ゲートで `bash scripts/cf.sh whoami && bash scripts/observability-target-diff.sh` として参照される
  - artifacts.json 更新（user マージ後）。`metadata.workflow_state` は `implementation_complete` 維持
- ブロック条件:
  - user 承認なしの PR 作成・push を一切禁止
  - local-check のいずれか FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - redaction / no-secret-leak audit 1 件以上検出（→ 即時停止）
  - `wrangler` 直呼び 1 件以上検出（→ 即時停止）
  - `apps/web` / `apps/api` 実コード混入（→ 即時停止 / spec PR 境界違反）
  - 親 UT-06-FU-A runbook link 不整合（→ Phase 12 へ差し戻し）
