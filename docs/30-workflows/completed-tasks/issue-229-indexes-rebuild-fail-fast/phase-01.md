# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-31 |
| Wave | 0（tooling / infrastructure governance） |
| 実行種別 | serial（単一スクリプト hardening + 回帰 spec test） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

issue #229「`pnpm indexes:rebuild` の非ゼロ exit 保証」を、最新コードの実態に合わせて要件化する。現行 `pnpm indexes:rebuild` は `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` の単一スクリプト経路であり、(1) 非 atomic な逐次 `writeFile` による部分書き込みリスク、(2) どの index で失敗したか特定できないエラーログ、(3) `extractHeadings` の silent catch という 3 つの穴を抱える。本 Phase ではこれらを fail-fast / atomic write / decisive log の要件 AC-1〜AC-8 へ落とし込み、出力 byte-identical（drift 0）の不変条件と命名規則を固定する。本ワークフローは仕様書整備に閉じ、実コード変更は今回の実装サイクル（03.実装.md）で行う前提を固定する。

## 真の論点 (true issue)

- 本タスクの本質は「index 生成が途中失敗したときに、壊れた中間状態を tracked file に commit させない」こと。pre-push hook / CI は `pnpm indexes:rebuild` の exit code と `git diff` に依存しているが、生成器が部分書き込みを残すと「exit は 1 でも index は半端に更新済み」という決定不能な状態が起こりうる。
- 副次論点: (1) atomic write（tmp→rename）の導入、(2) 失敗ログの skill / index / step 特定、(3) `extractHeadings` silent catch の ENOENT/その他分離、(4) import 時に `main()` を走らせない CLI 実行ガード（テスト可能化）、(5) 出力 byte-identical の維持（drift 0）。
- **scope 再最適化**: issue 原文の「各 skill の script 実装差を棚卸し」は、現行 `indexes:rebuild` が単一経路であるため前提が陳腐化している。複数 skill orchestrator を新設するのは over-scope。task-specification-creator/scripts/generate-index.js は `indexes:rebuild` に未配線のため scope 外（未タスク候補として記録）。

## 現状コード分析（hardening 対象）

| 箇所 | 現状 | 問題 |
| --- | --- | --- |
| `generate-index.js:355-358` | `main().catch(err => { console.error("エラー:", err.message); process.exit(1); })` | throw 時は exit 1（AC-1 概ね満たす）だが、ログが `err.message` のみで step/index 不明（AC-3 未達） |
| `generate-index.js:338` | `await writeFile(join(INDEXES_DIR, "topic-map.md"), topicMap)` | 非 atomic。直後の keywords.json 失敗時に topic-map.md だけ更新された不整合が残る（AC-2 未達） |
| `generate-index.js:344-347` | `await writeFile(join(INDEXES_DIR, "keywords.json"), JSON.stringify(keywordIndex, null, 2))` | 非 atomic。書き込み途中の I/O エラーで truncate された JSON が残る（AC-2 未達） |
| `generate-index.js:175-177` | `} catch { return []; }`（extractHeadings） | reference file の read 失敗を全て握り潰す。破損ファイルでも空 heading で「成功」扱い → exit 0（AC-1/AC-5 の穴） |
| top-level | `main().catch(...)` が import 時に即実行 | named export を import するテストが副作用で main を走らせてしまう（テスト不能） |

## 価値とコスト

