# Phase 2: 設計（修正方針・参照置換マップ）

## 修正方針
GitHub Actions context expression `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` を `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` に単純置換する。値そのものは変更しない（同名の Variable が既に登録済み）。

## 参照置換マップ

| # | ファイル | 行 | step | env | before | after |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `.github/workflows/backend-ci.yml` | 42 | Apply D1 migrations | staging | `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` | `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` |
| 2 | `.github/workflows/backend-ci.yml` | 53 | Deploy Workers app | staging | 同上 | 同上 |
| 3 | `.github/workflows/backend-ci.yml` | 87 | Apply D1 migrations | production | 同上 | 同上 |
| 4 | `.github/workflows/backend-ci.yml` | 98 | Deploy Workers app | production | 同上 | 同上 |
| 5 | `.github/workflows/web-cd.yml` | 45 | Build Next.js (OpenNext) → Deploy | staging | 同上 | 同上 |
| 6 | `.github/workflows/web-cd.yml` | 82 | Deploy Workers (production) | production | 同上 | 同上 |

## 検証戦略（要約）
- Static: `grep -rn 'secrets.CLOUDFLARE_ACCOUNT_ID' .github/` が 0 件
- Static: `grep -rn 'vars.CLOUDFLARE_ACCOUNT_ID' .github/` が 6 件
- Static: yaml の構文 parse 成功（actionlint / yamllint または python yaml.safe_load 代替）
- API: `gh api repos/.../actions/variables` で Variable 存在確認
- Runtime: main マージ後の `backend-ci` / `web-cd` deploy-production job が green

## 影響境界
参照変更のみ。job 構造・step 順・依存・permission は不変。不変条件 #5（D1 アクセスは `apps/api` に閉じる）には触れない。

## ロールバック方針
revert commit 一発で復元可能。値そのものは変えていないため、デプロイ既往データには副作用なし。
