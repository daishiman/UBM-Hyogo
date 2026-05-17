# Phase 3: ADR 草案

ADR 草案は Phase 8 で `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md`
として正本コミットする。草案実体はその正本ファイルと同一内容のため、本ファイルは草案 → 正本の対応表のみを記録する。

| 項目 | 値 |
| --- | --- |
| 草案 → 正本 | `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` |
| Status | Accepted (2026-05-16) |
| Decision | `member_tags.assigned_via_queue_id` 列を追加しない |
| Alternatives | 案 A（列追加）/ 案 C（仕様文書を `tag_code` 表記に戻して放置） |
| Re-evaluation triggers | (a) 監査 UI 1 クエリ要件 / (b) audit retention 短縮 / (c) D1 read 性能問題 |
| References | 原典 / 親 07a / Issue #296 / 現行 schema / queue trace 実装 / D1 schema 正本 / DB 実装 SSOT |

## ADR セクション 7 種

- Status / Context / Decision / Consequences / Alternatives considered / Re-evaluation triggers / References

すべて正本ファイルに含まれる。Phase 3 → Phase 8 の単一ソース化のため、草案を本ファイルに重複コピーしない。
