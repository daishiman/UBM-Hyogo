# Phase 3 — 設計レビュー

Phase 4 (タスク仕様書詳細) へ進めるかを判定する。

## レビュー観点

### 1. 価値性

| 評価項目 | 判定 | 備考 |
| -------- | ---- | ---- |
| dev → staging deploy lane 回復 | PASS | AC-3/AC-4 直接達成 |
| shell-lint annotation ノイズ除去 | PASS | AC-1/AC-2 達成 |
| ガバナンス (environment 分離) 維持 | PASS | B3 案を不採用とし staging environment 保持 |

### 2. 実現性

| 評価項目 | 判定 | 備考 |
| -------- | ---- | ---- |
| 1 サイクル / 1 PR 完了 | PASS | YAML 変更 ~10 行 + secret 登録 |
| 既存 action SHA pin 維持 | PASS | `actions/setup-node@49933ea` 不変 |
| `wrangler-action@v3` 4.85.0 維持 | PASS | wranglerVersion 不変 |

### 3. 整合性

| 評価項目 | 判定 | 備考 |
| -------- | ---- | ---- |
| `setup-project` composite の他 caller への副作用 | PASS | `cache` input default = `'pnpm'` で後方互換 |
| 他 job (typecheck / lint / test) 影響 | PASS | `cache: pnpm` を維持 (install: 'true' caller) |
| CLAUDE.md `scripts/cf.sh` 経由ルールとの整合 | PASS | GitHub Actions 環境は `wrangler-action` が canonical で、ローカル限定の `cf.sh` ルールには抵触しない |
| CLAUDE.md シークレット規約 | PASS | YAML / docs に値非掲載、1Password 参照のみ |

### 4. 運用性

| 評価項目 | 判定 | 備考 |
| -------- | ---- | ---- |
| secret rotation 時の運用負荷 | PASS | env-level secret に統一しており `gh secret set --env staging` で完結 |
| 失敗時の切り分け | PASS | `with.apiToken` と `env.CLOUDFLARE_API_TOKEN` の二経路で fail mode を分離可能 |
| ロールバック | PASS | YAML revert で復元、secret は手動再登録 |

### 5. 真の論点との整合

Phase 1 で fix した 2 論点 (cache annotation / CF token 未注入) を Phase 2 設計が直接解消することを確認。

## 残課題 / 未タスク化候補

| ID | 内容 | 対応 |
| -- | ---- | ---- |
| UNASSIGNED-01 | `backend-ci.yml` に `workflow_dispatch` trigger を追加し PR 上で staging deploy を dry-run 可能にする | 本サイクル外。CI infra 改善 issue として別途登録対象 |
| UNASSIGNED-02 | `deploy-production` の同等 hardening (env fallback) | main → prod release pipeline 改修タスクで対応 |

## 判定

**GO** — Phase 4 (タスク仕様書詳細) へ進む。

## 次フェーズの分担

- task-01 (`tasks/task-01-shell-lint-cache-fix/`) と task-02 (`tasks/task-02-cf-api-token-staging-secret-fix/`) を **SubAgent 並列**で作成する
- 並列 lane の validation は最終的に CI green stamp で締める (Phase 9-11)
