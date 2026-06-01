# Phase 7: AC / カバレッジマトリクス（受入条件 × テスト × 検証コマンド）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC / カバレッジマトリクス（AC-1〜AC-8 のカバレッジ確認） |
| 作成日 | 2026-05-31 |
| 前 Phase | 6 (異常系・回帰テスト拡充) |
| 次 Phase | 8 (DRY 化・リファクタリング) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #229（CLOSED のまま参照のみ） |

## 目的

本ワークフローの AC-1〜AC-8 が、TC-01〜TC-07（Phase 4）+ TC-F1〜TC-F5（Phase 6）+ Phase 5 ランブック / Phase 11 smoke でどのように被覆されるかを **AC × テスト × 検証コマンド × 担当成果物** のマトリクスとして固定する。あわせて `generate-index.js` の **変更箇所に限定した line / branch coverage 目標** を明記する。「全テスト一律 PASS」のような薄いゴールは禁止。Phase 9 / Phase 10 で本マトリクスを GO/NO-GO の根拠として再利用する。

## 実行タスク

1. AC-1〜AC-8 を TC-01〜TC-07 / TC-F1〜TC-F5 / Phase / 検証コマンド / 担当成果物にマッピングする（完了条件: 全 AC に対応行）。
2. 「全 AC が最低 1 つの T で被覆」「全 T が最低 1 つの AC に紐付く」双方向整合を確認する（完了条件: 双方向対応表に空 AC なし）。
3. 変更箇所限定の line / branch coverage 目標を `generate-index.js` の変更関数に絞って明記する（完了条件: coverage 目標表が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | AC-1〜AC-8 原典 |
| 必須 | phase-04.md | TC-01〜TC-07 |
| 必須 | phase-05.md | Step 1〜5 / コミット粒度 |
| 必須 | phase-06.md | TC-F1〜TC-F5 |
| 参考 | docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/phase-07.md | カバレッジ表フォーマット参照 |

## AC × テスト × 検証コマンド マトリクス

### AC-1: 生成途中 throw で必ず非ゼロ exit

| 項目 | 内容 |
| --- | --- |
| 対応 T | TC-02 / TC-03 / TC-05 / TC-06 / TC-F1 / TC-F2 / TC-F3 / TC-F4 |
| 対応 Phase | Phase 5 Step 1-4 / Phase 6 fail path |
| 検証コマンド | `mise exec -- pnpm indexes:rebuild; echo "exit=$?"`（失敗注入時 1）/ spec の `rejects.toThrow` |
| 期待値 | throw が top-level catch で `process.exit(1)` に伝播する |
| 担当成果物 | generate-index.js（コミット 1-3）/ spec test |

### AC-2: atomic write（tmp→rename・全成功後 commit・失敗時 tmp 削除）で部分書き込みを残さない

| 項目 | 内容 |
| --- | --- |
| 対応 T | TC-01 / TC-02 / TC-F1 / TC-F2 / TC-F4 |
| 対応 Phase | Phase 5 Step 2 / Phase 6 TC-F1/F2/F4 |
| 検証コマンド | spec で本ファイル不変 + `.tmp` 不在を assert |
| 期待値 | 全 tmp 成功後にのみ rename / 途中失敗で本ファイル不変 / tmp 0 |
| 担当成果物 | `writeFileAtomic` / `writeAllIndexesAtomic`（コミット 2） |

### AC-3: decisive log（`[generate-index] <skill> / <index-file> (<step>) 失敗: <message>`）

| 項目 | 内容 |
| --- | --- |
| 対応 T | TC-03 / TC-F2 |
| 対応 Phase | Phase 5 Step 3 / Phase 6 TC-F2 |
| 検証コマンド | spec で `expect(...).rejects.toThrow(/\[generate-index\].* \(.*\) 失敗:/)` |
| 期待値 | skill 名 / index ファイル名 / step を一意特定できる format |
| 担当成果物 | `writeAllIndexesAtomic` の Error message / top-level catch |

### AC-4: 回帰維持（pre-push / CI / verify-pr-ready）+ 出力 byte-identical

