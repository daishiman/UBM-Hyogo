# Phase 8: before-after.md

日付: 2026-04-28

## 1. ADR 本文の用語統一チェック

| 観点 | Before（点検前の懸念） | After（採用） |
| --- | --- | --- |
| ツール名表記 | "Lefthook" / "lefthook" の混在 | 全て小文字 `lefthook` で統一 |
| husky 表記 | "Husky" / "husky" | 小文字 `husky` で統一 |
| 「不採用」「却下」 | 用語混在の可能性 | 「不採用」で統一 |
| Status 値 | "ACCEPTED" / "Accepted" | `Accepted`（先頭大文字 + 小文字） |

## 2. References の網羅性

| 想定参照先 | 含めた | 備考 |
| --- | --- | --- |
| 派生元 phase-2 design.md | YES | 相対リンク |
| 派生元 phase-3 review.md | YES | 相対リンク |
| 派生元 phase-12 unassigned-task-detection.md | YES | B-2 が ADR 化要請の起点 |
| `lefthook.yml` | YES | |
| `doc/00-getting-started-manual/lefthook-operations.md` | YES | |
| `CLAUDE.md` | YES | |
| 関連未タスク（verify-indexes-up-to-date-ci） | YES | 相対パス記載 |

## 3. 冗長性の削減

ADR 本文は約 130 行。重複は確認できず削減はゼロ。Decision の lane 表は単独可読性の担保上必須のため残す。

## 4. 結論

実質的な書き換えなし。ADR と README は Phase 5 runbook 通りの構成で品質保証へ進める。
