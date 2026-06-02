# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（パーサ / 三者突合 / 関数シグネチャ / データ構造 / 変更ファイル） |
| 作成日 | 2026-06-02 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

Phase 1 で固定した AC-1〜AC-11 を満たす gate スクリプトの内部設計を確定する。具体的には (1) wrangler.toml 行パーサのデータ構造と走査ロジック、(2) env.ts property 抽出、(3) 棚卸し表抽出、(4) 三者突合の判定マトリクス、(5) 関数シグネチャ、(6) 変更 5 ファイル一覧、(7) ライブラリ採否、を設計する。実コードは今回の実装サイクルが書くため、本 Phase は方針と契約の正本とする。

## 設計方針 D-1〜D-7

- **D-1（ライブラリ採否）**: TOML パーサライブラリ（`@iarna/toml` 等）は採用しない。理由はライブラリがコメントアウト block を構文上無視し `applied:false`（コメントアウト適用予定）を区別できないため。依存を増やさず、行単位の自作軽量パーサとする。
- **D-2（パーサ走査）**: `wrangler.toml` を行配列に分割し、`[[<env-prefix?><kind>]]` ヘッダ行と直後付近の `binding = "<NAME>"` 行を対にして抽出する。行頭が `#` の場合は `applied:false`。`[[env.production.r2_buckets]]` のような env-prefix は正規表現で `env`/`kind` を分解する。
- **D-3（kind 正規化）**: `d1_databases` → `d1` / `kv_namespaces` → `kv` / `r2_buckets` → `r2` / `analytics_engine_datasets` → `analytics` / `queues.producers`・`queues.consumers` → `queue` に正規化する。
- **D-4（集約）**: 同名 binding が複数 env block に現れる場合（例: `MEMBER_PHOTOS` が prod + staging）、`{ name, kind }` を主キーに 1 エントリへ集約し、`envs: string[]`（`["production","staging"]` 等。top-level は `"default"`）と `applied`（いずれかの env で非コメント宣言があれば true）を持たせる。
- **D-5（突合スコープ）**: env.ts 突合は **applied:true の全 binding kind**（d1/kv/r2/analytics/queue）を対象。棚卸し表突合も **applied:true の全 binding kind** を対象にする。D1/analytics を inventory に含めることで R-1 を同一サイクルで解消する。
- **D-6（除外）**: env.ts の property のうち、wrangler binding 由来でないもの（secrets / vars）は突合対象にしない。env.ts → wrangler の逆方向（型にあるが宣言が無い）は **誤検出回避のため fail させない**（型は将来 binding を先行宣言しうる）。突合は wrangler → env.ts（宣言にあるが型が無い）の片方向のみ fail とする。
- **D-7（read-only）**: スクリプトは `readFileSync` のみ。書き込み・ネットワーク・`child_process` を一切使わない（AC-7）。終了コードのみで結果を伝える。

## データ構造

```ts
// wrangler.toml パーサ出力（1 binding = 1 エントリに集約済み）
type WranglerBinding = {
  name: string;          // 例: "MEMBER_PHOTOS"
  kind: "d1" | "kv" | "r2" | "analytics" | "queue";
  applied: boolean;      // いずれかの env で非コメント宣言があれば true
  envs: string[];        // 例: ["production", "staging"] / ["default"]
};

// 棚卸し表 1 行
type InventoryRow = {
  name: string;          // バッククォート 1 列目（例: "MEMBER_PHOTOS"）
  kind: string;          // "R2 bucket" / "Workers KV" 等（原文）
  state: "active" | "not-applied" | "optional-or-commented" | "unknown";
};

// ドリフト 1 件
type Drift = {
  code: "ENV_TYPE_MISSING" | "INVENTORY_MISSING" | "INVENTORY_KIND_MISMATCH" | "INVENTORY_ORPHAN";
  binding: string;
  detail: string;        // どの正本から欠落しているか
};
```

## 関数シグネチャ（設計契約）

```ts
// --- 解析 ---
function parseWranglerBindings(tomlText: string): WranglerBinding[];
function parseEnvInterfaceProps(envTsText: string): Set<string>; // Env interface の readonly <NAME> 集合
function parseInventoryRows(deploymentMdText: string): InventoryRow[]; // Current Cloudflare binding inventory 表

// --- 突合 ---
function reconcile(
  bindings: WranglerBinding[],
  envProps: Set<string>,
  inventory: InventoryRow[],
): Drift[];

// --- entrypoint ---
function main(): number; // 0 = drift なし / 1 = drift あり。read-only。
```

## 三者突合マトリクス（reconcile の判定）

| 入力状態 | 判定 | Drift code | 例 |
| --- | --- | --- | --- |
| applied:true & env.ts property 無し | **FAIL** | `ENV_TYPE_MISSING` | wrangler に新 binding 宣言、型未追加 |
| applied:true & 棚卸し表に行無し | **FAIL** | `INVENTORY_MISSING` | **MEMBER_PHOTOS（現存ドリフト）** / DB / SYNC_ALERTS drift |
| applied:true & 棚卸し表の Kind が wrangler 側 kind と不一致 | **FAIL** | `INVENTORY_KIND_MISMATCH` | `MEMBER_PHOTOS` を KV と誤記しても通る偽陽性を防ぐ |
| 棚卸し表 state=active & 対応 wrangler block 無し（または applied:false） | **FAIL** | `INVENTORY_ORPHAN` | 表が active と書くが宣言が消えた |
| applied:false（コメントアウト） | PASS（info） | — | SCHEMA_ALIAS_BACKFILL_QUEUE / ALERT_DEDUP_KV |
| applied:true & kind∈{d1,analytics} & 棚卸し表に行あり | PASS | — | DB / SYNC_ALERTS |
| 棚卸し表 state=not-applied & wrangler block 無し | PASS | — | SESSION_KV / R2_BUCKET |
| env.ts にあるが wrangler 宣言無し（secrets/vars/予約） | PASS（D-6・片方向） | — | R2_ACCOUNT_ID / AUTH_SECRET |

