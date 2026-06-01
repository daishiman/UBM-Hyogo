# 実装ガイド — `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log

> 本タスクは implemented_local_evidence_captured であり、実コードは今回サイクルで実装済み。本ガイドは実装内容と検証観点を説明する。

## Part 1: 中学生にもわかる説明

学校で「みんなの名簿」を 2 枚（クラス名簿 = topic-map.md と、出席番号順の一覧 = keywords.json）作り直す係になったと想像してください。今までのやり方は「まず 1 枚目を書き終えて先生に提出 → そのあと 2 枚目を書き始める」でした。でももし 2 枚目の途中でシャープペンの芯が折れて書けなくなったら、先生の手元には「新しい 1 枚目」と「古いままの 2 枚目」が混ざって残ってしまいます。これがいちばん困る「半端な状態」です。

このタスクでやりたいのは「2 枚とも下書き用のメモ用紙（`.tmp` という名前）に先に全部書いてしまい、両方ちゃんと書けたことを確認してから、はじめて先生に 2 枚いっぺんに差し替える」というやり方への変更です。途中で芯が折れたら、下書きメモはぜんぶ捨てて、先生の手元の古い名簿はそのまま 1 文字も触りません。だから「新しいのと古いのが混ざる」事故が絶対に起きません。これを難しい言葉で「アトミックな書き込み（atomic write）」と呼びます。

さらに 2 つ約束を足します。1 つ目は「失敗したら必ず『失敗した』と大きな声で言う（プログラムの世界では『非ゼロで終了する』）」こと。だまって成功したふりをしないので、後ろで見張っている仕組み（CI や git の hook）がちゃんと気づけます。2 つ目は「どの名簿のどの作業でつまずいたかを、エラーに名前付きで書く」ことです。「エラー」とだけ言われても直せませんが、「クラス名簿の rename で失敗」と書いてあればすぐ直せます。最後に大事なのは「中身は前と 1 文字も変えない」ことで、変えるのは書き方の手順だけ、できあがる名簿の文字は今までと完全に同じにします。

## Part 2: 技術者向け説明

### 変更対象と非変更の境界

編集対象は `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` の 1 ファイルと、新規 `scripts/__tests__/generate-index-fail-fast.spec.ts` のみ。出力 `indexes/topic-map.md` / `indexes/keywords.json` は **byte-identical（drift 0）** を不変条件とする。`generateTopicMap` / `generateKeywordIndex` の出力文字列組み立て（`JSON.stringify(keywordIndex, null, 2)` を含む）は一切変更せず、変えるのは「書き込み経路」「catch ログ」「silent catch 分離」「CLI 実行ガード / export 化」のみとする。

### helper の型と atomic write の原理

`createIndexWritePlan(topicMap, keywordIndex)` が `topic-map.md` / `keywords.json` の出力内容を先に確定し、`writeIndexFilesAtomically(indexesDir, plan, fsOps)` が all-or-nothing の境界を持つ。実装は (1) 全 entry を同一 `indexes/` ディレクトリの `.<basename>.tmp` へ書き、(2) 全 tmp 成功後に順次 `rename` で commit、(3) いずれかで throw したら残存 tmp を削除し、commit 済みファイルは事前に読んだ `previousContent` で復元する。POSIX の `rename(2)` は同一ファイルシステム上で atomic（中間状態が観測されない）であるため、tmp を出力先と同一ディレクトリへ置くことで `EXDEV`（cross-device）を回避する。

### decisive log と silent catch 分離

