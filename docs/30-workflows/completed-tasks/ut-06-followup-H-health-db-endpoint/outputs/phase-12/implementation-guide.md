# Implementation Guide — UT-06-FU-H `/health/db`

## Part 1: 中学生レベル

このタスクは、サーバーが「データの箱（D1 データベース）とちゃんと話せているか」を確認する小さな確認窓を作るものです。保健室の先生に「今いますか?」と聞くのと同じで、`/health/db` に聞くと、データの箱が元気なら「ok」と返ってきます。

誰でも自由に叩けると困るので、校門の警備員にあたる **Cloudflare WAF**（IP の許可リスト + アクセス回数制限）と、合言葉にあたる **`X-Health-Token` ヘッダ** の二重で守ります。万一警備員が休んでいても合言葉が残っているので、外から勝手にデータの箱を叩けないようになっています。

データの箱が壊れているときは「**30 秒後にもう一度来てね**（`Retry-After: 30`）」と返します。これによって監視システムが暴走せず、落ち着いて再試行する流れになります。

## Part 2: 技術者レベル

### 2.1 変更点サマリ

| 種別 | パス | 内容 |
| --- | --- | --- |
| 編集 | `apps/api/src/index.ts` | `Env.HEALTH_DB_TOKEN?` 追加 / `timingSafeEqual` 追加 / `app.get("/health/db", ...)` 追加 |
| 新規 | `apps/api/src/health-db.test.ts` | T1〜T5 の自動化 8 ケース |
| 新規 | `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-04〜10/main.md` | Phase 4〜10 成果物 |
| 新規 | `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-11/smoke-test-result.md` | smoke 期待値テンプレ正本 |
| 新規 | `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md` | ユーザー操作手順（secret/WAF/deploy/rotation） |

### 2.2 API 契約

```
GET /health/db
Headers: X-Health-Token: <HEALTH_DB_TOKEN>
```

| 状況 | Status | Body | Headers |
| --- | --- | --- | --- |
| 正常 | 200 | `{"ok":true,"db":"ok","check":"SELECT 1"}` | `Content-Type: application/json` |
| D1 失敗 | 503 | `{"ok":false,"db":"error","error":"<Error.name>"}` | `Retry-After: 30` |
| token 設定漏れ（fail-closed） | 503 | `{"ok":false,"db":"error","error":"HEALTH_DB_TOKEN unconfigured"}` | `Retry-After: 30` |
| token 欠落 / 誤値 | 401 | `{"ok":false,"error":"unauthorized"}` | - |

### 2.3 設計判断（Phase 1〜3）

- 認証方針: **案 D（固定パス + `X-Health-Token` + WAF/IP allowlist 併用）**
- token 比較: 期待 token 長を基準に全 byte を XOR し、長さ差分も mismatch に畳み込む
- error 文字列: `err.name` のみ（`err.message` は内部実装露出のため返さない）
- `Retry-After: 30`: D1 復旧が秒〜分オーダの想定 + UT-08 通知基盤の閾値合意（90 秒で連続 3 回 = alert）と整合
- 不変条件 #5: D1 アクセスは `apps/api` 内に閉包、`apps/web` から D1 binding を持たない

### 2.4 自動化済みテスト（本 PR 範囲）

`apps/api/src/health-db.test.ts` で以下 8 件を Vitest で網羅:

1. 正 token + 正常 D1 → 200 + 成功 schema + `prepare("SELECT 1")` spy 確認
2. D1 prepare throw → 503 + `Retry-After: 30`
3. D1 first throw → 503 + `Retry-After: 30`
4. SELECT 1 が null → 503
5. token 欠落 → 401
6. 誤 token → 401
7. `HEALTH_DB_TOKEN` 未設定 → fail-closed 503（DB 未接触）
8. 短い token → 401（length 不一致 path）
9. 長い token → 401（length 不一致 path）

`mise exec -- pnpm --filter @ubm-hyogo/api test`: **225 passed**
`mise exec -- pnpm --filter @ubm-hyogo/api typecheck`: **exit 0**

### 2.5 ユーザー操作待ちのアクション（Claude では実行不可）

以下は本 PR をマージした後にユーザーが実施する。詳細手順は **[operator-runbook.md](operator-runbook.md)** を参照:

1. `HEALTH_DB_TOKEN` を 32 byte ランダム生成し 1Password に保管（§1）
2. `wrangler secret put HEALTH_DB_TOKEN` を staging / production に投入（§2）
3. Cloudflare WAF custom rule + rate limit rule を設定（§3）
4. staging → production の順に deploy（§4）
5. staging smoke 3 件（成功 200 / token 欠落 401 / 誤 token 401）合格確認
6. production smoke 3 件 同上
7. Workers tail 10 分観察
8. token rotation を 90 日後にカレンダー登録

### 2.6 受入条件達成状況

| AC | 状態 |
| --- | --- |
| AC-1 `Env.DB: D1Database` 型 | ✅（既存 `SyncEnv` extends 経由）|
| AC-2 `SELECT 1` 実行仕様 | ✅（unit T2）|
| AC-3 200 + `{ok,db,check}` | ✅ unit / ⏳ staging smoke |
| AC-4 503 + Retry-After + error | ✅ unit / ⏳ staging fault injection |
| AC-5 wrangler D1 binding | ✅（production/staging 確認済み）|
| AC-6 案 D 認証 | ✅ unit 401 / ⏳ WAF 適用 |
| AC-7 smoke 期待値 drift 防止 | ✅（smoke-test-result.md 同期）|
| AC-8 metadata 一致 | ✅ |
| AC-9 不変条件 #5 | ✅（apps/web 編集なし）|

### 2.7 関連リンク

- 親タスク: `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution`
- 後続: UT-06 Phase 11 smoke S-03 / S-07、UT-06-FU-I `/health` 期待値同期、UT-08 通知基盤閾値合意
- ユーザー手動手順: [operator-runbook.md](operator-runbook.md)

### 2.8 NON_VISUAL evidence

本タスクは HTTP API / D1 疎通確認であり、UI / Renderer / 画面遷移を持たないため screenshot は不要。Phase 11 は `outputs/phase-11/main.md` と `phase-11.md` の L1〜L4 evidence（コマンド出力、Workers log、HTTP response body/header、Cloudflare Analytics snapshot ID）で検証する。
