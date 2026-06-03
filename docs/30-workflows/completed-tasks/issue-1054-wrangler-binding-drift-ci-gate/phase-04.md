# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（TC-01〜TC-10 設計） |
| 作成日 | 2026-06-02 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

Phase 2 の関数シグネチャ（`parseWranglerBindings` / `parseEnvInterfaceProps` / `parseInventoryRows` / `reconcile` / `main`）と三者突合マトリクス（`ENV_TYPE_MISSING` / `INVENTORY_MISSING` / `INVENTORY_KIND_MISMATCH` / `INVENTORY_ORPHAN`）を、`scripts/__tests__/verify-wrangler-binding-drift.spec.ts` の正常系テストケース TC-01〜TC-10 として設計する。各 TC は AC-1〜AC-11 のいずれかにトレースされ、純粋関数を fixture 文字列で検証する方針を固定する。異常系（ENOENT / 表記揺れ / 空 binding 等）は Phase 6 に委譲する。

## テスト方針（基本設計）

- **fixture 文字列で純粋関数を検証**: `parse*` / `reconcile` は実ファイルを読まず、テスト内に最小の TOML / `env.ts` / Markdown 表テキストを文字列リテラルで埋め込んで渡す。これにより実 repo の binding 変動からテストを独立させ、回帰 guard を安定させる（実ファイルを読むのは `main` の smoke のみで Phase 11 が担当）。
- **named export 化してテスト可能にする**: `verify-wrangler-binding-drift.mjs` は `parseWranglerBindings` / `parseEnvInterfaceProps` / `parseInventoryRows` / `reconcile` を named export し、`main` は `import.meta.url` の CLI 実行ガード内でのみ呼ぶ。spec は named export を import して純粋関数のみ検証する（`main` の `process.exit` を spec では呼ばない）。
- **vitest glob**: 新規 spec は `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` に置き、root vitest glob `scripts/**/*.spec.ts` で CI 実行対象になる（不変条件 #8 で `.spec.ts` のみ）。
- **AC トレーサビリティ**: 各 TC を AC-1〜AC-11 に対応付け、Phase 7 のカバレッジマトリクスで全 AC が最低 1 TC でカバーされることを確認する。

## テストケース TC-01〜TC-10

| TC | 対象関数 | 入力 fixture | 期待出力 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-01 | `parseWranglerBindings` | env-prefixed R2 block 3 件（`UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE` / `MEMBER_PHOTOS` が `[[env.production.r2_buckets]]` + `[[env.staging.r2_buckets]]`） | 3 エントリ。各 `{ kind:"r2", applied:true, envs:["production","staging"] }` に集約 | AC-1 |
| TC-02 | `parseWranglerBindings` | コメントアウト block（`# [[env.production.kv_namespaces]]` + `# binding = "ALERT_DEDUP_KV"`、`# [[queues.producers]]` + `# binding = "SCHEMA_ALIAS_BACKFILL_QUEUE"`） | `ALERT_DEDUP_KV`（kv）/ `SCHEMA_ALIAS_BACKFILL_QUEUE`（queue）が `applied:false` で抽出される | AC-1 / AC-5 |
| TC-03 | `parseEnvInterfaceProps` | `Env` interface（`DB` / `SYNC_ALERTS?` / `MEMBER_PHOTOS?` + secrets `R2_ACCOUNT_ID` / `AUTH_SECRET`） | property 名集合に `DB` / `SYNC_ALERTS` / `MEMBER_PHOTOS` / `R2_ACCOUNT_ID` / `AUTH_SECRET` を含む（secrets も拾うが `reconcile` 側で binding 突合から除外される） | AC-6 |
| TC-04 | `parseInventoryRows` | 「Current Cloudflare binding inventory」表 7 行（DB / SYNC_ALERTS / audit×2 / MEMBER_PHOTOS / ALERT_DEDUP_KV / SESSION_KV / R2_BUCKET） | 7 行抽出。`name` がバッククォート 1 列目、`kind` が d1/analytics/r2/kv、`state` が `active` / `not-applied` / `optional-or-commented` に正規化される | AC-1 |
| TC-05 | `reconcile` | applied:true binding に対し `env.ts` から 1 binding（例: `MEMBER_PHOTOS`）を削った envProps | `Drift` に `ENV_TYPE_MISSING`（binding=`MEMBER_PHOTOS`）が 1 件含まれる | AC-2 |
| TC-06 | `reconcile` | 棚卸し表から `MEMBER_PHOTOS` 行を削った状態（= 現行 repo 是正前）+ wrangler に applied R2 `MEMBER_PHOTOS` | `Drift` に `INVENTORY_MISSING`（binding=`MEMBER_PHOTOS`）が 1 件含まれる | AC-3 |
| TC-07 | `reconcile` | 棚卸し表 Kind が wrangler 側 kind と異なる | `Drift` に `INVENTORY_KIND_MISMATCH`（該当 binding）が 1 件含まれる | AC-4 |
| TC-08 | `reconcile` | 棚卸し表 state=active の binding に対応する wrangler block が無い（または applied:false） | `Drift` に `INVENTORY_ORPHAN`（該当 binding）が 1 件含まれる | AC-4 |
| TC-09 | `reconcile` | applied:false の binding（`ALERT_DEDUP_KV` / `SCHEMA_ALIAS_BACKFILL_QUEUE`）のみを含む入力（env.ts optional / 棚卸し表 optional・not-applied） | `Drift` が 0 件（applied:false を fail させない） | AC-5 |
| TC-10 | `reconcile` | 現行 repo 是正後（棚卸し表に `MEMBER_PHOTOS` 行追加済み）相当の整合状態 | `Drift` が 0 件（→ `main` は exit 0 を返す契約） | AC-10 |

