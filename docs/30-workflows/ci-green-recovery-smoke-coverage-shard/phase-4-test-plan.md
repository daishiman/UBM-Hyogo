# Phase 4: テスト計画

Phase 2 で確定した 3 lane 設計に対するテスト計画。新規 test は `*.spec.ts` のみ（CLAUDE.md 不変条件 #8）。NON_VISUAL タスクのため、UI screenshot は無く、自動テスト + actionlint + CI 観測を証跡とする。

---

## 0. テスト方針（lane 別の検証戦略）

| Lane | 主たる検証対象 | テスト手段 |
|---|---|---|
| A | mint helper の JWT が `verifySessionJwt` で検証通過し、isAdmin が正しく載ること / 必須 env 欠落で exit2 / TTL 反映 / 401・403 の reason 分類 | Vitest unit (`mint-staging-bearers.spec.ts`) + shell runner の reason 分岐目視確認 |
| B | `coverage-guard.sh --no-run` の MISSING 診断メッセージが強化されていること（判定ロジックは不変） | `--no-run` 実行のメッセージ確認 + 既存 coverage 系 unit の回帰 |
| C | `ci.yml` の top-level permissions / shard checkout token / step 順序が正しく YAML として妥当であること | actionlint + 目視 step 順序確認 |

mint した JWT は **`signSessionJwt` 一本を format 正本**とし、verify との parity を unit で固定する（R-2 解決）。secret 実値・JWT 文字列・署名鍵は test fixture にも転記せず、test 内で生成したダミー鍵（例: `"test-secret"` 等の非機密リテラル）のみを使う。

---

## 1. Lane A — mint parity test（`scripts/smoke/__tests__/mint-staging-bearers.spec.ts`）

### 1.1 検証関数のシグネチャ（Phase 2 §1.2 と完全一致）

```ts
// テスト対象（純粋関数。process.env を直接読まない）
export async function mintStagingBearers(env: {
  authSecret: string;
  adminMemberId: string;
  adminEmail: string;
  meMemberId: string;
  meEmail: string;
  ttlSeconds?: number;
}): Promise<{ adminBearer: string; meBearer: string; memberId: string }>;

// 検証に使う shared helper（実シグネチャ）
//   signSessionJwt(secret: string, input: { memberId, email, isAdmin, name?, nowSeconds?, ttlSeconds? }): Promise<string>
//   verifySessionJwt(token: string, secret: string, nowSeconds?: number): Promise<SessionJwtClaims | null>
import { verifySessionJwt } from "@ubm-hyogo/shared";
```

### 1.2 テストケース一覧

| # | ケース | 入力 | 期待結果 |
|---|---|---|---|
| T-A1 | admin parity | `authSecret=S`, admin identity, ttl 未指定 | `verifySessionJwt(adminBearer, S)` が非 null、`claims.isAdmin === true`、`claims.memberId === adminMemberId`、`claims.email === adminEmail`、`claims.sub === adminMemberId` |
| T-A2 | me parity | 同上 | `verifySessionJwt(meBearer, S)` が非 null、`claims.isAdmin === false`、`claims.memberId === meMemberId`、`claims.email === meEmail` |
| T-A3 | memberId 出力契約 | 同上 | 返り値 `memberId === adminMemberId`（既存 `STAGING_MEMBER_ID` 互換で admin の memberId を出す） |
| T-A4 | TTL 反映 | `ttlSeconds = 600` を指定し `nowSeconds` を固定する設計差を吸収するため、verify 時に `nowSeconds = iat + 599`（有効）/ `iat + 601`（失効）で検証 | 599 で非 null、601 で null（exp = iat + 600） |
| T-A5 | TTL 既定値 | `ttlSeconds` 未指定 | 既定 600（10 分）が適用される。`iat + 601` で失効、`iat + 599` で有効 |
| T-A6 | 鍵不一致で verify 失敗 | mint は `S` で発行、verify は `S2`（別鍵） | `verifySessionJwt(adminBearer, S2)` が null（HMAC mismatch） |
| T-A7 | 必須 env 欠落（CLI guard） | `authSecret=""` 等の欠落 | helper の純粋関数は throw 相当、CLI 経路では `process.exit(2)` + stderr に欠落 env 名（JWT は出さない） |

> T-A4/T-A5 の TTL 検証は `signSessionJwt` の `nowSeconds`/`ttlSeconds` を mint helper が透過させる前提。mint helper は test から `ttlSeconds` を受け取り `signSessionJwt` にそのまま渡すため、`exp = iat + ttlSeconds` が成立する。`iat` は decode して取得する（JWT payload の base64url decode は test util で行う / または verify の `nowSeconds` 引数で境界を突く）。

