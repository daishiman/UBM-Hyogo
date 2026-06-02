# Phase 6 成果物: 異常系・回帰テスト拡充（fail path / 回帰 guard）

## 前提

Phase 5 Step 2-4 実装済みを前提に fail path を扱う。全 fail path は `vi.spyOn(fs/promises)` の reject 注入で再現し、本物の `indexes/` は触らない（`os.tmpdir()` + `mkdtempSync` 隔離）。

## fail path 一覧

| TC | 対象 AC | 観点 | 失敗注入 | 期待される不変条件 |
| --- | --- | --- | --- | --- |
| TC-F1 | AC-2/AC-1 | tmp 書き込み失敗 | `writeFile` reject | 本ファイル不変・tmp 0（finally unlink）・非ゼロ exit |
| TC-F2 | AC-2/AC-1 | rename 失敗 | `rename` 2 回目 reject | 残存 tmp 掃除・decisive log に index/step・非ゼロ exit |
| TC-F3 | AC-5/AC-1 | EACCES | `readFile` EACCES reject | `[generate-index] heading 抽出失敗 (...)` throw・本ファイル不変 |
| TC-F4 | AC-2/AC-1 | 部分失敗 | keywords 側 writeFile reject | all-or-nothing（topic-map も commit しない）・両本ファイル不変・tmp 0 |
| TC-F5 | AC-4 | byte-identical 回帰 | なし | `git diff --quiet -- indexes` exit 0・hook/CI グリーン |

## all-or-nothing 不変条件

`writeAllIndexesAtomic` は「全 tmp 成功後にのみ rename」する設計のため、tmp フェーズで 1 件でも失敗すれば rename フェーズに入らず、本ファイルは全て変更前のまま。失敗時は `finally` で残存 tmp を全削除し、部分書き込みを残さない。

## 回帰 guard としての byte-identical

異常系は本物の `indexes/` を触らない（spy + tmpdir 隔離）。byte-identical（TC-F5）のみ CLI 経路全体の回帰なので Phase 11 で実 `pnpm indexes:rebuild` + `git diff --quiet` で drift 0 を最終証跡化する。spec 内では `generateTopicMap()` / `generateKeywordIndex()` の出力文字列が hardening 前後で不変であることを固定する。

## 申し送り

TC-F2 の rename commit フェーズ途中失敗（先行 rename 済みが残りうる）の境界を Phase 8 DRY 化で明記する。

## 委譲境界

実テスト作成・実走は今回の実装サイクル。本 Phase は仕様化のみ。
