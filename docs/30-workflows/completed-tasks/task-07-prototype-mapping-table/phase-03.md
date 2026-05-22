# Phase 3: 設計レビュー — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 3 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

Phase 2 で確定した設計（章立て・列名・row 数）が、§2 primitives mapping、§3 routes mapping (19 行)、§4 shell mapping、§5 派生ルール (5.1〜5.8)、§6 行範囲台帳の各観点で妥当かをレビューし、Phase 5 実装へ進むかを判断する。

## 実行タスク

1. §2 primitives mapping のレビュー観点を整理する。完了条件: 13 row が全て prototype 行範囲付き / RSC-safe 列ありで記録される。
2. §3 routes mapping (19 routes) のレビュー観点を整理する。完了条件: プロトタイプ忠実 9 + 未掲載 10 の比率が成立する。
3. §4 shell mapping のレビュー観点を整理する。完了条件: Sidebar / Topbar / MinimalBar / TweaksPanel(不採用) が確認される。
4. §5 派生ルール 5.1〜5.8 と phase-3 §3 の 1:1 対応をレビューする。
5. §6 行範囲台帳の grep 一意性をレビューする。

## 参照資料

- task-07 §4.2, §4.3, §4.4, §4.5, §4.6
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md §3

## 派生ルール 8 パターン（§5）レビュー対応表

| § | パターン | 対応 routes |
|---|----------|-------------|
| 5.1 | 法務ページ | `/privacy`, `/terms` |
| 5.2 | register | `/(public)/register` |
| 5.3 | admin queue 系 | `/(admin)/admin/tags`, `/(admin)/admin/requests` |
| 5.4 | admin CRUD | `/(admin)/admin/meetings` |
| 5.5 | admin diff | `/(admin)/admin/schema`（部分掲載あり） |
| 5.6 | admin compare | `/(admin)/admin/identity-conflicts` |
| 5.7 | admin timeline | `/(admin)/admin/audit` |
| 5.8 | 共通 error/404/loading | `error.tsx`, `not-found.tsx`, `loading.tsx`, `global-error.tsx` |

## 依存 Phase 成果物参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`

## 実行手順

- 章立て・列名・row 数の各レビュー観点を outputs/phase-03/main.md に記録する。
- 不採用記述（TweaksPanel / AvatarStoreProvider / data-theme warm/cool）が §2/§4 で漏れなく記載される設計か確認。

## 多角的チェック観点

- §3 列名 grep キーが後続 task で機械抽出可能か
- §6 行範囲が grep 一意か（重複 OK だが column 順は固定）
- 派生ルール末尾の「新規 primitive を生やさない」段落が §5 末尾に置かれる設計になっているか

## サブタスク管理

- [ ] §2 primitives 13 row レビュー
- [ ] §3 routes 19 row レビュー
- [ ] §4 shell mapping レビュー
- [ ] §5 派生ルール 8 パターン レビュー
- [ ] §6 行範囲台帳 25+ row レビュー
- [ ] outputs/phase-03/main.md 作成

## 成果物

- outputs/phase-03/main.md

## 完了条件

- [ ] §2 / §3 / §4 / §5 / §6 のレビュー結果が記録される
- [ ] 派生ルール 8 パターン × phase-3 §3 が 1:1 一致と確認される
- [ ] 不採用記述の対象 4 件が §2 / §4 / §6 のどこに記載されるか明記される

## 次 Phase への引き渡し

Phase 4 へ、レビュー済み設計をタスク分解入力として渡す。