| 項目 | 内容 |
| --- | --- |
| 対応 T | TC-07 / TC-F5 |
| 対応 Phase | Phase 5 Step 5 / Phase 11 smoke |
| 検証コマンド | `mise exec -- pnpm indexes:rebuild && git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` |
| 期待値 | exit 0（drift 0）/ `indexes-drift-guard.sh` / `verify-indexes.yml` / `verify-pr-ready.sh` グリーン |
| 担当成果物 | `outputs/phase-11/main.md`（CLI 実走ログ）/ 出力文字列不変の generate-index.js |

### AC-5: extractHeadings の silent catch を ENOENT 空継続 / その他 throw に分離

| 項目 | 内容 |
| --- | --- |
| 対応 T | TC-04 / TC-05 / TC-F3 |
| 対応 Phase | Phase 5 Step 4 / Phase 6 TC-F3 |
| 検証コマンド | spec の `extractHeadings` ENOENT → `[]` / EACCES → `rejects.toThrow` |
| 期待値 | ENOENT は空配列継続 / その他は context 付き throw |
| 担当成果物 | `extractHeadings` の catch 分離（コミット 3） |

### AC-6: scope 再最適化（単一 skill 経路・task-spec-creator 除外）

| 項目 | 内容 |
| --- | --- |
| 対応 T | scope documentation |
| 対応 Phase | Phase 1 / index.md 調査結論 |
| 検証コマンド | `rg -n '単一 skill 経路\|task-specification-creator.*scope 外' docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/index.md` |
| 期待値 | 調査結論テーブルに単一経路 + task-spec-creator scope 外が明記されている |
| 担当成果物 | `index.md` / `outputs/phase-01/main.md` |

### AC-7: 回帰 spec test（atomic / 途中失敗 / decisive log / ENOENT 分岐）

| 項目 | 内容 |
| --- | --- |
| 対応 T | TC-01 / TC-02 / TC-03 / TC-04 / TC-05 / TC-06 / TC-07 / TC-F1〜TC-F5 |
| 対応 Phase | Phase 5 Step 5 / Phase 4 / Phase 6 |
| 検証コマンド | `mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` |
| 期待値 | TC-01〜TC-07 + TC-F1〜TC-F5 全 PASS |
| 担当成果物 | `scripts/__tests__/generate-index-fail-fast.spec.ts`（コミット 4） |

### AC-8: 4 条件全 PASS（価値性 / 実現性 / 整合性 / 運用性）

| 項目 | 内容 |
| --- | --- |
| 対応 T | review gate |
| 対応 Phase | Phase 1 / Phase 3 / Phase 10 |
| 検証コマンド | `rg -n '価値性 \| PASS\|実現性 \| PASS\|整合性 \| PASS\|運用性 \| PASS' docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-01.md docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/phase-03.md` |
| 期待値 | 4 条件すべて PASS |
| 担当成果物 | Phase 1 / Phase 3 / Phase 10 |

## AC × T 双方向対応表

| AC \ T | TC-01 | TC-02 | TC-03 | TC-04 | TC-05 | TC-06 | TC-07 | TC-F1 | TC-F2 | TC-F3 | TC-F4 | TC-F5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | - | ◎ | ◎ | - | ◎ | ◎ | - | ◎ | ◎ | ◎ | ◎ | - |
| AC-2 | ◎ | ◎ | - | - | - | - | - | ◎ | ◎ | - | ◎ | - |
| AC-3 | - | - | ◎ | - | - | - | - | - | ◎ | - | - | - |
| AC-4 | - | - | - | - | - | - | ◎ | - | - | - | - | ◎ |
| AC-5 | - | - | - | ◎ | ◎ | - | - | - | - | ◎ | - | - |
| AC-6 | - | - | - | - | - | - | - | - | - | - | - | - |
| AC-7 | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ |
| AC-8 | - | - | - | - | - | - | - | - | - | - | - | - |

> 凡例: ◎ = 主たる被覆、- = 該当なし。AC-6（scope 文書）/ AC-8（4 条件 gate）はテストではなく文書 / レビュー gate で被覆（上記 AC 別表の検証コマンド参照）。
> **テスト被覆対象の AC（AC-1〜AC-5 / AC-7）はすべて最低 1 つの ◎ を持つこと** がカバレッジ要件 PASS の必要条件。

