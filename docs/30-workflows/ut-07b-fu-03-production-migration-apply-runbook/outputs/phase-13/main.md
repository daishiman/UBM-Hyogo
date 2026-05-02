# Phase 13: PR 作成（blocked_until_user_approval）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 13 |
| 状態 | blocked_until_user_approval |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. ユーザーの明示承認を取得する（取得前は commit / push / PR 作成いずれも禁止）。
2. 仕様書系コミットを 5 単位以内で分離して commit する。
3. branch を push し、PR を作成する。
4. `outputs/phase-13/main.md` に PR URL / 代表 commit SHA / mergeable 状態を記録する。
5. 本 PR のマージは production 実 apply のトリガーにしないことを PR 本文で明示する。

## 目的

ユーザーの明示承認を得てから、本タスク仕様書（spec_created 段階）に対する commit / push / PR 作成を行う。本 PR は **runbook 文書の起票のみ** を扱い、production D1 への migration apply は本 PR 内で実行しない。

## 三役ゲート

役 1（ユーザー）: Phase 13 着手の明示承認 → 役 2（実行者）: branch push → 役 3（実行者）: PR 作成。承認なしでの push / PR 作成は禁止。承認文言が曖昧な場合は再確認する。

## 必須事前条件

- Phase 1〜12 の成果物が実体として揃っている（本文テンプレートだけでは不可）
- `outputs/phase-12/` の 7 ファイル（`main.md` + 6 補助）が実体として揃っている
- root `artifacts.json` / `outputs/artifacts.json` parity、または root 単独正本宣言が記録されている
- 仕様書・ログに Token 値・Account ID 値・production 実 apply 結果値が含まれていないことを `grep` で確認済み
- Phase 11 の 4 検証（structure / grep / staging dry-run / redaction）が全 PASS で記録されている
- **ユーザーの明示承認**（自動実行禁止）

## コミット粒度（5 単位以内）

| # | 対象 | 概要 |
| --- | --- | --- |
| 1 | `phase-{01..03}.md` 周辺 | 要件・設計（runbook 構造）・レビュー |
| 2 | `phase-{04..10}.md` | テスト戦略・runbook 本体・異常系・AC・DRY・QA・最終レビュー |
| 3 | `phase-{11..13}.md` | Phase 11〜13 仕様 |
| 4 | `index.md` + `artifacts.json` + `outputs/artifacts.json` | メタ整合 |
| 5 | `.claude/skills/**` LOGS / topic-map | global skill sync |

5 単位を超える場合は再分割せず代表 commit に集約する。

## 実行手順

### Step 1: ローカル最終確認（承認後）

```bash
git status
git diff --stat

# Token 値 / Account ID 値混入チェック
rg -i "cloudflare_api_token=|account_id=[a-f0-9]{20,}" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/ \
  || echo "PASS: no token/account-id leakage"

# production 実 apply 結果値混入チェック
rg -i "Applied [0-9]+ migration|production apply result" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/ \
  || echo "PASS: no production apply results recorded"

# 40 文字級英数字の混入チェック（commit/sha/hash/run-id/migration を除外）
rg -nE '\b[A-Za-z0-9_-]{40,}\b' \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/ \
  | grep -vE '(commit|sha|hash|run-id|migration)' \
  || echo "PASS: no suspicious long token-like strings"
```

### Step 2: コミット

```bash
git commit -m "$(cat <<'EOF'
docs(ut-07b-fu-03): production migration apply runbook タスク仕様書

UT-07B 派生タスク UT-07B-FU-03 の Phase 1-13 タスク仕様書を起票。
対象 SQL `apps/api/migrations/0008_schema_alias_hardening.sql` を
本番 D1 (`ubm-hyogo-db-prod`) に適用するための承認ゲート付き runbook を
文書として整備する。

本タスクは runbook 文書整備のみを扱い、production への実 apply は
本タスク・本 PR の範囲外。実 apply はユーザー承認後に別タスクで運用実行する。

Spec is `spec_created`（Phase 1〜12）/ Phase 13 は `blocked_until_user_approval`。
Token / Account ID / production apply 結果値は記録していない。

Refs #363

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Step 3: Push（ユーザー承認後のみ）

```bash
git push -u origin docs/issue-363-ut-07b-fu-03-production-migration-apply-runbook
```

### Step 4: PR 作成（ユーザー承認後のみ）

```bash
gh pr create --base main \
  --title "docs(ut-07b-fu-03): production migration apply runbook タスク仕様書" \
  --body "$(cat <<'EOF'
## Summary

