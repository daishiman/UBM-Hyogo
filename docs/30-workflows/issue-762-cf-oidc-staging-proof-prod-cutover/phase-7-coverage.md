# Phase 7: カバレッジ確認

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)

---

## 1. Coverage 対象範囲

本サイクルは shell script 新規 1 件 + 既存 shell script 編集 1 件 + workflow YAML 新規 1 件 + workflow YAML コメント編集 1 件 + reference doc 編集 1 件で構成される。TypeScript / JavaScript / React のアプリケーションコード変更を含まないため、Vitest / Playwright の line / branch coverage 計測は本サイクル対象外。代替 coverage は「shell script の exit path 網羅」「正規表現パターン網羅」「workflow lint 適合」の 3 軸で評価する。

| 対象 | coverage 指標 | 計測手段 | 状態 |
|---|---|---|---|
| `scripts/oidc/verify-claim-pin.sh` | 全 exit path（0 / 1 / 2）と claim 4 軸の mismatch 各ケース | plain bash spec（リポジトリ既存スタイル） | covered（9 assertions） |
| `scripts/redaction-check.sh` 追加パターン | JWT 検出 / `cloudflare-aud` 検出 / クリーン PASS / 既存 ACCOUNT_ID regression | fixture log + plain bash spec | covered（Phase 6 追加テストで網羅） |
| `.github/workflows/oidc-observation-window.yml` | YAML syntax + GitHub Actions schema 適合 | `actionlint` | covered |
| `.github/workflows/web-cd.yml` | コメント追加後も既存 schema 適合 / deploy 挙動不変 | `actionlint` + `git diff` レビュー | covered |
| `deployment-secrets-management.md` | 構造崩れなし / G1-G4 追記 | lefthook markdown lint | covered |
| TypeScript / JavaScript line / branch | — | Vitest / coverage report | **非適用**（コード変更なし） |

## 2. Shell script exit path 網羅表

### 2.1 `verify-claim-pin.sh`

| ケース | 入力 | 期待 exit | 期待 stderr/stdout |
|---|---|---|---|
| C-1 | 4 軸完全一致（production） | 0 | stdout: `PASS: subject claim pin verified ...` |
| C-2 | 4 軸完全一致（staging） | 0 | stdout: `PASS: ...` |
| C-3 | repository mismatch | 1 | stderr: `MISMATCH repository: expected=..., got=...` |
| C-4 | ref mismatch | 1 | stderr: `MISMATCH ref: ...` |
| C-5 | environment mismatch | 1 | stderr: `MISMATCH environment: ...` |
| C-6 | event_name mismatch | 1 | stderr: `MISMATCH event_name: ...` |
| C-7 | ref と environment の組合せ不整合（`refs/heads/main` + `staging`） | 1 | stderr: `MISMATCH ref/environment combination: ...` |
| C-8 | 引数欠落（`--repository` のみ） | 2 | stderr: usage |
| C-9 | 未知オプション | 2 | stderr: usage |

→ exit code 3 種（0 / 1 / 2）× 主要分岐をすべて被覆。

### 2.2 `redaction-check.sh` 追加パターン

| ケース | 入力（stdin or fixture） | 期待 exit | 期待 stderr |
|---|---|---|---|
| R-1 | JWT 1 件含む log | 非ゼロ | `::error::JWT-like token detected in log` |
| R-2 | `cloudflare-aud` 文字列含む log | 非ゼロ | `::error::cloudflare-aud claim detected in log` |
| R-3 | クリーン log（pnpm-lock.yaml 風 integrity hash を含むが JWT 形式ではない） | 0 | なし |
| R-4 | 既存 ACCOUNT_ID leak ケース（regression） | 非ゼロ | `::error::Cloudflare Account ID detected` |
| R-5 | JWT + ACCOUNT_ID 同時混入 | 非ゼロ | 両 error が出力される |

→ 新規パターン 2 件 + 既存 regression + 偽陽性回避ケースを被覆。

## 3. Coverage gate 適用判定

| gate | 適用 | 根拠 |
|---|---|---|
| `pnpm test --coverage`（Vitest line/branch） | **非適用** | TypeScript / React コード変更なし |
| `pnpm exec playwright test`（E2E） | **非適用** | UI / API endpoint 変更なし（NON_VISUAL） |
| shell script spec 実行 | **適用** | 新規 `verify-claim-pin.sh` と編集 `redaction-check.sh` の挙動保証 |
| `actionlint` | **適用** | `oidc-observation-window.yml` 新規 + `web-cd.yml` コメント追記 |
| `shellcheck` | **適用** | `verify-claim-pin.sh` 新規 + `redaction-check.sh` 編集 |
| markdown lint（lefthook 既存設定） | **適用** | `deployment-secrets-management.md` 編集 |

## 4. Evidence Checklist

- [x] `scripts/oidc/verify-claim-pin.sh` の追加テスト 9 ケースが全 PASS（tracked summary に保存）
- [x] `scripts/redaction-check.sh` の追加テスト + regression 15 assertions が全 PASS（tracked summary に保存）
- [x] `shellcheck scripts/oidc/verify-claim-pin.sh scripts/oidc/__tests__/verify-claim-pin.spec.sh scripts/redaction-check.sh scripts/__tests__/redaction-check.test.sh` で warn 0 件
- [x] `actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml` で警告 0 件
- [x] `git diff -- .github/workflows/web-cd.yml` の差分がコメント行追加のみであることをレビュー
- [x] `outputs/phase-11/local-verification-summary.md` に shellcheck / actionlint / spec 実行結果を tracked evidence として保存
- [x] runtime OIDC token / JWT 実値 / Account ID 実値が成果物・log に含まれない

## 5. DoD

- [x] shell script の exit path 網羅表（§2）に対応するテストケースが Phase 6 で追加され全 PASS
- [x] `shellcheck` warn 0 件
- [x] `actionlint` 警告 0 件
- [x] TypeScript / JavaScript coverage gate 非適用の根拠（コード変更なし）が記録されている
- [x] missing runtime OIDC deploy log を PASS 根拠にしていない
- [x] 既存 `redaction-check.sh` の ACCOUNT_ID 検出ケースが regression なし