## 変更箇所限定 coverage 目標（generate-index.js）

> coverage 目標は **本タスクで変更する関数・分岐に限定**する（既存の `categorizeFiles` / topic-map 組み立て本文等の未変更ロジックは対象外）。

| 変更箇所 | line coverage 目標 | branch coverage 目標 | 被覆 TC |
| --- | --- | --- | --- |
| `writeFileAtomic`（新規） | 100% | 100%（成功 / tmp 書き込み or rename 失敗の throw） | TC-01 / TC-F1 / TC-F2 |
| `writeAllIndexesAtomic`（新規） | 100% | 100%（全成功 commit / 途中失敗 finally tmp 掃除 / decisive log throw） | TC-02 / TC-03 / TC-F1 / TC-F2 / TC-F4 |
| `extractHeadings` catch 分離（変更） | 変更行 100% | 100%（ENOENT → `[]` / その他 → throw の 2 分岐） | TC-04 / TC-05 / TC-F3 |
| CLI 実行ガード（新規） | 変更行 100% | 100%（`import.meta.url === argv[1]` の true / false） | TC-06（false 側）/ Phase 11 CLI 実走（true 側） |

> CLI ガードの true 側（実 CLI 実行）は spec から直接被覆しにくいため Phase 11 の `pnpm indexes:rebuild` 実走で担保する。false 側（import 経路）は TC-06 で被覆。

## 「変更ブロック AC 100%」の運用ルール

1. PR の diff（コミット 1〜4）に対して `git diff --stat <base>..HEAD` を取得。
2. AC-1〜AC-8 すべてが上記マトリクスで最低 1 つの被覆（テスト or 文書 / gate）を持つことを確認。
3. 「全テスト一律 PASS」のような薄い表記は **禁止**（AC 単位での被覆を要求）。
4. coverage 目標は変更箇所（新規 helper / catch 分離 / CLI ガード）に限定し、未変更ロジックを薄める言い訳にしない。

## 証跡保存先

| 種別 | パス | 記入タイミング |
| --- | --- | --- |
| AC マトリクス（本仕様） | outputs/phase-07/main.md | 本ワークフロー（spec 作成時 / template） |
| AC カバレッジレポート（実走証跡） | outputs/phase-07/ac-coverage-report.md | 今回の実装サイクルで記入（任意） |
| CLI 回帰 smoke ログ | outputs/phase-11/main.md | Phase 11 で実走 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | AC × T マトリクス / Phase 対応 / 検証コマンド / coverage 目標 |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] AC-1〜AC-8 が本 Phase と `outputs/phase-07/main.md` にマトリクス化されている
- [ ] AC × T 双方向対応表があり、テスト被覆対象 AC（AC-1〜AC-5 / AC-7）が空セルなく被覆されている
- [ ] AC-6 / AC-8 が文書 / gate で被覆される旨が明記されている
- [ ] 変更箇所限定の line / branch coverage 目標が `generate-index.js` の変更関数に絞って記述されている
- [ ] 「全テスト一律 PASS」表記が無い
- [ ] 実走（ac-coverage-report.md 記入）は今回の実装サイクルに委ねる旨が明示されている

## タスク100%実行確認【必須】

- 全実行タスク（3 件）が `completed`
- 成果物 `outputs/phase-07/main.md` が配置済み
- AC-1〜AC-8 すべてに被覆（テスト or 文書 / gate）が紐づく
- artifacts.json の `phases[6].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化・リファクタリング)
- 引き継ぎ事項:
  - AC マトリクスを Phase 9 品質保証 / Phase 10 GO/NO-GO の根拠に再利用
  - TC-F2（rename commit フェーズ途中失敗）の境界明記を Phase 8 へ申し送り
  - 変更箇所限定 coverage 目標を Phase 9 の数値確認の基準に再利用
- ブロック条件:
  - テスト被覆対象 AC のいずれかが空セル（被覆 T 不在）
  - 「全テスト一律 PASS」表記が混入
