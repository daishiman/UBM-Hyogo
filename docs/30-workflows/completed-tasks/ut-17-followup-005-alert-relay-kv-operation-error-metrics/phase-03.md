# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 で確定した 4 成果物を AC-1〜AC-10 / 不変条件 1〜8 / behaviour change 意思決定の 3 軸でレビューし、Gate-A GO / NO-GO 判定を `outputs/phase-03/design-review.md` に記録する。Phase 4 (タスク分解) 入力として固定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | spec_created |
| Gate | Gate-A |

## 目的

Phase 2 設計成果物 4 件 (`log-schema.md` / `helper-design.md` / `emit-points.md` / `isolate-id-strategy.md`) を 6 つのレビュー観点で評価し、Gate-A の GO / CONDITIONAL / NO-GO 判定を確定する。判定結果と理由を `outputs/phase-03/design-review.md` に記録する。

## レビュー観点

### 観点 1: AC-1〜AC-10 への対応マップ

| AC | 内容 | 対応設計 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `KV.get` 例外時に構造化ログ 1 行 emit (fail-open 維持) | `emit-points.md` Emit point A | PASS |
| AC-2 | `KV.put` 例外時に構造化ログ 1 行 emit (`dedupPersisted=false` 維持) | `emit-points.md` Emit point B | PASS |
| AC-3 | 固定 schema `{event, op, errorClass, dedupeKeyHash, isolateId, ts}` | `log-schema.md` Field 定義表 | PASS |
| AC-4 | `dedupeKeyHash` = SHA-256(dedupeKey) 先頭 12 hex、決定的 | `helper-design.md` `computeDedupeKeyHash` 擬似コード | PASS |
| AC-5 | `isolateId` は module top で `crypto.randomUUID()` 1 回採番 | `isolate-id-strategy.md` 採用設計 | PASS |
| AC-6 | 成功パスで `console.warn` が 0 回呼ばれる | `emit-points.md` 「Emit が行われない経路」節 | PASS |
| AC-7 | 既存 response 契約 (dedup hit / 502 / `dedupPersisted=false`) 維持 | `emit-points.md` Before/After snippet | PASS |
| AC-8 | `pnpm --filter @ubm-hyogo/api test` / typecheck / lint PASS | Phase 5/6 で担保、テスト計画は Phase 7 | CONDITIONAL (Phase 5/6/7 で実装担保) |
| AC-9 | monthly runbook 追記 + field 定義表 | Phase 8 (ドキュメント更新) で実施 | CONDITIONAL (Phase 8 担保) |
| AC-10 | 新規/変更テストは `*.spec.ts` のみ | 不変条件 2 で恒常担保 | PASS |

→ 設計時点で 8 件 PASS、2 件は実装 Phase 担保（後工程の Gate で再確認）。

### 観点 2: 不変条件 1〜8 整合性

| # | 不変条件 | 整合性 | 根拠 |
| --- | --- | --- | --- |
| 1 | behaviour change なし (但し `KV.get` fail-closed → fail-open は明示承認) | OK | 観点 3 で明示承認 |
| 2 | `*.spec.ts` 縛り | OK | Phase 7 test 計画で `alert-relay.spec.ts` 拡張に限定 |
| 3 | D1 直接アクセス境界 | OK | 本タスクで D1 使用なし |
| 4 | `wrangler` 直接禁止 | OK | secret / deploy 追加なし |
| 5 | 平文 secret 禁止 | OK | secret 追加なし |
| 6 | CONST_007 遵守 (Phase 1〜12 + local impl を本サイクル内) | OK | Phase 13 のみ user-gated |
| 7 | ログ schema 安定化 (additive only) | OK | `log-schema.md` で明文化 |
| 8 | PII non-leak (hash 化 / stack trace 出さない) | OK | `helper-design.md` で errorClass のみ抽出、stack 非含有 |

### 観点 3: behaviour change の意思決定承認

#### 変更内容

`apps/api/src/routes/internal/alert-relay.ts:66` の `KV.get` を try/catch で包み、catch path で fail-open (seen=null として継続) に変更する。

#### Before の挙動

- `KV.get` throw → Hono global error handler に伝播
- request 全体が 500 Internal Server Error
- Cloudflare Notifications 側の retry を消費し、最終的に Slack 配信されない可能性あり
- 失敗事実が構造化されず観測不能

#### After の挙動

- `KV.get` throw → catch で `logKvOperationError("get", err, dedupeKey)` emit
- `seen = null` として処理続行 → Slack 配信は通常通り
- KV 一時障害中の重複配信が一時的に発生しうる (eventual consistency window 内)

#### 承認判定

| 観点 | 評価 |
| --- | --- |
| 重複配信リスク | dedup hit 期間は 5 分窓のため、KV 障害継続時間に応じて最大数件の重複が発生する。Slack 受信側で目視判別可能 |
| サイレント障害リスク | Before は完全サイレント、After は構造化ログから検出可能。**運用上 After が優位** |
| UT-17 親不変条件との整合 | UT-17 親は「Slack 配信の信頼性確保」が目的。fail-open は配信継続を優先する方向で親不変条件に整合 |
| ロールバック性 | try/catch 削除で原状復帰可能、コスト低 |

→ **承認**: behaviour change を GO 条件付きで Gate-A 承認。条件は Phase 7 で「fail-open が原因で重複配信が起きるケース」を spec で明示テスト化すること。

### 観点 4: test 計画妥当性

#### 必須テストケース (Phase 7 で具体化)