- `UT-07B-FU-03`（production migration apply runbook 文書整備）の Phase 1〜13 タスク仕様書を起票
- 対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
- 対象 DB: `ubm-hyogo-db-prod`（production D1）
- 本 PR はドキュメントのみ。**production への実 migration apply は本 PR 内で実行しない**
- 実 apply はユーザー承認後に別タスクで運用実行する

## Status note

GitHub Issue #363 は既に CLOSED 状態だが、UT-07B Phase 12 の `unassigned-task-detection.md` で seed が未消化のため、本タスク仕様書を `spec_created` として再構築している。Issue 再オープンの要否は Phase 11/12 evidence ベースで判断済みで、本 PR では `Refs #363` を採用し `Closes #363` は採用しない（CLOSED Issue への自動クローズ副作用を避ける）。

Phase 13 の状態は `blocked_until_user_approval` であり、本 PR の作成自体がユーザー明示承認を受けて実行されている。

## Test plan

- [ ] Phase 1〜13 仕様書が揃っている
- [ ] `artifacts.json` parity、または root 単独正本宣言を確認
- [ ] runbook 本体（Phase 5）に preflight / apply / post-check / evidence / failure handling の 5 章が揃っている
- [ ] 仕様書・ログに Token 値・Account ID 値・production 実 apply 結果値が含まれない（grep 確認）
- [ ] Phase 11 の 4 検証（structure / grep / staging dry-run / redaction）が全 PASS
- [ ] **マージ後も production への実 apply は実施しない**（別タスクで運用実行する）

## Boundary（重要）

- 本 PR のマージは production migration apply のトリガーにならない
- 実 apply は本 PR マージ後、ユーザー明示承認のもと別タスクで `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` を runbook に従い実行する
- 本 PR 内で `apps/api/migrations/0008_schema_alias_hardening.sql` の内容変更は行わない（UT-07B で完了済み）

## Related

- Spec root: `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/`
- 上流（completed）: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`
- 並列依存: `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`
- GitHub Issue: #363（CLOSED）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 5: PR URL の記録

`outputs/phase-13/main.md` に以下を記録する:

- PR URL
- branch 名（`docs/issue-363-ut-07b-fu-03-production-migration-apply-runbook`）
- 代表 commit SHA（最大 5 件）
- mergeable 状態（`gh pr view --json mergeable,mergeStateStatus`）
- 本 PR マージ後も production 実 apply は別タスクで運用実行する旨の宣言

## Issue 連携ルール

`Refs #363` を採用する（Issue は既に CLOSED）。`Closes #363` / `Fixes #363` / `Resolves #363` は禁止（CLOSED Issue を再操作しないため）。Issue 再オープンは本 PR ではトリガしない。再オープン要否は Phase 12 で判断済みの方針に従う。

## 完了条件

- [ ] ユーザー明示承認取得済み
- [ ] commit が 5 単位以内で作成されている
- [ ] branch 名が `docs/issue-363-ut-07b-fu-03-production-migration-apply-runbook` で push されている
- [ ] PR が作成されており URL が `outputs/phase-13/main.md` に記録されている
- [ ] PR タイトルが `docs(ut-07b-fu-03): production migration apply runbook タスク仕様書`（または同等）になっている
- [ ] PR 本文に「Issue #363 は CLOSED だが本タスク仕様書は `spec_created` として作成」が明記されている
- [ ] PR 本文に `Refs #363` が含まれ `Closes #363` が含まれない
- [ ] PR 本文に「本 PR 内で production 実 apply は実行しない」が明記されている
- [ ] commit message / PR 本文に Token 値・Account ID 値・production 実 apply 結果値が含まれない

## 成果物

- `outputs/phase-13/main.md`（PR URL / branch / commit SHA / mergeable 状態 / production 実 apply 非実行宣言を記録）

## 関連リンク

- `index.md`
- Phase 11 成果物（4 検証ログ）
- Phase 12 成果物（7 ファイル）
- 上流（completed）: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`
- 並列依存: `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/363（CLOSED）

## 苦戦想定

- ユーザー明示承認なしの push が最大リスク。承認文言「Phase 13 を実施してよい」が出るまで待機する。
- `Closes #363` を反射的に書かない（CLOSED Issue のため `Refs #363` を厳守）。
- 本 PR をマージしたら production 実 apply もこの流れで走らせたくなるが、**マージは runbook 文書の起票完了であって運用実行のトリガーではない**。実 apply は別タスクで運用承認のうえ実施する境界を PR 本文 / commit message / `outputs/phase-13/main.md` の 3 箇所で固定する。
- commit が 5 単位を超えないよう、仕様書系 3 + メタ整合 1 + skill sync 1 に集約する。
- 本 PR マージ後も `workflow_state` は `spec_created` のまま。実 apply は別タスク・別 PR とし、本タスク自体は `completed` 化しない。
