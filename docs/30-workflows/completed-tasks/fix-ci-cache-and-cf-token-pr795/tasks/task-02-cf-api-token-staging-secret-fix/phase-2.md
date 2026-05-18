# Phase 2 — 設計

> workflow root `outputs/phase-2/phase-2.md` の **採用設計 B1 + B2** を task-02 で実装する詳細設計。

## 設計サマリ

| 案 | 内容 | 採否 |
| -- | ---- | ---- |
| B1 | environment `staging` に正しい secret を gh CLI で登録 | ✅ 採用 |
| B2 | `wrangler-action` に `with.apiToken` だけでなく step-level `env.CLOUDFLARE_API_TOKEN` も併設し fallback を確保 | ✅ 採用 |
| B3 | environment scope を廃止し repository scope に統一 | ❌ ガバナンス放棄のため不採用 |

B1 と B2 はそれぞれ単独でも fail mode を 1 つは閉じるが、片方だけでは secret rotation 時の再発リスク or 環境分離崩壊が残る。両方を同 PR で適用する。

## B1: GitHub Environment Secret 登録 (運用手順)

実 token 値は仕様書に書かない。Phase 5 で次の手順を **ユーザー承認後** 実行する。stdin/op read 経由で値が一切 echo されない経路を canonical とする:

```bash
# 1) 現状の environment secret を確認 (名前のみ、値非表示)
gh secret list --env staging --repo daishiman/UBM-Hyogo

# 2) D1 staging token を環境変数経由で登録 (op read の stdout は値だが、--body 経由で gh が直接受け取る)
gh secret set CF_TOKEN_D1_STAGING \
  --env staging \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://Cloudflare/UBM-Hyogo-D1-Staging/token')"

# 3) Workers staging token を登録
gh secret set CF_TOKEN_WORKERS_STAGING \
  --env staging \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://Cloudflare/UBM-Hyogo-Workers-Staging/token')"

# 4) 再確認: 2 件存在することを確認
gh secret list --env staging --repo daishiman/UBM-Hyogo
```

> `op read` の戻り値を変数に代入したり `echo` する経路は禁止。`$(...)` 即時展開で `gh` の `--body` 引数に渡し、shell history と log に値が残らないようにする。

## B2: `backend-ci.yml` の env fallback 追加

### 修正箇所

`.github/workflows/backend-ci.yml` の **deploy-staging job 内 2 step** のみ:

- `Apply D1 migrations` (line 37-46)
- `Deploy Workers app` (line 48-57)

`Record post-migration deploy failure` (line 59-67) と `deploy-production` job (line 69-122) は不変更。

### Before (現状)

```yaml
      - name: Apply D1 migrations
        id: migrate
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_TOKEN_D1_STAGING }}
          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: 4.85.0
          workingDirectory: apps/api
          command: d1 migrations apply ubm-hyogo-db-staging --env staging --remote
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Deploy Workers app
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: 4.85.0
          workingDirectory: apps/api
          command: deploy --env staging
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### After (修正後)

```yaml
      - name: Apply D1 migrations
        id: migrate
        uses: cloudflare/wrangler-action@v3
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_D1_STAGING }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        with:
          apiToken: ${{ secrets.CF_TOKEN_D1_STAGING }}
          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: 4.85.0
          workingDirectory: apps/api
          command: d1 migrations apply ubm-hyogo-db-staging --env staging --remote
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Deploy Workers app
        id: deploy
        uses: cloudflare/wrangler-action@v3
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        with:
          apiToken: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
          accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: 4.85.0
          workingDirectory: apps/api
          command: deploy --env staging
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### diff サマリ

- `Apply D1 migrations`: `env:` block 3 行追加 (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID)
- `Deploy Workers app`: 同様に `env:` block 3 行追加
- 合計 +6 行 / -0 行
- `with.apiToken` / `with.accountId` は維持 (二重化が B2 の本旨。`wrangler-action` が `with` を読まなくなった rotation でも `env` 経由で wrangler 本体が読める)

### `wrangler-action@v3` の挙動根拠

- `with.apiToken` が空文字評価される場合、`wrangler-action` は内部で `process.env.CLOUDFLARE_API_TOKEN` を直接 wrangler binary に引き継ぐ
- `wrangler` binary 自体は env var `CLOUDFLARE_API_TOKEN` を必須として読み取るため、step-level `env` 注入が最終 fallback として機能する
- `CLOUDFLARE_ACCOUNT_ID` も同じ理由で env 経由を二重化しておくことで vars 名変更時の耐性を確保

## 変更ファイル

| Path | 種別 | 行数 |
| ---- | ---- | ---- |
| `.github/workflows/backend-ci.yml` | 編集 | +6 / -0 |

## ステップ間 state ownership

| step | owner | 引き渡し |
| ---- | ----- | -------- |
| 仕様確認 | 実装者 | 本 phase + workflow root phase-2 |
| YAML 編集 | 実装者 | git diff |
| secret 登録 | ユーザー (機密操作) | `gh secret list --env staging` の名前出力 |
| dev push & CI 実行 | 自動 | `gh run watch` |
| Green 確認 | 実装者 | `gh run view --log` |

## 既知の制約

- `backend-ci.yml` に `workflow_dispatch` trigger が無いため、最終検証は dev ブランチへの実 push が唯一の経路 (Phase 4 / Phase 11 で再確認)
- workflow_dispatch 追加は `UNASSIGNED-01` として workflow root phase-3 で残課題化済み。本タスクスコープ外
