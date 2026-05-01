# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-30 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（タスク完了 / 後続は別タスク） |
| 状態 | pending_user_approval |
| タスク分類 | implementation（spec PR + VISUAL evidence / approval gate） |
| visualEvidence | VISUAL |
| workflow_state | spec_created（PR merge 後も `spec_created` を維持。verified 確定後の別タスクで `implemented` に昇格） |
| user_approval_required | **true** |
| ブランチ | `feat/wt-5`（既存） |
| ベース | `main` |

## 目的

Phase 1〜12 の成果物（13 Phase 仕様書 + 4 設計成果物 + Stage A/B/C VISUAL evidence + skill / spec 同期）をまとめて PR を作成し、**ユーザーの明示的な承認**を経てレビュー → マージへ進める。本 PR は `docs/30-workflows/ut-05a-followup-google-oauth-completion/` 配下の仕様書 + outputs evidence と、`02-auth.md` / `13-mvp-auth.md` / `environment-variables.md` / aiworkflow indexes の参照リンク同期を対象とする。`apps/api/` / `apps/web/` のコード変更は本 PR に含めない。

> **重要: 本 Phase は user の明示的な承認なしに実行してはならない。**
> approval 取得前に commit / push / PR 作成を一切実行しない。Claude Code は本仕様書段階では commit / push / PR を行わない。

## 統合 issue の取り扱い【重要】

- 統合元 GitHub Issue: **#251**（staging OAuth smoke evidence）/ **#252**（production Google OAuth verification）
- 両 issue は本タスク仕様書作成時点で **closed**。closed のまま運用する（ユーザー指示）。
- そのため PR 本文では `Closes #251` / `Closes #252` は **使わない**。
- 代わりに `Refs #251` / `Refs #252` または `Followup of #251 / #252` 形式で参照する。
- 仮に審査結果（verification verified 等）で issue を再 open する場合は、別タスクで対応し、本タスクの境界には含めない。

## 承認ゲート（approval gate）【最優先 / 必須】

| ゲート項目 | 確認内容 | 状態 |
| --- | --- | --- |
| Phase 10 GO 判定 | `outputs/phase-10/go-no-go.md` が GO（PASS） | 要確認 |
| Phase 11 Stage A/B/C 合否 | Stage A=PASS / Stage B=PASS or WAITING(submitted) / Stage C=PASS | 要確認 |
| Phase 11 VISUAL evidence | screenshot 9 枚以上 + session JSON 2 + wrangler-dev.log + consent-screen.png + verification-submission.md + login-smoke.png | 要確認 |
| Phase 12 compliance check | 必須 7 ファイル PASS / workflow_state=spec_created 維持 | 要確認 |
| change-summary レビュー | user が PR 内容（spec + evidence / コード変更なし）を把握 | **user 承認待ち** |
| 機密情報の非混入 | screenshot / log / JSON で client_id / client_secret / project ID / mail / cookie / database_id / API token がマスク済 | 要確認 |
| spec_created 維持確認 | `artifacts.json` の `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = false` / `metadata.visualEvidence = "VISUAL"` | 要確認 |
| `apps/api/` `apps/web/` コード非混入 | OAuth 設定変更は repo 外（GCP / Cloudflare）/ コード差分 0 | 要確認 |
| `wrangler login` 不在 | `~/Library/Preferences/.wrangler/config/default.toml` 不在 | 要確認 |
| issue 参照形式 | `Refs #251` / `Refs #252`（`Closes` 不使用） | 要確認 |
| PR 作成実行 | **user の明示的な指示があった場合のみ実行** | **承認待ち** |

> **本ゲートが PASS するまで `git commit` / `git push` / `gh pr create` を一切実行しない**。

## 実行タスク

