# Phase 7: 結合テスト（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-6.md` 完了（静的検証 PASS） |
| 出力 | dev push 後の `web-cd / deploy-staging` 実 run 観測 evidence |

---

## 1. 結合テストの位置づけ

CI workflow YAML の挙動は実 GitHub Actions runner で起動しないと最終確認できない。本 phase ではユーザー承認後の `dev` push 後、`web-cd` workflow を `gh run watch` で観測し、staging job の AC-04 / AC-05 を実 evidence として満たす。`production` job は `main` push 時のみ起動するため、本 cycle では静的検証で担保し、main runtime evidence はリリース時 evidence として分離する。

---

## 2. 観測手順

```bash
# 1. PR を dev に merge 後、最新 run を取得
gh run list --workflow=web-cd.yml --branch=dev --limit=1

# 2. run-id を控えて watch
RUN_ID=<取得した run-id>
gh run watch "$RUN_ID"

# 3. ログを保存（evidence）
gh run view "$RUN_ID" --log > outputs/phase-11/evidence/dev-run-watch.log

# 4. op 不在エラーの非検出を確認
grep -F "1Password CLI (op)" outputs/phase-11/evidence/dev-run-watch.log \
  && echo "FAIL: op error still present" \
  || echo "OK: op error gone"

# 5. Verify step の PASS 確認
grep -F "Verify CF token is present" outputs/phase-11/evidence/dev-run-watch.log

# 6. Deploy step の exit 0 確認
grep -E "Deploy to Cloudflare Workers \((staging|production)\)" outputs/phase-11/evidence/dev-run-watch.log
gh run view "$RUN_ID" --json conclusion --jq '.conclusion'
# 期待: "success"
```

---

## 3. 期待 step ログ抜粋

| step | 期待 |
|---|---|
| `Verify CF token is present` | exit 0、標準出力空（`::error::` が出ない） |
| `Install dependencies` | `pnpm install` 成功 |
| `Deploy to Cloudflare Workers (staging)` | `cf.sh deploy ...` 成功、`[cf.sh] 1Password CLI (op) が見つかりません` 出ない、wrangler が `Successfully deployed` を出力 |

---

## 4. 失敗時の切り分け

| 観測 | 想定原因 | 対処 |
|---|---|---|
| `Verify CF token is present` で `::error::CLOUDFLARE_API_TOKEN is empty` | Environment 側に secret 未登録 / scope 違い | `gh api environments/staging/secrets` で確認・ユーザー操作で再登録 |
| `[cf.sh] 1Password CLI (op) が見つかりません` 再発 | env 注入経路が想定と異なる（job-level env 未設定等） | `web-cd.yml` の job-level `env:` ブロック位置を再確認 |
| `Deploy to Cloudflare Workers (staging)` が wrangler エラー | token scope 不足 / Cloudflare 側問題 | wrangler エラー詳細をログから特定（task-01 スコープ外） |

---

## 5. AC-04 / AC-05 の機械検証

```bash
# AC-04
! grep -F "1Password CLI (op)" outputs/phase-11/evidence/dev-run-watch.log

# AC-05
[ "$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion')" = "success" ]
```

両方 exit 0 で AC-04 / AC-05 PASS。

---

## 6. exit criteria

| # | 条件 |
|---|------|
| EX-01 | dev push 後の `web-cd` run が `success` |
| EX-02 | `Verify CF token is present` step が staging job で PASS。production job は静的検証で step 存在を確認し、main push 時 runtime evidence に分離 |
| EX-03 | `dev-run-watch.log` が Phase 11 evidence として保存されている |
| EX-04 | op 不在エラーがログに含まれない |