- 価値: `pnpm indexes:rebuild` の失敗が「壊れた index を commit しない・どこで失敗したか即わかる・必ず非ゼロ exit」になり、pre-push hook / CI の T-6 ガードが decisive な前提に立てる。skill ledger の merge-conflict 0 化ループの安全網が完成する。
- コスト: `generate-index.js` への atomic write helper（tmp→rename）追加 + catch のログ強化 + silent catch 分離 + CLI 実行ガード + 純粋関数の export 化（合計十数〜数十行）。新規 spec test 1 本。運用コスト追加なし。
- 機会コスト: 複数 skill orchestrator 新設（案 C）と比べ over-scope を避けつつ、生成器の resilience は確実に上がる。byte-identical 維持で既存 CI への副作用ゼロ。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 部分書き込み・決定不能 exit・原因不明ログという 3 つの実在する穴を塞ぐ。pre-push/CI の T-6 ガードが信頼できる exit code を前提にできる |
| 実現性 | PASS | Node fs/promises の `rename` による atomic write は repo 内に先例あり（`scripts/cf-audit-log/feature-export.ts:42-62`）。export 化 + CLI ガードは数行。byte-identical は出力文字列を不変にすれば自明 |
| 整合性 | PASS | 不変条件 #5（D1 境界）非接触。#8（`.spec.ts` のみ）を新規 test で厳守。出力 byte-identical で既存 index / CI / hook と整合 |
| 運用性 | PASS | pre-push `indexes-drift-guard.sh` / CI `verify-indexes.yml` / `verify-pr-ready.sh` の挙動を回帰維持。ロールバックは generate-index.js 差分の `git revert` で 1 コミット粒度 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| スクリプト言語 | `generate-index.js` | ESM（`import ... from`） / async/await。CommonJS 化しない |
| 出力ファイル名 | `indexes/topic-map.md` / `indexes/keywords.json` | 不変。tmp は同一ディレクトリに `<name>.tmp` |
| 関数命名 | `generateTopicMap` / `generateKeywordIndex` / `categorizeFiles` / `extractHeadings` | camelCase。新規 helper も camelCase（例: `writeFileAtomic`） |
| テストファイル | 新規 spec test | 不変条件 #8 で `*.spec.ts` のみ。配置は vitest root glob `scripts/**/*.spec.ts` |
| テスト配置 | 既存 skill script テスト | `.claude/skills/**` は root vitest glob 外。CI 実行されるよう `scripts/__tests__/` に置く |
| ログ接頭辞 | 新規エラーログ | `[generate-index]` 接頭辞で grep 可能にする |

## 実行タスク

1. 起点 spec（`task-skill-ledger-t6-indexes-rebuild-fail-fast.md`）の AC-1〜AC-4 を最新コードへ写像し、本ワークフローの AC-1〜AC-8 へ拡張する（完了条件: AC が `index.md` と一致）。
2. 「issue #229 が他タスクで解決済みか」の調査結論を `index.md` 調査結論テーブルに固定する（完了条件: 未解決 + scope 再最適化が明記、AC-6）。
3. hardening 対象 4 箇所（:338 / :344 / :175 / top-level）を行番号付きで列挙する（完了条件: 現状コード分析テーブルが本 Phase に存在）。
4. 出力 byte-identical（drift 0）を不変条件として固定する（完了条件: AC-4 として記録）。
5. テストファイル配置を `scripts/__tests__/generate-index-fail-fast.spec.ts`（root vitest glob）に決定し、不変条件 #8 を確認する（完了条件: AC-7 / 命名規則テーブルと一致）。
6. タスク種別を `implementation` / `implementation_mode: new` / `visualEvidence: NON_VISUAL` / `scope: tooling` で固定する（完了条件: `artifacts.json.metadata` と一致）。
7. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
8. スコープ「本ワークフローは仕様書整備に閉じ、実コード変更は今回の実装サイクルで行う」を固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | hardening 対象本体 |
| 必須 | scripts/hooks/indexes-drift-guard.sh | pre-push T-6 ガード（exit code + git diff） |
| 必須 | .github/workflows/verify-indexes.yml | CI verify-indexes-up-to-date |
| 必須 | scripts/verify-pr-ready.sh | PR pre-flight drift gate |
| 必須 | scripts/cf-audit-log/feature-export.ts | atomic write 先例（:42-62） |
| 必須 | vitest.config.ts | test glob（`scripts/**/*.spec.ts`） |
| 必須 | docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/task-skill-ledger-t6-indexes-rebuild-fail-fast.md | 起点 spec |
| 必須 | CLAUDE.md | hook 方針 / 不変条件 #8 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備 + Phase 1〜3 成果物本体
- AC-1〜AC-8 の `index.md` との同期
- hardening 対象 4 箇所の行番号付き列挙
- 出力 byte-identical 不変条件の固定
- テストファイル配置（`scripts/__tests__/`）の決定

### 含まない

- 実 `generate-index.js` の編集（今回の実装サイクル）
- task-specification-creator/scripts/generate-index.js の hardening（scope 外・未タスク候補）
- 複数 skill orchestrator の新設（over-scope）
- lefthook.yml / verify-indexes.yml の編集
- UI / API / D1 / Cloudflare Secret の変更
- Issue #229 の状態変更（CLOSED のまま）

