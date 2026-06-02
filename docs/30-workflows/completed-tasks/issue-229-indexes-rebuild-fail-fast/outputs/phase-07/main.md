# Phase 7 成果物: AC / カバレッジマトリクス

## AC × 被覆 概要

| AC | 内容 | 主たる被覆 |
| --- | --- | --- |
| AC-1 | 生成途中 throw で非ゼロ exit | TC-02/03/05/06 + TC-F1〜F4 |
| AC-2 | atomic write（tmp→rename・全成功後 commit・失敗時 tmp 削除） | TC-01/02 + TC-F1/F2/F4 |
| AC-3 | decisive log（skill/index-file/step） | TC-03 + TC-F2 |
| AC-4 | 回帰維持 + byte-identical | TC-07 + TC-F5 |
| AC-5 | extractHeadings ENOENT 空継続 / その他 throw | TC-04/05 + TC-F3 |
| AC-6 | scope 再最適化（単一経路・task-spec-creator 除外） | index.md 調査結論（文書） |
| AC-7 | 回帰 spec test | TC-01〜07 + TC-F1〜F5 |
| AC-8 | 4 条件全 PASS | Phase 1/3/10（review gate） |

## AC × T 双方向対応表

| AC \ T | 01 | 02 | 03 | 04 | 05 | 06 | 07 | F1 | F2 | F3 | F4 | F5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | - | ◎ | ◎ | - | ◎ | ◎ | - | ◎ | ◎ | ◎ | ◎ | - |
| AC-2 | ◎ | ◎ | - | - | - | - | - | ◎ | ◎ | - | ◎ | - |
| AC-3 | - | - | ◎ | - | - | - | - | - | ◎ | - | - | - |
| AC-4 | - | - | - | - | - | - | ◎ | - | - | - | - | ◎ |
| AC-5 | - | - | - | ◎ | ◎ | - | - | - | - | ◎ | - | - |
| AC-7 | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ |

> AC-6 / AC-8 は文書 / review gate で被覆（テスト対象外）。テスト被覆対象 AC（1-5/7）は全て最低 1 つの ◎ を持つ。

## 変更箇所限定 coverage 目標

| 変更箇所 | line | branch | 被覆 TC |
| --- | --- | --- | --- |
| `writeFileAtomic`（新規） | 100% | 100% | TC-01 / TC-F1 / TC-F2 |
| `writeAllIndexesAtomic`（新規） | 100% | 100% | TC-02 / TC-03 / TC-F1/F2/F4 |
| `extractHeadings` catch 分離（変更） | 変更行 100% | 100%（ENOENT / その他） | TC-04 / TC-05 / TC-F3 |
| CLI 実行ガード（新規） | 変更行 100% | 100%（true / false） | TC-06（false）/ Phase 11 CLI 実走（true） |

> 未変更ロジック（categorizeFiles / topic-map 本文組み立て等）は coverage 対象外。

## 運用ルール

- AC 単位の被覆を要求。「全テスト一律 PASS」表記は禁止。
- coverage 目標は変更箇所に限定し、未変更ロジックで薄めない。

## 委譲境界

`ac-coverage-report.md` の数値記入は今回の実装サイクル（任意）。本 Phase は計画のみ。
