# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 13 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. ユーザーの明示承認を取得する（取得前は commit / push / PR 作成いずれも禁止）。
2. 仕様書系コミットと運用系（Cloudflare Dashboard / Secret 更新ログ）を分離して 5 単位以内で commit する。
3. branch を push し、PR を作成する。
4. `outputs/phase-13/main.md` に PR URL / commit SHA / mergeable 状態を記録する。

## 目的

ユーザーの明示承認を得てから、本タスク仕様書（spec_created 段階）に対する commit / push / PR 作成を行う。

## 三役ゲート

役 1（ユーザー）: Phase 13 着手の明示承認 → 役 2（実行者）: branch push → 役 3（実行者）: PR 作成。承認なしでの push / PR 作成は禁止。承認文言が曖昧な場合は再確認する。

## 必須事前条件

- Phase 1〜12 の成果物が実体として揃っている（本文テンプレートだけでは不可）
- `outputs/phase-12/` の 7 ファイル（main.md + 6 補助）が実体として揃っている
- root `artifacts.json` / `outputs/artifacts.json` parity、または root 単独正本宣言が記録されている
- 仕様書・ログに Token 値・Account ID 値が含まれていないことを `grep` で確認済み
- Phase 11 が `verified` でない場合、PR は spec-only 起票に限定し、実 Token 操作・正本仕様上書きを含めない
- **ユーザーの明示承認**（自動実行禁止）

## コミット粒度（5 単位以内）

| # | 対象 | 概要 |
| --- | --- | --- |
| 1 | `phase-{01..03}.md` 周辺 | 要件・設計・レビュー |
| 2 | `phase-{04..10}.md` | テスト・実装ランブック・QA |
| 3 | `phase-{11..13}.md` | Phase 11〜13 仕様 |
| 4 | `index.md` + `artifacts.json` + `outputs/artifacts.json` | メタ整合 |
| 5 | `.claude/skills/**` LOGS / topic-map | global skill sync |

5 単位を超える場合は再分割せず代表 commit に集約する。

## 実行手順

### Step 1: ローカル最終確認（承認後）

```bash
git status
git diff --stat
# Token 値混入チェック
grep -rnE '[A-Za-z0-9_-]{40,}' docs/30-workflows/u-fix-cf-acct-01-*/ \
  outputs/phase-1[12]/ 2>/dev/null \
  | grep -vE '(commit|sha|hash|run-id)' || echo "PASS: no token-like strings"
```

### Step 2: コミット

```bash
git commit -m "$(cat <<'EOF'
docs(security): U-FIX-CF-ACCT-01 Cloudflare API Token scope audit spec

Add Phase 1-13 task spec for auditing and minimizing CLOUDFLARE_API_TOKEN
scope. Required minimal scopes follow the current canonical set:
Workers Scripts:Edit, D1:Edit, Cloudflare Pages:Edit, Account Settings:Read.
Workers KV Storage:Edit / User Details:Read remain conditional additions only if
staging smoke proves they are required.

Spec is `spec_created` (no implementation). No token/account values
recorded.

Refs #330

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Step 3: Push / Step 4: PR 作成（ユーザー承認後のみ）

```bash
git push -u origin <branch-name>

gh pr create --base main \
  --title "docs(security): U-FIX-CF-ACCT-01 Cloudflare API Token scope audit spec" \
  --body "$(cat <<'EOF'
## Summary

- `U-FIX-CF-ACCT-01`（Cloudflare API Token スコープ最小化監査）の Phase 1〜13 タスク仕様書を起票
- 本 PR はドキュメントのみ。実装は別 wave、本 PR では `workflow_state = spec_created` のまま据え置く
- 必要最小権限は既存正本 4 種に合わせ、staging→production 適用順序と rollback 経路を Phase 11 で実機検証

## Status note

GitHub Issue #330 は既に CLOSED 状態だが、seed spec が未消化のため本タスク仕様書は `spec_created` として再構築している。Issue 再オープン要否は Phase 11/12 evidence ベースで別途判断する。本 PR では `Refs #330` を採用し `Closes #330` は使用しない（CLOSED Issue への自動クローズ副作用を避ける）。

## Test plan

- [ ] Phase 1〜13 仕様書が揃っている
- [ ] `artifacts.json` parity または root 単独正本宣言を確認
- [ ] 仕様書・ログに Token 値・Account ID 値が含まれない（grep 確認）
- [ ] マージ後、別タスクで Phase 11 staging smoke を実施
- [ ] マージ後、production Token 切替を Phase 5 ランブック手順で実施

## Related

- Spec root: `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`
- 並列: `U-FIX-CF-ACCT-02` / 上流（completed）: `FIX-CF-ACCT-ID-VARS-001`
- GitHub Issue: #330（CLOSED）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 5: PR URL の記録

`outputs/phase-13/main.md` に PR URL / branch 名 / 代表 commit SHA（5 件）/ mergeable 状態（`gh pr view --json mergeable`）を記録する。

## Issue 連携ルール

`Refs #330` を採用する（Issue は既に CLOSED）。`Closes #330` / `Fixes #330` / `Resolves #330` は禁止（CLOSED Issue を再操作しないため）。Issue 再オープンは本 PR ではトリガせず、Phase 11 evidence ベースで別途判断する。

## 完了条件

- [ ] ユーザー明示承認取得済み
- [ ] commit が 5 単位以内で作成されている
- [ ] PR が作成されており URL が記録されている
- [ ] PR 本文に「Issue #330 は CLOSED だが本タスク仕様書は `spec_created` として作成」が明記されている
- [ ] PR 本文に `Refs #330` が含まれ `Closes #330` が含まれない
- [ ] commit message / PR 本文に Token 値・Account ID 値が含まれない

## 成果物

- `outputs/phase-13/main.md`（PR URL / commit SHA / mergeable 状態を記録）

## 関連リンク

- `index.md` / Phase 12 成果物 / 並列 `U-FIX-CF-ACCT-02` / Issue #330（CLOSED）

## 苦戦想定

- ユーザー明示承認なしの push が最大リスク。承認文言「Phase 13 を実施してよい」が出るまで待機する。
- `Closes #330` を反射的に書かない（CLOSED Issue のため `Refs #330` を厳守）。
- commit が 5 単位を超えないよう、仕様書系 3 + メタ整合 1 + skill sync 1 に集約する。
- 本 PR マージ後も `workflow_state` は `spec_created` のまま。実装は別タスク・別 PR とし `completed` 化しない。
