# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase の成果物は `apps/api/src/routes/internal/alert-relay.ts` への helper 追加・module top 採番・`get` try/catch 新設・`put` catch 置換のコード設計を含む。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した 4 論点採用案（1 行 JSON 固定 / `get` fail-open 化 / module top isolateId / SHA-256 12 hex hash）を、コード実装可能な粒度の設計に落とし込む。本 Phase は以下 4 成果物を出力する。

1. `outputs/phase-02/log-schema.md` — 構造化ログ JSON schema 正本（AC-3, AC-4）
2. `outputs/phase-02/helper-design.md` — `logKvOperationError` helper 設計（AC-1, AC-2, AC-4）
3. `outputs/phase-02/emit-points.md` — emit 箇所マッピング（AC-5, AC-6）
4. `outputs/phase-02/get-fail-open-policy.md` — `get` fail-open 化方針（AC-5, AC-10）

## 変更対象ファイル一覧

| パス | 区分 | 概要 |
| --- | --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | 編集 | module top に `const isolateId = crypto.randomUUID();` 採番 / top-level に `logKvOperationError` private helper 定義 / `get` を try/catch で包む（行 66 周辺）/ `put` 既存 catch（行 93-102）を helper 呼出に置換 |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 編集 | 4 ケース追加 + `afterEach(() => vi.restoreAllMocks())` 追加（Phase 7 で詳細） |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 編集（Phase 8 想定） | 「KV 操作エラーログの確認」セクション追加（本 Phase では方針記録のみ） |

> **alert-relay 主機能ロジックは改変しない**。`createAlertRelayRoute` のシグネチャ・middleware・dedupe TTL・`formatCloudflareAlertToSlack` 呼出・`sendSlackMessage` 呼出・レスポンス body / status は不変。

## 主要関数シグネチャ

```typescript
// apps/api/src/routes/internal/alert-relay.ts (module top, after existing imports)

// UT-17-FU-005: isolate 寿命中に再利用する代理識別子。Workers に isolate.id API が
// 無いため、同一 isolate 内のログを集約する目的で module top で 1 回採番する。
// isolate 再生成時には別 UUID になる。
const isolateId = crypto.randomUUID();

/**
 * UT-17-FU-005: KV 操作エラーを構造化 JSON ログとして emit する private helper。
 * 後段 logpush の filter 契約として `event: "alert_relay_kv_op_failed"` を固定する。
 *
 * @param op - 失敗した KV 操作の種別
 * @param err - 失敗時 catch された unknown 値
 * @param dedupeKey - 失敗対象の dedupeKey（raw 値はログに出さず SHA-256 first 12 hex に短縮）
 */
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

`logKvOperationError` の内部仕様:

- `errorClass`: `err instanceof Error ? err.constructor.name : typeof err`
- `dedupeKeyHash`: `crypto.subtle.digest("SHA-256", new TextEncoder().encode(dedupeKey))` → `Uint8Array` → lowercase hex 文字列に変換 → first 12 chars
- `ts`: `new Date().toISOString()`（ISO8601）
- 出力: `console.warn(JSON.stringify({ event: "alert_relay_kv_op_failed", op, errorClass, dedupeKeyHash, isolateId, ts }))`
- 戻り値: `void`（emit 失敗時も throw しない）

## 入出力・副作用

- **入力**: `op`（`"get" | "put"`）、`err`（`unknown`）、`dedupeKey`（string）
- **出力**: なし（`Promise<void>`）
- **副作用**:
  - `console.warn` を 1 回呼ぶ（1 行 JSON 文字列）
  - `crypto.subtle.digest` 呼出 1 回（async、await 必須）
- **D1 アクセスなし**、**KV アクセスなし**、**外部 HTTP なし**

## 動作シーケンス

### 正常系（KV `get` 成功 → 配信続行）

```
[POST /internal/alert-relay]
  └─ verifyCfWebhookAuth → OK
       └─ env.ALERT_DEDUP_KV.get(dedupeKey)  ← try/catch で囲む（NEW）
            └─ 成功 → seen = "1" or null
                 └─ 通常配信 → put → 200 OK
                      └─ console.warn は呼ばれない
```

### 異常系 1（KV `get` 失敗 → fail-open）

```
[POST /internal/alert-relay]
  └─ verifyCfWebhookAuth → OK
       └─ env.ALERT_DEDUP_KV.get(dedupeKey)  ← throw
            └─ catch { await logKvOperationError("get", err, dedupeKey); seen = null }
                 └─ console.warn 1 回 emit
                 └─ 通常配信続行（fail-open）
                      └─ Slack 配信 → put → 200 OK
```

### 異常系 2（KV `put` 失敗 → 既存 fail-open）

```
[POST /internal/alert-relay]
  └─ Slack 配信成功
       └─ env.ALERT_DEDUP_KV.put(...)  ← throw
            └─ catch { await logKvOperationError("put", err, dedupeKey) }   ← 既存 plain object console.warn を置換
                 └─ console.warn 1 回 emit
                 └─ レスポンス: { ok: true, attempts, dedupPersisted: false }  ← 既存挙動と完全一致
