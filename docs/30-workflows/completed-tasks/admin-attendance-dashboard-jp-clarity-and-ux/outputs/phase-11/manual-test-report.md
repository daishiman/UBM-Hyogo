# Phase 11 手動テストレポート — admin-attendance-dashboard-jp-clarity-and-ux

> 本タスクは **VISUAL / implemented_local_visual_present_staging_pending**。apps/web 実装・ローカル機械検証・6 canonical PNG capture は admin 認証 gate 配下・Playwright staging 専用のためlocal fixture で取得済みで、authenticated staging baseline capture は staging deploy + admin 認証 + user 承認後に行う。
> 本レポートは「authenticated staging capture 前の手動テスト計画」と「local implementation 判定」を記録する。詳細チェックリストは [manual-test-result.md](./manual-test-result.md)、視覚評価は [ui-sanity-visual-review.md](./ui-sanity-visual-review.md)、発見事項は [discovered-issues.md](./discovered-issues.md) を参照。

## 0. 証跡メタ（[Feedback 4]）

| 項目 | 内容 |
| --- | --- |
| タスク種別 | VISUAL（UI 表示文言の日本語化 + 軽微 UX 調整） |
| 証跡の主ソース（実装後） | focused vitest（`apps/web/src/features/admin/attendance/__tests__`）+ 6 canonical local fixture screenshot |
| authenticated staging screenshot を pending にする理由 | ①staging deploy + admin 認証が前提 ②baseline capture は user-gated ③staging PNG を擬似生成しない |
| 現段階の判定 | 仕様（用語リネーム正本表 R/S/J/U・テスト追従 T-01〜T-06）の整合確認のみ完了。実行検証は pending |

## 1. 実装後に実施する手動テスト計画（3 層評価）

| 層 | 観点 | 確認内容 |
| --- | --- | --- |
| Semantic | 文言の意味保持 | 出席率・前期比・要フォロー対象・各テーブル値が日本語化後も同じ数値・同じ意味で表示される |
| Visual | 見た目 | 6 canonical screenshot（dashboard-full / overview-zone / trend-zone / detail-tabs / filter-bar / dashboard-mobile の各 -jp）で英語表記・専門語が消え、はみ出し・折返し崩れがない |
| AI UX | 直感性 | 非エンジニア視点で「全体の状況 / 出席の移り変わり / くわしい一覧」「開催回」「表計算ファイルで書き出す」が迷わず読めるか |

## 2. テスト結果サマリー（実装後に記入）

| 区分 | 件数 | 状態 |
| --- | --- | --- |
| focused vitest（attendance __tests__） | 8 files / 23 tests | PASS |
| 用語残存 grep（英語/専門語 0 件） | UI-facing residual 0 | PASS |
| design token gate（HEX 0 件） | 91 tracked | PASS |
| local fixture screenshot（6 canonical） | 6 | present |
| staging screenshot（6 canonical） | 6 | pending（user-gated baseline） |

## 3. 既知の制限

- 実 capture は staging deploy + admin bearer + user 承認が前提のため本タスクでは取得しない。
- `displayName` 空の要フォロー対象行はメール表示にフォールバックする（データ起因・仕様変更しない）。