> TC-01/TC-04 は parse 層の抽出精度、TC-05〜TC-10 は reconcile 層の突合判定を担保する。TC-03 は secrets を「拾うが突合除外」の片方向除外（D-6）を担保する。

## fixture 設計指針

- **TOML fixture**: env-prefixed block と top-level block、コメントアウト block を最小限ずつ含める。同名 binding を prod / staging の 2 block に書き、`envs:["production","staging"]` への集約を検証する。
- **env.ts fixture**: `export interface Env { ... }` 形を最小化し、`readonly <NAME>?: R2Bucket;` 形と secrets（`readonly <NAME>: string;`）を混在させる。
- **Markdown 表 fixture**: `| ` + バッククォート binding 名 + state 列を持つ Markdown table を 1 つ埋め込み、ヘッダ行・区切り行（`---`）を `parseInventoryRows` がスキップすることを確認する。
- fixture はテストファイル内 const として定義し、実 repo ファイルへ依存しない（回帰安定性）。

## 実行タスク

1. `parse*` を named export として spec から検証可能にする方針を固定する（完了条件: named export 方針と `main` の CLI ガード分離が本 Phase に記述されている）。
2. fixture 文字列で純粋関数を検証する方針を確定する（完了条件: fixture 設計指針が TOML / env.ts / Markdown 表の 3 種で記述されている）。
3. parse 層の正常系 TC-01〜TC-04 を設計する（完了条件: TC-01〜TC-04 が対象関数・入力 fixture・期待出力・対応 AC 付きで表に存在）。
4. reconcile 層の正常系 TC-05〜TC-10 を設計し 4 種 Drift code を網羅する（完了条件: `ENV_TYPE_MISSING` / `INVENTORY_MISSING` / `INVENTORY_KIND_MISMATCH` / `INVENTORY_ORPHAN` と applied:false PASS / 是正後 0 件が TC-05〜TC-10 でカバーされている）。
5. 各 TC を AC-1〜AC-11 にトレースする（完了条件: 全 TC に対応 AC が割り当てられ、Phase 7 のカバレッジマトリクスへ渡せる）。
6. 異常系の Phase 6 委譲を明記する（完了条件: ENOENT / 表記揺れ / 空 binding 等が Phase 6 範囲として記述されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 関数シグネチャ / データ構造 / 三者突合マトリクス（TC 期待値の基礎） |
| 必須 | phase-01.md | AC-1〜AC-11（TC トレース対象） |
| 必須 | scripts/verify-d1-migration-sequence.mjs | `.mjs` パーサ + named export + CLI ガードの先例 |
| 必須 | vitest.config.ts | test glob（`scripts/**/*.spec.ts`）正本 |
| 必須 | CLAUDE.md | 不変条件 #8（`.spec.ts` のみ） |
| 参考 | scripts/verify-design-tokens.ts | read-only 解析 → exit code の先例 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略主成果物（テスト方針 / TC-01〜TC-10 / fixture 設計指針 / AC トレース） |
| メタ | artifacts.json | Phase 4 状態の更新（spec_created） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | TC-01〜TC-10 を実装ランブック Step 4（spec 実装）の受入対象に渡す |
| Phase 6 | 正常系 TC との重複を避けるため異常系 TC-E01〜の境界を渡す |
| Phase 7 | TC-01〜TC-10 を AC カバレッジマトリクスの横軸に渡す |
| Phase 11 | TC-09（是正後 0 件）を `main` exit 0 の CLI smoke 基準に渡す |

## 完了条件

- [ ] named export + CLI ガード分離によるテスト容易性の方針が固定されている
- [ ] fixture 文字列で純粋関数を検証する方針が TOML / env.ts / Markdown 表の 3 種で記述されている
- [ ] parse 層 TC-01〜TC-04 が対象関数・入力・期待出力・対応 AC 付きで設計されている
- [ ] reconcile 層 TC-05〜TC-10 が 4 種 Drift code（ENV_TYPE_MISSING / INVENTORY_MISSING / INVENTORY_KIND_MISMATCH / INVENTORY_ORPHAN）を網羅して設計されている
- [ ] applied:false を fail させない TC-09 と是正後 0 件の TC-10 が存在する
- [ ] 各 TC が AC-1〜AC-11 にトレースされている
- [ ] 異常系の Phase 6 委譲が明記されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created` 範囲で記述済み
- 成果物 `outputs/phase-04/main.md` が配置済み
- TC-01〜TC-10 が 4 種 Drift code を全網羅している
- artifacts.json の `phases[3].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - TC-01〜TC-10（fixture 文字列による純粋関数検証）
  - named export 方針（`parse*` / `reconcile` を export、`main` は CLI ガード）
  - 異常系は Phase 6 に委譲
- ブロック条件:
  - 実装サイクルで `parse*` / `reconcile` が export されず spec から検証不能になる
  - 突合マトリクスから逸脱した期待値が TC に混入する
