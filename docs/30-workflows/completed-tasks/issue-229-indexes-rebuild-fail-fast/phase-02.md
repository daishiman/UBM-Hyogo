# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-31 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| 実装区分 | 実装仕様書 |

## 目的

Phase 1 の AC-1〜AC-8 を、`generate-index.js` の具体的な関数シグネチャ・変更差分方針・テスト構造へ落とし込む。本 Phase の成果物は今回の実装サイクルがそのまま編集着手できる粒度の設計図（CONST_005 必須項目を全て含む）とする。

## 変更対象ファイル一覧（CONST_005-1）

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | 編集 | atomic write helper 追加 / catch ログ decisive 化 / extractHeadings silent catch 分離 / CLI 実行ガード追加 / 純粋関数 export 化 |
| `scripts/__tests__/generate-index-fail-fast.spec.ts` | 新規 | atomic write・fail-fast・decisive log・ENOENT 分岐の回帰 spec test（vitest root glob `scripts/**/*.spec.ts`） |

> 上記 2 ファイル以外は変更しない。`indexes/topic-map.md` / `indexes/keywords.json` は再生成結果が **byte-identical**（drift 0）であること。

## 設計方針

### D-1: atomic write helper（AC-2）

全 index を一旦 `<name>.tmp` に書き、**全 index の生成・tmp 書き込みが成功した後にのみ** `rename` で本ファイルへ commit する。途中で throw した場合は `finally` で書きかけ tmp を全削除する。`rename` は同一ディレクトリ（`indexes/`）内のため atomic（`EXDEV` を回避）。先例: `scripts/cf-audit-log/feature-export.ts:42-62`。

### D-2: decisive エラーログ（AC-3）

`main()` の各 step を `try/catch` でラップせず、`writeAllIndexesAtomic` 内で step 名と対象 file 名を保持し、失敗時に `[generate-index] aiworkflow-requirements / <index-file> (<step>) 失敗: <message>` を `console.error` で出す。top-level `main().catch` はその context 付き Error を再 throw 済みのものとして表示し `process.exit(1)`。

### D-3: extractHeadings silent catch 分離（AC-5・AC-1）

`catch { return []; }` を `catch (err) { if (err && err.code === "ENOENT") return []; throw new Error(\`[generate-index] heading 抽出失敗 (${file}): ${err.message}\`); }` に分離。ENOENT（ファイル消失レース等）は従来通り空継続、それ以外の I/O エラー（権限・破損）は context 付きで throw し非ゼロ exit へ伝播。

### D-4: CLI 実行ガード + export 化（AC-7 のテスト可能化）

top-level の `main().catch(...)` を `if (import.meta.url === pathToFileURL(process.argv[1]).href) { main().catch(...) }` で囲み、import 時に副作用が走らないようにする。`writeFileAtomic` / `writeAllIndexesAtomic` / `generateTopicMap` / `generateKeywordIndex` を named export 化してテストから import 可能にする。

### D-5: byte-identical 維持（AC-4）

出力文字列の組み立て（topic-map.md 本文 / `JSON.stringify(keywordIndex, null, 2)`）は一切変更しない。変更は「書き込み経路（直接 writeFile → tmp + rename）」と「catch ログ」「silent catch 分離」「CLI ガード / export」のみ。

## 主要な関数・型シグネチャ（CONST_005-2）

```js
// generate-index.js（ESM）

import { rename, unlink, writeFile } from "fs/promises";
import { pathToFileURL } from "url";

/**
 * 単一ファイルを atomic に書く（tmp に書いてから rename で置換）。
 * 同一ディレクトリ内 rename のため atomic（EXDEV 回避）。
 * @param {string} targetPath 最終出力パス（例: indexes/topic-map.md）
 * @param {string} data       書き込む文字列
 * @returns {Promise<void>}
 * @throws tmp 書き込み / rename 失敗時。呼び出し元が tmp を掃除する。
 */
export async function writeFileAtomic(targetPath, data) { /* tmp = `${targetPath}.tmp`; await writeFile(tmp, data); await rename(tmp, targetPath); */ }

/**
 * 複数 index を all-or-nothing で書く。
 * 1) 全 entry を `<path>.tmp` に書き込む（本ファイルは未変更）
 * 2) 全 tmp 成功後に順次 rename で commit
 * 3) いずれかで throw したら finally で残存 tmp を全削除（部分書き込みを残さない）
 * @param {Array<{ step: string, path: string, data: string }>} entries
 * @returns {Promise<void>}
 * @throws decisive context（skill / index-file / step）付き Error
 */
export async function writeAllIndexesAtomic(entries) { /* ... */ }

// 既存（export 追加・本体ロジック不変）
export async function generateTopicMap() { /* ... */ }
export async function generateKeywordIndex() { /* ... */ }

async function main() { /* entries を組み立てて writeAllIndexesAtomic(entries) を呼ぶ */ }

// CLI 実行時のみ main を走らせる（import 副作用排除）
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message.startsWith("[generate-index]") ? err.message : `[generate-index] 失敗: ${err.message}`);
    process.exit(1);
  });
}
```

## 入力・出力・副作用の定義（CONST_005-3）

