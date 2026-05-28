# Phase 6: テスト拡充（fail path / 回帰 guard）

Phase 4 の正常系・基本系に対し、fail path と回帰 guard を拡充する。新規 test は `*.spec.ts` のみ。

---

## 1. Lane A — mint helper の fail path（`mint-staging-bearers.spec.ts` 追加ケース）

| # | ケース | 入力 | 期待結果 |
|---|---|---|---|
| F-A1 | 署名鍵不一致で verify 失敗 | mint を `S` で発行し `verifySessionJwt(adminBearer, "S-different")` | null（HMAC signature mismatch。`verifySessionJwt` は `!ok` で null 返却） |
| F-A2 | 改ざん token | mint した JWT の payload 部 1 文字を改変して verify | null（signature mismatch） |
| F-A3 | 期限切れ | `ttlSeconds=600` で mint、`verifySessionJwt(token, S, iat + 601)` | null（`claims.exp < now`） |
| F-A4 | 期限内 | 同上、`verifySessionJwt(token, S, iat + 599)` | 非 null（境界の有効側） |
| F-A5 | 必須 env 欠落（純粋関数） | `authSecret=""` を渡す | `signSessionJwt` が `"AUTH_SECRET missing"` で throw → mint helper も reject |
| F-A6 | isAdmin 取り違え防止 | admin/me を同一 identity で mint しても isAdmin が逆転しない | adminBearer.isAdmin=true / meBearer.isAdmin=false が独立に成立 |

> F-A1〜F-A4 は `verifySessionJwt` の実装（`auth.ts:127-158`：signature 不一致・`exp < now` で null）に正確に対応させる。`iat` は mint した JWT の payload を base64url decode して取得するか、mint helper に `ttlSeconds` を渡した上で verify の `nowSeconds` 第 3 引数で境界を制御する。

---

## 2. Lane A — workflow 回帰 guard（fallback 経路）

実 workflow 実行は CI 限定のため、fallback の検証は **設計上の `if:` 条件の妥当性確認 + actionlint** で担保する。

| # | 検証対象 | 手段 | 期待 |
|---|---|---|---|
| F-A7 | fallback 経路（`STAGING_AUTH_SECRET` 未設定時に静的 bearer 使用） | `runtime-smoke-staging.yml` の mint step `if: env.STAGING_AUTH_SECRET != ''` を目視 + actionlint | 鍵未設定時は mint step がスキップされ、既存「verify required staging secrets」が静的 `STAGING_ADMIN_BEARER`/`STAGING_ME_BEARER`/`STAGING_MEMBER_ID` で満たされる（AC-4） |
| F-A8 | mint 経路でも mask が export より前 | mint step の run スクリプトを目視 | `::add-mask::` → `>> $GITHUB_ENV` の順序を維持（R-1） |
| F-A9 | reason 分岐回帰（500 既存系を壊さない） | `runtime-attendance-provider.sh` の分岐順を目視（500→401→403） | 既存 `auth-secret-binding-missing`（500）が新規 401/403 分岐の追加で誤分類されない |

---

## 3. Lane B/C — coverage-gate shard 失敗検知の順序保証

最重要回帰: **shard 失敗検知（Fail closed）が `--no-run` MISSING より先に出ること**（AC-7 / R-4）。

| # | 検証対象 | 手段 | 期待 |
|---|---|---|---|
| F-B1 | step 順序回帰 | `ci.yml` の `coverage-gate` job step 列を目視 + actionlint | 「Fail closed on failed shard」が「Coverage gate (aggregate, no-run)」より**前**にある。shard 失敗時は `::error::coverage-gate-shard result was <result>` + exit 1 が先に出て、誤解を招く MISSING に到達しない |
| F-B2 | shard 全成功時の正常系 | 同上 | shard 全 success のとき Fail closed step は `if` で skip され、aggregate `--no-run` に到達し、真の coverage 判定が行われる |
| F-B3 | `--no-run` 判定ロジック不変 | `bash scripts/coverage-guard.sh --no-run`（summary 揃い状態） | 既存通り PASS / FAIL を判定。診断メッセージ追記が閾値判定に影響しない（false negative を作らない / R-4） |
| F-B4 | MISSING メッセージ強化 | `bash scripts/coverage-guard.sh --no-run`（summary 欠落状態） | MISSING 行 + 「shard 失敗が疑われる場合は coverage-gate-shard 結果を確認せよ」の誘導が出る。exit 1 のまま |

---

## 4. secret 非露出の回帰

| # | 検証対象 | 手段 | 期待 |
|---|---|---|---|
| F-S1 | mint helper が JWT を console / stdout に出さない | unit（純粋関数の戻り値のみ確認）+ helper 実装目視 | `console.*` / `process.stdout.write(jwt)` が無い。`GITHUB_OUTPUT` 追記のみ |
| F-S2 | redaction grep gate 維持 | `runtime-smoke-staging.yml` の既存 redaction grep step を目視 | `Bearer [A-Za-z0-9_-]{20,}` 等の漏洩パターン検出 gate が ci-evidence/ に対し維持される |

---

## 5. command suite（拡充分）

| 目的 | command |
|---|---|
| mint fail path unit | `mise exec -- pnpm exec vitest run scripts/smoke/__tests__/mint-staging-bearers.spec.ts` |
| coverage-guard MISSING メッセージ | `bash scripts/coverage-guard.sh --no-run` |
| workflow 順序 / 妥当性 | `actionlint .github/workflows/ci.yml .github/workflows/runtime-smoke-staging.yml` |

---

## 6. 成果物

- `outputs/phase-6/test-additions.md`（本 Phase のテスト拡充サマリ）
