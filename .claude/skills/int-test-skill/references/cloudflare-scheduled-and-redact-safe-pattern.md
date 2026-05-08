# Cloudflare Worker scheduled handler / redact-safe contract test pattern

> Issue #553 (live audit-correlation endpoint) の実装結果を canonical 例とする。
> Cloudflare Worker `scheduled` event、Slack 通知、D1 `INSERT OR IGNORE` を Vitest で
> 契約レベルに固定するときの実用パターン集。

## 適用対象

- `apps/api/src/audit-correlation/scheduled.ts` のような Cloudflare Worker `scheduled(event, env, ctx)` ハンドラ
- 外部 webhook（Slack incoming webhook 等）へ HTTP POST する notify モジュール
- D1 へ `INSERT OR IGNORE` で UNIQUE 競合を許容しながら書き込む persist モジュール
- `Authorization: Bearer <internal-token>` で守られる internal route

## パターン1: scheduled handler は `ctx.waitUntil` の引数捕捉で観測する

Cloudflare Worker の `scheduled` event は同期 `sleep` / リトライ待ちを Worker 内で行えない
（CPU time 制約・cron 1 invocation = 1 実行）。再試行は **次の cron cycle に任せる** 設計が
canonical で、test もそれに合わせて以下を観測する。

```ts
// scheduled.ts 例 (実装側)
export function scheduledAuditCorrelation(env, ctx) {
  ctx.waitUntil(
    runCorrelation({ env }).catch((e) => {
      console.error('audit-correlation scheduled failed', { name: e?.name ?? 'unknown' });
    }),
  );
}
```

test 側の必須 assertion:

1. `ctx.waitUntil` に Promise が 1 件渡ること
2. handler 自体は **同期 return**（待ち合わせしない）こと
3. 失敗時に **stack / value を console に出さない**（name のみ）こと
4. 失敗時も throw せず Promise resolve / catch 済みになること（次 cron cycle で自然に再試行）

## パターン2: redact-safe contract は serialize 後の文字列で grep する

通知 / 永続化 layer の test では、payload を実際に JSON 直列化してから `not.toContain` で
secret / 完全 hash / webhook URL / PAT 様 token を排除する。schema 準拠だけでは不十分。

```ts
const serialized = JSON.stringify(payload);
expect(serialized).toContain('deadbeef'); // fingerprint prefix 8 chars only
expect(serialized).not.toContain(fullFingerprintHash);
expect(serialized).not.toContain('hooks.slack.com');     // webhook URL は body に echo しない
expect(serialized).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);  // GitHub PAT
expect(serialized).not.toMatch(/Bearer\s+[A-Za-z0-9]/);  // Authorization header
```

route 側の `not echo token` 観測も同等に必要:

```ts
// 401 応答 body に bearer token / wrong-token suffix が含まれないこと
expect(text).not.toContain(TOKEN);
expect(text).not.toContain('wrong-token');
```

## パターン3: D1 `INSERT OR IGNORE` を Fake で UNIQUE 制約付きに再現する

repository test で `meta.changes` 0 / 1 の分岐を観測するため、Fake stmt に **UNIQUE key set** を
持たせて競合時 `changes=0` を返す:

```ts
class FakeStmt {
  bind(...args) { this.bound = args; return this; }
  async run() {
    const [prefix, , , , , , event_type, , observed_at] = this.bound;
    const key = `${prefix}|${observed_at}|${event_type}`;
    if (this.state.uniqueKeys.has(key)) return { meta: { changes: 0 } };
    this.state.uniqueKeys.add(key);
    this.state.rows.push({ values: this.bound });
    return { meta: { changes: 1 } };
  }
}
```

test で必ず観測する 3 件:

1. `attempted=N, inserted=N`（初回投入）
2. `attempted=N, inserted=0`（同一 finding 再投入時の冪等性）
3. bind された値に **完全 hash / 完全 IP / 完全 UA / salt literal が含まれない**

## パターン4: internal token authz は 4 軸で網羅する

`Authorization: Bearer <token>` で守られる internal endpoint は次の 4 ケースを必ず固定:

| 観点 | 期待 status | 期待挙動 |
|------|-------------|---------|
| header 不在 | 401 | body に `error: 'unauthorized'` |
| token mismatch | 401 | body に token literal を echo しない |
| env token unset（empty string） | 401 | bypass 不可 |
| token match | 200 | counts response（schema 準拠） |

env token unset の case を忘れると、CI で `wrangler secret put` 漏れ時に **空文字列 = 任意 token PASS**
の脆弱性が混入する（実際に Issue #553 で防いだ）。

## パターン5: test fixture placeholder と CI grep gate の整合

redact-safe grep gate（`.github/workflows/audit-correlation-verify.yml` 等）と test fixture の
プレースホルダを **同じパターン** に揃える:

| 役割 | test fixture 値 | grep gate 期待 |
|------|----------------|----------------|
| Slack webhook | `https://hooks.slack.com/services/X/Y/Z` | `hooks.slack.com` literal は src 配下に出現しない（test 配下のみ許容） |
| GitHub PAT | `ghp_dummy_test_value_xxxxxxxxxxxxxxxxxxxxxxxx` | `/ghp_[A-Za-z0-9]{20,}/` literal は src 配下に出現しない |
| salt | `'a'.repeat(32)` | salt literal は src 配下に出現しない |
| internal token | `'t'.repeat(48)` | token literal は src 配下に出現しない |

CI grep gate を src 配下のみに限定し、test 配下は除外するよう path フィルタを明示する。

## アンチパターン

- ❌ scheduled handler 内で `setTimeout` / `await sleep(N)` でリトライする（CPU time 超過）
- ❌ webhook URL を payload `text` / `blocks` に **意図せず echo**（log 分析 leak）
- ❌ `INSERT OR IGNORE` を `INSERT` で書いて UNIQUE violation を try/catch で握り潰す（meta.changes 観測不能）
- ❌ token unset 時の 401 を未観測のまま release（empty bearer bypass 脆弱性）
- ❌ test fixture に **実 webhook URL / 実 PAT / 実 salt** を書く

## 関連 reference

- [api-contract-test-pattern.md](api-contract-test-pattern.md) — Hono route × zod schema の固定
- [authz-matrix-pattern.md](authz-matrix-pattern.md) — authz 軸の網羅
- [d1-mock-factory-setup.md](d1-mock-factory-setup.md) — D1 binding mock factory
