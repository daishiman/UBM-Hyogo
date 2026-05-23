# Phase 1 — 要件定義

## P50 チェック

| 項目 | 結果 | 備考 |
| ---- | ---- | ---- |
| current branch に実装が存在する | No | 仕様書のみ。実装は別サイクル |
| upstream (dev/main) にマージ済み | No | PR #795 で fail 残存 |
| 前提タスクが完了済み | Yes | PR #795 本体 (esbuild override 修正) はマージ済 |

`implementation_mode`: **`new`** (両 task とも新規 fix 実装)

## タスク分類

両タスクとも **NON_VISUAL** / **CI infra 修正**。Phase 11 スクリーンショット不要。Phase 11 evidence は CI run の green stamp と `gh run view` 出力で代替する。

## 真の論点

PR #795 (`fix(cf-deploy): align pnpm esbuild override`) マージ後も、以下 2 件の CI failure が再発しており blocking。

- **A**: `workflow-shell-lint` の post-job cache cleanup で `Path Validation Error`
- **B**: `deploy-staging` の wrangler が `CLOUDFLARE_API_TOKEN` 未注入で exit 1

これらは互いに独立だが、いずれも staging deploy lane を red にしているため、dev 環境への merge gate が機能しない状態にある。

## 因果分析

### A: workflow-shell-lint cache failure

- `setup-project` composite が `actions/setup-node@v4` を `cache: pnpm` 付きで呼び出す
- `workflow-shell-lint` job は `install: 'false'` を指定する (依存 install 不要)
- `cache: pnpm` は依存 install 後に生成される pnpm store directory を cache 対象とする
- install せず → store dir 未生成 → post-cleanup で「path does not exist」 → warning が GitHub annotation で error 表示
- job 全体は他 step (shellcheck / actionlint) で fail している可能性が高い (cache warning は本来 fail 条件ではない)
- **本タスクスコープ**: cache annotation error 解消のみ。他 step の fail があれば別途調査

### B: deploy-staging CLOUDFLARE_API_TOKEN 不足

- `cloudflare/wrangler-action@v3` に `apiToken: ${{ secrets.CF_TOKEN_D1_STAGING }}` を渡している
- ログ証跡: `CLOUDFLARE_API_TOKEN environment variable` 必要エラー → `secrets.CF_TOKEN_D1_STAGING` が空に評価された
- 候補原因 (優先度順):
  1. `staging` environment の `CF_TOKEN_D1_STAGING` secret 未登録 (or rotation 後の名前不一致)
  2. workflow が `environment: name: staging` を指定しているが、secret は repository secret として保存されている (environment secret として参照されないため空評価)
  3. secret 自体は存在するが trigger context (`push` to `dev`) で environment guard が反応していない

## 価値・コスト

- **価値**: dev → staging deploy lane の自動化を回復。手動 deploy 工数 (1 deploy あたり 5-10 min × 月 ~20回) を削減
- **コスト**: workflow YAML 1-2 ファイル変更 (合計 ~30 行以内) + GitHub Secrets / Environment 整合確認

## 受入条件 (DoD)

| ID  | 条件 | 検証方法 |
| --- | ---- | -------- |
| AC-1 | `workflow-shell-lint` job が green になる | `gh run list --workflow=ci.yml --branch=feat/ci-cache-and-cf-token-fix-spec` で latest = success |
| AC-2 | cache annotation error が 0 件 | `gh run view <run-id> --log` で `Path Validation Error` grep 0 件 |
| AC-3 | `deploy-staging` job が green になる | `gh run list --workflow=backend-ci.yml --branch=dev` で latest = success |
| AC-4 | wrangler が `CLOUDFLARE_API_TOKEN` を取得 | `Apply D1 migrations` step が `Resource location: remote` の後 success exit |

## 不変条件

- 他 job (typecheck / lint / test / verify-*) を破壊しない
- `actions/setup-node@v4` / `pnpm/action-setup` の SHA pin を維持
- secret 値はコード / ドキュメントに転記しない (CLAUDE.md §シークレット管理)
- `wrangler-action@v3` の `wranglerVersion: 4.85.0` を維持
