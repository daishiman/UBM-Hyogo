# Phase 6: テスト拡充（fail path / 回帰ガード）

## 1. 目的

Phase 4 の基本ケースに加え、`extension-noise-filter.ts` の
**fail-open 砦**と**判定経路の網羅**を固めるエッジケースを追加する。
これらは Phase 7 のカバレッジ目標（pure module の line / branch ほぼ全網羅）を満たす土台になる。

追加先: `apps/web/src/lib/sentry/extension-noise-filter.spec.ts`（Phase 4 と同一ファイルに `describe` ブロックを追記）。

## 2. fail path / 網羅追加ケース

### 2.1 `eventHasExtensionFrame` の深い/複雑な shape

| ケースID | event の形 | 期待値 | 観点 |
|---------|-----------|--------|------|
| FRAME-10 | `exception.values` が複数（`[アプリ frame のみ, 拡張 frame を含む]`） | `true` | 2件目で拾えること（ループ網羅） |
| FRAME-11 | `exception.values` が複数すべてアプリ frame のみ | `false` | 複数 values でも誤検知しない |
| FRAME-12 | frames が深い（10件以上、最後の1件だけ拡張 `abs_path`） | `true` | 全 frame 走査 |
| FRAME-13 | frame に `filename` 無し・`abs_path` のみ拡張 | `true` | abs_path 経路（filename フォールバック） |
| FRAME-14 | `request` 無し（`request.url` 参照が undefined） | `false`（throw しない） | request 経路の null 安全 |
| FRAME-15 | `culprit: undefined` | `false` | culprit 経路の null 安全 |
| FRAME-16 | `Object.create(null)` 由来の null-prototype 風 event（`exception` 等プロパティ無し） | `false`（throw しない） | プロトタイプ無しオブジェクトでも安全 |
| FRAME-17 | frame オブジェクトが `null`（`frames: [null]`） | `false`（throw しない） | 配列要素 null 安全（`frame?.filename`） |

### 2.2 `filterExtensionNoise` の fail-open 境界

| ケースID | 入力 | 期待値 | 観点 |
|---------|------|--------|------|
| FILTER-07 | 複数 values の片方が拡張 frame | `null`（drop） | 1件でも拡張なら drop |
| FILTER-08 | null-prototype 風 event（FRAME-16 と同形） | **event を返す** | 判定不能 → 残す（fail-open） |
| FILTER-09 | `abs_path` のみ拡張の event | `null` | abs_path 経由でも drop |
| FILTER-10 | `culprit` のみ拡張の event | `null` | culprit 経由でも drop |

### 2.3 `EXTENSION_IGNORE_ERRORS` の RegExp / 文字列 双方の境界

| ケースID | メッセージ | 期待 | 観点 |
|---------|-----------|------|------|
| IGN-08 | `"Could not establish connection. Receiving end does not exist."`（**string 完全一致要素**） | マッチ | string 要素の `includes` 経路 |
| IGN-09 | `"prefix: Could not establish connection. Receiving end does not exist. suffix"` | マッチ（部分一致） | string 要素は部分一致で拾う |
| IGN-10 | `"No tab with id: 9999 found later"`（**RegExp 要素**） | マッチ | RegExp 要素の `.test` 経路 |
| IGN-11 | `"ResizeObserver loop limit exceeded"` | マッチ | `/ResizeObserver loop/` の別バリアント |
| IGN-12 | `"Could not establish"`（部分文字列だが完全な ignore 文言ではない） | **マッチしない** | string 完全片の境界（誤一致防止） |

> IGN-08 / IGN-10 で「string 要素」「RegExp 要素」の両分岐を必ず通すこと（branch 網羅）。

## 3. 最優先の回帰ガード（fail-open の砦）

以下を**独立した `describe("回帰: アプリ error を誤って drop しない", ...)`** として固定する。
これが本機能の最重要不変条件であり、将来の変更で壊れたら即 fail させる。

| ケースID | 入力 | 期待値 | 説明 |
|---------|------|--------|------|
| REG-01 | 典型的なアプリ実エラー（`exception.values[0].stacktrace.frames` がすべて `https://members.ubm-hyogo.example/...` の event） | `filterExtensionNoise` が **同一 event を返す** | アプリ error は素通し |
| REG-02 | アプリ error メッセージ（`"TypeError: members.map is not a function"`） | `EXTENSION_IGNORE_ERRORS` のどれにも**マッチしない** | ignoreErrors の誤爆防止 |
| REG-03 | アプリ URL（`"https://members.ubm-hyogo.example/app.js"`） | `EXTENSION_DENY_URLS` のどれにも**マッチしない** | denyUrls の誤爆防止 |
| REG-04 | 完全に空 / 壊れた event | `filterExtensionNoise` が event を返す（drop しない） | 判定不能でも握り潰さない |

## 4. Phase 7 カバレッジへの橋渡し

- 上記ケースで `extension-noise-filter.ts` の全分岐（各 prefix・filename/abs_path/request/culprit の4経路・try/catch・配列ガード・string/RegExp 双方）を通過する。
- pure module で外部 I/O・SDK 起動を持たないため、line / branch カバレッジはほぼ 100% を目標にできる。Phase 7 ではこのテスト群を基に閾値を確認する。
- 万一カバーされない分岐（例: 到達不能な防御 catch）が残る場合は、Phase 7 で「意図的な防御コードで到達不能」と注記し、テスト追加 or 注記で扱う。

## 5. 実行コマンド

```bash
pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts
```

全ケース green であること。とくに §3 の回帰ガードは**絶対に fail させてはならない**（アプリ実エラーを Sentry から消さない保証）。
