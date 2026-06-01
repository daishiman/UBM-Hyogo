# issue-229-indexes-rebuild-fail-fast - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-229-indexes-rebuild-fail-fast |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証（issue #229 / skill-ledger T-6 U-5） |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast |
| 実行種別 | serial（単一スクリプト hardening + 回帰 spec test） |
| 作成日 | 2026-05-31 |
| 担当 | unassigned |
| 状態 | implemented_local_evidence_captured |
| 実装区分 | **実装仕様書**（コード変更を伴う。CONST_004 デフォルト） |
| implementation_mode | new |
| visualEvidence | NON_VISUAL（CLI tooling・UI/UX 変更なし） |
| scope | tooling / infrastructure_governance |
| 優先度 | MEDIUM（GitHub label `priority:medium` / `scale:small`） |
| GitHub Issue | #229（**CLOSED のまま**。再 open・Issue mutation はユーザー指示まで行わない） |
| 起点 | docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-5) / task-skill-ledger-t6-indexes-rebuild-fail-fast.md |

## 調査結論（issue 最適化の根拠）

本タスクは「issue #229 が既に別タスクで解決済みか」を最新コードで調査した上で起こした **実装仕様書** である。調査結果:

| 観点 | 現状コード | 判定 |
| --- | --- | --- |
| `pnpm indexes:rebuild` の実体 | `package.json:54` = `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` の**単一 skill 経路**（複数 skill orchestrator ではない） | issue 原文「各 skill の script 実装差」の前提は陳腐化。現実は単一スクリプト |
| AC-1（部分失敗で非ゼロ exit） | `generate-index.js:355-358` の `main().catch(() => process.exit(1))` で throw 時は exit 1。ただし `extractHeadings` の `catch { return [] }`（:175-177）が reference file 読込エラーを握り潰す | **partial**（throw 系は満たすが silent catch が穴） |
| AC-2（部分書き込みが残らない） | `:338` topic-map.md → `:344` keywords.json を**逐次・非 atomic**に `writeFile`。後段失敗時に前段だけ更新された不整合 index が残る。tmp→rename パターンなし | **未達** |
| AC-3（どの skill / index か特定） | `:356` は `console.error("エラー:", err.message)` のみ。失敗した index/step を特定できない | **未達** |
| AC-4（T-6 hook が前提にできる decisive exit） | `scripts/hooks/indexes-drift-guard.sh:13`（pre-push, `set -euo pipefail`）・`.github/workflows/verify-indexes.yml`・`scripts/verify-pr-ready.sh:37` が exit code + `git diff` で検証。exit code 依存自体は機能 | **partial**（hook 側は依存済。生成器側の decisiveness が AC-1/2/3 不足で揺らぐ） |
| issue #229 以降の関連 commit | 本ワークツリーで `generate-index.js` fail-fast / atomic / decisive log と回帰 spec を実装済み。commit はユーザー指示まで未実行 | **ローカル実装済み** |

> 結論: **issue #229 は他タスクで解決されておらず、対応が必要**。ただし issue 原文の「複数 skill 棚卸し」スコープは現行コードに合わせて再最適化し、**単一スクリプト `generate-index.js` の fail-fast / atomic write / decisive log 強化 + 回帰 spec test** へ写像する。task-specification-creator/scripts/generate-index.js は `pnpm indexes:rebuild` に未配線のため本タスク scope 外（未タスク候補として Phase 12 に記録）。

## 目的

`pnpm indexes:rebuild`（= `generate-index.js`）が、index 生成途中で失敗したときに **(1) 必ず非ゼロ exit し、(2) 破損/部分書き込みファイルを残さず、(3) どの index で失敗したかを一意特定できるログを出す** ことを script 層で保証する。あわせて生成出力が現状と **byte-identical（drift 0・冪等）** であることを回帰テストで固定し、pre-push hook / CI の T-6 ガードが decisive な exit code を前提にできる状態にする。

## スコープ

### 含む