| # | ケース | assertion |
| --- | --- | --- |
| T-1 | `KV.get` throw → 構造化ログ 1 行 emit / Slack 配信実行 / 200 OK | `console.warn` 1 回、payload schema 完全一致、Slack mock 1 回呼ばれる |
| T-2 | `KV.put` throw → 構造化ログ 1 行 emit / response `dedupPersisted=false` | `console.warn` 1 回、payload schema 完全一致 |
| T-3 | 成功パス (get null + put 成功) → `console.warn` 0 回 | spy.callCount === 0 |
| T-4 | dedup hit (`get` returns "1") → `console.warn` 0 回 / `{deduped: true}` | spy.callCount === 0 |
| T-5 | 同一 isolate で T-1 + T-2 連続実行 → 両 emit の `isolateId` 一致 | parse(spy.calls[0]).isolateId === parse(spy.calls[1]).isolateId |
| T-6 | payload shape assertion | `event`, `op`, `errorClass`, `dedupeKeyHash` (12hex regex), `isolateId` (uuid regex), `ts` (ISO 8601 regex) すべて検証 |
| T-7 | `dedupeKeyHash` 決定性 | 同一 dedupeKey で 2 回 emit → 同一 hash |

#### spy leak 対策

```ts
let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
  vi.restoreAllMocks();
});
```

→ `beforeEach`/`afterEach` で spy をライフサイクル管理し、test 間 leak を防ぐ。

#### CLAUDE.md 不変条件 8 (`*.spec.ts` 縛り) 遵守

新規ケースは既存 `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への追加のみ。`*.test.ts` 新規作成は禁止。

→ **承認**: test 計画妥当性 OK。

### 観点 5: runbook 追記範囲

Phase 8 で `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に以下を追記する:

- 「KV 操作エラーログ確認」セクション (約 25 行)
- field 定義表 (AC-3 schema 6 field)
- 検索コマンド例:
  ```bash
  bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production \
    --format json | grep alert_relay_kv_op_failed
  ```
- 集計観点:
  - `op` 別 (get / put) 出現頻度
  - 同一 `isolateId` 連続発生 → isolate 偏り
  - 異なる `isolateId` 分散発生 → グローバル障害

→ **承認**: 追記範囲妥当。Phase 8 で詳細実装。

### 観点 6: UT-17 親不変条件との非干渉

UT-17 親タスク (`docs/30-workflows/ut-17-cloudflare-analytics-alerts/`) の不変条件:
- Slack 配信信頼性: **強化される** (fail-open 化により KV 障害でも配信継続)
- `cf-webhook-auth` 認証: **影響なし** (middleware 触らない)
- dedup 5 分窓: **挙動不変** (KV 障害時のみ window 一時的に効かない)
- formatter (`cloudflare-alert-formatter`): **影響なし**

UT-17-FU-002 (KV 永続化) 不変条件:
- KV value "1" 固定 / metadata 不使用: **影響なし**
- expirationTtl 5 分: **影響なし**

→ **承認**: 親 / 兄弟 followup 不変条件と非干渉。

## 判定

### Gate-A 結果

**GO (CONDITIONAL)**

条件:
1. Phase 7 で観点 3 の behaviour change 担保テスト (T-1: fail-open) を必ず含めること
2. Phase 8 で観点 5 の runbook field 定義表を AC-3 schema と完全一致させること
3. Phase 5/6 実装時に observe 3 (test 計画) の spy leak 対策を `beforeEach`/`afterEach` で必ず実装すること

これら 3 条件は Gate-B (Phase 12) で再確認する。

## 完了条件

- [ ] 観点 1 (AC マップ) が 10/10 評価済
- [ ] 観点 2 (不変条件) が 8/8 評価済
- [ ] 観点 3 (behaviour change) が承認記録に明示されている
- [ ] 観点 4 (test 計画) のテストケース 7 件が一覧化されている
- [ ] 観点 5 (runbook) の追記範囲が明示されている
- [ ] 観点 6 (親不変条件非干渉) が確認されている
- [ ] Gate-A 判定が GO / CONDITIONAL / NO-GO のいずれかで記録されている
- [ ] `outputs/phase-03/design-review.md` が作成されている

## 実行タスク

- [ ] Phase 2 の 4 成果物を読み込む
- [ ] 観点 1〜6 をそれぞれ評価する
- [ ] behaviour change の意思決定承認を明示記録する
- [ ] CONDITIONAL 条件 3 件を Gate-B 引き継ぎとして列挙する
- [ ] `outputs/phase-03/design-review.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/phase-02.md | レビュー対象 Phase |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-02/*.md | 4 設計成果物 |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md | AC / 不変条件 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md | 親不変条件 |
| 必須 | docs/30-workflows/completed-tasks/ut-17-followup-002-alert-relay-dedup-kv-persistence.md | 兄弟 followup 不変条件 |
| 参考 | CLAUDE.md | 不変条件 2 / 6 / 7 / 8 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | Gate-A GO/NO-GO 判定記録、6 観点の評価結果、CONDITIONAL 条件 3 件 |

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 成果物 `outputs/phase-03/design-review.md` が指定パスに配置済み
- 全完了条件にチェック
- behaviour change 意思決定の明示承認
- CONDITIONAL 条件 3 件が Gate-B 引き継ぎとして明記

## 次 Phase

- 次: 4 (タスク分解)
- 引き継ぎ事項:
  - Gate-A 判定: **GO (CONDITIONAL)**、条件 3 件は Gate-B で再確認
  - 観点 4 のテストケース 7 件 (T-1〜T-7) を Phase 7 test 計画の最小集合として固定
  - 観点 5 の runbook 追記範囲を Phase 8 ドキュメント更新の最小集合として固定
- ブロック条件: Gate-A 判定が NO-GO の場合、Phase 4 に進まず Phase 2 へ差し戻し

## 統合テスト連携

Gate-A の設計承認内容は Phase 7 の focused Vitest、Phase 11 の local evidence、Phase 12 の compliance check に引き継ぐ。
