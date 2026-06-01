# Phase 8 成果物 — DRY 化・リファクタリング

> 本ワークフローはタスク仕様書整備と実コード hardening。実 `generate-index.js` の編集は今回の実装サイクルで行う。本成果物は DRY 化の意図と集約先を確定する。

## 1. DRY 化対象（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| DRY-1 | index 書き込み経路 | `:338` / `:344` の個別 `writeFile`（非 atomic・2 箇所重複） | `writeFileAtomic` に集約し `writeAllIndexesAtomic(entries)` が一括処理 | atomic 化漏れの drift を防ぐ。境界を 1 箇所に閉じる（AC-2） |
| DRY-2 | tmp パス算出 | tmp 概念なし（導入時の `${path}.tmp` 二重記述リスク） | `writeFileAtomic` 内のみで tmp パス生成 | EXDEV 回避（同一 dir 制約）を崩さない |
| DRY-3 | tmp 掃除 | 各 entry ごとの unlink 重複リスク | `writeAllIndexesAtomic` の `finally` 1 箇所で一括 unlink | 掃除漏れの穴を防ぐ |
| DRY-4 | エラーログ接頭辞 | `:356` `console.error("エラー:", err.message)` 固有文字列 | `[generate-index] <skill> / <index-file> (<step>) 失敗: <message>` を throw 時に集約・二重付与判定も 1 箇所 | grep 可能な単一接頭辞に統一（AC-3） |
| DRY-5 | extractHeadings catch | `:175-177` silent `catch { return []; }` | ENOENT 空継続 / その他 throw の明示分岐に書換（当該 catch 内に限定） | silent catch のコピー拡散を防ぐ（AC-5） |
| DRY-6 | CLI 実行ガード | top-level `main().catch` 即実行（ガードなし） | `import.meta.url === pathToFileURL(process.argv[1]).href` 判定を 1 箇所のみ | import 副作用排除（TC-06）を安定化 |

## 2. helper 集約構造（2 段）

- `writeFileAtomic(targetPath, data)`: 単一ファイルの tmp→rename。tmp パス生成を内包。
- `writeAllIndexesAtomic(entries)`: 複数 index の all-or-nothing。全 tmp 書き込み成功後に rename commit、失敗時は `finally` で残存 tmp を一括掃除。decisive ログの接頭辞付与もここに集約。

## 3. 残す重複（共通化しない）

| 対象 | 残す理由 |
| --- | --- |
| `generateTopicMap` / `generateKeywordIndex` の出力文字列組み立て | byte-identical 不変条件（AC-4）の正本。整形・共通化すると drift |
| `--quiet` フラグ判定 | 既存挙動を変えない。scope 外 |

## 4. AC トレース（DRY 化後も維持）

| AC | DRY 化後の保持先 |
| --- | --- |
| AC-1 / AC-3 | DRY-4（decisive ログ集約） |
| AC-2 | DRY-1 / DRY-2 / DRY-3（atomic 境界集約） |
| AC-5 | DRY-5（silent catch 分離） |
| AC-7 | DRY-6（CLI ガード → export 化 → テスト可能） |
| AC-4 | 残す重複（出力文字列正本を不変に保つ） |

## 5. 完了状態

- DRY-1〜DRY-6 の集約先を確定。helper は 2 段に限定（過剰共通化を回避）。
- byte-identical を破る共通化は「残す重複」として明示除外。
- 実コード編集は今回の実装サイクル。