- `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` の hardening:
  - atomic write helper（tmp ファイル → `rename`）を導入し、全 index 生成成功後にのみ commit する
  - 失敗時は書きかけ tmp を必ず削除する（部分ファイルを残さない）
  - 失敗ログに「skill 名 / index ファイル名 / step」を含める decisive なエラーフォーマット
  - `extractHeadings` の silent catch を「ENOENT は空継続 / その他 I/O エラーは throw」に分離
  - import 時に `main()` が走らないよう CLI 実行ガード（`import.meta.url` 判定）を追加し、純粋関数を named export 化してテスト可能にする
- 回帰 spec test `scripts/__tests__/generate-index-fail-fast.spec.ts`（vitest root glob `scripts/**/*.spec.ts` で自動発見・CI 実行対象）
- 出力 byte-identical（冪等）の回帰確認（`pnpm indexes:rebuild` で `git diff` 0 件）
- Phase 1〜13 のタスク仕様書（`phase-NN.md`）と Phase 1〜3 設計成果物（`outputs/phase-0N/main.md`）

### 含まない

- `task-specification-creator/scripts/generate-index.js` の同等 hardening（`indexes:rebuild` に未配線。未タスク候補として記録）
- 複数 skill を横断する rebuild orchestrator の新設（現状単一経路のため不要。over-scope）
- lefthook.yml / `.github/workflows/verify-indexes.yml` の編集（exit code 依存は既に機能。回帰確認のみ）
- index の**内容**改善（キーワード抽出ロジック・トピック分類の改良）
- GitHub Issue #229 の状態変更（**CLOSED のまま**）
- UI / API / D1 / Cloudflare Secret の変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 起点 | skill-ledger-t6-hook-idempotency（T-6 / Issue #161, CLOSED） | U-5 検出元。T-6 hook が AC-4 の decisive exit を前提にする受け皿 |
| 並列 | （なし） | 単一スクリプト hardening で独立 |
| 下流 | （後続なし） | 本タスク完了で `pnpm indexes:rebuild` の fail-fast ループが閉じる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | hardening 対象スクリプト本体 |
| 必須 | scripts/hooks/indexes-drift-guard.sh | pre-push T-6 ガード（exit code + git diff 依存） |
| 必須 | .github/workflows/verify-indexes.yml | CI verify-indexes-up-to-date（exit code + git diff） |
| 必須 | scripts/verify-pr-ready.sh | PR pre-flight の indexes:rebuild drift gate |
| 必須 | scripts/cf-audit-log/feature-export.ts | repo 内の atomic write 先例（`.tmp` → `renameSync`、:42-62） |
| 必須 | vitest.config.ts | test glob（`scripts/**/*.spec.ts`）正本 |
| 必須 | docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/task-skill-ledger-t6-indexes-rebuild-fail-fast.md | 起点 spec（AC-1〜AC-4 原文） |
| 必須 | CLAUDE.md | hook 方針（post-merge 廃止 / 明示 rebuild / CI gate） / 不変条件 #8（`.spec.ts` のみ） |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 テンプレ正本 |
| 参考 | https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath | rename の atomicity（同一 FS 上の atomic 置換） |

## 受入条件 (AC)

