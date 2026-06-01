# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（atomic helper / decisive log / silent catch 分離 / CLI ガード / export 化） |
| 作成日 | 2026-05-31 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系・回帰テスト拡充) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #229（CLOSED のまま参照のみ） |

## 目的

Phase 4 で固定した TC-01〜TC-07 を Green にするための **実装ステップ列** を仕様化する。本 Phase は今回の実装サイクル（人間 / Claude Code）が別サイクルで逐次実行するためのランブックであり、本ワークフロー（spec 整備）は **仕様化までで完了**。実コード適用・コミット作成は本ワークフローでは行わない。各変更点は Before/After の **方針レベル**で記述し、実コードは今回サイクルで実装済み（今回の実装サイクルが実装する）。

> **重要**: 出力 index（`indexes/topic-map.md` / `indexes/keywords.json`）は再生成結果が **byte-identical（drift 0）** であること。変更は「書き込み経路」「catch ログ」「silent catch 分離」「CLI ガード / export」に限定し、出力文字列の組み立ては一切変えない。

## 新規作成 / 修正ファイルパス一覧（必須）

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | 修正 | atomic write helper 追加 / catch ログ decisive 化 / extractHeadings silent catch 分離 / CLI 実行ガード追加 / 純粋関数 export 化 |
| `scripts/__tests__/generate-index-fail-fast.spec.ts` | 新規 | TC-01〜TC-07 の回帰 spec test（vitest root glob `scripts/**/*.spec.ts` で自動発見・CI 実行対象） |

> 上記 2 ファイル **以外は変更しない**。`indexes/topic-map.md` / `indexes/keywords.json` は byte-identical 維持。`lefthook.yml` / `.github/workflows/verify-indexes.yml` / `scripts/verify-pr-ready.sh` は **編集せず**回帰確認のみ。

## 実行タスク

1. CLI 実行ガード + 純粋関数 export 化を最初に入れ、テストから import 可能にする（完了条件: TC-06 が Green / import 副作用 0）。
2. atomic write helper（`writeFileAtomic` / `writeAllIndexesAtomic`）を追加し書き込み経路を all-or-nothing 化する（完了条件: TC-01 / TC-02 が Green）。
3. catch ログを decisive 化する（skill / index-file / step を含む）（完了条件: TC-03 が Green）。
4. `extractHeadings` の silent catch を ENOENT 空継続 / その他 throw に分離する（完了条件: TC-04 / TC-05 が Green）。
5. byte-identical 維持を確認する（完了条件: TC-07 が Green / `git diff --quiet` exit 0）。
6. コミット粒度と rollback 境界を明記する（完了条件: コミット粒度表が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | TC-01〜TC-07（Green 条件） |
| 必須 | phase-02.md | 関数シグネチャ / 設計方針 D-1〜D-5 |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | 修正対象本体 |
| 必須 | scripts/cf-audit-log/feature-export.ts | atomic write 先例（tmp→rename） |
| 必須 | scripts/hooks/indexes-drift-guard.sh | 回帰維持対象（exit code + git diff） |
| 必須 | .github/workflows/verify-indexes.yml | 回帰維持対象（CI gate） |
| 必須 | scripts/verify-pr-ready.sh | 回帰維持対象（PR pre-flight drift gate） |
| 必須 | CLAUDE.md | hook 方針 / 不変条件 #8 |

## 実装手順（5 ステップ）

> 各ステップは Before（現状）/ After（方針）で記述する。**実コードは今回の実装サイクルが書く**。本 Phase は方針の正本。

### Step 1: CLI 実行ガード + 純粋関数 export 化（AC-7 のテスト可能化 / TC-06）

- 対象: `generate-index.js` top-level の `main().catch(...)`（現状 :355 付近）。
- Before: import しただけで top-level `main().catch(...)` が即実行され、テストが本物の index を書き換える。
- After（方針）:
  - `import { pathToFileURL } from "url";` を追加。
  - top-level の `main().catch(...)` を `if (import.meta.url === pathToFileURL(process.argv[1]).href) { main().catch(...) }` で囲み、CLI 実行時のみ発火させる。
  - `writeFileAtomic` / `writeAllIndexesAtomic` / `generateTopicMap` / `generateKeywordIndex` を **named export** 化（本体ロジックは不変）。
- 確認: TC-06（import 副作用 0）が Green。
- コミット粒度: `refactor(generate-index): add CLI guard and export pure functions for testability (#229)`（**コミット 1**）。

### Step 2: atomic write helper（AC-2 / TC-01 / TC-02）

- 対象: `generate-index.js` の `writeFile(topic-map.md)`（現状 :338）/ `writeFile(keywords.json)`（現状 :344）。
- Before: 逐次・非 atomic に `writeFile` を 2 回呼ぶ。後段失敗時に前段だけ更新された不整合 index が残る。
- After（方針）:
  - `import { rename, unlink } from "fs/promises";` を追加。
  - `writeFileAtomic(targetPath, data)`: `<targetPath>.tmp` に書いてから `rename(tmp, targetPath)` で置換（同一 `indexes/` dir 内のため atomic・`EXDEV` 回避）。
  - `writeAllIndexesAtomic(entries)`: (1) 全 entry を `<path>.tmp` に書く（本ファイルは未変更）→ (2) 全 tmp 成功後に順次 rename で commit → (3) いずれかで throw したら `finally` で残存 tmp を全 `unlink`（部分書き込みを残さない）。
  - `main()` は entries（`[{step,path,data}]`）を組み立てて `writeAllIndexesAtomic(entries)` を 1 回呼ぶ形へ。
