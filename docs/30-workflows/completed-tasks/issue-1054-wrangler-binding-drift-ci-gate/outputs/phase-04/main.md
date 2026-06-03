# Phase 4 成果物 — テスト戦略

## 1. テスト方針

- fixture 文字列で純粋関数（`parse*` / `reconcile`）を検証する。実 repo ファイルへ依存せず回帰を安定化（実ファイル読みは `main` smoke = Phase 11 担当）。
- `verify-wrangler-binding-drift.mjs` は `parseWranglerBindings` / `parseEnvInterfaceProps` / `parseInventoryRows` / `reconcile` を named export。`main` は `import.meta.url` の CLI ガード内のみで実行し、spec では import 副作用ゼロ。
- 配置: `scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（root glob `scripts/**/*.spec.ts`・不変条件 #8 で `.spec.ts` のみ）。

## 2. 正常系テストケース TC-01〜TC-10

| TC | 対象関数 | 入力 fixture | 期待出力 | AC |
| --- | --- | --- | --- | --- |
| TC-01 | parseWranglerBindings | env-prefixed R2 3 件（audit×2 + MEMBER_PHOTOS / prod+staging） | 3 エントリ `{kind:"r2",applied:true,envs:["production","staging"]}` 集約 | AC-1 |
| TC-02 | parseWranglerBindings | コメントアウト ALERT_DEDUP_KV / SCHEMA_ALIAS_BACKFILL_QUEUE | `applied:false` で抽出 | AC-1/AC-5 |
| TC-03 | parseEnvInterfaceProps | Env interface（binding + secrets 混在） | property 集合に binding と secrets を含む（secrets は reconcile で除外） | AC-6 |
| TC-04 | parseInventoryRows | Current Cloudflare inventory 表 7 行 | 7 行抽出・kind/state 正規化 | AC-1 |
| TC-05 | reconcile | env.ts から MEMBER_PHOTOS 削った envProps | `ENV_TYPE_MISSING` 1 件 | AC-2 |
| TC-06 | reconcile | 棚卸し表から MEMBER_PHOTOS 削った状態（是正前） | `INVENTORY_MISSING` 1 件 | AC-3 |
| TC-07 | reconcile | 棚卸し表 Kind が wrangler 側 kind と不一致 | `INVENTORY_KIND_MISMATCH` 1 件 | AC-4 |
| TC-08 | reconcile | 棚卸し表 active だが wrangler block 無し | `INVENTORY_ORPHAN` 1 件 | AC-4 |
| TC-09 | reconcile | applied:false binding のみ | Drift 0 件 | AC-5 |
| TC-10 | reconcile | 是正後（MEMBER_PHOTOS 行追加済み）整合状態 | Drift 0 件 → main exit 0 | AC-10 |

> phase-04.md「テストケース TC-01〜TC-10」を正本とする。

## 3. fixture 設計指針

- TOML: env-prefixed / top-level / コメントアウト block を最小ずつ。同名を prod+staging に書き集約検証。
- env.ts: `readonly <NAME>?: R2Bucket;`（binding）と `readonly <NAME>: string;`（secrets）を混在。
- Markdown 表: バッククォート binding 名 1 列目 + state 列。ヘッダ / 区切り行（`---`）はスキップ。
- すべてテスト内 const として定義し実 repo に非依存。

## 4. AC トレーサビリティ

TC-01/04（AC-1）/ TC-02（AC-1,5）/ TC-03（AC-6）/ TC-05（AC-2）/ TC-06（AC-3）/ TC-07〜08（AC-4）/ TC-09（AC-5）/ TC-10（AC-10）。4 種 Drift code（ENV_TYPE_MISSING / INVENTORY_MISSING / INVENTORY_KIND_MISMATCH / INVENTORY_ORPHAN）を TC-05〜08 で全網羅。異常系は Phase 6 に委譲。

## 5. 結論

正常系 TC-01〜TC-10 が parse 層 + reconcile 層 + 4 種 Drift code を網羅。named export 方針でテスト容易性を確保。Phase 5 実装ランブックへ。
