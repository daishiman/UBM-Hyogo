# Phase 10 — Go / No-Go 判定

> ステータス: `completed`。spec-level Go 判定は完了。本ワークフローは `implemented_local_evidence_captured`。focused 機械検証は PASS、6 canonical PNG は user-gated。

---

## 1. Go 条件（全充足で Phase 11 へ進行）

以下 4 ブロックすべてが充足したときのみ Go とする。1 つでも未充足なら No-Go。

### ブロック A: 4 条件（価値性 / 実現性 / 整合性 / 運用性）

| 条件 | Go 基準 | 判定手段 |
| --- | --- | --- |
| 価値性 | 非エンジニアの管理者が監査ログを「いつ・誰が・何を操作したか」日本語で一目把握でき、よく使う絞り込みが前面・詳細条件が引き出しに格納されて認知負荷が下がる | 視覚証跡（日本語ラベル / 段階開示）+ AC-1〜AC-5 |
| 実現性 | 既存 primitive + 既存 token + 既存 endpoint で 1 サイクル完了（新規は glossary helper 3 + ラベルマップ 3 + globals.css クラス 4 のみ・新規 primitive 0） | AC-6 / AC-10 / 変更ファイル一覧（§6） |
| 整合性 | 表現層（apps/web component / glossary / globals.css / test）に責務が閉じ、`<input name>`（query param キー）= API 契約を不変に保つ | AC-9 / component-map |
| 運用性 | `verify:tokens` + vitest component/lib spec + playwright visual capture で回帰保護が成立 | AC-8 / Phase 4-7 / Phase 11 |

### ブロック B: AC 全充足

| 基準 | Go 条件 |
| --- | --- |
| AC-1〜AC-12 | 全 12 件が `outputs/phase-10/main.md` の確認手段で充足観点として整理。spec-level 未充足 0 件 |

### ブロック C: token gate PASS

| 基準 | Go 条件 |
| --- | --- |
| `verify:tokens`（AC-8） | `apps/web/src/components/admin/` + `apps/web/src/styles/globals.css` の変更箇所で HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が **0 件**。1 件でも検出で No-Go。新規 CSS は全て `var(--ubm-*)` トークン経由 |

検証コマンド（_shared-context §9）:
```bash
mise exec -- pnpm verify:tokens
```

### ブロック D: 既存機能温存

| 基準 | Go 条件 |
| --- | --- |
| AC-12 | 検索 / リセット / ページネーション（cursor）/ PII マスク / JSON 開示 / エラー親切メッセージがすべて挙動不変。回帰 0 件。query param キー名不変（AC-9） |

---

## 2. No-Go 条件と戻り先

| No-Go トリガ | 戻り先 Phase |
| --- | --- |
| ブロック A の整合性 / 実現性が崩れる（API/D1/shared 型に diff 発生 / query param キー変化 = AC-9 違反） | Phase 2（設計）または Phase 5（実装） |
| AC-1〜AC-12 のいずれか未充足 | 該当 AC の検証 Phase（機能=Phase 5 / テスト=Phase 6 / token=Phase 9） |
| token gate FAIL（HEX 検出） | Phase 9（品質保証） |
| 既存機能の回帰検出 | Phase 5（実装）または Phase 6（テスト拡充） |

---

## 3. Phase 11 進行条件

| # | 条件 |
| --- | --- |
| 1 | ブロック A〜D がすべて Go |
| 2 | AC-1/AC-2/AC-3/AC-4/AC-7 が Phase 11 screenshot canonical 名にマップ済み（`outputs/phase-10/main.md` §1） |
| 3 | OOS-1〜OOS-4 が Phase 12 baseline へ申し送り済み |

---

## 4. Phase 13 blocked 条件（厳守）

| # | 条件 |
| --- | --- |
| 1 | Go 判定が出ても **commit / push / PR はユーザーの明示承認後のみ実行**する。 |
| 2 | 承認がない限り Phase 13 は **blocked** のまま維持する。 |
| 3 | 本ワークフローは `implemented_local_evidence_captured`。staging capture・commit・PR は user 承認後にのみ着手可能。PNG 未取得時は PR 本文の screenshot セクションを削除する。 |

> 本タスクは relatedIssue=null（staging 観察起点）。base ブランチは `dev`。production リリースを伴わないため `--base main` は使用しない。
