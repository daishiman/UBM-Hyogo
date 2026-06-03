# Phase 8: DRY 化・リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化・リファクタリング |
| 作成日 | 2026-06-02 |
| 前 Phase | 7 (AC / カバレッジマトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

Phase 2 で設計し Phase 4〜7 でテスト・実装ランブック化した gate スクリプト `scripts/verify-wrangler-binding-drift.mjs` の内部構造を、重複排除・定数化・責務分離の観点で整理する方針を確定する。Phase 8 では read-only 性（D-7 / AC-7）と片方向突合（D-6）を一切変えず、可読性と保守性のみを高めるリファクタリング指針を「対象 / Before / After / 理由」で固定する。実コードのリファクタリングは実装サイクルが行うため、本 Phase は方針レベルの正本である。

## リファクタリング対象（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| RF-1 | kind 正規化（D-3） | `d1_databases`→`d1` 等の対応を `parseWranglerBindings` 内に分岐で散在させる | `const KIND_NORMALIZE_MAP`（`{ d1_databases:"d1", kv_namespaces:"kv", r2_buckets:"r2", analytics_engine_datasets:"analytics", "queues.producers":"queue", "queues.consumers":"queue" }`）をモジュール定数化し参照する | 正規化規則を 1 箇所に集約。kind 追加時の修正点を 1 箇所に限定し、テスト fixture と規則が乖離しない |
| RF-2 | block ヘッダ正規表現 | `[[env.production.r2_buckets]]` / `[[r2_buckets]]` を 2 つの個別正規表現で判定 | env-prefix を optional group とする単一正規表現 `^#?\s*\[\[(?:env\.(?<env>[^.\]]+)\.)?(?<kind>[a-z_]+(?:\.[a-z_]+)?)\]\]` に統合し、`env` 欠落時は `"default"` にフォールバック | top-level と env-prefixed の走査ロジック重複を排除。D-2 の走査仕様を 1 表現で表す |
| RF-3 | parse* 3 関数の行走査 | `parseWranglerBindings` / `parseEnvInterfaceProps` / `parseInventoryRows` がそれぞれ独自に `text.split("\n")` + trim を実装 | 共通ヘルパ `splitLines(text)`（改行分割 + 行末空白除去のみ・判断しない）を抽出して 3 関数で再利用 | 行分割の前処理重複を排除。改行コード（CRLF/LF）正規化の修正点を 1 箇所に集約 |
| RF-4 | 突合判定マトリクス | `reconcile` 内に判定条件（applied / kind / inventory state）を if 連鎖で直書き | Phase 2「三者突合マトリクス」の 7 行を `RECONCILE_RULES` 相当の宣言的テーブル（または明確に分割した 3 つの check 関数 `checkEnvTypeMissing` / `checkInventoryMissing` / `checkInventoryOrphan`）へ整理し、`reconcile` は各 check を合成するだけにする | AC-2〜AC-6 と判定ロジックの 1:1 対応を可視化。Drift code 追加時の影響範囲を局所化 |
| RF-5 | 棚卸し表 state 正規化（表記揺れ） | `active` / `not applied` / `optional; commented` 等の自由記述判定を `parseInventoryRows` に分岐で混在 | `normalizeInventoryState(raw): "active" | "not-applied" | "optional-or-commented" | "unknown"` を純粋関数として抽出。未知語は `"unknown"`（warn 用）へ寄せる | index.md 苦戦箇所②「表記揺れ正規化」を 1 関数に閉じ込め、誤 fail 回避ルール（unknown は fail させない）をテスト対象化 |
| RF-6 | ログ接頭辞 | `console.error("...")` に `[verify-wrangler-binding-drift]` を都度手書き | `const LOG_PREFIX = "[verify-wrangler-binding-drift]"` を定数化し、`logDrift` / `logInfo` ヘルパで一貫付与 | grep 可能性（命名規則）を保証しつつ接頭辞の打ち間違いを排除 |
| RF-7 | CLI 実行ガード | `main()` 末尾で直接 `process.exit` を呼ぶ構造 | 純粋関数群（parse* / reconcile）を `export` し、`import.meta.url === pathToFileURL(process.argv[1]).href` の CLI ガード内でのみ `main()` を実行・`process.exit(main())` する | テスト（spec）から純粋関数を import しても副作用（exit）が走らない構造を固定。AC-8 の fixture テスト容易性を担保 |

## 不変条件・設計の保持（リファクタリングで変えないもの）

| 保持対象 | 根拠 |
| --- | --- |
| read-only（`readFileSync` のみ・書き込み / ネットワーク / `child_process` 不使用） | AC-7 / D-7。Phase 9 で grep gate により回帰検証 |
| 片方向突合（wrangler → env.ts のみ fail。env.ts → wrangler は fail させない） | AC-6 / D-6 |
| 棚卸し突合は applied 全 binding | AC-3 / D-5 |
| `applied:false`（コメントアウト）を fail させない | AC-5 |
| exit code 契約（0 = drift なし / 1 = drift あり） | Phase 2 main シグネチャ。Phase 11 CLI smoke の基準 |
| 変更ファイルは Phase 2 の 5 ファイルに限定（`apps/api/wrangler.toml` / `apps/api/src/env.ts` は非編集） | Phase 2「変更ファイル一覧」 |

## 実行タスク

1. kind 正規化を `KIND_NORMALIZE_MAP` 定数へ集約する（RF-1）。完了条件: kind 対応規則がモジュール定数 1 箇所に集約され、`parseWranglerBindings` が分岐ではなくマップ参照で kind を解決する方針が確定している。
2. block ヘッダ正規表現を env-prefix optional の単一表現へ統合する（RF-2）。完了条件: top-level / env-prefixed を 1 正規表現で判定し env 欠落時 `"default"` フォールバックする方針が確定している。
3. 行走査前処理を `splitLines` ヘルパへ抽出し parse* 3 関数で再利用する（RF-3）。完了条件: 3 関数の `split("\n")` 重複が共通ヘルパへ寄せられ、改行正規化の修正点が 1 箇所である方針が確定している。
4. 突合判定を check 関数群（または宣言的ルール表）へ分割し `reconcile` を合成役へ縮約する（RF-4）。完了条件: AC-2〜AC-6 が各 check と 1:1 対応する構造が方針として記述されている。
5. 棚卸し state 正規化を `normalizeInventoryState` 純粋関数へ抽出し未知語を `unknown` へ寄せる（RF-5）。完了条件: 表記揺れ正規化が 1 関数に閉じ、unknown は fail させないルールがテスト対象化される方針が確定している。
6. ログ接頭辞を `LOG_PREFIX` 定数 + `logDrift`/`logInfo` ヘルパへ集約する（RF-6）。完了条件: `[verify-wrangler-binding-drift]` 接頭辞が定数経由で一貫付与される方針が確定している。
7. CLI 実行ガードを `import.meta.url` 判定で囲い純粋関数を export する（RF-7）。完了条件: spec から import しても `process.exit` が走らない構造が方針として固定されている。
8. read-only / 片方向突合 / KV-R2 限定 / exit code 契約をリファクタリング後も保持することを明記する。完了条件: 「保持するもの」テーブルが本 Phase に存在し Phase 9 の回帰検証対象として渡される。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 設計方針 D-1〜D-7 / データ構造 / 関数シグネチャ / 突合マトリクス |
| 必須 | phase-07.md | AC / カバレッジマトリクス（リファクタリング後も維持すべき AC 対応） |
| 必須 | scripts/verify-design-tokens.ts | 定数化 + 純粋関数 export + CLI ガードの先例 |
| 必須 | scripts/verify-d1-migration-sequence.mjs | `.mjs` read-only パーサ + `import.meta.url` CLI ガードの先例 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase テンプレ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタリング方針（RF-1〜RF-7 / 保持対象 / read-only 維持）の主成果物 |
| メタ | artifacts.json | Phase 8 状態（spec_created） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC / カバレッジマトリクスを「リファクタリング後も維持する AC」として参照する |
| Phase 9 | RF-7（CLI ガード）後の read-only 維持を grep gate で回帰検証する対象に渡す |
| Phase 10 | RF-1〜RF-7 が AC を毀損しないことを最終レビューの確認項目に渡す |
| Phase 11 | exit code 契約（0/1）の保持を CLI smoke の前提として渡す |

## 完了条件

- [ ] kind 正規化が `KIND_NORMALIZE_MAP` 定数へ集約される方針が確定している（RF-1）
- [ ] block ヘッダ正規表現が env-prefix optional の単一表現へ統合される方針が確定している（RF-2）
- [ ] 行走査前処理が `splitLines` ヘルパへ抽出される方針が確定している（RF-3）
- [ ] 突合判定が check 関数群へ分割され AC-2〜AC-6 と 1:1 対応する方針が確定している（RF-4）
- [ ] 棚卸し state 正規化が `normalizeInventoryState` 純粋関数へ抽出される方針が確定している（RF-5）
- [ ] CLI 実行ガードと純粋関数 export の構造が固定されている（RF-7）
- [ ] read-only / 片方向突合 / KV-R2 限定 / exit code 契約がリファクタリング後も保持されることが明記されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が方針として `spec_created` で記述されている
- 成果物 `outputs/phase-08/main.md` が配置済み
- 変更ファイルが Phase 2 の 5 ファイルから増減していない
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - RF-1〜RF-7 のリファクタリング方針
  - リファクタリング後も保持する不変（read-only / 片方向 / KV-R2 限定 / exit code）
  - RF-7（CLI ガード）後の read-only 維持を Phase 9 grep gate で検証する
- ブロック条件:
  - リファクタリングが read-only（AC-7）または片方向突合（AC-6）を崩す
  - 変更ファイルが 5 件を超える
