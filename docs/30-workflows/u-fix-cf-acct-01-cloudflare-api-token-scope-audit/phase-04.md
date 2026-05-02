# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 4 |
| 状態 | spec_created |
| taskType | implementation |
| subtype | security-audit |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. Phase 1〜3 で確定した「権限マトリクス」「適用順序」「rollback 設計」に対し検証戦略を組み立てる。
2. Token 値・Account 情報を成果物に残さない検証手順を確定する。
3. NON_VISUAL かつ infrastructure 系として、UI test ではなく grep / `gh api` / `cf.sh` dry-run / 失敗系の 4 軸で網羅する。

## 目的

API Token の権限最小化が「過不足なく必要権限を満たす」ことを CI 設定の静的解析、Cloudflare API での実行可否、失敗系での権限不足検出の三段で検証する。Token 値そのものをログ・成果物に出さない手順だけを採用する。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-02.md`（権限マトリクス・適用順序）
- `phase-03.md`（PASS 判定）
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `scripts/cf.sh`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- Cloudflare API Token Permissions Reference

## 入力

- Phase 2 成果物（必要権限マトリクス・staging→production 適用順序・rollback 設計）
- Phase 3 PASS 判定
- 既存 GitHub Environment Secret `CLOUDFLARE_API_TOKEN`（staging / production）

## テストカテゴリ

### 1. Static 検証（Token 再発行前に実行可能）

| TC ID | 種別 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| TC-S01 | Token 参照棚卸し | `grep -rn 'secrets\.CLOUDFLARE_API_TOKEN' .github/` | backend-ci.yml / web-cd.yml の `apiToken:` 行のみマッチ |
| TC-S02 | scope 外参照ゼロ | `grep -rn 'CLOUDFLARE_API_TOKEN' apps/ scripts/` | アプリ本体・cf.sh ラッパに直書きが無いこと |
| TC-S03 | Secret 存在確認（値非表示） | `gh api repos/daishiman/UBM-Hyogo/environments/production/secrets \| jq '.secrets[] \| select(.name=="CLOUDFLARE_API_TOKEN") \| .name'` | `"CLOUDFLARE_API_TOKEN"` のみ出力、`value` フィールドは API 仕様上返らない |
| TC-S04 | staging 側 Secret 存在 | `gh api repos/daishiman/UBM-Hyogo/environments/staging/secrets \| jq '.secrets[] \| select(.name=="CLOUDFLARE_API_TOKEN") \| .name'` | `"CLOUDFLARE_API_TOKEN"` |
| TC-S05 | wrangler-action バージョン整合 | `grep -rn 'cloudflare/wrangler-action@' .github/workflows/` | 全箇所 `@v3` に揃っていること |
| TC-S06 | Token 値の混入なし | `grep -rEn '[A-Za-z0-9_-]{40,}' docs/30-workflows/u-fix-cf-acct-01*/outputs/` | 該当ヒットなし（成果物に Token 値が無い） |

### 2. Runtime 検証（staging Token 再発行後に実行）

| TC ID | 種別 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| TC-R01 | 認証疎通 | `bash scripts/cf.sh whoami` | `OK Account` 表示・exit=0（Token 値は出力されない） |
| TC-R02 | D1 list 権限 | `bash scripts/cf.sh d1 list` | exit=0、`ubm-hyogo-db-staging` を含む一覧が返る |
| TC-R03 | D1 migrations list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | exit=0、適用済 migration 一覧が返る |
| TC-R04 | apps/api dry-run deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | exit=0、`Would upload` 系出力 |
| TC-R05 | apps/web dry-run deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit=0 |
| TC-R06 | 追加候補確認 | `bash scripts/cf.sh kv namespace list` / `bash scripts/cf.sh whoami` | 4 権限で失敗した場合のみ Workers KV Storage:Edit / User Details:Read の追加要否を記録 |

### 3. Negative 検証（権限剥がし時の見え方）

| TC ID | 種別 | 想定操作 | 期待結果 |
| --- | --- | --- | --- |
| TC-N01 | D1:Edit 欠落 | staging 用一時 Token から D1 権限を外して `cf.sh d1 migrations apply --env staging` | `Authentication error [code: 10000]` または `code: 7003` で fail |
| TC-N02 | Workers Scripts:Edit 欠落 | 同上で `cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | `Authentication error` で fail |
| TC-N03 | Pages:Edit 欠落 | 同上で apps/web の dry-run | `Authentication error` または Pages project 取得失敗 |
| TC-N04 | Token 値露出検出 | `cf.sh whoami` 実行時の出力を `grep -E '[A-Za-z0-9_-]{40,}'` | ヒットしないこと（Token 値が log に漏れない） |

### 4. Production 適用後検証（Phase 11）

| TC ID | 種別 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| TC-P01 | backend-ci main run | `gh run list --branch main --workflow=backend-ci --limit 1 --json conclusion` | `conclusion: success` |
| TC-P02 | web-cd main run | `gh run list --branch main --workflow=web-cd --limit 1 --json conclusion` | `conclusion: success` |
| TC-P03 | Authentication error 不出 | 最新 run log に `code: 10000` が含まれない | 該当文字列なし |
| TC-P04 | 旧 Token 失効後 24h 監視 | GitHub Actions 通知 + `gh run list` | 失敗 0 件 |

## TDD 適用判定

本タスクはコード実装を伴わず、Cloudflare Dashboard 操作 + GitHub Secret 値の差し替えに留まる。RED/GREEN サイクルではなく **権限剥がし → 失敗確認 → 必要権限戻し → 成功確認** の差分テストを Phase 6 と組み合わせて代替する。

## カバレッジ目標

| 観点 | カバレッジ |
| --- | --- |
| 権限カテゴリ | 4/4 = 100%（Workers Scripts / D1 / Pages / Account Settings を TC-R01〜R05 と TC-N01〜N03 で網羅。KV / User Details は追加候補として TC-R06 で判定） |
| Token 利用 step | 6/6 = 100%（backend-ci.yml の 4 step + web-cd.yml の 2 step を TC-S01 で確認） |
| 環境分離 | 2/2 = 100%（staging / production を TC-R / TC-P で確認） |

## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定（Secret 値）と Cloudflare 側 Token 権限の監査であり、アプリケーション統合テストは追加しない。
- runtime 検証は `scripts/cf.sh` 経由の wrangler 実行のみで完結する。

## Token 値非記録ガード

- 全 TC で `set -x` を**使用しない**。
- `cf.sh whoami` などのラッパ出力は Token 値を含まないが、エラー時に Token を含むスタックが出る場合は該当行を `tee` 前に sanitize する。
- 成果物に貼り付ける際は `--- Token redacted ---` 表記に置換する。
- TC-S06 / TC-N04 を必須実行とし、Phase 11 evidence の最終 grep を gate にする。

## 完了条件

- [ ] 全 TC（Static / Runtime / Negative / Production）が ID 付きで列挙されている
- [ ] 6 カテゴリの権限がいずれかの TC に紐付いている
- [ ] Token 値非記録ガード（TC-S06 / TC-N04）が含まれている
- [ ] staging→production の段階分けが明示されている

## 成果物

- `outputs/phase-04/main.md`
