# Phase 2 成果物: 設計

## 変更対象ファイル（CONST_005-1）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | 編集 | atomic write helper / decisive log / silent catch 分離 / CLI ガード / export 化 |
| `scripts/__tests__/generate-index-fail-fast.spec.ts` | 新規 | 回帰 spec test |

その他ファイルは不変。`indexes/topic-map.md` / `indexes/keywords.json` は byte-identical（drift 0）。

## 関数シグネチャ（CONST_005-2）

```js
import { rename, unlink, writeFile } from "fs/promises";
import { pathToFileURL } from "url";

export async function writeFileAtomic(targetPath, data) {
  // tmp = `${targetPath}.tmp`; await writeFile(tmp, data); await rename(tmp, targetPath);
}

export async function writeAllIndexesAtomic(entries /* {step,path,data}[] */) {
  // 1) 全 entry を tmp に書く  2) 全成功後に順次 rename  3) finally で残存 tmp 掃除
  // 失敗時は `[generate-index] aiworkflow-requirements / <index> (<step>) 失敗: <message>` を持つ Error を throw
}

export async function generateTopicMap() { /* 本体不変・export 追加のみ */ }
export async function generateKeywordIndex() { /* 本体不変・export 追加のみ */ }

async function main() { /* entries 組み立て → writeAllIndexesAtomic(entries) */ }

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message.startsWith("[generate-index]") ? err.message : `[generate-index] 失敗: ${err.message}`);
    process.exit(1);
  });
}
```

extractHeadings の silent catch 分離:

```js
} catch (err) {
  if (err && err.code === "ENOENT") return [];
  throw new Error(`[generate-index] heading 抽出失敗 (${file}): ${err.message}`);
}
```

## 入出力・副作用（CONST_005-3）

| 項目 | 内容 |
| --- | --- |
| 入力 | references/*.md / `--quiet` フラグ |
| 出力 | indexes/topic-map.md / indexes/keywords.json（byte-identical） |
| 副作用 | indexes/*.tmp の一時生成→rename 消滅、失敗時 unlink 掃除。本ファイルへの部分書き込みなし |
| exit | 成功 0 / 失敗 1（decisive） |
| stderr | 失敗時 `[generate-index]` 接頭辞 decisive ログ |

## state ownership

| 部品 | 所有状態 |
| --- | --- |
| generateTopicMap / generateKeywordIndex | 出力文字列生成（byte-identical 正本・不変） |
| writeAllIndexesAtomic | atomic 境界（tmp / rename / 掃除）の唯一所有者 |
| main | entries 組み立てと進捗ログ |
| CLI ガード | exit code 決定（import 経路では非発火） |

## テスト戦略（Phase 4 へ）

TC-01 writeFileAtomic 正常 / TC-02 writeAllIndexesAtomic 途中失敗で本ファイル不変+tmp 残らない / TC-03 decisive log / TC-04 extractHeadings ENOENT 空継続 / TC-05 その他 I/O throw / TC-06 import 副作用なし / TC-07 byte-identical 回帰。配置 `scripts/__tests__/generate-index-fail-fast.spec.ts`、`mkdtempSync` 隔離 + `vi.spyOn` 失敗注入。

## 検証コマンド（CONST_005-5）

```bash
mise exec -- pnpm typecheck && mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts
mise exec -- pnpm indexes:rebuild && git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes && echo "drift 0 OK"
```

## DoD（CONST_005-6）

- typecheck / lint パス
- TC-01〜TC-07 全 PASS
- `pnpm indexes:rebuild` 後 indexes/ に drift 0
- 失敗注入時 exit 1 + `[generate-index]` decisive stderr
- pre-push / CI 回帰グリーン
- 変更ファイルが 2 件のみ

## ロールバック

`generate-index.js` 差分 + 新規 spec test の 2 ファイル限定。`git revert` で 1 コミット復元。byte-identical のため index 差分なし。
