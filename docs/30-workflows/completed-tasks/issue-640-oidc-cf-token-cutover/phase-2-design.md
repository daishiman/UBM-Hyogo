# Phase 2: 設計

> [実装区分: 実装仕様書]

## 1. アーキテクチャ（責務境界）

```
┌─ GitHub Actions runner ─────────────────────────────────┐
│  job (deploy-staging / deploy-production)               │
│   ├─ step: checkout            ← env なし                │
│   ├─ step: setup-node          ← env なし                │
│   ├─ step: pnpm install        ← env なし                │
│   ├─ step: build               ← env なし                │
│   └─ step: deploy              ← env: CLOUDFLARE_API_TOKEN│ ← step-scoped 限定
│        └─ wrangler-action / scripts/cf.sh                │
│   └─ step: redaction-check     ← log を grep             │
└──────────────────────────────────────────────────────────┘
```

状態所有権:
- token 値の存在 scope: deploy step の env block 内部のみ
- log redaction の判定権: redaction-check step（fail で job failure）

## 2. token 配線パターン（step-scoped）

### Before（job-level、現状）

```yaml
jobs:
  deploy-staging:
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # ← 全 step に露出
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm build
      - run: bash scripts/cf.sh deploy ...
```

### After（step-scoped、本タスクで導入）

```yaml
jobs:
  deploy-staging:
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm build
      - name: Deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # ← この step に限定
        run: bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
      - name: Redaction check
        run: bash scripts/redaction-check.sh
```

## 3. redaction-check 設計

### `scripts/redaction-check.sh`

| 項目 | 値 |
|---|---|
| 入力 | stdin、またはオプション `--log <file>` でファイル指定 |
| 検出パターン | `CLOUDFLARE_API_TOKEN`（変数名は OK だが値の prefix/suffix が出ない確認）、Account ID、token 形式 regex `[A-Za-z0-9_-]{40,}` |
| 出力 | leak 検出時 exit 1 + 該当行（マスク済み）、なければ exit 0 |
| 副作用 | なし（read-only、stdout/stderr のみ） |

### 関数シグネチャ

```bash
# scripts/redaction-check.sh
# usage: bash scripts/redaction-check.sh [--log <path>] [--account-id <id>]
# exit 0: no leak / exit 1: leak detected
main "$@"
```

主要ロジック:
1. `${CLOUDFLARE_ACCOUNT_ID:-}` が定義されていれば、それを `grep -F` で検索
2. `secrets.CLOUDFLARE_API_TOKEN` の実値（runtime では `$CLOUDFLARE_API_TOKEN`）が log に出ていないか確認（**注: token 値そのものを変数展開すると漏洩するため、token の長さ・形式パターンで間接検出**）
3. log から `***` マスク後の prefix/suffix が読み取れる場合は warning

## 4. workflow 改修パターン

各 workflow に対する変更パターン:

| workflow | 現状 | 変更後 |
|---|---|---|
| `web-cd.yml` (line 22, 63) | job-level `env` | deploy step 直下 `env` へ降格 + redaction-check step 追加 |
| `backend-ci.yml` (line 41, 52, 96, 107) | step-level `with: apiToken:` | 既に step-scoped（confirm-only）。`wrangler-action` の internal log は本スクリプトで取得しないため、redaction-check は追加せず静的 scope gate で検証 |
| `cf-audit-log-*.yml` / `d1-migration-verify.yml` / `post-release-dashboard.yml` | 個別調査結果に従う | step-scoped 化 |

## 5. validation lane（直列）

1. `actionlint` で workflow yaml の syntax 検証
2. `grep` で `env:` 階層の正当性確認（job-level に CLOUDFLARE_API_TOKEN が残っていないこと）
3. staging deploy を feature ブランチで実走（または dev push 経由）
4. log を `redaction-check.sh` に流して fail にならないことを確認

## 6. リスク

| リスク | 対策 |
|---|---|
| step-scoped に降格した結果、後続 step が token を必要としていた | Phase 4 のテスト計画で deploy step の前後で token 参照を grep し、必要なら deploy step の `run:` 内で複数コマンドを実行する形に統合 |
| redaction-check が false positive を出す | account-id / token 値の検出基準を明示化し、shell escape を回避（`grep -F` 固定文字列検索） |
| `scripts/cf.sh` が env var 読み取りに失敗 | env var 名 `CLOUDFLARE_API_TOKEN` を維持。GitHub Secret 名は変えない（互換性最優先） |

## 7. 4条件評価

- 価値性: 漏洩 blast radius が deploy step 限定に縮小 → 高
- 実現性: yaml 修正 + 1 shell script 追加で完結 → 1サイクル達成可
- 整合性: `scripts/cf.sh` 互換維持で他経路への波及なし
- 運用性: redaction-check が CI gate として継続的に保護