```

## emit 箇所マッピング（行番号根拠）

| 既存行 | 既存実装 | 変更内容 |
| --- | --- | --- |
| alert-relay.ts:66 | `const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);`（try/catch なし） | `let seen: string \| null = null; try { seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey); } catch (err) { await logKvOperationError("get", err, dedupeKey); /* seen = null 維持 */ }` |
| alert-relay.ts:93-102 | `try { put } catch (error) { console.warn("alert relay dedup KV put failed after Slack delivery", { error: ... }); return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false }); }` | catch 内の `console.warn` 呼び出しを `await logKvOperationError("put", error, dedupeKey);` に置換。`return c.json(...)` 行は不変 |
| alert-relay.ts module top | (採番なし) | `const isolateId = crypto.randomUUID();` を import 群直後に追加 |
| alert-relay.ts top-level | (helper なし) | `logKvOperationError` private async function を `createAlertRelayRoute` の外側に追加 |

## テスト方針

詳細テストケース定義は Phase 7（test-plan.md）に委ねる。本 Phase では以下 4 ケースを最低集合として明示する。

| # | ケース | 期待結果 |
| --- | --- | --- |
| T-01 | KV.get throw（`vi.fn().mockRejectedValueOnce(new Error("boom"))`） | `console.warn` 1 回 emit、payload に `event: "alert_relay_kv_op_failed"` / `op: "get"` / `errorClass: "Error"` / `dedupeKeyHash` (12 hex chars) / `isolateId` (UUID) / `ts` (ISO8601) を含む。Slack 配信は続行され 200 OK 返却 |
| T-02 | KV.put throw | `console.warn` 1 回 emit、payload に `op: "put"` を含む。レスポンスは既存 `{ ok: true, attempts, dedupPersisted: false }` のまま |
| T-03 | 成功パス（get / put 共に成功） | `console.warn` は呼ばれない（false-positive 防止） |

leak 防止: `afterEach(() => vi.restoreAllMocks());` を spec.ts top-level に明示。

## ローカル実行・検証コマンド

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# unit test（@ubm-hyogo/api workspace）
mise exec -- pnpm --filter @ubm-hyogo/api test src/routes/internal/__tests__/alert-relay.spec.ts

# Workers 側の動作確認（staging）— Phase 8 / 9 で実施
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty | grep alert_relay_kv_op_failed
```

## DoD（Phase 2 完了条件）

- [ ] 4 つの outputs/phase-02 ドキュメント全てが作成され、AC-1〜AC-6 / AC-10 にそれぞれ紐付いている
- [ ] 関数シグネチャ・I/O 契約・最低テスト集合（T-01〜T-04）が本 phase-02.md に明記されている
- [ ] 変更対象ファイル一覧が新規 / 編集 区分付きで揃っている
- [ ] alert-relay 主機能ロジックへの影響がゼロであることが emit 箇所マッピングで示されている
- [ ] `get` fail-open 化が「唯一の意図的 behaviour change」として明記されている
- [ ] `event` 文字列リテラル固定が後段 logpush 契約として記録されている
- [ ] CONDITIONAL の Phase 1 解消条件 2 件が本 Phase で具体化されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | Phase 1 確定事項 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 編集対象（行 23 / 66 / 93-102） |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | Phase 7 で詳細化 |
| 必須 | CLAUDE.md | env / scripts/cf.sh ルール |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle.digest` / `crypto.randomUUID` |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | Workers Logs 構造化 JSON |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/log-schema.md | 構造化ログ JSON schema 正本（AC-3, AC-4） |
| ドキュメント | outputs/phase-02/helper-design.md | logKvOperationError helper 設計（AC-1, AC-2, AC-4） |
| ドキュメント | outputs/phase-02/emit-points.md | emit 箇所マッピング（AC-5, AC-6） |
| ドキュメント | outputs/phase-02/get-fail-open-policy.md | `get` fail-open 化方針（AC-5, AC-10） |

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: Phase 2 成果物 4 件、変更対象ファイル一覧、最低テスト集合 T-01〜T-04、`get` fail-open 化が唯一の意図的 behaviour change である旨
- ブロック条件: outputs/phase-02 配下 4 ファイル未作成、または DoD 未充足の場合 Phase 3 へ進まない

## 実行タスク

- 構造化ログ schema、helper、emit point、`get` fail-open 方針を固定する。

## 完了条件

- [x] `outputs/phase-02/{log-schema,helper-design,emit-points,get-fail-open-policy}.md` が存在する。

## 統合テスト連携

Phase 7 の `alert-relay.spec.ts` 4 ケースで Phase 2 の設計契約を検証する。
