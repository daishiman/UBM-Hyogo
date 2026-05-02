# `.github/workflows/web-cd.yml` 差分（テキスト仕様）

Pages → Workers cutover 用の build / deploy step 改修内容を before / after 形式で確定する。AC-2 の正本仕様。

## deploy-staging job

| 項目 | before | after |
| --- | --- | --- |
| Build step `run` | `pnpm --filter @ubm-hyogo/web build` | `pnpm --filter @ubm-hyogo/web build:cloudflare` |
| Deploy step `command` | `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging --branch=dev` | `deploy --env staging` |
| Deploy step `gitHubToken` | 維持 | 維持（Workers でも deployment status を post するため） |
| `workingDirectory` | `apps/web` | `apps/web`（維持） |
| `wranglerVersion` | `4.85.0` | `4.85.0`（維持。`apps/web/package.json` devDependencies と整合） |

## deploy-production job

| 項目 | before | after |
| --- | --- | --- |
| Build step `run` | `pnpm --filter @ubm-hyogo/web build` | `pnpm --filter @ubm-hyogo/web build:cloudflare` |
| Deploy step `command` | `pages deploy .next --project-name=${{ vars.CLOUDFLARE_PAGES_PROJECT }} --branch=main` | `deploy --env production` |
| その他 | 維持 | 維持 |

## 周辺方針

- このファイルの `after` は `target_state_not_applied_in_this_workflow`。現行 `.github/workflows/web-cd.yml` は Pages deploy 残であり、実改修は implementation follow-up で行う。
- `concurrency.group = web-cd-${{ github.ref_name }}` は維持（同一 ref の deploy 重複抑止）
- `environment.name` は staging / production を維持（GitHub Environment protection rule の receptacle）
- `permissions: contents: read, deployments: write` は維持
- `vars.CLOUDFLARE_PAGES_PROJECT` への参照は **削除**（Pages project 名は不要になる）
- `secrets.CLOUDFLARE_API_TOKEN` / `vars.CLOUDFLARE_ACCOUNT_ID` は維持

## 静的検証コマンド

```bash
# AC-2 / T-10
grep -n "pages deploy" .github/workflows/web-cd.yml          # ヒットゼロを期待
# T-11
grep -n "deploy --env staging" .github/workflows/web-cd.yml   # 1 件以上
grep -n "deploy --env production" .github/workflows/web-cd.yml # 1 件以上
# 周辺
grep -n "CLOUDFLARE_PAGES_PROJECT" .github/workflows/web-cd.yml # ヒットゼロを期待
grep -n "build:cloudflare" .github/workflows/web-cd.yml        # 2 件以上（staging / production）
```

## 変更後の wrangler-action 呼び出し例（after 形）

```yaml
- name: Deploy to Cloudflare Workers (staging)
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    workingDirectory: apps/web
    wranglerVersion: "4.85.0"
    command: deploy --env staging
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

> 上記サンプルは Phase 5 の implementation template に転載される。本タスク（設計 close-out）では実改修は行わない。
