# Phase 10: 最終レビュー（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-9.md` 完了（品質ゲート全 PASS） |
| 出力 | GO/NO-GO チェックリスト、ロールバック手順 |

---

## 1. GO/NO-GO チェックリスト

| # | 項目 | 期待 | 検証方法 |
|---|------|------|---------|
| GO-01 | AC-01 (旧 secret 名 0 件) | PASS | G-04 |
| GO-02 | AC-02 (新 secret 名 2 件) | PASS | G-05 |
| GO-03 | AC-03 (Verify step 2 件) | PASS | G-06 |
| GO-04 | AC-04 (op 不在エラー消失) | runtime_pending | Phase 7 §5 / G-10（user approval 後） |
| GO-05 | AC-05 (deploy success) | runtime_pending | Phase 7 §5 / G-10（user approval 後） |
| GO-06 | AC-06 (secret 値残留 0 件) | PASS | G-07 |
| GO-07 | YAML 構文 | PASS | G-01 |
| GO-08 | typecheck / lint | PASS | G-08 / G-09 |
| GO-09 | dev push 後の web-cd staging run = success | runtime_pending | G-10（user approval 後） |
| GO-10 | scripts/cf.sh 無変更 | PASS | `git diff --name-only dev...HEAD \| grep -q '^scripts/cf.sh$' && echo NO-GO \|\| echo GO` |
| GO-11 | spec 文書（phase-1..13 / index / artifacts.json / Phase 12 strict outputs）が揃っている | PASS | `find docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment -maxdepth 3 -type f` |

local gate は GO-01..GO-03 / GO-06..GO-11 が PASS、GO-04 / GO-05 は user-approved dev/main GitHub Actions run まで `runtime_pending` として扱う。runtime evidence 取得前に `completed` へ昇格しない。

---

## 2. ロールバック手順

### 2.1 PR merge 前

```bash
# 編集を破棄
git restore --staged .github/workflows/web-cd.yml
git checkout -- .github/workflows/web-cd.yml
git checkout dev
git branch -D fix/web-cd-secret-name-alignment
```

### 2.2 PR merge 後 / dev push 後の問題発生時

```bash
# 1. merge commit を revert
git checkout dev
git pull
git revert <merge-commit-sha> -m 1
git push origin dev

# 2. 必要に応じて Cloudflare Workers 側を rollback
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env production
```

`<PREVIOUS_VERSION_ID>` は `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging` で確認。

### 2.3 ロールバック後の確認

- `gh run watch` で dev の最新 web-cd run が再び以前の状態（成功 or 失敗）に戻ったことを確認
- Cloudflare Workers Dashboard で deploy version が元に戻っていることを確認

---

## 3. レビュー観点総括

| 観点 | 結論 |
|------|------|
| 最小差分原則 | YAML +12 / -2 のみ。逸脱なし |
| 不変条件遵守 | scripts/cf.sh 無変更、CI で op 不使用、secret 値漏洩なし |
| ロールバック容易性 | git revert + cf.sh rollback で原状回復可能 |
| solo policy 整合 | required_pull_request_reviews=null 維持、CI gate のみで品質担保 |

---

## 4. exit criteria

| # | 条件 |
|---|------|
| EX-01 | GO-01..GO-11 すべて PASS |
| EX-02 | ロールバック手順が PR merge 前 / 後で明文化されている |
| EX-03 | レビュー観点総括が記述されている |
