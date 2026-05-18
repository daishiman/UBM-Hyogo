# Phase 2 — 設計

## 設計方針

両 task は独立した GitHub Actions YAML 修正であり、並列 lane で実装可能。validation lane は CI run の green stamp で直列締め。

## Task 01: shell-lint cache fix

### 設計選択肢

| 案 | 説明 | 採否 | 理由 |
| -- | ---- | ---- | ---- |
| A1 | `setup-project` に `cache: <enabled>` 入力を追加し、`install=false` 時は `cache: ''` を渡す | ✅ 採用 | 局所変更で済む、他 job に副作用なし |
| A2 | `workflow-shell-lint` を `actions/setup-node@v4` 直呼びに切り替える | ❌ | composite を回避してしまい再利用性を損なう |
| A3 | post-cleanup 警告を `continue-on-error` で握り潰す | ❌ | 根本原因隠蔽。次回の真の cache fail を検知不能化 |

### 採用設計 (A1)

`.github/actions/setup-project/action.yml` に新 input `cache` を追加し、 `actions/setup-node@v4` の `cache:` 入力にそのまま渡す。

- input 仕様: `cache` (optional, default `'pnpm'`, accepts `''` for disabled)
- `inputs.install == 'false'` のとき呼出側は明示的に `cache: ''` を指定する
- 後方互換: default `'pnpm'` のため既存呼出は無変更

呼出側 (`ci.yml:25-29`) を以下に変更:

```yaml
- name: Setup project
  uses: ./.github/actions/setup-project
  with:
    node-version: '24'
    install: 'false'
    cache: ''   # ← 追加
```

### 変更ファイル

| Path | 種別 | 行数 (目安) |
| ---- | ---- | --------- |
| `.github/actions/setup-project/action.yml` | 編集 | +6 / -1 |
| `.github/workflows/ci.yml` | 編集 | +1 |

## Task 02: CF API token staging secret fix

### 因果整理

`secrets.CF_TOKEN_D1_STAGING` が空に評価される根本原因を解消する必要がある。原因は **GitHub 側設定** であり、YAML だけでは完全解決できない。本タスクは「**YAML 修正 + 検証手順 + secret 登録手順**」の 3 点セット。

### 設計選択肢

| 案 | 説明 | 採否 |
| -- | ---- | ---- |
| B1 | environment `staging` に正しい secret を登録する (gh CLI 手順を仕様書化) | ✅ 採用 |
| B2 | `apiToken` を `env.CLOUDFLARE_API_TOKEN` 経由でも渡せるよう保険を入れる | ✅ 採用 (B1 と併用) |
| B3 | 環境 guard を外し repository secret に統一 | ❌ | environment 分離 (staging / production) のガバナンス放棄 |

### 採用設計 (B1 + B2)

#### B1: secret 登録 (運用手順)

仕様書内に以下の gh CLI 手順を明示。**実行はユーザー承認後**:

```bash
# secret 一覧確認 (値は表示されない)
gh secret list --env staging --repo daishiman/UBM-Hyogo

# 必要 secret (未登録なら登録 / rotation 名変更なら再登録)
gh secret set CF_TOKEN_D1_STAGING --env staging --repo daishiman/UBM-Hyogo
gh secret set CF_TOKEN_WORKERS_STAGING --env staging --repo daishiman/UBM-Hyogo
```

token の取得は 1Password vault `op://Cloudflare/UBM-Hyogo-D1-Staging/token` から。仕様書には**参照 path のみ記載**、実値はコミットしない。

#### B2: env 経由フォールバック (YAML 堅牢化)

`wrangler-action` の input `apiToken` が空の場合でも、step-level `env.CLOUDFLARE_API_TOKEN` から wrangler が直接読めるよう、両方を渡す:

```yaml
- name: Apply D1 migrations
  id: migrate
  uses: cloudflare/wrangler-action@v3
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_D1_STAGING }}
  with:
    apiToken: ${{ secrets.CF_TOKEN_D1_STAGING }}
    accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
    wranglerVersion: 4.85.0
    workingDirectory: apps/api
    command: d1 migrations apply ubm-hyogo-db-staging --env staging --remote
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

同じパターンを `Deploy Workers app` step にも適用 (`CF_TOKEN_WORKERS_STAGING`)。

### 変更ファイル

| Path | 種別 | 行数 (目安) |
| ---- | ---- | --------- |
| `.github/workflows/backend-ci.yml` | 編集 | +4 step × 2 = +8 |

### 早期検証 (pre-merge)

実装後 dev 直接 push する前に、feature branch 上で以下を実施:

1. `gh secret list --env staging` で secret 名一致を確認
2. `gh workflow run backend-ci.yml --ref feat/... -f` (workflow_dispatch trigger 追加が必要 — スコープ外として未タスク登録)
3. 代替: `act` でローカル dry-run (ただし secret 未注入のため認証 step は skip 確認のみ)

> 早期検証経路に gap がある。**未タスク候補**: `backend-ci.yml` への `workflow_dispatch` trigger 追加 (別 PR)。

## ステップ間 state ownership (両 task 共通)

| step | owner | 引き渡し |
| ---- | ----- | -------- |
| 仕様確認 | 実装者 | `phase-1.md` / `phase-2.md` を読込 |
| YAML 編集 | 実装者 | git diff |
| secret 登録 | ユーザー (機密操作) | gh CLI 出力 (値非表示) |
| CI 再実行 | 自動 | `gh run watch` |
| Green 確認 | 実装者 | `gh run view --log` |

## ライブラリ / external action 採用

| ライブラリ | バージョン | 確認事項 |
| ---------- | ---------- | -------- |
| `actions/setup-node` | v4 (SHA `49933ea`) | `cache:` 入力で空文字を渡した場合 cache 完全無効化されることを doc で確認済 |
| `cloudflare/wrangler-action` | v3 | `env.CLOUDFLARE_API_TOKEN` が `with.apiToken` 不在時に fallback として読まれることを doc で確認済 |
