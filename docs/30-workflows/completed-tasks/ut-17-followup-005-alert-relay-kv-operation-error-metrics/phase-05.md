# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | spec_created |
| GitHub Issue | #701 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 4 で固定した T-01〜T-09 のうち T-01〜T-07 は `apps/api/src/routes/internal/alert-relay.ts` と同テスト `alert-relay.spec.ts` の **実コード変更**である。本 Phase はそのコード実装の着手前計画として、変更対象ファイル・関数シグネチャ・型・依存・実装順序を CONST_005 必須項目に沿って固定する。 |

---

## 目的

Phase 4 のサブタスク T-01〜T-09 を、Phase 06（実装手順）以降が即着手できる粒度まで具体化する。
本 Phase の出力は CONST_005（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存ライブラリ / 実装順序）の
全項目を満たす `outputs/phase-05/implementation-plan.md` を中心に構成する。

---

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 役割 | 想定 LOC | 担当サブタスク |
| --- | --- | --- | --- | --- |
| 編集 | `apps/api/src/routes/internal/alert-relay.ts` | 構造化ログ helper / `computeDedupeKeyHash` / `isolateId` / `KV.get` try/catch 化 / `KV.put` catch 置換 | +50 / -5 LOC | T-01〜T-06 |
| 編集 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 4 ケース追加（`get` throw / `put` throw / 成功時 emit 0 / isolateId 一致） | +80 LOC | T-07 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログ確認」セクション + grep 例 + field 定義表 | +30 LOC | T-08 |

> 新規ファイルなし。削除ファイルなし。`apps/web/` 配下は変更しない。`apps/api/wrangler.toml` / `apps/api/src/env.ts` は変更しない（`ALERT_DEDUP_KV` binding 既存流用）。

---

## 5-2. 主要関数シグネチャ・型定義

### 5-2-1. ログ schema 定数・型（module-local）

```ts
// apps/api/src/routes/internal/alert-relay.ts 冒頭付近に追加

/**
 * 後段 logpush / Workers Logs 検索の正本キー。
 * 不変条件 7（log schema 安定化）により value 変更禁止。
 */
const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed" as const;

/**
 * KV `get`/`put` 操作失敗を構造化ログとして emit する際の payload schema。
 * `dedupeKeyHash` は raw key の SHA-256 先頭 12 hex（PII non-leak）。
 * `isolateId` は module top 採番（同一 isolate 内 emit は同値）。
 */
type LogKvOperationError = {
  readonly event: typeof KV_OP_FAILED_EVENT;
  readonly op: "get" | "put";
  readonly errorClass: string;
  readonly dedupeKeyHash: string;
  readonly isolateId: string;
  readonly ts: string; // ISO8601
};
```

### 5-2-2. `computeDedupeKeyHash`（async pure 関数）

```ts
/**
 * dedupeKey の SHA-256 先頭 12 hex chars を返す。
 * 入力: dedupeKey（`{metric}:{policy_id|name}:{minuteBucket}` 形式）
 * 出力: 12 文字の lowercase hex（48 bit 空間）
 * 副作用: なし
 * エラー: `crypto.subtle.digest` 失敗時は throw（呼び出し側 `logKvOperationError` で catch しない設計）
 */
async function computeDedupeKeyHash(dedupeKey: string): Promise<string>;
```

### 5-2-3. `isolateId` module top 採番

```ts
/**
 * module load 時に 1 回採番される isolate 識別子。
 * `createAlertRelayRoute` 関数の **外側**で評価することで、
 * 同 isolate 内の複数 request / emit が同値を共有する。
 */
const isolateId: string = crypto.randomUUID();
```

### 5-2-4. `logKvOperationError`（emit ヘルパ）

