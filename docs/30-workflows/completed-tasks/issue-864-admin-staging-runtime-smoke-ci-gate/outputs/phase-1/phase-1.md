# Phase 1: 要件定義

## 目的

issue #864「admin staging runtime smoke CI gate」のスコープ・前提・受入条件・inventory を固定する。
root-cause render error（digest=167275886）は親タスク + #877/#862/#863 で修正済み。本タスクは**回帰防止 gate の新設**に限定する。

## P50 前提確認チェック

| 確認項目                           | 結果 | 対応                                                                     |
| ---------------------------------- | ---- | ------------------------------------------------------------------------ |
| current branch に実装が存在する    | No   | 通常の実装 Phase（`implementation_mode: new`）                           |
| upstream（dev/main）にマージ済み   | No（gate 部分） | render error 修正は merge 済。本 gate は本 worktree で新規 local 実装として扱う |
| 前提タスク（依存タスク）が完了済み | Yes  | 親タスク root-cause 修正（#877/#862/#863）完了済み。gate は本タスクで新設 |

→ `implementation_mode: "new"`。RED/GREEN サイクルで新規実装。

## 既存コードの命名規則分析（Phase 4 のテストパターン整合に使用）

| 対象                       | 命名規則                                | 例                                              |
| -------------------------- | --------------------------------------- | ----------------------------------------------- |
| smoke runner shell         | kebab-case `.sh`                        | `scripts/smoke/runtime-attendance-provider.sh`  |
| smoke mint helper          | kebab-case `.mts`                       | `scripts/smoke/mint-staging-bearers.mts`        |
| shell test                 | `*.test.sh`（`scripts/smoke/__tests__/`）| `runtime-attendance-provider.test.sh`           |
| TS test                    | `*.spec.ts`（CLAUDE.md 不変条件 8）      | `mint-staging-bearers.spec.ts`                  |
| GitHub Actions job 名      | kebab-case                              | `deploy-staging` / `smoke`                      |
| 関数（mint helper export） | camelCase                               | `mintStagingBearers`                            |

→ 新規 runner は `runtime-admin-web.sh`、mint helper は `mint-staging-session-cookie.mts`、test は `runtime-admin-web.test.sh` / `mint-staging-session-cookie.spec.ts` とする。

## carry-over 確認（前タスク成果物の棚卸し）

| 既存成果物                                          | 本タスクとの関係                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `runtime-smoke-staging.yml`（API smoke）            | **構造テンプレート**として再利用（mint step / redaction gate / artifact upload / Slack 通知） |
| `runtime-attendance-provider.sh`                    | **構造テンプレート**として再利用（`assert_staging_target` / `fail_and_exit` / `request_json` / redact） |
| `mint-staging-bearers.mts`                          | `signSessionJwt` ベースの mint 手法を流用。Auth.js 互換性は Phase 1 で実測判定 |
| `scripts/cf.sh`                                     | `tail` subcommand を追加（EDIT）                                  |
| 親 `fix-admin-server-components-render-error-stg` Phase 11 | 手動 `cf.sh tail` + curl 手順を **自動 gate へ昇格**する対象 |

## 真の論点の固定（1文）

> 「staging へ deploy するたびに authenticated `/admin` の Server Components render が壊れていないことを、人手ではなく CI が自動で検証する gate を新設する」。

## 認証ゲート 2 層構造の事前確認（最重要・未確定点）

`/admin` は次の 2 層で守られている。post-deploy probe は**両層を通過**しなければ render path に到達しない。

| 層 | 実装 | 復号方式 | probe が満たす条件 |
| -- | ---- | -------- | ------------------ |
| edge | `apps/web/middleware.ts` の `decodeAuthSessionJwt(authSecret, sessionToken)` | 自前 HS256（`signSessionJwt` と対） | session cookie に `signSessionJwt` 形式の JWT |
| route | `apps/web/(admin)/layout.tsx` の `getSession()` → Auth.js `auth()` | Auth.js の session 復号設定に依存（JWE or 自前 jwt callback） | Auth.js が同 cookie を session として復号できること |

**Phase 1 で必ず実測確認する未確定点**:

1. `apps/web/src/lib/auth.ts` の Auth.js 設定で `session.strategy` / `jwt.encode` / `jwt.decode` が **custom（`signSessionJwt`/`decodeAuthSessionJwt` と同一）か Auth.js default（JWE）か**を確認する。
2. custom で統一されている場合 → `mint-staging-bearers.mts` 由来の JWT を session cookie 値にセットすれば両層通過。新規 mint helper は薄い wrapper で済む。
3. Auth.js default（JWE）の場合 → middleware は HS256 を見て layout は JWE を見るという**非対称**になっている可能性がある。その場合は Auth.js 互換 encode を行う `mint-staging-session-cookie.mts` を新設し、`@auth/core` の `encode` を `AUTH_SECRET` で呼ぶ。

実測コマンド（read-only、値は出力しない）:

```bash
rg -n "session\s*:|strategy|jwt\s*:|encode|decode" apps/web/src/lib/auth.ts
rg -n "decodeAuthSessionJwt|signSessionJwt" packages/shared/src/auth.ts apps/web/middleware.ts
rg -n "cookie|session-token|__Secure" apps/web/middleware.ts
```

## inventory（変更対象ファイル）

| 区分 | パス                                            | 役割                                                            |
| ---- | ----------------------------------------------- | --------------------------------------------------------------- |
| EDIT | `scripts/cf.sh`                                 | `tail` subcommand 追加（`wrangler tail` ラップ）                |
| NEW  | `scripts/smoke/runtime-admin-web.sh`            | authenticated `/admin` GET 200 probe + boundary log grep gate   |
| NEW  | `scripts/smoke/mint-staging-session-cookie.mts` | `/admin` 2 層を通過する session cookie を mint                   |
| EDIT | `.github/workflows/web-cd.yml`                  | `needs: deploy-staging` の `admin-runtime-smoke` job 追加        |
| NEW  | `scripts/smoke/__tests__/runtime-admin-web.test.sh` | runner の unit/contract test                                |
| NEW  | `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | mint helper の unit test（純粋関数）              |

## 受入条件（再掲）

AC-1〜AC-8 は `index.md` の受入条件テーブルを正本とする。

## targeted test ファイルリスト（全件 test 回避）

メモリ制約下では全件 `pnpm test` を避け、以下を targeted run する:

```bash
bash scripts/smoke/__tests__/runtime-admin-web.test.sh
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
```

## 完了判定

- [x] スコープ・受入条件・inventory 確定
- [x] 認証 2 層の token 互換性の実測手順を Phase 2 へ引き継ぎ
- [x] 命名規則を記録（Phase 4 のテストパターン整合に使用）
