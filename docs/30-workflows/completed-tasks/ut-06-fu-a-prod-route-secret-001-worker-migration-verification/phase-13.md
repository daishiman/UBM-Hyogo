# Phase 13: PR 作成

> **【最重要 / 冒頭明記】コミット・push・PR 作成は本仕様書段階では一切禁止。**
> 本 Phase は仕様書のみを記述し、`git commit` / `git push` / `gh pr create` を含む実コマンドは Claude Code から実行しない。
> 実 PR 作成はユーザーの**明示的な承認**取得後に、ユーザー操作または明示指示の下でのみ行う。
> CLAUDE.md「solo 運用ポリシー」/ task-specification-creator skill の approval gate ルールに準拠する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク仕様書としては完了 / 実 deploy 検証は親 UT-06-FU-A 側で別途実施） |
| 状態 | pending_user_approval |
| タスク分類 | docs-only（spec PR / approval gate） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（PR merge 後も spec 段階のため `spec_created` を維持） |
| user_approval_required | **true** |
| ブランチ | `feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec` |
| ベース | `main` |
| 親タスク | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` |
| GitHub Issue | #246（CLOSED）→ `Refs #246` で関連付け |

## 目的

Phase 1〜12 で整備した「apps/web production Worker route / secret / observability 移行確認」の仕様書一式（13 Phase + index + artifacts.json + outputs + runbook）を main ブランチに取り込むための PR 作成手順を定義する。本 PR は **タスク仕様書のみ**（`docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` 配下）を対象とし、実コード変更（`apps/web/wrangler.toml` の routes / secrets bindings / observability 設定 など）は本 PR に含めない。承認ゲート前のいかなる commit / push / PR 作成も禁止し、approval を取得して初めて自動同期手順へ進む。

