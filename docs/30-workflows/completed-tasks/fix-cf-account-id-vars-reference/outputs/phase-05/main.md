# Phase 5: 実装ランブック

## 実行手順

1. ワークツリー: `.worktrees/task-20260430-170037-wt-11`
2. 一括置換:

   ```bash
   sed -i '' 's/secrets\.CLOUDFLARE_ACCOUNT_ID/vars.CLOUDFLARE_ACCOUNT_ID/g' \
     .github/workflows/backend-ci.yml \
     .github/workflows/web-cd.yml
   ```

3. 検証:

   ```bash
   grep -rn 'secrets\.CLOUDFLARE_ACCOUNT_ID' .github/   # 0 件
   grep -rn 'vars\.CLOUDFLARE_ACCOUNT_ID' .github/workflows/  # 6 件
   python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ['.github/workflows/backend-ci.yml','.github/workflows/web-cd.yml']]"
   ```

## diff サンプル（backend-ci.yml L42 抜粋）

```diff
-          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
+          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

同一の差分が backend-ci.yml に 4 箇所、web-cd.yml に 2 箇所 適用される。

## 実行結果（本ワークツリー）

| 検証 | 結果 |
| --- | --- |
| `grep secrets\.` | exit=1（0 件） ✅ |
| `grep vars\.` | 6 件 ✅ |
| `yaml.safe_load` | OK ✅ |
| `gh api .../variables` | `CLOUDFLARE_ACCOUNT_ID` 登録済み ✅ |
| `gh api .../secrets` | 同名 Secret 不在 ✅ |