- AC-1: `generate-index.js` が index 生成途中で throw した場合に必ず非ゼロ exit する（既存 `main().catch` の exit 1 を維持し、catch 内ログを decisive 化する）。
- AC-2: index 書き込みを atomic 化する。各 index を `<name>.tmp` に書き、**全 index 生成成功後にのみ** `rename` で本ファイルへ commit する。途中失敗時は書きかけ tmp を全て削除し、本ファイル（topic-map.md / keywords.json）に部分書き込みを残さない。
- AC-3: 失敗ログが `[generate-index] <skill> / <index-file> <step> 失敗: <message>` 形式で「どの skill / どの index ファイル / どの step」を一意特定できる。
- AC-4: pre-push `indexes-drift-guard.sh` / CI `verify-indexes.yml` / `verify-pr-ready.sh` が依存する挙動を回帰維持する。success 時 exit 0、失敗時 exit 1、かつ正常系の生成出力が現状と **byte-identical（`git diff` 0 件・冪等）**。
- AC-5: `extractHeadings` の silent catch を分離する。`ENOENT`（ファイル不在）は従来通り空配列で継続、それ以外の I/O エラー（権限・破損等）は context 付きで throw し非ゼロ exit へ伝播する。
- AC-6: スコープ再最適化が `index.md` 調査結論に明記され、`indexes:rebuild` が単一 skill 経路であること・task-specification-creator 側は scope 外であることが記録されている。
- AC-7: 回帰 spec test `scripts/__tests__/generate-index-fail-fast.spec.ts` が、(a) atomic write helper の tmp→rename 成功、(b) 途中失敗で本ファイル不変 + tmp 削除、(c) decisive log フォーマット、(d) ENOENT 継続 / その他 throw の分岐、を vitest で回帰 guard する。
- AC-8: 4 条件（価値性 / 実現性 / 整合性 / 運用性）すべてが Phase 1 / Phase 3 で PASS 確認されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系・回帰テスト拡充 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC / カバレッジマトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化・リファクタリング | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke test（CLI 回帰検証） | phase-11.md | completed | outputs/phase-11/main.md ほか 6 件 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md ほか 6 件 |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 現状コード分析 / スコープ / AC-1〜AC-8 / 4 条件評価 / 命名規則） |
| 設計 | outputs/phase-02/main.md | atomic write helper / fail-fast / decisive log / export 化 / テスト戦略の設計、関数シグネチャ、変更ファイル一覧 |
| レビュー | outputs/phase-03/main.md | 代替案 4 案比較・PASS/MINOR/MAJOR・着手可否ゲート |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Node.js (fs/promises) | atomic write（tmp → rename） | 無料 |
| pnpm | `pnpm indexes:rebuild` 経由の index 再生成 | 無料 |
| vitest | 回帰 spec test（`scripts/**/*.spec.ts`） | 無料 |
| lefthook | pre-push `indexes-drift-guard` の正本配置 | 無料 |
| GitHub Actions | `verify-indexes-up-to-date` CI gate | 無料枠 |
| GitHub | Issue #229 連携（CLOSED のまま参照のみ） | 無料枠 |

## Secrets 一覧

本タスクは Secret を導入しない。CLI スクリプトの hardening と spec test のみで完結する。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは D1 を触らない。違反なし |
| #8 | 新規 test は `*.spec.{ts,tsx}` のみ | 新規 test を `scripts/__tests__/generate-index-fail-fast.spec.ts` とし `.spec.ts` を厳守 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜12 = `completed` / Phase 13 = `pending_user_approval`）
- AC-1〜AC-8 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 本ワークフローは `generate-index.js` hardening + spec test + Phase 11 local evidence まで今回サイクルで完了し、commit / push / PR / Issue mutation のみユーザー承認待ちである

## 苦戦箇所・知見（実装着手時に追記する想定枠）

**1. import 時の top-level `main()` 実行**
現状 `generate-index.js:355` は import しただけで `main()` が走る。テストから純粋関数を import するには CLI 実行ガード（`if (import.meta.url === pathToFileURL(process.argv[1]).href)`）が必須。Phase 2 で named export 化と合わせて設計する。

**2. rename の atomicity は同一ファイルシステム前提**
`fs.rename` は同一 FS 上では atomic だが跨ぐと `EXDEV`。tmp ファイルは出力先 `indexes/` と同一ディレクトリに置くこと（`indexes/topic-map.md.tmp`）で atomicity を担保する。Phase 2 で固定。

**3. byte-identical 維持の罠**
hardening で改行・JSON シリアライズ（`JSON.stringify(..., null, 2)`）を変えると index drift が出て CI fail。出力文字列の組み立ては現状と完全一致させ、書き込み経路のみ atomic 化する。Phase 4/11 で `git diff` 0 件を回帰確認。

## 関連リンク

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/229
- 起点 T-6 ワークフロー: ../completed-tasks/skill-ledger-t6-hook-idempotency/index.md
- 起点 spec: ../completed-tasks/skill-ledger-t6-hook-idempotency/task-skill-ledger-t6-indexes-rebuild-fail-fast.md
- hook 運用正本: ../../../CLAUDE.md / ../../../.claude/skills/aiworkflow-requirements/references/technology-devops-core.md