> **重要: このフェーズは user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR を作らない（厳守）。Claude Code は本仕様書の段階で commit / push / PR を実行しない。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 1〜12 全完了 | 各 Phase の `outputs/phase-NN/main.md` 生成済み / `artifacts.json` の `phases[0..11].status` が `completed` | 要確認 |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO | 要確認 |
| Phase 11 NON_VISUAL evidence | runbook / grep / dry-run ログのテキスト証跡が記録されている理由が明記 | 要確認 |
| Phase 12 compliance check | 正本 7 ファイル PASS / workflow_state=spec_created 維持 | 要確認 |
| artifacts.json 整合 | `phases[12].status = pending_user_approval` / `phases[0..11].status = completed` | 要確認 |
| validate / verify スクリプト | exit code 0 | 要確認 |
| change-summary レビュー | user が PR 内容（spec のみ / 実 deploy は親 UT-06-FU-A で別途）を把握 | **user 承認待ち** |
| secret 値の非混入 | `CLOUDFLARE_API_TOKEN` / OAuth トークン / `*.dev.vars` 実値 / `database_id` 実値が diff に無い | 要確認 |
| `wrangler` 直呼びの非混入 | runbook / spec 内で `bash scripts/cf.sh` ラッパー一本化（`wrangler ` 直接呼び出し記述が無い） | 要確認 |
| 親 UT-06-FU-A runbook link 整合 | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` への相互 link が壊れていない | 要確認 |
| 実コード非混入 | `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / `apps/web/src/**` への変更が含まれない | 要確認 |
| spec_created 維持確認 | `artifacts.json` の `metadata.workflow_state` が `spec_created` / `metadata.docsOnly = true` | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得する）。
2. local-check-result（typecheck / lint / verify-indexes / unit / integration / docs-only smoke）を実行・記録する。
3. change-summary（PR description 草案）を作成する。
4. user 承認後、ブランチ確認 → commit → push → PR 作成を実行する（**仕様書記述のみ・本 Phase で実行しない**）。
5. CI 確認と承認後マージの手順を記録する（マージ実行は user 操作）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/main.md | NON_VISUAL evidence サマリー |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/index.md | PR タイトル / 説明根拠 |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | 原典 / 完了条件 |
| 必須 | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ | 親タスク runbook（link 整合の対象） |
| 必須 | CLAUDE.md | ブランチ戦略（feature/* → main）/ solo 運用ポリシー / Cloudflare CLI 実行ルール |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-13.md | PR テンプレ参照（本 Phase の構造ベース） |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | Phase 13 テンプレ要件 |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase13-detail.md | Phase 13 詳細要件 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 1〜12 全 Phase の成果物が `outputs/phase-NN/main.md` として揃っており、`artifacts.json` の `phases[0..11].status` が `completed` であることを確認する。
2. Phase 10 GO 判定 / Phase 11 NON_VISUAL evidence / Phase 12 compliance check が PASS していることを確認する。
3. 本 worktree に存在する検証手段で ledger / 参照整合（親 UT-06-FU-A runbook への link を含む）を確認する。
4. `git status` および `git diff --name-only main..HEAD` で `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / `apps/**/src/**` 配下に変更が無いことを確認する（spec PR 境界遵守）。
5. change-summary を user に提示し、**明示的な承認**を待つ。
6. 承認取得後にステップ 2 へ進む。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

> **Claude Code は本仕様書の作成段階では commit / push / PR を行わない。** approval 後の実行段階でのみ以下を行う。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# 型チェック（docs-only でも CI と同じく走らせる）
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# Indexes drift 検証（CI verify-indexes と同等）
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes

# 単体テスト（docs-only 変更のため影響なしを再確認）
mise exec -- pnpm test

# secret 値 grep（CLOUDFLARE_API_TOKEN / OAuth / database_id 実値の混入チェック）
git diff main..HEAD | grep -nE "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|CLOUDFLARE_API_TOKEN=[^\s]+" || echo "OK: no secrets"

# wrangler 直呼び grep（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）
git diff main..HEAD -- 'docs/**' | grep -nE "^\+\s*wrangler " && echo "BLOCKED: wrangler 直呼びが含まれる" || echo "OK: scripts/cf.sh 一本化"

# 実コード混入チェック（spec PR 境界）
git diff --name-only main..HEAD | grep -E "^(apps/web|apps/api)/(src/|wrangler\.toml)" && echo "BLOCKED: 実コード混入" || echo "OK: spec only"

# 親 UT-06-FU-A runbook link 整合
grep -RIn "ut-06-followup-A-opennext-workers-migration" docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ | wc -l
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/main.md §local-check |
| lint | exit 0 | 同上 |
| verify-indexes | drift 0 | 同上 |
| test (unit / integration) | 全 PASS | 同上 |
| `git status` で意図せぬ変更が無い | clean | 同上 |
| secret grep | 0 件 | 同上 |
| `wrangler` 直呼び grep | 0 件（`scripts/cf.sh` 一本化） | 同上 |
| `apps/web` / `apps/api` 実コード混入 | 0 件 | 同上 |
| 親 UT-06-FU-A runbook link | 1 件以上（相互 link 維持） | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` および `outputs/phase-13/pr-template.md` に以下構造で記述する。

#### 概要

UT-06-FU-A-PROD-ROUTE-SECRET-001 に基づき、apps/web production Worker 名分離（dev/staging/prod の Worker 名衝突解消）に伴う **route / secret / observability 移行確認 runbook と関連タスク仕様書一式** を `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` 配下に作成する。本 PR は spec のみで、`apps/web/wrangler.toml` の routes 切替 / secrets 再投入 / observability 設定の実コード変更は親 UT-06-FU-A 配下の後続 PR / 手動 deploy で行う。

#### 動機

- GitHub Issue: #246 — UT-06-FU-A-PROD-ROUTE-SECRET-001（CLOSED 状態のため `Refs #246`）
- 親タスク UT-06-FU-A（OpenNext Workers migration）の production cutover 直前ゲートとして route / secret / observability の verification runbook が必須
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 一本化 / `wrangler` 直呼び禁止）の運用整合
- secret 値の AI コンテキスト混入防止ルールの runbook 反映

#### 変更内容

**新規ファイル一覧（spec のみ）**:

- `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/index.md`
- `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-01.md` 〜 `phase-13.md`（13 Phase）
- `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/artifacts.json`
- `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-01/` 〜 `outputs/phase-13/`（各 Phase 成果物）
- `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/artifacts.json`

**修正ファイル一覧（Phase 12 same-wave sync 起因）**:

- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（UT-06-FU-A spec 導線追加）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（workflow inventory 追加）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（spec sync root 追加）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（索引再生成）
- `docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md`（状態を `spec_created` に更新）

**含まないファイル（明示）**:

- `apps/web/wrangler.toml`（routes / secrets bindings / observability 設定の実コード変更は親 UT-06-FU-A 後続 PR）
- `apps/api/wrangler.toml`（同上）
- `apps/web/src/**` / `apps/api/src/**`（アプリコードは別 PR）
- 実 secret 値 / `*.dev.vars` / `.env`（1Password 参照のみが正本）

#### 動作確認

- Phase 11 NON_VISUAL evidence: runbook dry-run / grep / link 整合のテキスト証跡を `outputs/phase-11/main.md` から転記
- typecheck / lint / verify-indexes / unit / integration: 全 PASS（local-check-result 記録）
- secret 値 grep: 0 件
- `wrangler` 直呼び grep: 0 件（`scripts/cf.sh` 一本化）
- spec PR 境界 grep（`apps/web` / `apps/api` 実コード混入チェック）: 0 件
- 親 UT-06-FU-A runbook 相互 link: 1 件以上維持

#### リスク・後方互換性

- **破壊的変更なし**（spec ドキュメントのみの追加）
- 実 deploy は親 UT-06-FU-A 配下の手動 cutover で行うため、本 PR が merge されても production Worker / D1 / route / secret に影響は無い
- skill references の反映は **正本仕様の予告**であり、実 deploy が追従しない期間を Phase 12 changelog に明記済み

#### workflow_state 維持の確認

- `artifacts.json` の `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` を merge 後も維持する（phase-12-pitfalls.md「設計タスクの workflow root を completed にしてしまう」漏れパターン回避）
- 本 PR は spec 境界のため、`apps/web/wrangler.toml` / `apps/api/wrangler.toml` の実コード変更は含めない。
- 実 deploy が親 UT-06-FU-A 配下で完了した段階で初めて `workflow_state = implementation_ready` → `implemented` に昇格させる（昇格は親タスク責任）。

#### レビュー観点（reviewer 向け）

- AC（Phase 0 / 受入基準）が runbook に網羅されているか
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 一本化）整合
- secret 値の AI コンテキスト混入防止ルール（実値非混入 / 1Password 参照のみ）整合
- 親 UT-06-FU-A runbook との link 整合 / 役割分担（spec vs 実 deploy）の明確さ
- solo 運用ポリシー整合（required reviewers=0 / CI gate のみで保護）

### ステップ 4: PR 作成（user 承認後のみ・本 Phase では実行しない / 仕様としてコマンドのみ記述）

> **本コマンドは仕様書として記述するのみ**。Phase 13 内で Claude Code は **実行しない**。
> user の明示承認後の実行手順として参照する。

```bash
# 現在のブランチが feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec であることを確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . / git add -A は使わない）
git add docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ \
        docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
        .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
        .claude/skills/aiworkflow-requirements/indexes/keywords.json

# コミット
git commit -m "$(cat <<'EOF'
docs(ut-06-fu-a): apps/web production Worker route/secret/observability 移行確認タスク仕様書 (Refs #246)

- Phase 1〜13 の仕様書を docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ に追加
- production Worker 名分離に伴う route 切替 / secret 再投入 / observability 設定の verification runbook を spec として整備
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」(scripts/cf.sh 一本化) 整合
- Phase 12 same-wave sync（aiworkflow indexes + 原典 unassigned status）完了
- workflow_state は spec_created を維持（実 deploy は親 UT-06-FU-A 配下で別途実施）

Refs #246
EOF
)"

# push
git push -u origin feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec

# PR 作成（base=main / head=feat ブランチ、solo 運用ポリシー: required reviewers=0、CI gate のみで保護）
gh pr create \
  --title "[UT-06-FU-A-PROD-ROUTE-SECRET-001] apps/web production Worker route / secret / observability 移行確認 task spec" \
  --base main \
  --head feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec \
  --body "$(cat <<'EOF'
## Summary
- UT-06-FU-A-PROD-ROUTE-SECRET-001 の **タスク仕様書のみ** を docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ 配下に追加します。
- production Worker 名分離に伴う route 切替 / secret 再投入 / observability 設定の verification runbook を spec として整備しました（実コード変更なし / 実 deploy は親 UT-06-FU-A 配下の手動 cutover）。
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（scripts/cf.sh 一本化 / wrangler 直呼び禁止）と secret 値非混入ポリシーを runbook に反映済みです。

## 動機
- GitHub Issue: #246（CLOSED 状態のため `Refs #246`）
- 親タスク UT-06-FU-A（OpenNext Workers migration）の production cutover 前ゲート整備
- CLAUDE.md 不変条件 #5（D1 直アクセスは apps/api に閉じる）整合の前提

## 変更内容
- 新規: docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/（13 Phase + index + artifacts.json + outputs/）
- 同期: .claude/skills/aiworkflow-requirements/indexes/{topic-map,resource-map,quick-reference,keywords}（same-wave sync）
- 更新: docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md の状態を spec_created に変更

## 含まないもの（明示）
- apps/web/wrangler.toml（routes / secrets bindings / observability 設定の実コード変更は親 UT-06-FU-A 後続 PR）
- apps/api/wrangler.toml（同上）
- apps/web/src/** / apps/api/src/**（アプリコードは別 PR）
- 実 secret 値 / *.dev.vars / .env（1Password 参照のみが正本）

## 影響範囲
- docs only（実コード未変更）
- production Worker / D1 / route / secret / observability への影響なし

## リスク
- なし（docs-only）

## レビュー観点
- AC カバレッジ（Phase 0 受入基準が runbook に網羅）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合（scripts/cf.sh 一本化）
- secret 値非混入（grep 0 件）
- 親 UT-06-FU-A runbook との相互 link 整合
- solo 運用ポリシー整合（required reviewers=0 / CI gate のみで保護）

## Test plan
- [x] typecheck / lint / verify-indexes / unit / integration: 全 PASS（local-check-result 記録）
- [x] secret 値 grep（CLOUDFLARE_API_TOKEN / OAuth / database_id 実値）: 0 件
- [x] wrangler 直呼び grep: 0 件（scripts/cf.sh 一本化）
- [x] spec PR 境界 grep（apps/web / apps/api 実コード混入）: 0 件
- [x] 親 UT-06-FU-A runbook 相互 link: 1 件以上
- [ ] CI gate（typecheck / lint / verify-indexes / unit / integration）全 green を `gh pr checks` で確認
- [ ] reviewer による runbook 内容レビュー

## 関連 Issue
Refs #246
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `[UT-06-FU-A-PROD-ROUTE-SECRET-001] apps/web production Worker route / secret / observability 移行確認 task spec` |
| body | Summary / 動機 / 変更内容 / 含まないもの / 影響範囲 / リスク / レビュー観点 / Test plan / 関連 Issue（上記 HEREDOC 参照） |
| base | `main`（solo 運用 / `feature/* → main` 直 PR、CLAUDE.md ブランチ戦略・solo ポリシー準拠） |
| head | `feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec` |
| reviewer | required reviewers=0（solo 運用 / CI gate のみで保護） |
| labels | `area:docs` / `task:UT-06-FU-A` / `wave:cutover-gate` / `spec-only` |
| linked issue | #246（`Refs #246`、Issue は CLOSED のため `Closes` は使用しない） |

## CI gate 通過条件

| gate | 条件 | 必須 |
| --- | --- | --- |
| typecheck | exit 0 | YES |
| lint | exit 0 | YES |
| verify-indexes-up-to-date | `.claude/skills/aiworkflow-requirements/indexes` に drift なし | YES |
| unit test | 全 PASS | YES |
| integration test | 全 PASS | YES |
| codeowners 構文 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}` | 参考 |

> docs-only 変更のため typecheck / lint / unit / integration への実質的影響なし。CI gate は構成保護のため必須通過とする。

## pre-merge チェックリスト

- [ ] Phase 12 same-wave sync が完了（aiworkflow indexes + 原典 unassigned status）
- [ ] root `artifacts.json` と `outputs/artifacts.json` が parity（drift 0）
- [ ] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true`
- [ ] GitHub Issue #246 が PR 本文に `Refs #246` で記載（Issue は CLOSED のため `Closes` を使用しない）
- [ ] `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / `apps/**/src/**` 配下の変更が 0 件（spec PR 境界遵守）
- [ ] secret 値 grep 0 件（CLOUDFLARE_API_TOKEN / OAuth / database_id 実値）
- [ ] `wrangler` 直呼び grep 0 件（`scripts/cf.sh` 一本化）
- [ ] CI gate（typecheck / lint / verify-indexes / unit / integration）全 green
- [ ] Phase 11 NON_VISUAL evidence（runbook / grep / link 整合のテキスト証跡）が PR 本文から辿れる
- [ ] Phase 12 phase12-task-spec-compliance-check の PASS 判定 link
- [ ] CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 経由 / `wrangler` 直呼び禁止）が runbook に反映されている
- [ ] 親 UT-06-FU-A runbook との相互 link が壊れていない

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域** とし、Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch
```

### タスク完了処理（merge 後）

- `artifacts.json` の `phases[0..11].status` を `completed` に更新
- `artifacts.json` の `phases[12].status` は `pending_user_approval` のまま据え置き、merge 確認後に `completed` へ更新（実 PR 作成・merge は user 操作のため、Claude が自動で書き換えない）
- `metadata.workflow_state` は `spec_created` のまま据え置き（実 deploy 実施は親 UT-06-FU-A 担当）
- LOGS 反映方針:
  - `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / merge 日時を追記
  - `outputs/phase-13/pr-creation-result.md` に実行ログを追記
  - 親 UT-06-FU-A 配下 runbook に「spec 完了」link back（spec_created 維持）

## ロールバック手順

PR 作成後に問題が発覚した場合の手順を以下に明示する（user 操作）。

```bash
# 1. PR をクローズ（merge していない場合）
gh pr close <PR番号> --comment "rollback: <理由>"

# 2. リモートブランチを削除
git push origin --delete feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec

# 3. ローカルブランチを削除（必要時）
git branch -D feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec

# 4. artifacts.json の phases[12].status を pending_user_approval に戻す（既にそうなっていれば変更不要）
```

> merge 後に問題が発覚した場合は、新規 PR で revert を作成する（`gh pr create` で revert 用 commit を含む PR）。docs-only のため revert 影響は限定的。

## 変数一覧

| 変数 | 値 |
| --- | --- |
| TASK_ID | `UT-06-FU-A-PROD-ROUTE-SECRET-001` |
| BRANCH | `feat/issue-246-ut-06-fu-a-prod-route-secret-001-task-spec` |
| BASE | `main` |
| PR_TITLE | `[UT-06-FU-A-PROD-ROUTE-SECRET-001] apps/web production Worker route / secret / observability 移行確認 task spec` |
| ISSUE_LINK | `Refs #246`（CLOSED Issue のため `Closes` 不使用） |
| LABELS | `area:docs` / `task:UT-06-FU-A` / `wave:cutover-gate` / `spec-only` |
| 添付スコープ | `docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` 配下 + indexes 4 ファイル + 原典 unassigned 1 ファイル |
| 親タスク link | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` |
| 除外スコープ | `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / `apps/**/src/**` / 実 secret 値 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | NON_VISUAL evidence（runbook / grep / link 整合のテキスト証跡）を PR の Test plan セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 |

## 多角的チェック観点

- 価値性: PR が Issue #246 の spec 段階成果物（route / secret / observability verification runbook）を網羅しているか。
- 実現性: local-check-result が typecheck / lint / verify-indexes / test すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか / 親 UT-06-FU-A runbook との相互 link が維持されているか。
- 運用性: PR description が後続実 deploy 担当者（親 UT-06-FU-A）に必要十分な情報を含むか。
- 認可境界: コミット差分に `CLOUDFLARE_API_TOKEN` 実値 / OAuth トークン / `database_id` 実値 / 会員データが混入していないか（grep）。
- 後方互換性: spec のみで実コード変更がないことを diff レビューで再確認したか。
- 境界遵守: `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / `apps/**/src/**` への変更が 0 件であることを `git diff --name-only` で確認したか。
- CLI 統制: runbook / spec 内に `wrangler ` 直呼びが含まれず、`bash scripts/cf.sh` 一本化が徹底されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | pending_user_approval | **user 承認なし禁止** |
| 2 | local-check-result（typecheck/lint/verify-indexes/test） | 13 | pending_user_approval | 全 PASS |
| 3 | secret 値 grep | 13 | pending_user_approval | 0 件 |
| 4 | `wrangler` 直呼び grep | 13 | pending_user_approval | 0 件（`scripts/cf.sh` 一本化） |
| 5 | spec PR 境界 grep（実コード混入） | 13 | pending_user_approval | 0 件 |
| 6 | 親 UT-06-FU-A runbook link 整合 | 13 | pending_user_approval | 1 件以上 |
| 7 | change-summary 作成 | 13 | pending_user_approval | user 提示用 |
| 8 | branch / commit / push | 13 | pending_user_approval | 承認後のみ・本 Phase で実行しない |
| 9 | gh pr create | 13 | pending_user_approval | base=main / head=feat/issue-246-... / 本 Phase で実行しない |
| 10 | CI 確認 | 13 | pending_user_approval | gh pr checks |
| 11 | マージ手順記録（user 操作） | 13 | pending_user_approval | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check-result + change-summary + 承認ログ |
| テンプレ | outputs/phase-13/pr-template.md | PR title / body テンプレと CI gate 一覧 |
| 結果 | outputs/phase-13/pr-info.md | PR 作成後の URL / CI 結果（承認後のみ） |
| 結果 | outputs/phase-13/pr-creation-result.md | PR 作成プロセスの実行ログ（承認後のみ） |
| PR | user 承認後に作成 | UT-06-FU-A-PROD-ROUTE-SECRET-001 spec PR（Issue #246 Refs） |
| メタ | artifacts.json | 全 Phase 状態の更新（merge 後 phases[0..11] completed / phases[12] は user 操作後 completed / workflow_state は spec_created 維持） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / verify-indexes / test 全 PASS
- [ ] secret 値 grep が 0 件
- [ ] `wrangler` 直呼び grep が 0 件（`scripts/cf.sh` 一本化）
- [ ] `apps/web` / `apps/api` 実コード混入 grep が 0 件
- [ ] 親 UT-06-FU-A runbook 相互 link が維持されている
- [ ] change-summary が PR body と一致している
- [ ] PR が作成され Issue #246 に紐付いている（`Refs #246` / Issue CLOSED のため `Closes` 不使用）
- [ ] CI（`gh pr checks`）が green
- [ ] solo 運用ポリシーに従い required reviewers=0 / CI gate で保護されている
- [ ] マージ後、`phases[0..11].status` が `completed` / `phases[12].status` は user 操作後に `completed` / `metadata.workflow_state` は `spec_created` 維持

## タスク100%実行確認【必須】

- 全実行タスク（11 件）が `pending_user_approval`
- 承認ゲートが他のすべての手順より先行する設計
- approval 取得前に commit / push / PR 作成しない方針が冒頭・承認ゲート・ステップ 1・ステップ 4 の 4 箇所で明文化されている
- 本 Phase では PR 作成コマンドを **記述のみ**（実行しない）として扱う方針が明文化されている
- マージ操作は user の領域として明確に分離されている
- artifacts.json の `phases[12].user_approval_required = true` / `status = pending_user_approval`
- `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` 維持
- 実 deploy は親 UT-06-FU-A 配下で別途実施する旨を明示

## 次 Phase

- 次: なし（タスク仕様書としては完了 / 後続は親 UT-06-FU-A 配下の実 deploy / cutover）
- 引き継ぎ事項:
  - 実 deploy（`apps/web/wrangler.toml` の routes / secrets bindings / observability 設定変更 / `bash scripts/cf.sh deploy` 実行）は親 UT-06-FU-A 配下の後続 PR / 手動 cutover で行う
  - 親 UT-06-FU-A runbook に spec 完了 link back を追加し、cutover 直前ゲートとして本 spec を参照させる
  - artifacts.json の `phases[*].status` を `completed` に更新（user マージ後）。`metadata.workflow_state` は `spec_created` を維持
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 / 12 へ差し戻し）
  - secret 値 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - `wrangler` 直呼び grep で 1 件以上検出（→ 即時停止 / Phase 12 CLI 統制再確認）
  - `apps/web` / `apps/api` 実コードへの変更が混入（→ 即時停止 / spec PR 境界違反）
  - 親 UT-06-FU-A runbook との link が壊れている（→ Phase 12 へ差し戻し）
