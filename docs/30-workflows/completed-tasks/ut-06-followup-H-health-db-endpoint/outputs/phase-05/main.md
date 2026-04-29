# Phase 5 成果物 — 実装ランブック

## 1. 目的

Phase 4 で固定した T1〜T5 を Green 化するための実装手順を、コード差分・実行コマンド・確認観点とセットで固定する。本 PR 時点で実行済みの内容と、ユーザー操作待ちの内容を区別する。

## 2. 依存ゲート（Step 0）

| 確認項目 | コマンド / 場所 | 期待 |
| --- | --- | --- |
| UT-22 D1 migration 適用済み | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | `Already applied` のみ |
| `apps/api/wrangler.toml` の D1 binding | grep `[[d1_databases]]` | production / staging / development で binding=DB が存在 |
| Cloudflare Secrets `HEALTH_DB_TOKEN` 投入済み | `wrangler secret list --env production` | `HEALTH_DB_TOKEN` がリスト内 |

> Step 0 の secret 投入はユーザー操作。`outputs/phase-12/operator-runbook.md` 参照。

## 3. ステップ詳細

### Step 1: `Env` 型に `HEALTH_DB_TOKEN` を追加（実装済み）

`apps/api/src/index.ts` の `interface Env` に以下を追加:

```typescript
readonly HEALTH_DB_TOKEN?: string;
```

`DB: D1Database` は既存 `SyncEnv` 経由で型付け済み（AC-1 既達）。

### Step 2: 定数時間 token 比較ヘルパー（実装済み）

```typescript
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
```

### Step 3: `GET /health/db` ハンドラ（実装済み）

```typescript
app.get("/health/db", async (c) => {
  const expected = c.env.HEALTH_DB_TOKEN;
  if (!expected) {
    c.header("Retry-After", "30");
    return c.json({ ok: false, db: "error", error: "HEALTH_DB_TOKEN unconfigured" } as const, 503);
  }
  const presented = c.req.header("X-Health-Token") ?? "";
  if (!timingSafeEqual(presented, expected)) {
    return c.json({ ok: false, error: "unauthorized" } as const, 401);
  }
  try {
    const result = await c.env.DB.prepare("SELECT 1").first();
    if (!result) throw new Error("SELECT 1 returned null");
    return c.json({ ok: true, db: "ok", check: "SELECT 1" } as const, 200);
  } catch (err) {
    const message = err instanceof Error ? err.name : String(err);
    c.header("Retry-After", "30");
    return c.json({ ok: false, db: "error", error: message } as const, 503);
  }
});
```

設計判断:
- `HEALTH_DB_TOKEN` 未設定時は **fail-closed**（503）。誤って未設定環境にデプロイされても D1 ping は通さない。
- token 比較はキー長一致時のみ XOR ループへ進む constant-time 実装。
- `err instanceof Error` の場合は `err.name` のみ返す（`err.message` を漏らすと内部情報露出の可能性があるため）。
- `Retry-After: 30` は秒指定。Phase 3 の open question で 30 秒採用。

### Step 4: ハンドラ単体テスト（実装済み）

`apps/api/src/health-db.test.ts` に 8 ケース:

1. 正 token + 正常 D1 → 200 + 成功 schema
2. D1 prepare throw → 503 + Retry-After:30
3. D1 first throw → 503 + Retry-After:30
4. SELECT 1 が null → 503
5. token 欠落 → 401
6. 誤 token → 401
7. HEALTH_DB_TOKEN 未設定 → 503 + DB に触れない
8. 短い token → 401（length 不一致 path）

### Step 5: ローカル smoke (任意)

```bash
mise exec -- pnpm --filter @ubm-hyogo/api dev  # wrangler dev 起動
curl -sS -H "X-Health-Token: $(op read 'op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN')" \
  http://127.0.0.1:8787/health/db
# expect: {"ok":true,"db":"ok","check":"SELECT 1"}
```

> ローカルの D1 は `--local` で in-memory。AC-3 wire format 確認のみ目的。

### Step 6: typecheck

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
# expect: exit 0
```

### Step 7: lint / test

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
# expect: 225 passed (8 件は health-db.test.ts)
```

## 4. ファイル差分サマリ

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/index.ts` | 編集 | `HEALTH_DB_TOKEN` を Env に追加 / `timingSafeEqual` 追加 / `app.get("/health/db", ...)` 追加 |
| `apps/api/src/health-db.test.ts` | 新規 | T1〜T5 自動化分（8 ケース） |
| `apps/api/wrangler.toml` | 変更なし | 既存 D1 binding を確認のみ（AC-5） |

## 5. 不変条件 #5 整合チェック

- 編集対象は `apps/api/` 配下のみ
- `apps/web/wrangler.toml` を変更していない（D1 binding 追加なし）
- ハンドラは `apps/api` 内の Hono 単体に閉包

## 6. 引き渡し

Phase 6 へ: 異常系（D1 ダウン / binding 未注入 / WAF 解除事故）を AC-4 wire format に整合した形で展開する。
