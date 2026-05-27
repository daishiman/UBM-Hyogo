# Phase 1: 要件定義

## 目的

issue #922「production admin runtime smoke gate」のスコープ・前提・受入条件・inventory を固定する。
親 #864 で staging gate は確立済み。本タスクは **同型 gate の production 展開** に限定する。

## P50 前提確認チェック

| 確認項目                           | 結果 | 対応                                                                     |
| ---------------------------------- | ---- | ------------------------------------------------------------------------ |
| current branch に実装が存在する    | No   | 通常の実装 Phase（`implementation_mode: extend`） |
| upstream（dev/main）にマージ済み   | No（production gate 部分） | staging gate は merge 済。本 production gate は本 worktree で新規 local 実装として扱う |
| 前提タスク（依存タスク）が完了済み | Yes  | 親 #864（staging gate）merge 済み                                       |

→ `implementation_mode: "extend"`。既存 staging gate コードを environment-aware に拡張し、production job を追加。

## 既存コードの命名規則分析（Phase 4 のテストパターン整合に使用）

| 対象                       | 命名規則                                | 例                                              |
| -------------------------- | --------------------------------------- | ----------------------------------------------- |
| smoke runner shell         | kebab-case `.sh`                        | `scripts/smoke/runtime-admin-web.sh`            |
| smoke mint helper          | kebab-case `.mts`                       | `scripts/smoke/mint-staging-session-cookie.mts` |
| shell test                 | `*.test.sh`                             | `runtime-admin-web.test.sh`                     |
| TS test                    | `*.spec.ts`（CLAUDE.md 不変条件 8）     | `mint-staging-session-cookie.spec.ts`           |
| GitHub Actions job 名      | kebab-case                              | `admin-runtime-smoke` / `admin-runtime-smoke-production` |
| 関数（mint helper export） | camelCase                               | `mintStagingSessionCookie`（既存）→ `mintAdminSessionCookie`（一般化後）|

→ 本タスクでは **既存ファイル名は維持** し、内部で environment-aware に分岐する設計を採る
（後方互換と review surface 最小化のため）。

## carry-over 確認（前タスク成果物の棚卸し）

| 既存成果物                                          | 本タスクとの関係                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `.github/workflows/web-cd.yml admin-runtime-smoke` job (staging) | **構造テンプレート**として再利用。`needs: deploy-production` の new job をその直後に配置 |
| `scripts/smoke/runtime-admin-web.sh`                | **EDIT**。staging hard-code (`if [[ "$ENVIRONMENT" != "staging" ]]; then exit 2`) を staging\|production allowlist へ拡張 |
| `scripts/smoke/mint-staging-session-cookie.mts`     | **EDIT**。env prefix を CLI 引数化（引数なし = staging、`production` = production）|
| `scripts/cf.sh tail`                                | 変更なし（既存 subcommand をそのまま再利用）                       |
| `scripts/smoke/redact.sh` / `ci-summary-post.sh`    | 変更なし（既存 helper をそのまま再利用）                           |
| `scripts/smoke/__tests__/runtime-admin-web.test.sh` | **EDIT**。production env path の test ケースを追加                |
| `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | **EDIT**。production env path（PRODUCTION_AUTH_SECRET 等）の test を追加 |

## 真の論点の固定（1文）

> 「main へ production deploy するたびに authenticated `/admin` の Server Components render が壊れていないことを、staging gate と対称な構造で CI が自動検証する」。

## 既存コード調査結果（事前確認済み）

| 対象                                                  | 現状                                                                 | 要対応                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| `.github/workflows/web-cd.yml` 行 65-160              | staging `admin-runtime-smoke` job 完備                               | テンプレートとして引用                              |
| `.github/workflows/web-cd.yml` 行 162-203             | production deploy job 存在、admin-runtime-smoke 未実装               | `admin-runtime-smoke-production` job を追加         |
| `scripts/smoke/runtime-admin-web.sh`                  | `$ENVIRONMENT != staging` で exit 2、host は `STAGING_WEB_BASE`、`CF_WORKER_NAME` 既定 `ubm-hyogo-web-staging` | env-aware に一般化 |
| `scripts/smoke/mint-staging-session-cookie.mts`       | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` を直接参照 | env prefix を引数化、production prefix を追加 |
| cookie 名                                             | `__Secure-authjs.session-token`（staging / production 共通）         | 変更なし                                            |

## 認証ゲート 2 層構造の継承（親 #864 で確定済み）

`/admin` は親 #864 Phase 1 で実測確定した **分岐 A**（middleware と layout が同一 custom JWT `signSessionJwt`/`decodeAuthSessionJwt`）で守られている。production も同 `apps/web` deploy のため **同構造**。本タスクでは再実測不要だが、production secret が staging と異なる値であることのみ確認する。

## inventory（変更対象ファイル）

| 区分 | パス                                            | 役割                                                            |
| ---- | ----------------------------------------------- | --------------------------------------------------------------- |
| EDIT | `scripts/smoke/runtime-admin-web.sh`            | env を `staging\|production` allowlist 化、host / worker name を env 引数で切替 |
| EDIT | `scripts/smoke/mint-staging-session-cookie.mts` | CLI 引数で env prefix を切替（引数なし = `STAGING_*`、`production` = `PRODUCTION_*`）|
| EDIT | `.github/workflows/web-cd.yml`                  | `admin-runtime-smoke-production` job を追加（`needs: deploy-production`、`if: github.ref_name == 'main'`）|
| EDIT | `scripts/smoke/__tests__/runtime-admin-web.test.sh` | production env path の test ケース追加（host allowlist / reason 分類） |
| EDIT | `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | production env path の env prefix routing test 追加 |

## 受入条件（再掲）

AC-1〜AC-9 は `index.md` の受入条件テーブルを正本とする。

## targeted test ファイルリスト（全件 test 回避）

メモリ制約下では全件 `pnpm test` を避け、以下を targeted run する:

```bash
bash scripts/smoke/__tests__/runtime-admin-web.test.sh
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
```

## 完了判定

- [x] スコープ・受入条件・inventory 確定
- [x] 親 #864 の構造を再利用し、production 用 environment-aware 一般化を Phase 2 へ引き継ぎ
- [x] 命名規則を記録（既存ファイル名維持・内部 env-aware 分岐方針）
