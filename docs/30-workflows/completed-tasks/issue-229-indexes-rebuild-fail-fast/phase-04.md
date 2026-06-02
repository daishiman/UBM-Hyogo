# Phase 4: テスト戦略（TDD Red）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（TDD Red） |
| 作成日 | 2026-05-31 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #229（CLOSED のまま参照のみ） |

## 目的

Phase 2 / Phase 3 でレビュー済みの設計（案 A）に対して、**TDD Red 段階の失敗テスト TC-01〜TC-07 を仕様レベルで固定する**。本 Phase はテストの実走ではなく、今回の実装サイクルが `scripts/__tests__/generate-index-fail-fast.spec.ts` を新規作成する際の **対象関数 / 入力 / 期待 / 失敗注入方法 / `describe`/`it` 構造案** の正本を確定することが責務。NON_VISUAL のため screenshot は不要。

> **本 Phase は仕様化のみ**。テスト本体（spec.ts）は作成しない。実テストの作成・実走は今回の実装サイクル（Phase 5 ランブック / Phase 11 smoke）で行う。

## 前提（テスト可能化の依存）

TC-01〜TC-06 は **CLI 実行ガード（`import.meta.url` 判定）+ 純粋関数 export 化**（Phase 2 D-4）が実装されていることを前提とする。これが無いと skill script を import した瞬間に `main()` が走り、テストが index ファイルを書き換えてしまう（TC-06 の検証対象そのもの）。よって実装サイクルでは CLI ガード + export を **最初に**入れてから各 TC を Green 化する。

## テスト配置・隔離方針

| 項目 | 値 |
| --- | --- |
| テストファイル | `scripts/__tests__/generate-index-fail-fast.spec.ts`（不変条件 #8: `.spec.ts` のみ） |
| 自動発見 | vitest root glob `scripts/**/*.spec.ts` で CI 実行対象。`.claude/skills/**` は glob 外のため不可 |
| import 対象 | `../../.claude/skills/aiworkflow-requirements/scripts/generate-index.js`（相対 import の named export） |
| FS 隔離 | `os.tmpdir()` + `mkdtempSync` で per-test の隔離ディレクトリを作り、本物の `indexes/` を触らない |
| 失敗注入 | `vi.spyOn(fs/promises のメソッド)` で `writeFile` / `rename` を一時的に reject させ、fail path を再現 |
| 後始末 | `afterEach` で spy restore + 一時ディレクトリ `rmSync(..., { recursive: true })` |

## 実行タスク

1. TC-01〜TC-07 の対象関数・入力・期待・Red 状態・失敗注入方法を表に落とす（完了条件: 7 件すべてが本 Phase に表化）。
2. CLI 実行ガード + export 化を TC-01〜TC-06 の前提として明記する（完了条件: 前提節に記載）。
3. `describe`/`it` 構造案を提示し、今回の実装サイクルがそのまま骨格に使える形にする（完了条件: 構造案コードブロックが存在）。
4. byte-identical 回帰（TC-07）を `git diff --quiet` ベースで定義する（完了条件: AC-4 と整合）。
5. 実テスト作成・実走を今回サイクルへ委譲する境界を明記する（完了条件: 委譲記述あり）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | テスト戦略 TC-01〜TC-07 / 関数シグネチャの源泉 |
| 必須 | phase-03.md | base case 案 A / MINOR（ENOENT 分岐・tmp 同一 dir） |
| 必須 | vitest.config.ts | test glob（`scripts/**/*.spec.ts`） |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | テスト対象（import 元） |
| 必須 | scripts/cf-audit-log/feature-export.ts | atomic write 先例（tmp→rename） |
| 必須 | CLAUDE.md | 不変条件 #8（`.spec.ts` のみ） |

## スコープ

### 含む

- TC-01〜TC-07 の RED 仕様（対象関数 / 入力 / 期待 / Red 状態 / 失敗注入方法）
- `describe`/`it` 構造案
- FS 隔離・spy 失敗注入の方針
- byte-identical 回帰（TC-07）の定義

### 含まない

- 実 spec.ts ファイルの作成（今回の実装サイクル）
- テストの実走（Phase 11）
- `generate-index.js` の編集

## テスト一覧（TDD Red）

> 凡例: **期待値** = Green 成立条件 / **Red 状態** = 実装前の現状値 / **対応 AC** = 本ワークフロー受入条件番号

### TC-01: `writeFileAtomic` 正常系（tmp→rename）