```ts
/**
 * KV `get`/`put` 操作失敗を構造化 JSON 1 行で `console.warn` に emit する。
 *
 * 入力:
 *   - op: "get" | "put"
 *   - err: unknown（catch ブロック由来。`Error` 以外も許容）
 *   - dedupeKey: 算出済み raw key（内部で hash 化）
 * 出力: Promise<void>
 * 副作用: `console.warn(JSON.stringify(payload))` を 1 回実行
 * エラー時の挙動:
 *   - hash 算出失敗時のみ catch して `dedupeKeyHash = "hash_error"` で fallback emit
 *   - 上位 fail-open / fail-closed 経路には影響を与えない（throw しない）
 */
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

### 5-2-5. `app.post("/")` 内の主要差分

before:

```ts
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
```

after:

```ts
let seen: string | null = null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (error) {
  await logKvOperationError("get", error, dedupeKey);
  // fail-open: seen=null として配信処理に進む
}
```

before (`KV.put` catch ブロック):

```ts
} catch (error) {
  console.warn("alert relay dedup KV put failed after Slack delivery", {
    error: error instanceof Error ? error.message : "unknown",
  });
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

after:

```ts
} catch (error) {
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

---

## 5-3. 入出力・副作用・エラーハンドリング

| 関数 | 入力 | 出力 | 副作用 | エラー時の挙動 |
| --- | --- | --- | --- | --- |
| `computeDedupeKeyHash` | dedupeKey (string) | Promise<string>（12 hex） | なし | `crypto.subtle.digest` 失敗時 throw（呼び出し側で catch） |
| `logKvOperationError` | op, err, dedupeKey | Promise<void> | `console.warn` × 1 | 内部 hash 失敗時は `dedupeKeyHash="hash_error"` で emit、throw しない |
| `app.post("/")` 内 KV.get | （既存） | （既存） | catch 経路で emit 追加 | 例外時 fail-open（seen=null）。Slack 重複配信を許容（観測可能化と引換え） |
| `app.post("/")` 内 KV.put | （既存） | （既存） | catch 経路で emit 追加 | 既存 `{ ok: true, dedupPersisted: false }` レスポンスを維持 |

### 観測点（Workers Logs での見え方）

| シナリオ | `KV.get` | `KV.put` | emit 回数 | レスポンス |
| --- | --- | --- | --- | --- |
| 正常（dedup miss → Slack 成功 → put 成功） | OK | OK | 0 | `{ ok: true, attempts }` |
| dedup hit | OK | （呼ばない） | 0 | `{ ok: true, deduped: true }` |
| `KV.get` 障害 → Slack 成功 → put 成功 | throw | OK | 1（op=get） | `{ ok: true, attempts }` |
| Slack 失敗 | OK | （呼ばない） | 0 | 502 |
| `KV.put` 障害 | OK | throw | 1（op=put） | `{ ok: true, dedupPersisted: false }` |
| `get`/`put` 双方障害 | throw | throw | 2（op=get / op=put） | `{ ok: true, dedupPersisted: false }` |

---

## 5-4. 依存ライブラリ方針

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| hash 算出 | `crypto.subtle.digest("SHA-256", ...)`（Workers 標準） | 追加依存ゼロ・Workers runtime にネイティブ実装 |
| UUID 採番 | `crypto.randomUUID()`（Workers 標準） | 同上 |
| JSON シリアライズ | 標準 `JSON.stringify` | 追加依存ゼロ |
| ロガー | `console.warn` | Workers Logs / logpush の標準経路（UT-17-FU-004 連携） |
| テスト | 既存 vitest + `vi.spyOn` | `*.spec.ts` 縛り遵守 |

> **追加 npm 依存ゼロ**を原則とする。`pino` / `winston` 等の logger ライブラリは採用しない。

---

## 5-5. 実装順序（T-01〜T-09 詳細）

| 順 | サブタスク | 着手前条件 | 完了判定 |
| --- | --- | --- | --- |
| 1 | T-01（schema 定数 + 型） | Phase 03 GO | `pnpm typecheck` PASS |
| 2 | T-02（`computeDedupeKeyHash`） | T-01 完了 | 12 hex 決定性が手元確認 |
| 3 | T-03（`isolateId` module top） | Phase 03 GO（並列） | `createAlertRelayRoute` 外側評価が確定 |
| 4 | T-04（`logKvOperationError`） | T-01, T-02, T-03 完了 | typecheck PASS、`JSON.stringify` で 1 行に収まる |
| 5 | T-05（`KV.get` try/catch + fail-open） | T-04 完了 | typecheck / lint PASS、Slack 配信路は不変 |
| 6 | T-06（`KV.put` catch 置換） | T-04 完了（T-05 と並列可） | 旧 `console.warn` 文字列が grep でヒットしない |
| 7 | T-07（vitest 4 ケース追加） | T-05, T-06 完了 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay` 全 PASS |
| 8 | T-08（runbook 追記） | Phase 03 GO（並列） | 新セクション + grep 例 + field 表 |
| 9 | T-09（品質ゲート） | T-07, T-08 完了 | typecheck / lint / test 全 PASS |

---

## 5-6. ロールバック計画

| 単位 | 戻し方 |
| --- | --- |
| コード変更（`alert-relay.ts` + `alert-relay.spec.ts`） | `git revert <commit>` 単一 commit 想定。helper 追加 + emit 配線 + テスト追加を 1 commit に集約する |
| runbook 追記 | 別 commit。コードと独立 revert 可能 |
| Cloudflare デプロイ | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production`（既存運用通り） |

> 本タスクは env / secret / D1 schema / KV binding を変更しないため、コード revert のみで完全ロールバック可能。

---

## 5-7. 検証コマンド一覧

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay
```

PR 直前の追加チェック:

```bash
# 旧 console.warn 文字列が残っていないことを確認
grep -RIn "alert relay dedup KV put failed after Slack delivery" apps/api/src || echo "OK: 旧文字列なし"

# 新 event キーが新 helper 経由のみで emit されることを確認
grep -RIn "alert_relay_kv_op_failed" apps/api/src
```

---

## 5-8. 不変条件チェック

- [ ] `apps/web` には変更を加えない
- [ ] D1 直接アクセスを追加しない
- [ ] Secret / env / KV binding を追加しない
- [ ] `wrangler` 直接実行禁止（本タスクは deploy 変更なし）
- [ ] 新規テストは `*.spec.ts` 拡張子のみ（既存 `alert-relay.spec.ts` 拡張）
- [ ] ログ schema（AC-3）の field 順・名前を Phase 02 設計から変えない（不変条件 7）
- [ ] `dedupeKey` raw / stack trace をログに書かない（不変条件 8）

---

## 5-9. リスク・前提

| 項目 | 内容 |
| --- | --- |
| 前提 1 | `crypto.subtle` / `crypto.randomUUID` は Cloudflare Workers runtime で利用可能（Web Crypto API 標準準拠） |
| 前提 2 | `isolateId` を module top で採番すれば Workers isolate 単位で固定（Workers の module worker semantics に依存） |
| 前提 3 | `console.warn` 出力は Workers Logs に流れる（UT-17-FU-002 で既存運用済み） |
| リスク 1 | `KV.get` を fail-open 化することで Slack 重複配信が増える可能性 → Phase 03 で意思決定済み（観測可能化と trade-off） |
| リスク 2 | `crypto.subtle.digest` の async 化により hot path 影響 → 失敗時のみ呼ぶため negligible |
| リスク 3 | CLAUDE.md `*.spec.ts` 縛りに反して `*.test.ts` を作らないこと → 既存 `alert-relay.spec.ts` 拡張で対応 |

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 本体 | 同一 route ファイル内に helper 追加 | module-local 配置（export しない） |
| UT-17-FU-002（KV 永続化） | `ALERT_DEDUP_KV` binding 流用 | binding 変更なし |
| UT-17-FU-004（logpush） | 1 行 JSON が後段集計の入力 | schema 安定化（不変条件 7）遵守 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/phase-04.md | T-01〜T-09 の入力 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md | 原典 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 実装対象本体 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト拡張対象 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle.digest` / `crypto.randomUUID` |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | `console.warn` 経路 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | CONST_005 必須項目を満たす実装計画書 |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 完了条件

- [ ] CONST_005 の必須項目（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存 / 実装順序）が全て埋まっている
- [ ] 追加 npm 依存ゼロが確認されている
- [ ] env / secret / KV binding / cron / D1 への追加変更がないことが確認されている
- [ ] ロールバック計画（git revert + cf.sh rollback）が記述されている
- [ ] outputs/phase-05 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-05 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 6（実装手順）
- 引き継ぎ事項:
  - 5-2 の関数シグネチャは Phase 6 で完成形コード snippet に展開する
  - 5-3 の入出力テーブルは Phase 6 のテストケース構築の根拠
  - 5-5 の実装順序は Phase 6 のステップ S1〜S6 にそのまま対応する
- ブロック条件: CONST_005 必須項目に欠落、または env / secret / cron 追加が混入した場合は Phase 4 へ差し戻す

## 実行タスク

Phase 4 の T-01〜T-09 を実装順序として採用する。最短経路は `alert-relay.ts` helper 実装、`alert-relay.spec.ts` 拡張、runbook 更新、Phase 11/12 evidence 同期の順とする。
