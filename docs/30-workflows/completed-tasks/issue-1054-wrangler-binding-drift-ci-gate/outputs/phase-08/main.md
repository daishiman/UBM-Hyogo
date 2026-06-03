# Phase 8 成果物 — DRY 化・リファクタリング

## 1. 目的

gate スクリプト `scripts/verify-wrangler-binding-drift.mjs` の内部構造を、重複排除・定数化・責務分離の観点で整理する方針を確定する。read-only 性（AC-7 / D-7）・片方向突合（AC-6 / D-6）・exit code 契約は一切変えない。

## 2. リファクタリング方針（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| RF-1 | kind 正規化（D-3） | `parseWranglerBindings` 内に分岐散在 | `KIND_NORMALIZE_MAP` モジュール定数へ集約 | 正規化規則を 1 箇所に集約。kind 追加時の修正点を局所化 |
| RF-2 | block ヘッダ正規表現 | top-level / env-prefixed を別表現で判定 | env-prefix optional の単一正規表現（env 欠落時 `"default"`） | 走査ロジック重複排除 |
| RF-3 | parse* の行走査 | 各関数が独自に `split("\n")` + trim | `splitLines(text)` 共通ヘルパで再利用 | 行分割前処理の重複排除。改行正規化点を 1 箇所に |
| RF-4 | 突合判定 | `reconcile` 内に if 連鎖直書き | check 関数群（`checkEnvTypeMissing` / `checkInventoryMissing` / `checkInventoryOrphan`）へ分割し `reconcile` は合成役 | AC-2〜AC-6 と判定の 1:1 対応を可視化 |
| RF-5 | 棚卸し state 正規化 | 自由記述判定を `parseInventoryRows` に混在 | `normalizeInventoryState(raw)` 純粋関数へ抽出（未知語 → `unknown`） | 表記揺れ正規化を 1 関数に閉じ、誤 fail 回避をテスト対象化 |
| RF-6 | ログ接頭辞 | `[verify-wrangler-binding-drift]` 都度手書き | `LOG_PREFIX` 定数 + `logDrift`/`logInfo` ヘルパ | grep 可能性を保証し打ち間違い排除 |
| RF-7 | CLI 実行ガード | `main()` 末尾で直接 `process.exit` | 純粋関数を `export` し `import.meta.url` ガード内で `process.exit(main())` | spec から import しても副作用が走らない構造（AC-8 容易性） |

## 3. リファクタリング後も保持する不変

| 保持対象 | 根拠 |
| --- | --- |
| read-only（`readFileSync` のみ） | AC-7 / D-7 / Phase 9 QG-4 |
| 片方向突合（wrangler → env.ts のみ fail） | AC-6 / D-6 |
| 棚卸し突合は applied 全 binding | AC-3 / D-5 |
| applied:false を fail させない | AC-5 |
| exit code 0/1 契約 | Phase 2 main シグネチャ |
| 変更ファイル 5 件限定（解析対象 2 ファイル非編集） | Phase 2 |

## 4. 結論

RF-1〜RF-7 は可読性・保守性のみを高め、AC と read-only / exit code 契約を毀損しない。実コードのリファクタリングは実装サイクルが行い、本 Phase は方針の正本。Phase 9（品質保証）で read-only 維持を grep gate により回帰検証する。