| 項目 | 内容 |
| --- | --- |
| ID | TC-01 |
| 対象 AC | AC-2 |
| 対象関数 | `writeFileAtomic(targetPath, data)` |
| 入力 | 一時 dir 内の `target.md` + 任意文字列 |
| 期待値 | rename 後 `target.md` に data が書かれている / `target.md.tmp` が存在しない |
| Red 状態 | `writeFileAtomic` が未実装（export されていない・直接 writeFile のまま） |
| 失敗注入方法 | なし（happy path） |

### TC-02: `writeAllIndexesAtomic` 途中失敗で本ファイル不変 + tmp 残らない

| 項目 | 内容 |
| --- | --- |
| ID | TC-02 |
| 対象 AC | AC-2 / AC-1 |
| 対象関数 | `writeAllIndexesAtomic(entries)` |
| 入力 | 既存内容を持つ 2 ファイル分の entries（`[{step,path,data}, {step,path,data}]`） |
| 期待値 | 2 件目の書き込みで throw → 1 件目を含む本ファイル群が変更前のまま / `.tmp` が 1 つも残らない |
| Red 状態 | 逐次 writeFile のため 1 件目だけ更新された不整合が残る |
| 失敗注入方法 | `vi.spyOn(fsp, "writeFile")` を 2 回目の呼び出しで reject（または rename を reject）。`finally` で tmp が unlink されることを検証 |

### TC-03: decisive log フォーマット

| 項目 | 内容 |
| --- | --- |
| ID | TC-03 |
| 対象 AC | AC-3 |
| 対象関数 | `writeAllIndexesAtomic`（throw する Error.message） |
| 入力 | 失敗を注入した entries（step / index-file 名を持つ） |
| 期待値 | throw された Error.message が `[generate-index] aiworkflow-requirements / <index-file> (<step>) 失敗: <message>` 形式に一致（接頭辞 + skill + index-file + step を含む） |
| Red 状態 | top-level catch が `console.error("エラー:", err.message)` のみで step/index 不明 |
| 失敗注入方法 | TC-02 と同じ spy reject。`expect(...).rejects.toThrow(/\[generate-index\].*\(.*\) 失敗:/)` で format を assert |

### TC-04: `extractHeadings` ENOENT で空継続

| 項目 | 内容 |
| --- | --- |
| ID | TC-04 |
| 対象 AC | AC-5 |
| 対象関数 | `extractHeadings(file)` |
| 入力 | 存在しないパス（ENOENT を誘発） |
| 期待値 | throw せず空配列 `[]` を返す（従来挙動の維持） |
| Red 状態 | `catch { return []; }` が全エラーを握り潰す（ENOENT 以外も空継続になる＝AC-1 の穴） |
| 失敗注入方法 | 実在しないファイルパスを渡す。または `vi.spyOn(fsp, "readFile")` を `{ code: "ENOENT" }` で reject |

### TC-05: `extractHeadings` その他 I/O エラーで throw

| 項目 | 内容 |
| --- | --- |
| ID | TC-05 |
| 対象 AC | AC-5 / AC-1 |
| 対象関数 | `extractHeadings(file)` |
| 入力 | EACCES 等 ENOENT 以外の I/O エラーを誘発する状況 |
| 期待値 | context 付き Error（`[generate-index] heading 抽出失敗 (<file>): <message>`）を throw する |
| Red 状態 | silent catch が EACCES も握り潰し空配列で「成功」扱い → exit 0 |
| 失敗注入方法 | `vi.spyOn(fsp, "readFile")` を `{ code: "EACCES" }` で reject。`expect(...).rejects.toThrow(/EACCES\|heading 抽出失敗/)` |

### TC-06: import 副作用なし（CLI ガード）

| 項目 | 内容 |
| --- | --- |
| ID | TC-06 |
| 対象 AC | AC-7（テスト可能化）/ AC-1 |
| 対象関数 | module top-level（CLI 実行ガード） |
| 入力 | spec から module を `import` するだけ |
| 期待値 | import しても `main()` が走らない（index ファイルへの書き込み副作用が発生しない） |
| Red 状態 | top-level `main().catch(...)` が import 時に即実行され、テストが本物の index を書き換える |
| 失敗注入方法 | import 前後で `indexes/` の writeFile が呼ばれていないことを spy で確認。または import 後に named export が定義済みであることを確認しつつ書き込み副作用 0 を assert |

