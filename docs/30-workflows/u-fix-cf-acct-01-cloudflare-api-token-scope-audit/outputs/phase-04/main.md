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
| 上流 | outputs/phase-01/main.md, outputs/phase-02/main.md, outputs/phase-03/main.md |
| 下流 | outputs/phase-05/main.md, outputs/phase-06/main.md, outputs/phase-11/main.md |

## 1. 目的

API Token の権限最小化が「過不足なく必要権限を満たす」ことを、(a) CI 設定の静的解析、(b) Cloudflare API での実行可否（dry-run）、(c) 失敗系での権限不足検出 の三段で検証する。Token 値・Account ID をログ・成果物に出さない検証手順だけを採用する。

## 2. テスト戦略の前提

- 本タスクはアプリケーションコードの追加・変更を伴わないため、unit / integration test は新設しない。
- 検証手段は `grep` / `gh api` / `gh secret list` / `bash scripts/cf.sh ... --dry-run` / `bash scripts/cf.sh whoami` の 5 系統に限定する。
- すべての runtime 検証は `bash scripts/cf.sh` ラッパー経由で行い、`wrangler` を直接呼ばない（`scripts/cf.sh` が op 注入と esbuild バージョン整合を保証する）。
- 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）に侵入しない。検証コマンドは CI 経路（`apps/api` の migration / Workers deploy / Pages deploy）の権限実測のみを対象とする。

## 3. テストカテゴリ

### 3.1 Static 検証（Token 再発行前に実行可能）

| TC ID | 種別 | コマンド | 期待結果 | 紐付く AC |
| --- | --- | --- | --- | --- |
| TC-S01 | Token 参照棚卸し | `grep -rn 'secrets\.CLOUDFLARE_API_TOKEN' .github/` | `backend-ci.yml` / `web-cd.yml` の `apiToken:` 行のみマッチ | AC-1 |
| TC-S02 | scope 外参照ゼロ | `grep -rn 'CLOUDFLARE_API_TOKEN' apps/ scripts/` | アプリ本体・cf.sh ラッパに直書きが無い | AC-1 / AC-9 |
| TC-S03 | production Secret 存在確認（値非表示） | `gh api repos/daishiman/UBM-Hyogo/environments/production/secrets \| jq '.secrets[] \| select(.name=="CLOUDFLARE_API_TOKEN") \| .name'` | `"CLOUDFLARE_API_TOKEN"` のみ・`value` は API 仕様上返らない | AC-12 |
| TC-S04 | staging Secret 存在確認（値非表示） | `gh api repos/daishiman/UBM-Hyogo/environments/staging/secrets \| jq '.secrets[] \| select(.name=="CLOUDFLARE_API_TOKEN") \| .name'` | `"CLOUDFLARE_API_TOKEN"` のみ | AC-12 |
| TC-S05 | wrangler-action バージョン整合 | `grep -rn 'cloudflare/wrangler-action@' .github/workflows/` | 全箇所 `@v3` に揃っている | AC-10 |
| TC-S06 | Token 値混入なし | `grep -rEn '[A-Za-z0-9_-]{40,}' docs/30-workflows/u-fix-cf-acct-01*/outputs/` | 該当ヒットなし（成果物に Token 値が無い） | AC-8 |

### 3.2 Runtime 検証（staging Token 切替後・T2 で実施）

| TC ID | 種別 | コマンド | 期待結果 | 紐付く AC |
| --- | --- | --- | --- | --- |
| TC-R01 | 認証疎通 | `bash scripts/cf.sh whoami` | `OK Account` 表示・exit=0、Token 値は出力されない | AC-2 |
| TC-R02 | D1 list 権限 | `bash scripts/cf.sh d1 list` | exit=0、`ubm-hyogo-db-staging` を含む一覧が返る | AC-2 |
| TC-R03 | D1 migrations list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | exit=0、適用済 migration 一覧が返る | AC-3 |
| TC-R04 | apps/api dry-run deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | exit=0、`Would upload` 系出力 | AC-4 |
| TC-R05 | apps/web dry-run deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit=0 | AC-5 |
| TC-R06 | 追加候補要否判定 | `bash scripts/cf.sh kv namespace list` ／ `bash scripts/cf.sh whoami` の fail 出力観察 | 4 権限で失敗した場合のみ `Workers KV Storage:Edit` / `User Details:Read` の追加要否を Phase 11 evidence に記録 | AC-2 |

### 3.3 Negative 検証（権限剥がし時の見え方）