失敗時は `[generate-index] aiworkflow-requirements / <index-file> <step> 失敗: <message>` 形式の context 付き Error を throw し、top-level の CLI ガード `main().catch` がそれを stderr へ出して `process.exit(1)` する。`extractHeadings` の `catch { return []; }` は `catch (err) { if (err && err.code === "ENOENT") return []; throw withIndexContext(...) }` に分離し、ファイル不在（ENOENT）は従来通り空継続、権限/破損等は context 付きで throw して非ゼロ exit へ伝播する。import 副作用排除のため top-level 実行は `if (import.meta.url === pathToFileURL(process.argv[1] || "").href)` でガードし、helper / generator を named export 化してテストから import 可能にする。さらに skill-local `.claude/skills/aiworkflow-requirements/package.json` に `{ "type": "module" }` を置き、正常系 stderr に Node module-type warning が混入しないようにした。

### byte-identical 維持とテスト

byte-identical は回帰の生命線で、書き込み経路の変更が出力差分を生まないことを `pnpm indexes:rebuild` 後の `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` で確認する。spec test は `os.tmpdir()` 配下を `mkdtemp` で隔離し、`fsOps` 依存注入で tmp write failure / rename failure を注入する。現在の focused spec は 6 tests で、atomic 正常 / tmp write failure / rename failure rollback / ENOENT 継続 / その他 I/O throw / decisive log / write plan byte stability を compact に被覆する。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡 = `outputs/phase-11/manual-test-result.md`（CLI 回帰 smoke: exit 0 + byte-identical drift 0、失敗注入時 exit 1 + `[generate-index]` decisive log）と自動テスト `scripts/__tests__/generate-index-fail-fast.spec.ts`（1 file / 6 tests）。

## 実装との対応（実コード準拠の補足）

Part 2 の prose では設計案の関数名（`writeFileAtomic` / `writeAllIndexesAtomic`）を用いているが、**実コードは依存注入（`fsOps`）でテスト可能な以下の構造を採用した**（設計の superset）:

| 実装関数 | シグネチャ | 役割 |
| --- | --- | --- |
| `createIndexWritePlan` | `(topicMap, keywordIndex) => Array<{fileName, content}>` | 書き込みプラン生成（出力バイトは byte-identical 維持） |
| `writeIndexFilesAtomically` | `(indexesDir, plan, fsOps = {}) => Promise<void>` | all-or-nothing で tmp→rename commit。途中失敗時は tmp 削除 + commit 済みを `previousContent` から復元 |
| `withIndexContext` | `(indexFile, step, error) => Error` | decisive log `[generate-index] <skill> / <indexFile> <step> 失敗: <message>` を生成 |
| `extractHeadings` | `(file) => Promise<string[]>` | ENOENT 空継続 / 他 I/O エラーは `withIndexContext` で throw |

CLI 実行ガードは `import.meta.url === pathToFileURL(process.argv[1]||"").href`。named export は `createIndexWritePlan` / `extractHeadings` / `generateKeywordIndex` / `generateTopicMap` / `main` / `withIndexContext` / `writeIndexFilesAtomically`。tmp ファイル名は `.${basename}.tmp`（先頭ドット・同一 `indexes/` dir）。

## 実走結果（2026-05-31・Node v24.15.0・全 PASS）

- `pnpm typecheck` exit 0 / `pnpm lint` exit 0
- `pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` → 6 tests passed
- AC-4: `pnpm indexes:rebuild` exit 0、rebuild 前後で `topic-map.md` / `keywords.json` の md5 不変（冪等 = byte-identical）
- AC-1 / AC-3: `indexes/` を `chmod 555` で失敗注入 → exit=1、stderr `[generate-index] aiworkflow-requirements / topic-map.md,keywords.json atomic-write 失敗: ... EACCES`、本ファイル md5 不変・`.tmp` 残存 0 件

### 実走で発覚・修正した点

ESM 化した `generate-index.js` に対して skill-local `package.json` が無いと、正常系 `pnpm indexes:rebuild -- --quiet` でも Node の `MODULE_TYPELESS_PACKAGE_JSON` warning が stderr に混入した。成功時 stderr が noisy だと decisive log の観測性が落ちるため、`.claude/skills/aiworkflow-requirements/package.json` に `{ "type": "module" }` を追加して warning-free にした。
