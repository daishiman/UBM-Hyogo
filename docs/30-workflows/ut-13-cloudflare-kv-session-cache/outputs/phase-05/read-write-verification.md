# Phase 5: Workers から KV への read/write 動作確認手順

## 動作確認の目的

`apps/api` の Workers から `SESSION_KV` バインディング経由で put / get / delete が成功することを確認する。AC-3（Workers からの read/write 動作確認手順確定）の証跡となる。

## 動作確認方式

### 方式 A: wrangler CLI 経由（推奨・docs-only でも実施可能）

```bash
# 1. staging に値を put
wrangler kv:key put --binding=SESSION_KV --env=staging \
  "verify:phase-05" "ok"

# 2. get で確認
wrangler kv:key get --binding=SESSION_KV --env=staging \
  "verify:phase-05"
# 期待: ok

# 3. list でキー一覧確認
wrangler kv:key list --binding=SESSION_KV --env=staging | grep "verify:phase-05"
# 期待: ヒットする

# 4. クリーンアップ
wrangler kv:key delete --binding=SESSION_KV --env=staging \
  "verify:phase-05"

# 5. 削除確認
wrangler kv:key get --binding=SESSION_KV --env=staging \
  "verify:phase-05"
# 期待: Key not found
```

### 方式 B: Workers コード経由（下流タスクで検証エンドポイントを追加して確認）

下流の認証実装タスクで `apps/api` 内に検証エンドポイント（または既存ヘルスチェック拡張）を用意し、以下を確認する。

```ts
// apps/api/src/routes/health-kv.ts（下流タスクで実装）
import { Hono } from "hono"

export const healthKv = new Hono<{ Bindings: Env }>()

healthKv.get("/health-kv", async (c) => {
  const key = "verify:phase-05"
  const value = "ok"

  await c.env.SESSION_KV.put(key, value, { expirationTtl: 60 })
  const got = await c.env.SESSION_KV.get(key)

  if (got !== value) {
    return c.json({ status: "fail", got }, 500)
  }

  await c.env.SESSION_KV.delete(key)
  return c.json({ status: "ok" })
})
```

```bash
# staging で実行
wrangler dev --env staging --remote
# 別ターミナルで
curl http://127.0.0.1:8787/health-kv
# 期待: {"status":"ok"}
```

## 注意事項

- 検証用キー（`verify:phase-05`）は必ず削除する。残存すると無料枠の storage を消費する
- production への put は原則実施しない。namespace / binding 存在確認は `wrangler kv:namespace list` で代替する
- 最終的一貫性 60 秒の影響により、put 直後の get で稀に旧値が返る可能性があるが、本検証では同一エッジ・同一プロセス内で実施するため通常は影響しない
- TTL 60 秒で put した場合、60 秒後の get は null を返す（FC-04 参照）

## AC-3 達成判定

| 確認項目 | 期待結果 | 判定方法 |
| --- | --- | --- |
| put が成功 | コマンド exit 0 | wrangler 出力を確認 |
| get で put 値が返る | "ok" が返る | wrangler 出力を確認 |
| delete が成功 | コマンド exit 0 | wrangler 出力を確認 |
| 削除後の get は null | "Key not found" | wrangler 出力を確認 |

すべて PASS で AC-3 達成。

## production 環境での確認方法（書き込み回避）

production への動作確認は本番データ汚染リスクがあるため、以下に限定する：

```bash
# Namespace 存在確認のみ
wrangler kv:namespace list | grep "ubm-hyogo-kv-prod"

# wrangler.toml の binding が production env に設定されていることを確認
grep -A3 "env.production.kv_namespaces" apps/api/wrangler.toml
```

実際の put / get は staging で完結させる。

## 完了条件

- [x] wrangler CLI 経由の read/write 確認手順が定義されている
- [x] Workers コード経由の検証エンドポイント設計（下流タスク向け）が示されている
- [x] 検証用キーの削除手順が含まれている
- [x] production 環境での書き込み回避方針が明記されている