| 項目 | 内容 |
| --- | --- |
| 入力 | `.claude/skills/aiworkflow-requirements/references/*.md`（REFS_DIR）。`--quiet` フラグ（既存） |
| 出力 | `indexes/topic-map.md` / `indexes/keywords.json`（byte-identical 維持） |
| 副作用 | `indexes/*.tmp` を一時生成 → rename で消滅。失敗時は unlink で掃除。本ファイルへの部分書き込みなし |
| exit code | 成功 0 / 任意の生成・書き込み失敗 1（decisive） |
| stdout | `--quiet` 時は抑制（hook が `>/dev/null 2>&1` で呼ぶため挙動不変） |
| stderr | 失敗時に `[generate-index]` 接頭辞付き decisive ログ |

## state ownership

| 部品 | 所有する状態 | 備考 |
| --- | --- | --- |
| `generateTopicMap` / `generateKeywordIndex` | 出力文字列の生成（純粋・I/O は read のみ） | byte-identical の正本。変更しない |
| `writeAllIndexesAtomic` | tmp 書き込み / rename commit / tmp 掃除 | atomic 境界の唯一の所有者 |
| `main` | entries 組み立てと進捗ログ | 書き込み詳細は helper に委譲 |
| CLI ガード | exit code 決定 | import 経路では発火しない |

## ロールバック設計

- 変更は `generate-index.js` 1 ファイル + 新規 spec test 1 ファイルに限定。問題時は `git revert <commit>` で 1 コミット粒度で復元可能。
- 出力 byte-identical のため、revert しても index ファイルに差分は生じない。

## テスト戦略（Phase 4 へ渡す設計）

| TC | 観点 | 期待 |
| --- | --- | --- |
| TC-01 | `writeFileAtomic` 正常 | tmp が消え本ファイルに data が書かれる。rename 後 `.tmp` 不在 |
| TC-02 | `writeAllIndexesAtomic` 途中失敗 | 2 件目で throw を注入 → 本ファイル群が変更前のまま / `.tmp` が残らない |
| TC-03 | decisive log | throw 時 Error.message が `[generate-index]` 接頭辞 + skill/index/step を含む |
| TC-04 | extractHeadings ENOENT | ENOENT は空配列で継続（throw しない） |
| TC-05 | extractHeadings その他 I/O エラー | EACCES 等は context 付き throw |
| TC-06 | import 副作用なし | module を import しても main() の書き込みが走らない（CLI ガード） |
| TC-07 | byte-identical（回帰） | `pnpm indexes:rebuild` 実行後 `git diff --quiet -- indexes/` が 0 |

> テスト配置: `scripts/__tests__/generate-index-fail-fast.spec.ts`。skill script は相対 import（`../../.claude/skills/aiworkflow-requirements/scripts/generate-index.js`）。fs 操作は `os.tmpdir()` 配下の `mkdtempSync` で隔離し、`writeFile` を `vi.mock`/`vi.spyOn` で失敗注入する。

## ローカル実行・検証コマンド（CONST_005-5）

```bash
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 回帰 spec test
mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts

# byte-identical 回帰（drift 0 確認）
mise exec -- pnpm indexes:rebuild
git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes && echo "drift 0 OK" || echo "DRIFT!"

# 失敗時非ゼロ exit の手動確認（chmod で書き込み不可にする等）
mise exec -- pnpm indexes:rebuild; echo "exit=$?"
```

## DoD（Definition of Done・CONST_005-6）

- `pnpm typecheck` / `pnpm lint` がパスする
- `vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` で TC-01〜TC-07 が全 PASS
- `pnpm indexes:rebuild` 実行後 `indexes/` に `git diff` 0 件（byte-identical / drift 0）
- 生成失敗を注入したとき exit code が 1、かつ stderr に `[generate-index]` 接頭辞付きで skill/index/step が出る
- pre-push `indexes-drift-guard.sh` / CI `verify-indexes.yml` がローカル回帰でグリーン
- 変更ファイルが `generate-index.js` と新規 spec test の 2 件のみ（`git status` で確認）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | 編集対象 |
| 必須 | scripts/cf-audit-log/feature-export.ts | atomic write 先例（:42-62） |
| 必須 | vitest.config.ts | test glob |
| 必須 | scripts/hooks/indexes-drift-guard.sh | 回帰維持対象 |
| 必須 | .github/workflows/verify-indexes.yml | 回帰維持対象 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計主成果物（関数シグネチャ / 変更ファイル / state ownership / テスト戦略 / DoD） |
| メタ | artifacts.json | Phase 2 状態の更新（completed） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 変更対象ファイル一覧（2 件）と変更種別が明記されている（CONST_005-1）
- [x] 主要関数シグネチャ（`writeFileAtomic` / `writeAllIndexesAtomic` ほか）が定義されている（CONST_005-2）
- [x] 入力・出力・副作用が定義されている（CONST_005-3）
- [x] テスト戦略 TC-01〜TC-07 が定義されている（CONST_005-4）
- [x] ローカル実行・検証コマンドが記載されている（CONST_005-5）
- [x] DoD が明記されている（CONST_005-6）
- [x] byte-identical 維持方針が設計に組み込まれている

## タスク100%実行確認【必須】

- 設計タスクが全て completed
- outputs/phase-02/main.md が配置済み
- artifacts.json の `phases[1].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項: 関数シグネチャ / 変更差分方針 / テスト戦略 / DoD / byte-identical 不変条件
- ブロック条件: 設計レビューで MAJOR 指摘が残る場合