| TC ID | 種別 | 想定操作 | 期待結果 | 紐付く AC |
| --- | --- | --- | --- | --- |
| TC-N01 | D1:Edit 欠落 | staging 用一時 Token から D1 権限を外し `cf.sh d1 migrations apply --env staging` | `Authentication error [code: 10000]` または `code: 7003` で fail | AC-1 / AC-2 |
| TC-N02 | Workers Scripts:Edit 欠落 | 同上で `cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | `Authentication error` で fail | AC-1 / AC-2 |
| TC-N03 | Pages:Edit 欠落 | 同上で `cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | `Authentication error` または Pages project 取得失敗 | AC-1 / AC-2 |
| TC-N04 | Token 値露出検出 | `cf.sh whoami` 実行時の標準出力／エラーを `grep -E '[A-Za-z0-9_-]{40,}'` | ヒットしないこと（Token 値が log に漏れない） | AC-8 |

### 3.4 Production 適用後検証（Phase 11 で実施）

| TC ID | 種別 | 確認方法 | 期待結果 | 紐付く AC |
| --- | --- | --- | --- | --- |
| TC-P01 | backend-ci main run | `gh run list --branch main --workflow=backend-ci --limit 1 --json conclusion` | `conclusion: success` | AC-3 / AC-4 |
| TC-P02 | web-cd main run | `gh run list --branch main --workflow=web-cd --limit 1 --json conclusion` | `conclusion: success` | AC-5 |
| TC-P03 | Authentication error 不出 | 最新 run log を `grep 'code: 10000'` | 該当文字列なし | AC-1 |
| TC-P04 | 旧 Token 失効後 24h 監視 | `gh run list --branch main --created '>YYYY-MM-DD' --json conclusion` | 失敗 0 件 | AC-6 / AC-7 |

## 4. TDD 適用判定

本タスクはコード実装を伴わず、Cloudflare Dashboard 操作 + GitHub Secret 値の差し替えに留まる。RED/GREEN サイクルではなく **権限剥がし → 失敗確認 → 必要権限戻し → 成功確認** の差分テスト（TC-N01〜N03）を Phase 6 と組み合わせて代替する。

## 5. カバレッジ目標

| 観点 | カバレッジ | 内訳 |
| --- | --- | --- |
| 権限カテゴリ | 4/4 = 100% | Workers Scripts / D1 / Pages / Account Settings を TC-R01〜R05 と TC-N01〜N03 で網羅。KV / User Details は条件付きで TC-R06 で判定 |
| Token 利用 step | 6/6 = 100% | backend-ci.yml の 4 step + web-cd.yml の 2 step を TC-S01 で確認 |
| 環境分離 | 2/2 = 100% | staging / production を TC-R / TC-P で確認 |
| AC カバレッジ | 12/12 | AC-1〜AC-12 を本 Phase の TC ID か Phase 5/6/7 のいずれかにマッピング（Phase 7 で再集約） |

## 6. Token 値非記録ガード

- 全 TC で `set -x` を**使用しない**（stderr に Token を含むコマンドラインが echo されるリスク回避）。
- `cf.sh` 系出力は Token 値を含まない仕様だが、エラー時のスタックに含まれる可能性があるため、`tee` 前に `grep -vE '[A-Za-z0-9_-]{40,}'` を挟む方針を Phase 5 / 6 と共有。
- 成果物に貼り付ける際は `--- Token redacted ---` 表記で置換。
- TC-S06 / TC-N04 を Phase 11 evidence の最終 grep gate にする。

## 7. 統合テスト連携

- アプリケーション統合テストは追加しない。
- runtime 検証は `scripts/cf.sh` 経由の wrangler 実行のみで完結する。

## 8. AC マッピング（Phase 4 内 完結分）

| AC | 本 Phase での貢献 |
| --- | --- |
| AC-1 | TC-S01 / TC-S02 / TC-N01〜N03 / TC-P03 |
| AC-2 | TC-R01〜R06（実測根拠の取得） |
| AC-3 | TC-R03 |
| AC-4 | TC-R04 |
| AC-5 | TC-R05 |
| AC-8 | TC-S06 / TC-N04（grep gate） |
| AC-12 | TC-S03 / TC-S04 |

その他 AC（AC-6 / AC-7 / AC-9 / AC-10 / AC-11）は Phase 2 / 5 / 6 / 7 で扱う。

## 9. 完了条件

- [ ] 全 TC（Static / Runtime / Negative / Production）が ID 付きで列挙されている
- [ ] 6 カテゴリの権限がいずれかの TC に紐付いている（追加候補 2 種は TC-R06 で条件付き）
- [ ] Token 値非記録ガード（TC-S06 / TC-N04）が含まれている
- [ ] staging→production の段階分けが明示されている

## 10. 成果物

- 本ファイル: `outputs/phase-04/main.md`
