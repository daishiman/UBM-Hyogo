# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 13 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

ユーザーの明示承認を得てから commit / push / PR 作成を実行する。


## 参照資料

- `index.md`
- `artifacts.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 必須事前条件

- Phase 1〜12 の全 spec_created / completed が達成済み
- Static 検証 TC-S01〜S07 が PASS
- `outputs/phase-12/` の 7 ファイル（main.md + 6 補助）が揃っている
- **ユーザーの明示承認**（自動実行禁止）

## 実行手順

### Step 1: ローカル最終確認

```bash
git status
git diff --stat
git diff .github/workflows/
```

### Step 2: コミット

```bash
git add .github/workflows/backend-ci.yml .github/workflows/web-cd.yml \
        docs/30-workflows/fix-cf-account-id-vars-reference/

git commit -m "$(cat <<'EOF'
fix(ci): switch CLOUDFLARE_ACCOUNT_ID to vars namespace in workflows

Replace 6 references of ${{ secrets.CLOUDFLARE_ACCOUNT_ID }} with
${{ vars.CLOUDFLARE_ACCOUNT_ID }} in backend-ci.yml and web-cd.yml.

The account ID is registered as a Repository Variable, not a Secret.
The previous secrets. reference expanded to an empty string, causing
wrangler to call /memberships and fail with Authentication error
[code: 10000] on every main-branch deploy-production run.

Account ID is an identifier (not a credential) per Cloudflare's
official guidance, so vars. is the canonical placement.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Step 3: Push

```bash
git push -u origin fix/cf-account-id-vars-reference
```

### Step 4: PR 作成

```bash
gh pr create \
  --base main \
  --title "fix(ci): switch CLOUDFLARE_ACCOUNT_ID to vars namespace" \
  --body "$(cat <<'EOF'
## Summary

- `.github/workflows/backend-ci.yml` の 4 箇所と `.github/workflows/web-cd.yml` の 2 箇所、計 6 箇所の `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` を `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` に修正
- 原因: GitHub には `CLOUDFLARE_ACCOUNT_ID` が Repository **Variable** として登録されているが、workflow は `secrets.` で参照しており空文字列に展開されていた
- 結果: wrangler が account ID 不在のまま起動 → `/memberships` API 呼び出し → Token のスコープ外で `Authentication error [code: 10000]` で失敗
- Account ID は識別子（資格情報ではない）であり、Cloudflare 公式・wrangler-action 公式の慣行と整合する `vars.` 配置に統一

## Test plan

- [x] `grep -rn 'secrets\.CLOUDFLARE_ACCOUNT_ID' .github/` が 0 件
- [x] `grep -rn 'vars\.CLOUDFLARE_ACCOUNT_ID' .github/workflows/` が 6 件
- [x] `actionlint` / `yamllint` でエラーなし
- [x] `gh api .../actions/variables` で `CLOUDFLARE_ACCOUNT_ID` Variable 登録確認済み
- [ ] マージ後 `backend-ci` deploy-production が green
- [ ] マージ後 `web-cd` deploy-production が green
- [ ] マージ後 run log に `Authentication error [code: 10000]` が出ない

## Related

- Spec: `docs/30-workflows/fix-cf-account-id-vars-reference/`
- Failed run (backend-ci): https://github.com/daishiman/UBM-Hyogo/actions/runs/25153872414
- Failed run (web-cd): https://github.com/daishiman/UBM-Hyogo/actions/runs/25153872595

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 5: マージ後の Runtime 検証

PR マージ後に Phase 11 の Runtime 検証（TC-R01〜R03）を実行し、`outputs/phase-11/manual-smoke-log.md` に結果を追記する。

## 完了条件

- [ ] ユーザー承認取得済み
- [ ] commit が作成されている
- [ ] PR が作成されており URL が記録されている
- [ ] マージ後の Runtime 検証で deploy-production が green

## 成果物

- `outputs/phase-13/main.md`（PR URL・commit SHA・mergeable 状態を記録）
