# Phase 1 成果物: 要件定義

## 背景

`pnpm indexes:rebuild`（= `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`）は、skill の references/ から `indexes/topic-map.md` と `indexes/keywords.json` を再生成する。pre-push hook（`scripts/hooks/indexes-drift-guard.sh`）・CI（`.github/workflows/verify-indexes.yml`）・PR pre-flight（`scripts/verify-pr-ready.sh`）がこの再生成の exit code と `git diff` に依存して drift を検出する。

issue #229（skill-ledger T-6 U-5）は「部分失敗時の中断挙動が揃っていない可能性。`set -euo pipefail` 相当を script 層で固定する」を求めている。最新コード調査の結果、issue は**未解決**であり、かつ原文の「複数 skill 棚卸し」前提は現行コードに対して陳腐化していることが判明した。

## 現状コード分析（hardening 対象 4 箇所）

| 箇所 | 現状 | 問題 | 対応 AC |
| --- | --- | --- | --- |
| `generate-index.js:355-358` | `main().catch(err => { console.error("エラー:", err.message); process.exit(1); })` | throw 時 exit 1 だがログが原因特定不能 | AC-1 / AC-3 |
| `generate-index.js:338` | `await writeFile(.../topic-map.md, topicMap)` | 非 atomic・逐次。後段失敗で不整合残存 | AC-2 |
| `generate-index.js:344-347` | `await writeFile(.../keywords.json, JSON.stringify(...))` | 非 atomic。truncate JSON 残存リスク | AC-2 |
| `generate-index.js:175-177` | `} catch { return []; }` | reference read 失敗を握り潰し exit 0 | AC-1 / AC-5 |
| top-level | `main()` が import 時に即実行 | テストから純粋関数を import 不能 | AC-7 |

## scope 再最適化（AC-6）

- `pnpm indexes:rebuild` は **単一 skill 経路**（aiworkflow-requirements のみ）。複数 skill orchestrator は存在しない。
- `task-specification-creator/scripts/generate-index.js` は独自に存在するが `indexes:rebuild` に**未配線**。本タスク scope 外（Phase 12 未タスク候補に記録）。
- よって issue 原文の「各 skill の script 実装差を棚卸し」は、現実の「単一スクリプト `generate-index.js` の fail-fast / atomic / decisive log 強化」へ写像する。

## スコープ

### 含む
- `generate-index.js` の atomic write / decisive log / silent catch 分離 / CLI ガード / export 化
- 回帰 spec test `scripts/__tests__/generate-index-fail-fast.spec.ts`
- 出力 byte-identical（drift 0）の維持

### 含まない
- task-specification-creator/scripts/generate-index.js の hardening
- 複数 skill orchestrator 新設
- lefthook.yml / verify-indexes.yml 編集
- Issue #229 の状態変更（CLOSED のまま）

## 受入条件 AC-1〜AC-8

- AC-1: 生成途中 throw で必ず非ゼロ exit。
- AC-2: atomic write（tmp→rename・全成功後 commit・失敗時 tmp 削除）で部分書き込みを残さない。
- AC-3: `[generate-index] <skill> / <index-file> (<step>) 失敗: <message>` 形式で原因を一意特定。
- AC-4: pre-push / CI / verify-pr-ready の挙動回帰維持 + 出力 byte-identical（drift 0）。
- AC-5: extractHeadings silent catch を ENOENT 空継続 / その他 throw に分離。
- AC-6: scope 再最適化（単一経路 / task-spec-creator 除外）を明記。
- AC-7: 回帰 spec test が atomic / fail-fast / decisive log / ENOENT 分岐を guard。
- AC-8: 4 条件全 PASS。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 実在 3 穴を塞ぎ T-6 ガードが decisive exit を前提にできる |
| 実現性 | PASS | repo 内 atomic write 先例あり・最小差分 |
| 整合性 | PASS | byte-identical で既存整合・不変条件 #5/#8 遵守 |
| 運用性 | PASS | 1 ファイル差分中心で revert 容易 |

## 命名規則

- ESM / async-await 維持。新規 helper は camelCase（`writeFileAtomic` / `writeAllIndexesAtomic`）。
- 出力ファイル名不変。tmp は `<name>.tmp`（同一 `indexes/` dir）。
- テストは `.spec.ts`（不変条件 #8）、配置 `scripts/__tests__/`（root vitest glob 対象）。
- エラーログ接頭辞 `[generate-index]`。