1. 承認ゲートを通過する（user に change-summary を提示し、明示承認を取得）。
2. local-check-result（typecheck / lint / verify-indexes / unit / integration）を実行・記録。
3. change-summary（PR description 草案）を作成。
4. user 承認後、commit → push → PR 作成を実行（branch=feat/wt-5 / base=main）。
5. CI 確認と承認後マージの手順を記録（マージ実行は user 操作）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-12/documentation-changelog.md | PR 変更ファイル一覧の根拠 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-12/phase12-task-spec-compliance-check.md | 承認ゲート前提 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/main.md | VISUAL evidence サマリー |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/index.md | PR タイトル / 説明根拠 |
| 必須 | CLAUDE.md | ブランチ戦略（feature/* → main）/ solo 運用ポリシー / scripts/cf.sh / wrangler login 禁止 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-13.md | PR テンプレ参照 |

## 実行手順

### ステップ 1: 承認ゲート通過（user 承認必須）

1. Phase 10 GO 判定 / Phase 11 Stage A/B/C 合否 / Phase 12 compliance check が PASS していることを確認。
2. Stage B が `submitted`（WAITING）の場合も完了扱いとして PR は進められる旨を user に明示。
3. `git status` で `apps/api/` / `apps/web/` 配下に変更が無いことを確認（spec + evidence PR の境界遵守）。
4. screenshot / log / JSON のマスク済みを再点検（`git diff` を grep でチェック）。
5. change-summary を user に提示し、**明示的な承認**を待つ。
6. 承認取得後にステップ 2 へ。承認が得られない場合はここで停止し、指摘事項を Phase 5 / 11 / 12 に差し戻す。

> **Claude Code は本仕様書段階では commit / push / PR を行わない。** approval 後の実行段階でのみ以下を行う。

### ステップ 2: local-check-result（PR 前ローカル確認）

```bash
# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# Indexes drift 検証（CI verify-indexes と同等）
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes

# 単体テスト
mise exec -- pnpm test

# 機密情報 grep（OAuth client_id / client_secret / API token / cookie / mail パターン）
git diff main..HEAD | grep -nE "ya29\.|GOCSPX-|-----BEGIN|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|@gmail\.com" || echo "OK: no secrets"

# コード差分 0 件チェック（spec + evidence PR 境界）
git diff --name-only main..HEAD | grep -E "^(apps/api|apps/web|packages)/" && echo "BLOCKED: code change混入" || echo "OK: spec + evidence only"

# wrangler login 不在チェック
test ! -f ~/Library/Preferences/.wrangler/config/default.toml && echo "OK: no wrangler login" || echo "BLOCKED: wrangler login token exists"
```

| チェック項目 | 期待値 | 記録先 |
| --- | --- | --- |
| typecheck | exit 0 | outputs/phase-13/main.md §local-check |
| lint | exit 0 | 同上 |
| verify-indexes | drift 0 | 同上 |
| test (unit / integration) | 全 PASS | 同上 |
| `git status` で意図せぬ変更が無い | clean | 同上 |
| 機密情報 grep | 0 件 | 同上 |
| `apps/{api,web}` / `packages/` 混入 | 0 件 | 同上 |
| `wrangler login` 不在 | 不在 | 同上 |

### ステップ 3: change-summary（PR description 草案）

`outputs/phase-13/main.md` および `outputs/phase-13/pr-template.md` に以下構造で記述する。

#### 概要

UT-05A-FOLLOWUP-OAUTH（GitHub Issue #251 / #252 統合）の **タスク仕様書 + Stage A/B/C VISUAL evidence + skill / spec 参照同期** を `docs/30-workflows/ut-05a-followup-google-oauth-completion/` に整備する。OAuth 設定変更（Google Cloud Console / Cloudflare Secrets）は repo 外で実施済み（または submitted で待機中）であり、本 PR にはコード変更を含まない。

#### 動機

- GitHub Issue: #251（staging OAuth smoke evidence）/ #252（production Google OAuth verification） — **両 issue は closed のまま統合扱い**
- 05a Phase 11 で取得できなかった OAuth 可視 evidence の上書きと、本番公開前に必須の Google OAuth verification 申請を単一仕様書で完結
- B-03（testing user 以外ログイン不能）解除条件 a (verified) または b (submitted 暫定) の達成記録
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（scripts/cf.sh 経由 / wrangler 直呼び禁止）の徹底

#### 変更内容

**新規ファイル一覧（spec + evidence）**:

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/index.md`
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-01.md` 〜 `phase-13.md`（13 Phase）
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/artifacts.json`
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-01/` 〜 `outputs/phase-13/`（各 Phase 成果物）
- `outputs/phase-11/staging/`（screenshot 9+ / session JSON 2 / wrangler-dev.log / curl / redirect-uri-actual.md）
- `outputs/phase-11/production/`（consent-screen.png / verification-submission.md / login-smoke.png / url-200-check.txt）

**修正ファイル一覧（Phase 12 same-wave sync 起因）**:

- `docs/00-getting-started-manual/specs/02-auth.md`（secrets 配置参照リンク追加）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`（B-03 解除状態更新 + verification-submission.md 参照）
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`（secrets-placement-matrix 双方向リンク）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md`（OAuth evidence 参照を本タスク outputs に上書き）
- `docs/30-workflows/unassigned-task/05a-authjs-google-oauth-admin-gate/05a-followup-001-staging-oauth-smoke-evidence.md`（状態更新 / merged_into link）
- `docs/30-workflows/unassigned-task/05a-authjs-google-oauth-admin-gate/05a-followup-002-google-oauth-verification.md`（同上）

**含まないファイル（明示）**:

- `apps/api/**` / `apps/web/**` / `packages/**`（OAuth 実装は 05a で完了済み / 本タスクは設定運用のみ）
- 実 OAuth client / client_secret / project ID（Google Cloud Console 内 / 1Password / Cloudflare Secrets で管理）

#### 動作確認

- Phase 11 Stage A: M-01〜M-11 / F-09 / F-15 / F-16 / B-01 すべて PASS（screenshot 9+ / session JSON 2 / wrangler-dev.log）
- Phase 11 Stage B: consent screen Production publishing で submitted（または verified）
- Phase 11 Stage C: 外部 Gmail account で `/login` → 着地ページ到達（screenshot 配置済）
- typecheck / lint / verify-indexes / unit / integration: 全 PASS
- 機密情報 grep: 0 件（client_id / client_secret / project ID / mail / cookie / token / database_id すべてマスク済）
- コード差分 grep（`apps/{api,web}` / `packages/`）: 0 件
- `~/Library/Preferences/.wrangler/config/default.toml`: 不在

#### リスク・後方互換性

- **破壊的変更なし**（spec ドキュメント + VISUAL evidence のみ / コード変更 0）
- OAuth 設定変更は repo 外で完了済み（または submitted 待機中）。本 PR が merge されても production OAuth 動作には追加影響なし
- skill / spec 参照リンク追加は読み手向けの導線整備であり、機能挙動には影響しない

#### B-03 解除状態（明示）

- 解除条件 a (verified): `outputs/phase-11/production/verification-submission.md` の publishing status が `Verified` の場合
- 解除条件 b (submitted 暫定): publishing status が `In production - Verification in progress` の場合（本タスクは b で完了扱い可）
- 解除条件 c (testing user 拡大): 採用しない（運用負債化）

#### workflow_state 維持の確認

- `artifacts.json` の `metadata.workflow_state = "spec_created"` を merge 後も維持
- verification verified 確定後に別タスク（UT-05A-FOLLOWUP-OAUTH-CLEANUP 等）で `implemented` に昇格させる
- 本 PR は spec + evidence 境界のため、`apps/{api,web}` / `packages/` のコード変更は含めない

### ステップ 4: PR 作成（user 承認後のみ）

```bash
# 現在のブランチが feat/wt-5 であることを確認
git status
git branch --show-current

# 必要なファイルを明示的に add（git add . / git add -A は使わない）
git add docs/30-workflows/ut-05a-followup-google-oauth-completion/ \
        docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md \
        docs/30-workflows/unassigned-task/05a-authjs-google-oauth-admin-gate/05a-followup-001-staging-oauth-smoke-evidence.md \
        docs/30-workflows/unassigned-task/05a-authjs-google-oauth-admin-gate/05a-followup-002-google-oauth-verification.md \
        docs/00-getting-started-manual/specs/02-auth.md \
        docs/00-getting-started-manual/specs/13-mvp-auth.md \
        .claude/skills/aiworkflow-requirements/references/environment-variables.md \
        .claude/skills/aiworkflow-requirements/indexes/topic-map.md \
        .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
        .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
        .claude/skills/aiworkflow-requirements/indexes/keywords.json

# コミット（HEREDOC で改行整形）
git commit -m "$(cat <<'EOF'
docs(ut-05a-followup): Google OAuth staging smoke + production verification 統合タスク仕様書 (Refs #251 #252)

- Phase 1〜13 の仕様書 + 4 設計成果物 + Stage A/B/C VISUAL evidence
- secrets-placement-matrix を 02-auth.md / 13-mvp-auth.md / environment-variables.md から参照する単一正本化
- 05a Phase 11 placeholder を本タスク outputs にリンク上書き
- B-03 解除条件 a (verified) または b (submitted 暫定) の達成記録
- workflow_state は spec_created を維持（コード変更なし / OAuth 設定は repo 外）

Refs #251
Refs #252
EOF
)"

# push（既存ブランチ feat/wt-5）
git push origin feat/wt-5

# PR 作成（base=main / head=feat/wt-5、solo 運用ポリシー: required reviewers=0）
gh pr create \
  --title "docs(ut-05a-followup): Google OAuth staging smoke + production verification 統合 (Refs #251 #252)" \
  --base main \
  --head feat/wt-5 \
  --body "$(cat <<'EOF'
## 概要
UT-05A-FOLLOWUP-OAUTH（Issue #251 / #252 統合 / 両 issue は closed のまま）のタスク仕様書 + Stage A/B/C VISUAL evidence + skill / spec 参照同期を整備します。OAuth 設定変更（Google Cloud Console / Cloudflare Secrets）は repo 外で実施済み（または submitted 待機中）であり、本 PR にコード変更は含まれません。

## 動機
- Issue: #251 (staging OAuth smoke evidence) / #252 (production Google OAuth verification)
- 05a Phase 11 で未取得だった OAuth 可視 evidence の上書きと verification 申請の単一ワークフロー化
- B-03（testing user 以外ログイン不能）解除条件 a / b の達成記録
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」(scripts/cf.sh 経由) の徹底

## 変更内容
- 新規: docs/30-workflows/ut-05a-followup-google-oauth-completion/（13 Phase + index + artifacts.json + outputs）
- 新規: outputs/phase-11/staging/（screenshot / session JSON / log）
- 新規: outputs/phase-11/production/（consent-screen.png / verification-submission.md / login-smoke.png）
- 同期: docs/00-getting-started-manual/specs/02-auth.md / 13-mvp-auth.md（secrets 配置 / B-03 状態 参照リンク追加）
- 同期: .claude/skills/aiworkflow-requirements/references/environment-variables.md（secrets-placement-matrix 双方向リンク）
- 同期: aiworkflow indexes（topic-map / resource-map / quick-reference / keywords）
- 上書き: 05a Phase 11 main.md の OAuth evidence 参照を本タスク outputs に統合
- 更新: 05a 原典 unassigned-task 2 件（followup-001 / -002）を spec_created または merged_into に更新

## 含まないもの（明示）
- apps/api/** / apps/web/** / packages/**（OAuth 実装は 05a で完了済み）
- 実 OAuth client_id / client_secret / project ID / 会員 mail（GCP / 1Password / Cloudflare Secrets で管理 / マスク済）

## 動作確認
- Phase 11 Stage A: M-01〜M-11 / F-09 / F-15 / F-16 / B-01 全 PASS（screenshot 9+ / session JSON 2 / wrangler-dev.log）
- Phase 11 Stage B: consent screen Production publishing で submitted（または verified）
- Phase 11 Stage C: 外部 Gmail account で /login → 着地ページ到達
- typecheck / lint / verify-indexes / unit / integration: 全 PASS
- 機密情報 grep: 0 件（マスク済）
- コード差分 grep（apps/{api,web}/packages/）: 0 件
- ~/Library/Preferences/.wrangler/config/default.toml: 不在

## B-03 解除状態
- 採用: 解除条件 a (verified) または b (submitted 暫定 / verification in progress)
- 不採用: 解除条件 c (testing user 拡大 / 運用負債化)

## リスク・後方互換性
- 破壊的変更なし（spec + evidence のみ / コード変更 0）
- production OAuth 動作への追加影響なし
- workflow_state は spec_created を維持

## 関連 Issue
- Refs #251 (両 issue は closed のまま統合 / Closes ではなく Refs で参照)
- Refs #252
EOF
)"
```

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(ut-05a-followup): Google OAuth staging smoke + production verification 統合 (Refs #251 #252)` |
| body | 概要 / 動機 / 変更内容 / 含まないもの / 動作確認 / B-03 解除状態 / リスク / 関連 Issue（上記参照） |
| base | `main`（solo 運用 / `feature/* → main` 直 PR / CLAUDE.md ブランチ戦略） |
| head | `feat/wt-5`（既存 worktree ブランチ） |
| reviewer | required reviewers=0（solo 運用 / CI gate のみで保護） |
| labels | `area:auth` / `task:UT-05A-FOLLOWUP-OAUTH` / `wave:2-plus` / `spec-and-evidence` |
| linked issue | #251 / #252（**Refs** / Closes 不使用 / 両 issue closed のまま統合扱い） |

## CI gate 通過条件

| gate | 条件 | 必須 |
| --- | --- | --- |
| typecheck | exit 0 | YES |
| lint | exit 0 | YES |
| verify-indexes-up-to-date | `.claude/skills/aiworkflow-requirements/indexes` に drift なし | YES |
| unit test | 全 PASS | YES |
| integration test | 全 PASS | YES |
| codeowners 構文 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}` | 参考 |

## solo 運用ポリシー（CLAUDE.md 準拠）

- `required_pull_request_reviews=null`（必須レビュアー 0）
- 品質保証: `required_status_checks` / `required_linear_history` / `required_conversation_resolution` / force-push & 削除禁止
- `enforce_admins=true`
- 本 PR は solo dev / CI gate のみで保護される

## pre-merge チェックリスト

- [ ] Phase 12 same-wave sync 完了（aiworkflow indexes + 原典 unassigned 2 件 + 05a placeholder + environment-variables）
- [ ] root `artifacts.json` と `outputs/artifacts.json` が parity（drift 0）
- [ ] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = false` / `metadata.visualEvidence = "VISUAL"`
- [ ] PR 本文で #251 / #252 が **Refs** で記載（Closes 不使用）
- [ ] `apps/{api,web}` / `packages/` 配下の変更 0 件
- [ ] 機密情報 grep 0 件（client_id / client_secret / project ID / mail / cookie / token / database_id）
- [ ] CI gate 全 green
- [ ] Phase 11 VISUAL evidence のメタ情報（Stage A/B/C 合否 / screenshot 件数 / マスク方針）が PR 本文から辿れる
- [ ] Phase 12 phase12-task-spec-compliance-check の PASS link
- [ ] CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` / `wrangler` 直呼び禁止）が runbook に反映
- [ ] `~/Library/Preferences/.wrangler/config/default.toml` 不在を local-check で確認済
- [ ] B-03 解除条件 a / b のどちらで完了扱いか PR 本文に明記

## 承認後の自動同期手順（user 操作）

PR 作成後の以下は **user の操作領域**。Claude は実行しない（指示があれば補助コマンドの提示のみ）。

```bash
# CI 確認
gh pr checks <PR番号>

# user による承認後のマージ（user 操作）
gh pr merge <PR番号> --squash --delete-branch=false  # feat/wt-5 は worktree の都合で残す可能性あり
```

- マージ後、`artifacts.json` の `phases[*].status` を `completed` に更新（ただし `metadata.workflow_state` は `spec_created` を維持）。
- verification verified 確定後に別タスク（UT-05A-FOLLOWUP-OAUTH-CLEANUP 等）で `13-mvp-auth.md` の B-03 状態を `submitted` から `verified` に更新し、`workflow_state` を `implemented` に昇格させる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO 判定を承認ゲートの前提として再利用 |
| Phase 11 | Stage A/B/C VISUAL evidence を PR 動作確認セクションに転記 |
| Phase 12 | documentation-changelog から変更ファイルリストを生成 |

## 多角的チェック観点

- 価値性: PR が Issue #251 / #252 の統合成果（spec + VISUAL evidence + B-03 解除記録）を網羅しているか。
- 実現性: local-check-result が typecheck / lint / verify-indexes / test すべて PASS か。
- 整合性: change-summary が Phase 12 documentation-changelog と一致しているか。
- 運用性: PR description が verified 確定後の cleanup タスク担当者に必要十分な情報を含むか。
- 認可境界: コミット差分に client_id / client_secret / project ID / 会員 mail / cookie / token / database_id が混入していないか（grep）。
- 後方互換性: spec + evidence のみで実コード変更がないことを diff レビューで再確認したか。
- 境界遵守: `apps/{api,web}` / `packages/` への変更が 0 件であることを `git diff --name-only` で確認したか。
- issue 参照形式: `Closes` ではなく `Refs` で記載しているか（両 issue closed のまま統合扱い）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 承認ゲート通過 | 13 | spec_created | **user 承認なし禁止** |
| 2 | local-check-result | 13 | spec_created | typecheck/lint/verify-indexes/test 全 PASS |
| 3 | 機密情報 grep | 13 | spec_created | 0 件 |
| 4 | コード差分 0 件 grep | 13 | spec_created | apps/{api,web} / packages/ 不在 |
| 5 | wrangler login 不在チェック | 13 | spec_created | ~/Library/Preferences/.wrangler/ 不在 |
| 6 | change-summary 作成 | 13 | spec_created | user 提示用 |
| 7 | commit / push | 13 | spec_created | 承認後のみ / branch=feat/wt-5 |
| 8 | gh pr create | 13 | spec_created | base=main / head=feat/wt-5 / Refs #251 #252 |
| 9 | CI 確認 | 13 | spec_created | gh pr checks |
| 10 | マージ手順記録（user 操作） | 13 | spec_created | Claude は実行しない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | local-check-result + change-summary + 承認ログ |
| テンプレ | outputs/phase-13/pr-template.md | PR title / body テンプレと CI gate 一覧 |
| 結果 | outputs/phase-13/pr-info.md | PR URL / CI 結果（承認後のみ） |
| 結果 | outputs/phase-13/pr-creation-result.md | PR 作成プロセス実行ログ（承認後のみ） |
| PR | user 承認後に作成 | UT-05A-FOLLOWUP-OAUTH spec + evidence PR（Refs #251 / #252） |
| メタ | artifacts.json | 全 Phase 状態の更新（merge 後 phases completed / workflow_state は spec_created 維持） |

## 完了条件

- [ ] 承認ゲートの全項目が PASS（user 明示承認を含む）
- [ ] local-check-result が typecheck / lint / verify-indexes / test 全 PASS
- [ ] 機密情報 grep 0 件
- [ ] `apps/{api,web}` / `packages/` 混入 0 件
- [ ] `wrangler login` 不在
- [ ] change-summary が PR body と一致
- [ ] PR が作成され Issue #251 / #252 に **Refs** で紐付け（Closes 不使用）
- [ ] CI（`gh pr checks`）が green
- [ ] solo 運用ポリシー（required reviewers=0 / CI gate）に準拠
- [ ] マージ後、`phases[*].status = completed` / `metadata.workflow_state = spec_created` 維持
- [ ] B-03 解除条件 a / b のどちらで完了扱いか PR 本文に明記

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 承認ゲートが他のすべての手順より先行する設計
- approval 取得前に commit / push / PR 作成しない方針が明文化
- マージ操作は user の領域として明確に分離
- artifacts.json の `phases[12].user_approval_required = true` / `status = pending_user_approval`
- `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = false` / `metadata.visualEvidence = "VISUAL"` 維持
- 両 issue (#251 / #252) は closed のまま `Refs` で参照（`Closes` 不使用）

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ事項:
  - verification verified 確定後の cleanup は別タスク（UT-05A-FOLLOWUP-OAUTH-CLEANUP 等）で `13-mvp-auth.md` の `submitted` → `verified` 更新 / workflow_state を `implemented` に昇格
  - Magic Link provider 統合タスクで secrets-placement-matrix の DRY 化を活用
  - 本 PR の B-03 解除条件 a / b 達成記録を本番リリース系タスクの上流前提として参照
  - artifacts.json の `phases[*].status` を merge 後 `completed` に更新（ただし `metadata.workflow_state` は `spec_created` を維持）
- ブロック条件:
  - user 承認が無い場合は PR 作成・push を一切実行しない
  - local-check-result のいずれかが FAIL（→ Phase 5 / 11 / 12 に差し戻し）
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 12 secret hygiene 再確認）
  - `apps/{api,web}` / `packages/` への変更が混入（→ 即時停止 / spec + evidence PR 境界違反）
  - PR 本文で `Closes #251` / `Closes #252` を誤って記載（両 issue closed のまま運用方針違反）
