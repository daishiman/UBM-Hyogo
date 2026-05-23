# Phase 3 成果物: 設計レビュー (Gate-A)

## レビュー対象

Phase 2 設計成果物 4 件:

- `outputs/phase-02/log-schema.md`
- `outputs/phase-02/helper-design.md`
- `outputs/phase-02/emit-points.md`
- `outputs/phase-02/isolate-id-strategy.md`

## 観点 1: AC マトリックス

| AC | 内容 | 対応設計 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `KV.get` 例外時に構造化ログ 1 行 emit / fail-open 維持 | `emit-points.md` Emit point A | PASS |
| AC-2 | `KV.put` 例外時に構造化ログ 1 行 emit / `dedupPersisted=false` 維持 | `emit-points.md` Emit point B | PASS |
| AC-3 | 固定 schema (6 field) / `JSON.stringify` 1 行 | `log-schema.md` field 定義表 | PASS |
| AC-4 | `dedupeKeyHash` = SHA-256(dedupeKey) 先頭 12 hex / 決定的 | `helper-design.md` `computeDedupeKeyHash` | PASS |
| AC-5 | `isolateId` = module top で `crypto.randomUUID()` 1 回 | `isolate-id-strategy.md` 採用設計 | PASS |
| AC-6 | 成功パスで `console.warn` 0 回 | `emit-points.md` 「Emit が行われない経路」 | PASS |
| AC-7 | 既存 response 契約維持 | `emit-points.md` Before/After snippet | PASS |
| AC-8 | typecheck / lint / test PASS | Phase 5/6/7 で担保 | CONDITIONAL |
| AC-9 | monthly runbook 追記 + field 定義表 | Phase 8 で担保 | CONDITIONAL |
| AC-10 | 新規/変更テストは `*.spec.ts` のみ | 不変条件 2 で恒常担保 | PASS |

## 観点 2: 不変条件マトリックス

| 不変条件 | 内容 | 設計対応 | 判定 |
| --- | --- | --- | --- |
| 1 | behaviour change なし（ただし `get` fail-closed → fail-open は明示的改善） | `emit-points.md` Emit point A 意思決定根拠 | PASS (behaviour change 明示承認) |
| 2 | `*.spec.ts` 縛り | Phase 7 で `alert-relay.spec.ts` 拡張のみ | PASS |
| 3 | D1 直接アクセス境界 | 本タスクで D1 不使用 | PASS |
| 4 | `wrangler` 直接禁止 | 本タスクで wrangler 操作なし | PASS |
| 5 | 平文 secret 禁止 | secret 追加なし | PASS |
| 6 | CONST_007 (Phase 1〜12 + local 実装をサイクル内で完了) | Phase 計画で担保 | PASS |
| 7 | ログ schema 安定化 (additive only) | `log-schema.md` 後方互換性ポリシー | PASS |
| 8 | PII non-leak | dedupeKey raw 出力禁止 + stack 非出力 | PASS |

## 観点 3: behaviour change 明示承認

`KV.get` の現状 throw（fail-closed / 観測不能 / 500 落下）を「try/catch + fail-open + 構造化ログ」に変更する。これは index.md 不変条件 1 で明示された例外承認の範囲。Gate-A で **承認**。

## 観点 4: テストケース最小集合 (Phase 7 へ申し送り)

| ID | 観点 | 期待 |
| --- | --- | --- |
| TC-LOG-01 | `KV.get` throw 時に schema 準拠 JSON 1 行 emit + fail-open で Slack 配信継続 | warn 1 回 / response 200 OK |
| TC-LOG-02 | `KV.put` throw 時に schema 準拠 JSON 1 行 emit + `dedupPersisted=false` | warn 1 回 / response `{ ok: true, attempts, dedupPersisted: false }` |
| TC-LOG-03 | 成功パスで warn 0 回 | warn 0 回 |
| TC-LOG-04 | 同一テスト実行内の 2 emit が同じ `isolateId` | 2 つの payload の `isolateId` が一致 |
| TC-LOG-05 | `dedupeKeyHash` が SHA-256 先頭 12 hex として決定的 | 同一 dedupeKey で同 hash |
| TC-LOG-06 | dedup hit ケースで既存挙動維持 | response `{ ok: true, deduped: true }` / warn 0 |
| TC-LOG-07 | Slack 502 ケースで KV.put 到達せず warn 0 | response 502 / warn 0 |

## 観点 5: runbook 追記範囲 (Phase 8 へ申し送り)

- 新規 section「## 7. KV 操作エラーログ確認」
- field 定義表 (6 field) を runbook 内にも複製
- `scripts/cf.sh tail apps/api/wrangler.toml --env production --format json | grep alert_relay_kv_op_failed` の検索例
- しきい値ガイドライン（例: 同一 isolate で連続 emit / 1 時間で N 件超など）

## 観点 6: リスク再確認

| リスク | 緩和策 | 判定 |
| --- | --- | --- |
| `KV.get` fail-open による重複配信増加 | 構造化ログ + 後段 dashboard で検出可能化 | 受容 |
| `console.warn` spy が test 間 leak | beforeEach clear / afterEach restore で統一 | Phase 7 で担保 |
| `crypto.subtle.digest` 失敗 | helper 内 try/catch + `"hash_error"` fallback | 設計済 |
| 12 hex 衝突 | 48 bit 空間。policy_id × minute × metric 規模で実用上問題なし | 受容 |
| `isolateId` 採番ミス（request 毎採番） | TC-LOG-04 で assertion 化 | Phase 7 で担保 |

## Gate-A 判定

**GO (CONDITIONAL)**

CONDITIONAL 条件 3 件（Gate-B で再確認）:

1. AC-8: Phase 6/7 完了後に typecheck / lint / test PASS を evidence で確認
2. AC-9: Phase 8 で runbook 追記内容を確認
3. behaviour change（`KV.get` fail-closed → fail-open）の実装が Phase 6 snippet と完全一致

## Phase 4 への申し送り

- 観点 4 の TC-LOG-01〜08 を Phase 7 test 計画の最小集合として固定
- 観点 5 の追記範囲を Phase 8 ドキュメント更新の最小集合として固定
- Gate-B (Phase 9 受入確認) で CONDITIONAL 3 件を消化する