> 現行 repo（是正前）では `MEMBER_PHOTOS` が `INVENTORY_MISSING` で 1 件 FAIL する。AC-10 の棚卸し表追記後は 0 件 → exit 0。

## 変更ファイル一覧（必須）

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `scripts/verify-wrangler-binding-drift.mjs` | 新規 | パーサ + reconcile + main。`export` で純粋関数をテスト可能化。CLI 実行ガード（`import.meta.url` 判定）付き |
| `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | 新規 | TC-01〜TC-10 回帰 spec（fixture 文字列で純粋関数を検証） |
| `.github/workflows/verify-wrangler-binding-drift.yml` | 新規 | `apps/api/wrangler.toml` / `apps/api/src/env.ts` / `deployment-cloudflare.md` 変更時に gate 起動 |
| `package.json` | 編集 | `"verify:wrangler-binding-drift": "node scripts/verify-wrangler-binding-drift.mjs"` を `scripts` に追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | 棚卸し表へ `MEMBER_PHOTOS` 行を追加（AC-10）+ 「機械検出対象 SSOT」注記 |

> 上記 5 ファイル以外は変更しない。`apps/api/wrangler.toml` / `apps/api/src/env.ts` は **解析対象であり編集しない**（現行宣言・型が正）。

## ステップ間 / レイヤ責務

| レイヤ | 責務 | 状態所有 |
| --- | --- | --- |
| パーサ（parse*） | テキスト → 構造体。判断しない | 入力テキストのみ |
| reconcile | 構造体 3 種 → Drift[]。I/O しない純粋関数 | 引数のみ |
| main | ファイル read + reconcile 呼び出し + stderr 出力 + exit code | プロセス終了コード |

## 実行タスク

1. ライブラリ採否（D-1）を確定し、自作行パーサ方針を固定する（完了条件: D-1 が記述、根拠=コメント block 区別）。
2. データ構造（`WranglerBinding` / `InventoryRow` / `Drift`）を確定する（完了条件: 型定義が本 Phase に存在）。
3. 関数シグネチャ（parse* / reconcile / main）を確定する（完了条件: シグネチャ表が存在）。
4. 三者突合マトリクスを 7 行で固定する（完了条件: マトリクスが AC-2〜AC-6 を網羅）。
5. 変更 5 ファイル一覧を確定する（完了条件: 一覧が存在し解析対象 2 ファイルを非編集と明記）。
6. レイヤ責務（parse / reconcile / main）を分離する（完了条件: 責務テーブルが存在）。
7. read-only（D-7）と片方向突合（D-6）を設計に固定する（完了条件: AC-6 / AC-7 と整合）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-01.md | AC-1〜AC-11 / binding 棚卸し / 命名規則 |
| 必須 | scripts/verify-design-tokens.ts | read-only 解析 → exit code の先例 |
| 必須 | scripts/verify-d1-migration-sequence.mjs | `.mjs` read-only パーサ + CLI ガードの先例 |
| 必須 | apps/api/wrangler.toml | binding block 構文の実体 |
| 必須 | apps/api/src/env.ts | `Env` interface property 抽出対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 棚卸し表構文（Markdown table） |
| 必須 | vitest.config.ts | test glob 確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/main.md | パーサ / reconcile / シグネチャ / データ構造 / 変更ファイル / 突合マトリクスの設計 |
| メタ | artifacts.json | Phase 2 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計方針 D-1〜D-7 を代替案比較・着手可否ゲートの対象に渡す |
| Phase 4 | 関数シグネチャ + 突合マトリクスを TC-01〜TC-10 の期待値に渡す |
| Phase 5 | 変更 5 ファイル一覧 + Step 順序を実装ランブックの起点に渡す |
| Phase 6 | 異常系（ファイル不在 / 表記揺れ / 空 binding）の設計前提を渡す |
| Phase 11 | main の exit code 契約（0/1）を CLI smoke の基準に渡す |

## 完了条件

- [x] ライブラリ採否（D-1・自作行パーサ）が根拠付きで確定している
- [x] データ構造 3 種（WranglerBinding / InventoryRow / Drift）が定義されている
- [x] 関数シグネチャ（parse* / reconcile / main）が確定している
- [x] 三者突合マトリクスが AC-2〜AC-6 を網羅して固定されている
- [x] 変更 5 ファイル一覧が存在し、解析対象 2 ファイルを非編集と明記している
- [x] レイヤ責務（parse / reconcile / main）が分離されている
- [x] read-only（D-7）と片方向突合（D-6）が設計に固定されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 成果物 `outputs/phase-02/main.md` が配置済み
- 変更ファイルが 5 件に限定されている
- artifacts.json の `phases[1].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項:
  - 設計方針 D-1〜D-7 と代替案（ライブラリ採用 / 双方向突合）の不採用理由
  - 関数シグネチャ + 突合マトリクス
  - 変更 5 ファイル一覧
- ブロック条件:
  - 突合マトリクスが AC を取りこぼす
  - read-only / 片方向突合が崩れる設計が残る
