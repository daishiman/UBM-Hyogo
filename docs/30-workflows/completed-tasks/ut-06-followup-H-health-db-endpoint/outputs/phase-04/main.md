# Phase 4 成果物 — テスト戦略

## 1. 目的

Phase 3 で PASS（with notes）となった base case = 案 D（固定パス + `X-Health-Token` + WAF / IP allowlist 併用）に対し、`/health/db` 実装が満たすべき検証項目 T1〜T5 を Red/Green 条件と実走 Phase 委譲先で固定する。

## 2. 依存タスク順序（UT-22 完了必須）

UT-22 D1 migration 適用済みであることが T1〜T5 実走の前提。未完了で実走した場合 `c.env.DB` が undefined となり T2/T3/T5 が runtime レベルで Red に固定される（false negative ではなく構造的失敗）。

## 3. T1〜T5 サマリ表

| ID | 対象 AC | 検証コマンド / ハーネス | 期待値 (Green) | Red 状態 | 実走 Phase |
| --- | --- | --- | --- | --- | --- |
| T1 | AC-1, AC-5 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 / `c.env.DB` が `D1Database` 解決 | `Env` に `DB` 欠落 | Phase 5 step 7 |
| T2 | AC-2 | Vitest: `apps/api/src/health-db.test.ts` で mock D1 を注入し `prepare("SELECT 1").first()` 呼び出しを spy | `prepare("SELECT 1")` が 1 回 / `first()` が 1 回 | ハンドラ未登録 → 404 | Phase 5 step 4 |
| T3 | AC-3 | `curl -sS -H "X-Health-Token: $TOK" -o /tmp/out.json -w "%{http_code}\n" "${API_BASE}/health/db"` + `jq` | `200` / body 完全一致 `{"ok":true,"db":"ok","check":"SELECT 1"}` | 404 / shape mismatch | Phase 5 (local) + Phase 11 (S-03) |
| T4 | AC-4 | mock D1 を throw 化 → 503 検証 / fault injection で staging 503 検証 | `503` + `Retry-After: 30` + body `{"ok":false,"db":"error","error":<string>}` | 500 plain / Retry-After 欠落 | Phase 6 + Phase 11 (S-07) |
| T5 | AC-6 | (a) 正 token (b) token 無 (c) 誤 token を curl で叩く | (a) 200 / (b)(c) 401 (endpoint) または 403 (WAF) / 404 (path) | (b)(c) で 200 = unauth で D1 ping 通過 | Phase 11 |

## 4. AC × T トレース表

| AC | 内容 | 紐付く T |
| --- | --- | --- |
| AC-1 | `Env.DB: D1Database` | T1 |
| AC-2 | SELECT 1 実行仕様 | T2 |
| AC-3 | 成功 200 + JSON shape | T3 |
| AC-4 | 失敗 503 + Retry-After | T4 |
| AC-5 | wrangler D1 binding 確認 | T1（typecheck で間接確認）+ Phase 5 step 1 |
| AC-6 | 案 D（token + WAF） | T5 |
| AC-7 | smoke 期待値 drift 防止 | T3 / T4 をテンプレ正本として再利用 |
| AC-8 | metadata 一致 | Phase 12 ドキュメント検証 |
| AC-9 | 不変条件 #5 侵害なし | T2 / T3 のテストハーネスが apps/api 内閉包 |

## 5. 自動化 vs 手動

| 区分 | 内容 | 実行手段 |
| --- | --- | --- |
| 自動化 | T1（typecheck）/ T2（Hono 単体）/ T4 の throw パスを Vitest で網羅 | `apps/api/src/health-db.test.ts`（本 PR で追加） |
| 自動化 | T5(b)(c) の 401 を Vitest で網羅（token なし / 誤 token） | 同上 |
| 半自動 | T3 staging / production smoke は curl + jq で確認（`bash scripts/cf.sh deploy` 後） | Phase 11 manual-smoke-log.md |
| 手動 | T5(a) の WAF 経由疎通は dashboard / curl 経路の組合せ確認 | Phase 11 manual-smoke-log.md |

## 6. テストカバレッジ達成状況（本 PR 時点）

| スコープ | 状況 |
| --- | --- |
| 型契約 (`Env.DB`) | T1 PASS（typecheck Green） |
| ハンドラ実装 (prepare/first) | T2 PASS（spy で `"SELECT 1"` 確認）|
| 成功 wire format | T3 PASS（unit）/ staging-prod は Phase 11 で実走 |
| 失敗 wire format + Retry-After | T4 PASS（unit）/ 実 fault injection は Phase 11 |
| 認証 defense in depth | T5(b)(c) PASS（unit）/ T5(a) WAF は Phase 11 |

## 7. 不変条件 #5 整合確認

- ハーネス側で `apps/web` や `apps/web` 由来のモジュールを import していない
- `apps/api/src/health-db.test.ts` は `apps/api/src/index.ts` の default export のみを参照
- D1 binding は test 内で生成した stub を `worker.fetch(req, env, ctx)` の `env.DB` として注入する形で apps/api 内に閉包

## 8. 引き渡し

Phase 5 へ:
- 自動化分 T1/T2/T3(unit)/T4(unit)/T5(unit) は本 PR で Green
- staging / production smoke (T3 S-03 / T4 S-07 / T5(a)) は Phase 11 で実走待ち（HEALTH_DB_TOKEN secret 投入後）
