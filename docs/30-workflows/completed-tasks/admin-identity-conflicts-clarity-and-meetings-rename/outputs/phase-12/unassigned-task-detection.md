# Phase 12 — unassigned task detection

**[実装区分: 実装 / 状態: implemented_local_evidence_captured]**

本サイクルで生じた gap（`current`）と、設計上分離した既知の将来タスク（`baseline`）を分離記録する。

## current（本サイクルで生じた gap）

**0 件。**

本タスクのスコープ（concern 1-4）は単一 PR（CONST_007）で完結する設計であり、本サイクル内で新たに「完了すると破綻する未処理」は発生しない。日本語化・glossary/Guide 新設・専用 seed はいずれも本サイクルで閉じる。

## baseline（設計上分離した将来タスク）

いずれも「今回サイクルで完了すると破綻する明確な理由（**API/D1 変更を伴う・独立スコープ**）」に該当し、CONST_007 の例外として分離が妥当。Issue 化は **user 判断（PENDING）**。

| id | 概要 | 分離理由 | 出典 |
| --- | --- | --- | --- |
| M-1 | 内部 member_id（TEST-MEM-xx 等）の完全隠蔽（氏名/職業を主表示にし ID を `<details>` 化） | 本タスクはラベル日本語化で一部対応済。完全隠蔽は行 UX の再設計を伴う独立スコープ | [phase-3-design-review.md](../../phase-3-design-review.md) M-1 |
| M-2 | `/admin/meetings` ページ本体（カード/フォーム）の UX 改善 | 本タスクはサイドバー命名のみ。ページ本体は別スコープ | phase-3 M-2 / shared-context §9 |
| 第二段階検出 | 電話番号・住所一致による重複検出の拡張 | 検出ロジック（`identity-conflict-detector.ts`）と D1 read 範囲の変更を伴う＝**API/D1 変更** | shared-context §9 |

> 補足: 3 件以上の一括統合 UI（現行 2 件ずつ）も需要次第で別タスク候補（shared-context §9）。本 baseline では主要 3 件を記録。

## 関連タスク差分確認（重複起票チェック）

| 既存 / 関連 workflow | 関係 | 重複か |
| --- | --- | --- |
| `completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix` | 同じ route の prototype 整合 + 404 修復（過去サイクル） | **非重複**。本タスクは日本語化・用語平易化・seed 投入が主題で、prototype 整合とは目的が異なる |
| `completed-tasks/admin-meetings-card-ux-clarity` 系 | `/admin/meetings` ページ本体 UX | M-2 と関連するが本タスク範囲外。M-2 起票時は当該 completed タスクとの差分確認が必要 |
| test-accounts seed（`apps/api/src/testing/test-accounts/`） | 既存 seed dataset | **非重複**。本 seed は専用 dataset（identity-conflicts）で分離・既存を変更しない |

現時点で baseline 3 件は既存 OPEN issue と重複しない（起票は user 判断）。

## 判定

- current 0 件。
- baseline 3 件（M-1 / M-2 / 第二段階検出）は分離が妥当・Issue 化 PENDING。