## 実行手順

### ステップ 1: 起点 spec 写像と AC 拡張

- `task-skill-ledger-t6-indexes-rebuild-fail-fast.md` の AC-1〜AC-4 を最新コードへ写像し、AC-5（silent catch 分離）・AC-6（scope 再最適化）・AC-7（spec test）・AC-8（4 条件）を追加する。

### ステップ 2: 調査結論の固定

- 「issue #229 は他タスクで未解決」「単一 skill 経路」「task-spec-creator は scope 外」を `index.md` 調査結論に固定する。

### ステップ 3: hardening 対象の特定

- :338 / :344 / :175 / top-level を行番号付きで列挙し、Phase 2 設計の入力にする。

### ステップ 4: byte-identical 不変条件

- 出力文字列・JSON シリアライズ（`JSON.stringify(..., null, 2)`）を不変とし、書き込み経路のみ atomic 化する方針を固定する。

### ステップ 5: テスト配置決定

- root vitest glob を確認し、`scripts/__tests__/generate-index-fail-fast.spec.ts` に決定（`.claude/skills/**` は glob 外で CI 非実行のため不採用）。

### ステップ 6: 4 条件評価のロック

- 4 条件すべてを PASS で確定する。MAJOR があれば Phase 2 へ進めない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | hardening 対象 4 箇所・関数 export 化・atomic helper・テスト戦略の設計入力 |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-8 をテスト戦略のトレース対象に渡す |
| Phase 5 | 実装ランブック（変更ファイル一覧 + 差分方針）の起点 |
| Phase 7 | AC matrix の左軸として AC-1〜AC-8 を使用 |
| Phase 11 | CLI 回帰 smoke（`pnpm indexes:rebuild` の exit 0 + git diff 0）の基準として AC-4 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 境界に触れない。
- 不変条件 #8: 新規 test は `.spec.ts` のみ。
- byte-identical: hardening で index 内容を変えない（drift 0）。
- decisive exit: pre-push/CI が exit code を前提にできる。
- テスト可能化: CLI 実行ガードで import 副作用を排除。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 起点 spec 写像と AC-1〜AC-8 確定 | 1 | completed | index.md と一致 |
| 2 | 調査結論（未解決 / 単一経路 / scope 外）固定 | 1 | completed | AC-6 |
| 3 | hardening 対象 4 箇所の列挙 | 1 | completed | 行番号付き |
| 4 | byte-identical 不変条件の固定 | 1 | completed | AC-4 |
| 5 | テスト配置決定 | 1 | completed | scripts/__tests__/ |
| 6 | タスク種別 / scope / visualEvidence 固定 | 1 | completed | artifacts.json と一致 |
| 7 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 8 | スコープ「仕様書整備に閉じる」固定 | 1 | completed | 含む / 含まない明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 現状コード分析 / スコープ / AC-1〜AC-8 / 4 条件評価 / 命名規則） |
| メタ | artifacts.json | Phase 1 状態の更新（completed） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「途中失敗時に壊れた中間状態を commit させない」として再定義されている
- [x] 現状コード分析テーブルに hardening 対象 4 箇所が行番号付きで列挙されている
- [x] 4 条件評価が全 PASS で確定している
- [x] AC-1〜AC-8 が `index.md` と完全一致している
- [x] scope 再最適化（単一経路 / task-spec-creator scope 外）が明記されている（AC-6）
- [x] テストファイル配置が `scripts/__tests__/generate-index-fail-fast.spec.ts` に決定されている
- [x] タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: tooling` が固定されている
- [x] スコープ「本ワークフローは仕様書整備に閉じる」が明記されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（import 時 main 実行 / rename atomicity / byte-identical 維持）が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - hardening 対象 4 箇所（:338 / :344 / :175 / top-level）
  - atomic write helper（tmp→rename）と全 stage 成功後 commit の方針
  - decisive log フォーマット（`[generate-index] <skill> / <index> <step> 失敗: <message>`）
  - CLI 実行ガード + 純粋関数 export 化（テスト可能化）
  - 出力 byte-identical（drift 0）の不変条件
  - テスト配置 `scripts/__tests__/generate-index-fail-fast.spec.ts`
  - 4 条件評価（全 PASS）の根拠
- ブロック条件:
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-8 が index.md と乖離