- 確認: TC-01（正常 tmp→rename）/ TC-02（途中失敗で本ファイル不変 + tmp 掃除）が Green。
- コミット粒度: `fix(generate-index): atomic all-or-nothing index write to prevent partial output (#229)`（**コミット 2**）。

### Step 3: decisive エラーログ（AC-3 / TC-03）

- 対象: `writeAllIndexesAtomic` 内の失敗ハンドリング / top-level catch。
- Before: top-level `console.error("エラー:", err.message)` のみで step / index 不明。
- After（方針）:
  - `writeAllIndexesAtomic` が step 名と対象 file 名を保持し、失敗時に `[generate-index] aiworkflow-requirements / <index-file> (<step>) 失敗: <message>` を含む Error を throw。
  - top-level catch は `[generate-index]` 接頭辞付きで stderr 出力し `process.exit(1)`（既存 exit 1 を維持）。
- 確認: TC-03（format 逐語一致）が Green。
- コミット粒度: Step 2 と同一コミットに含めてよい（atomic と decisive log は一体）。

### Step 4: extractHeadings silent catch 分離（AC-5 / TC-04 / TC-05）

- 対象: `generate-index.js` の `extractHeadings`（現状 :175 `catch { return []; }`）。
- Before: `catch { return []; }` が全 I/O エラーを握り潰す。破損ファイルでも空 heading で「成功」扱い。
- After（方針）: `catch (err) { if (err && err.code === "ENOENT") return []; throw new Error(`[generate-index] heading 抽出失敗 (${file}): ${err.message}`); }`。ENOENT は従来通り空継続、その他（EACCES / 破損）は context 付き throw で非ゼロ exit へ伝播。
- 確認: TC-04（ENOENT 空継続）/ TC-05（その他 throw）が Green。
- コミット粒度: `fix(generate-index): separate ENOENT skip from other I/O throw in extractHeadings (#229)`（**コミット 3**）。

### Step 5: 回帰 spec test + byte-identical 確認（AC-4 / AC-7 / TC-07）

- 対象: 新規 `scripts/__tests__/generate-index-fail-fast.spec.ts`。
- 方針: Phase 4 の `describe`/`it` 構造案に従い TC-01〜TC-07 を実装。`os.tmpdir()` + `mkdtempSync` で隔離、`vi.spyOn(fs)` で失敗注入。
- byte-identical 確認: `pnpm indexes:rebuild` 実行後 `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` が exit 0。
- 確認: TC-01〜TC-07 全 PASS。
- コミット粒度: `test(generate-index): add fail-fast / atomic / decisive log regression spec (#229)`（**コミット 4**）。

## コミット粒度

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `refactor(generate-index): add CLI guard and export pure functions for testability (#229)` | CLI ガード + export 化 | import 副作用 0 / 本体ロジック不変 |
| 2 | `fix(generate-index): atomic all-or-nothing index write to prevent partial output (#229)` | atomic helper + decisive log | tmp→rename / 全成功後 commit / 失敗時 tmp 掃除 / format |
| 3 | `fix(generate-index): separate ENOENT skip from other I/O throw in extractHeadings (#229)` | silent catch 分離 | ENOENT 空継続 / その他 throw |
| 4 | `test(generate-index): add fail-fast / atomic / decisive log regression spec (#229)` | 新規 spec test | TC-01〜TC-07 / byte-identical |

> Step 2 と Step 3 は一体のため同一コミットに含めてよい。問題時は `git revert <commit>` で 1 コミット粒度で復元可能。byte-identical のため revert しても index に差分は生じない。

## ローカル実行・検証コマンド（実装担当者向け）

```bash
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 回帰 spec test
mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts

# byte-identical 回帰（drift 0 確認）
mise exec -- pnpm indexes:rebuild
git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes && echo "drift 0 OK" || echo "DRIFT!"

# 失敗時非ゼロ exit の手動確認
mise exec -- pnpm indexes:rebuild; echo "exit=$?"
```

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 実装ランブック（変更ファイル一覧 / Step 1〜5 Before-After / コミット粒度） |
| 別サイクル成果（参考） | generate-index.js diff / spec test | 本ワークフローでは生成しない |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 新規作成 / 修正ファイルパス一覧（2 件）が明記されている
- [ ] Step 1〜5 が Before/After 方針で記述されている
- [ ] CLI ガード + export 化を最初に行う順序依存が明記されている
- [ ] atomic helper / decisive log / silent catch 分離の各方針が記述されている
- [ ] byte-identical 維持手順（`git diff --quiet`）が記述されている
- [ ] コミット粒度と rollback 境界が明記されている
- [ ] 本ワークフローでは実コミットを作成しない旨が明示されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 成果物 `outputs/phase-05/main.md` が配置済み
- 変更ファイルが 2 件（generate-index.js / 新規 spec）に限定されている
- artifacts.json の `phases[4].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系・回帰テスト拡充)
- 引き継ぎ事項:
  - atomic helper の tmp 掃除（`finally` unlink）が Phase 6 の fail path（rename 失敗 / EACCES）の前提
  - decisive log format を異常系メッセージ assert の基準に再利用
  - byte-identical は Phase 11 で CLI 実走 + `git diff` 最終担保
- ブロック条件:
  - 変更ファイルが 2 件を超える
  - 出力文字列の組み立てを変更して byte-identical が崩れる設計が残っている
