# Unassigned Task Detection — issue-1103

- 区分: 実装仕様書（NON_VISUAL / status: implemented_local_evidence_captured）
- 判定: **新規未タスク（current）0 件**

---

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| current（今回起票すべき新規） | **0 件**（単一ファイル重複除去で完結・先送りなし / CONST_007） |
| baseline（候補だが本 wave では未起票） | parallel-01 重複再発防止の専用 CI guard（後述・MINOR・機械的価値が低く未起票） |

## 検出ソース表

| 検出ソース | 検出結果 | 未タスク化 |
| --- | --- | --- |
| 元タスク仕様書スコープ外項目 | 親タスク `sidebar-footer-pinning-and-account-popover-ux` の Phase 8 Task 8-1 が「整合のみ」とし物理統合を本 follow-up へ分離。本タスクがその統合を担い完結。スコープ外残件なし | 0 件 |
| Phase 3 / Phase 10 MINOR 指摘 | 重複ブロック削除範囲内で吸収。残る独立タスクなし（baseline 候補 1 件は下記） | 0 件（current） |
| Phase 11 発見 | byte 一致 + cascade 文脈同一を確認しただけで、新規派生課題の発見なし | 0 件 |
| コードコメント TODO / FIXME | `globals.css` 内に新規 TODO / FIXME なし | 0 件 |
| `describe.skip` / テスト skip | 該当なし（本タスクは test 追加なし・既存 token gate のみ） | 0 件 |

## baseline 候補（MINOR・未起票）

- **候補**: 「parallel-01 P1-1〜P1-5 ブロックの重複再発を機械検知する専用 CI guard」。今回のような byte 一致重複ブロックが再混入した場合に CI で fail させる仕組み。
- **未起票の理由**: 機械的価値が低い。現状は `grep -c 'data-shell="sidebar"' apps/web/src/styles/globals.css` の手動確認（AC-1）で十分に検知でき、専用 gate を新設するコスト（保守対象の追加・false positive リスク）が再発リスク（単発の構造的重複・本タスクで解消済み）を上回る。よって baseline 欄に記録し、**新規 Issue / spec は作成しない**。

## 関連タスク差分確認（FB-CANCEL-004-2）

| 関連タスク | 概要 | 本タスクとの重複 |
| --- | --- | --- |
| `sidebar-footer-pinning-and-account-popover-ux-followup-002-globals-css-sidebar-block-consolidation`（消費元未タスク） | globals.css sidebar ブロック統合（= 本タスク） | **consumed**（本 workflow が昇格・新規起票不要） |
| 親タスク `sidebar-footer-pinning-and-account-popover-ux` | Phase 8 Task 8-1 で整合のみ実施・統合は本 follow-up へ分離 | 重複なし（本タスクが分離先・統合担当） |

→ 親タスク・消費元未タスクとの重複起票の懸念なし。

## 判定根拠（新規未タスク 0 件）

1. **消費元未タスクは本 workflow が consume 済み** → 再起票しない。
2. 単一ファイル `globals.css` の後発重複ブロック（1774-1904）削除のみで完結し、先送り項目（別 PR / バックログ / Phase 2）は **なし**（CONST_007）。
3. baseline 候補（再発防止 CI guard）は機械的価値が低く、手動 grep 確認で足りるため未起票（baseline 欄に記録のみ）。
4. コードコメント TODO / テスト skip 由来の検出は 0 件。

→ **新規未タスク（current）0 件**。新規 Issue / spec は作成しない。
