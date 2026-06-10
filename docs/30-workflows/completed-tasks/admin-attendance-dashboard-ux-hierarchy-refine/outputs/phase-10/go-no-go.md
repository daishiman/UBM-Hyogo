# Phase 10 — Go / No-Go 判定

> ステータス: `completed`。source-level Go 判定は完了。VISUAL screenshot 8 PNG は `pending_visual_capture`。

---

## 1. Go 条件（全充足で Phase 11 へ進行）

以下 4 ブロックすべてが充足したときのみ Go とする。1 つでも未充足なら No-Go。

### ブロック A: 4 条件（価値性 / 実現性 / 整合性 / 運用性）

| 条件 | Go 基準 | 判定手段 |
| --- | --- | --- |
| 価値性 | 管理者の「何を判断すべきか分からない」認知コストを 3 層階層 + 焦点で低減し、最重要 2 判断（出席率 / 要フォロー）が最上部に到達する | 視覚証跡（PRIMARY ヒーロー）+ AC-1/AC-2 |
| 実現性 | 既存 primitive + token + 6 endpoint で 1 サイクル完了（新規は `AttendanceDetailTabs` 1 件 + globals.css クラス追加のみ） | AC-6 / AC-7 / 実装 diff |
| 整合性 | 表現層（apps/web feature）に責務が閉じ、filter（hook）/ タブ（local state）/ データ（server fetch）の所有権が分離 | AC-7 / component-map |
| 運用性 | `verify-design-tokens` + vitest component spec + playwright visual smoke で回帰保護が成立 | AC-5 / Phase 4-7 / Phase 11 |

### ブロック B: AC 全充足

| 基準 | Go 条件 |
| --- | --- |
| AC-1〜AC-10 | 全 10 件が `outputs/phase-10/main.md` の確認手段で充足。未充足 0 件 |

### ブロック C: token gate PASS

| 基準 | Go 条件 |
| --- | --- |
| `verify-design-tokens`（AC-5） | `apps/web/src/features/admin/attendance` 配下で HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が **0 件**（grep PASS）。1 件でも検出で No-Go |

検証コマンド（_shared-context §9）:
```bash
bash -lc 'grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance && echo "FAIL" || echo "PASS"'
```

### ブロック D: 既存機能温存

| 基準 | Go 条件 |
| --- | --- |
| AC-10 | フィルタ（期間プリセット / 回数帯チェック）・CSV エクスポート・ドリルダウン modal・各テーブル内容・フッター生成日時・SafeResult 単位 degrade がすべて挙動不変。回帰 0 件 |

---

## 2. No-Go 条件と戻り先

| No-Go トリガ | 戻り先 Phase |
| --- | --- |
| ブロック A の整合性 / 実現性が崩れる（API/D1/shared 型に diff 発生 = AC-7 違反） | Phase 2（設計）または Phase 5（実装） |
| AC-1〜AC-10 のいずれか未充足 | 該当 AC の検証 Phase（機能=Phase 5 / テスト=Phase 6 / token=Phase 9） |
| token gate FAIL（HEX 検出） | Phase 9（品質保証） |
| 既存機能の回帰検出 | Phase 5（実装）または Phase 6（テスト拡充） |
| MINOR が blocker 化（想定外） | M-1/M-2=Phase 5 / M-3=Phase 4・6 |

---

## 3. Phase 11 進行条件

| # | 条件 |
| --- | --- |
| 1 | ブロック A〜D がすべて Go |
| 2 | AC-1/AC-4/AC-8 が Phase 11 screenshot canonical 名にマップ済み（`outputs/phase-10/main.md` §1） |
| 3 | MINOR M-1/M-2/M-3 が非 blocker として記録済み |

---

## 4. Phase 13 blocked 条件（厳守）

| # | 条件 |
| --- | --- |
| 1 | Go 判定が出ても **commit / PR / push はユーザーの明示承認後のみ実行**する。 |
| 2 | 承認がない限り Phase 13 は **blocked** のまま維持する。 |
| 3 | 実装 diff は存在するが、Phase 13 は user 承認後にのみ着手可能。PNG 未取得時は PR 本文の screenshot セクションを削除する。 |

> 本タスクは relatedIssue=null（staging 観察起点）。base ブランチは `dev`。production リリースを伴わないため `--base main` は使用しない。