### 1.3 secret 非露出の検証

| # | ケース | 期待結果 |
|---|---|---|
| T-A8 | console 非出力 | mint helper（純粋関数）は JWT を `console.*` に出さない。CLI guard 経路でも stdout への JWT echo が無い（`GITHUB_OUTPUT`/`GITHUB_ENV` 追記のみ）。unit では純粋関数のみ検証し、CLI の add-mask 適用は workflow 側の責務として Phase 9 actionlint + 目視で担保する |

### 1.4 reason 分岐の検証方針（`runtime-attendance-provider.sh`）

shell runner の reason 分類（Phase 2 §1.4）は bats などの shell unit ではなく、**runner の分岐ロジックを目視レビュー + ローカルでの擬似レスポンス確認**で検証する（実 staging への通信は CI 限定のため、ローカルは jq 分岐の単体確認に留める）。検証する分岐は以下:

| status / body | 期待 `failure_reason` |
|---|---|
| 500 + `{"error":"auth misconfigured"}` | `auth-secret-binding-missing`（既存・回帰） |
| 401 + `{"error":"unauthorized"}` | `auth-token-invalid-or-expired`（新規） |
| 403 + `{"error":"forbidden"}` | `auth-not-admin`（新規） |
| 200 | reason 無し（PASS） |

> reason 値は redact 済み body から `jq` で error 種別のみを読むため JWT は出力しない（不変条件 3 維持）。検証は redacted body を入力にした分岐の到達確認に限定する。

---

## 2. Lane B — coverage-guard.sh `--no-run` 診断メッセージ

| # | ケース | command | expected result |
|---|---|---|---|
| T-B1 | MISSING メッセージ強化確認 | `bash scripts/coverage-guard.sh --no-run`（coverage 未生成状態） | 既存 MISSING 行に加え、「shard 成功時のみ真の欠落。shard 失敗が疑われる場合は coverage-gate-shard 結果を確認せよ」という誘導メッセージが stderr に出る。exit 1 のまま（判定ロジック不変） |
| T-B2 | 判定ロジック不変（回帰） | summary が全 package 揃った状態で `--no-run` | 既存通り PASS（exit 0）。メッセージ追記が判定に影響しない（false negative を作らない / R-4） |
| T-B3 | group モード回帰 | `bash scripts/coverage-guard.sh --group packages --no-run` | 既存挙動維持（group summary の存在確認のみ） |

> coverage-guard.sh は shell script のため Vitest 対象外。`--no-run` のメッセージ確認は手動 command 実行 + 目視。判定ロジックの回帰は既存の coverage 系運用で担保する。

---

## 3. Lane C — ci.yml 検証（actionlint）

| # | ケース | command | expected result |
|---|---|---|---|
| T-C1 | YAML / workflow 妥当性 | `actionlint .github/workflows/ci.yml` | エラー 0。top-level `permissions: contents: read` 追加・checkout token 明示・step 順序入れ替えが syntactically valid |
| T-C2 | step 順序確認 | 目視 + `actionlint` | `coverage-gate` job 内で「Fail closed on failed shard」が「Coverage gate (aggregate, no-run)」より**前**にあること |
| T-C3 | required context 名不変 | 目視（`name: coverage-gate`） | job name `coverage-gate` / `coverage-gate-shard (...)` が変わっていない（branch protection 維持 / AC-8） |
| T-C4 | runtime-smoke-staging.yml 妥当性 | `actionlint .github/workflows/runtime-smoke-staging.yml` | mint step + setup-project + fallback `if:` 追加後もエラー 0 |

---

## 4. command suite サマリ（ローカル実行）

| 目的 | command |
|---|---|
| mint parity unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts` |
| coverage-guard メッセージ確認 | `bash scripts/coverage-guard.sh --no-run` |
| workflow lint | `actionlint .github/workflows/ci.yml .github/workflows/runtime-smoke-staging.yml` |
| 全体型 / lint | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |

---

## 5. 受入条件との対応

| AC | 担保するテスト |
|---|---|
| AC-2（admin/me parity） | T-A1, T-A2, T-A3 |
| AC-3（secret 非露出） | T-A8 + Phase 9 actionlint/目視 |
| AC-4（fallback） | Phase 6（回帰 guard）で workflow `if:` 経路を検証 |
| AC-5（permissions / checkout） | T-C1, T-C2 |
| AC-6/AC-7（MISSING 誤検知解消） | T-B1, T-B2 + step 順序 T-C2 |
| AC-8（context 名不変） | T-C3 |
| AC-9（typecheck/lint/unit） | §4 全体型 / lint + 全 unit |

---

## 6. 成果物

- `outputs/phase-4/test-plan.md`（本 Phase のテスト計画サマリ）