### TC-07: byte-identical 回帰（drift 0）

| 項目 | 内容 |
| --- | --- |
| ID | TC-07 |
| 対象 AC | AC-4 |
| 対象関数 | `pnpm indexes:rebuild`（CLI 経路全体） |
| 入力 | 現状の `references/*.md`（変更なし） |
| 期待値 | 再生成後 `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` が exit 0（出力 byte-identical） |
| Red 状態 | hardening で改行 / JSON シリアライズが変わると drift が出て CI fail |
| 失敗注入方法 | なし（回帰 guard）。spec 内で `generateTopicMap()` / `generateKeywordIndex()` の出力文字列が hardening 前後で不変であることを snapshot 的に固定するか、Phase 11 で CLI 実走 + `git diff` で担保 |

## `describe`/`it` 構造案

```ts
// scripts/__tests__/generate-index-fail-fast.spec.ts（今回の実装サイクルで作成）
describe("generate-index fail-fast", () => {
  describe("writeFileAtomic", () => {
    it("TC-01: tmp→rename で本ファイルに書き、.tmp を残さない", async () => { /* ... */ });
  });
  describe("writeAllIndexesAtomic", () => {
    it("TC-02: 途中失敗で本ファイル群が不変かつ .tmp が残らない", async () => { /* ... */ });
    it("TC-03: throw する Error.message が [generate-index] skill/index (step) 失敗 形式", async () => { /* ... */ });
  });
  describe("extractHeadings", () => {
    it("TC-04: ENOENT は空配列で継続する", async () => { /* ... */ });
    it("TC-05: ENOENT 以外（EACCES 等）は context 付きで throw する", async () => { /* ... */ });
  });
  describe("CLI 実行ガード", () => {
    it("TC-06: module を import しても main() の書き込み副作用が走らない", async () => { /* ... */ });
  });
  describe("byte-identical 回帰", () => {
    it("TC-07: 生成出力が drift 0（git diff --quiet）", async () => { /* ... */ });
  });
});
```

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| AC-1（非ゼロ exit） | TC-02 / TC-03 / TC-05 / TC-06 の throw 伝播で被覆 |
| AC-2（部分書き込み防止） | TC-01（正常 commit）+ TC-02（途中失敗で不変 + tmp 掃除）で被覆 |
| AC-3（decisive log） | TC-03 で format 文字列を逐語 assert |
| AC-5（silent catch 分離） | TC-04（ENOENT 空継続）+ TC-05（その他 throw）の両分岐で被覆 |
| AC-7（テスト可能化 / 回帰 spec） | TC-06（CLI ガード）+ TC-01〜TC-05 の存在自体で被覆 |
| AC-4（byte-identical） | TC-07 で `git diff --quiet` 回帰 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | TC-01〜TC-07 一覧 / 対象関数 / 失敗注入 / 構造案 / カバレッジ目標 |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] TC-01〜TC-07 が本 Phase と `outputs/phase-04/main.md` に表化されている
- [ ] 各 TC に ID / 対象 AC / 対象関数 / 入力 / 期待値 / Red 状態 / 失敗注入方法が記述されている
- [ ] CLI 実行ガード + export 化が TC-01〜TC-06 の前提として明記されている
- [ ] FS 隔離（`os.tmpdir()` + `mkdtempSync`）と spy 失敗注入（`vi.spyOn(fs)`）の方針が記述されている
- [ ] `describe`/`it` 構造案が提示されている
- [ ] byte-identical 回帰（TC-07）が `git diff --quiet` ベースで定義されている
- [ ] 実 spec.ts 作成・実走を今回の実装サイクルに委ねる旨が明示されている

## タスク100%実行確認【必須】

- 全実行タスク（5 件）が `completed`
- 成果物 `outputs/phase-04/main.md` が配置済み
- TC-01〜TC-07 が AC-1〜AC-8 の少なくとも 1 つに紐づく
- artifacts.json の `phases[3].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - TC-01〜TC-07 を Phase 5 実装ステップの Green 条件として参照
  - CLI ガード + export 化を最初に実装する順序依存
  - FS 隔離 / spy 失敗注入の方針
  - byte-identical（TC-07）は Phase 11 で CLI 実走 + `git diff` で最終担保
- ブロック条件:
  - TC-01〜TC-07 のいずれかに対象関数 / 期待値 / 失敗注入方法が欠けている
  - テスト配置が `scripts/__tests__/`（root vitest glob）でない
