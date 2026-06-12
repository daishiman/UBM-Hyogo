# Phase 8: リファクタリング

## 8.1 docs-only における読み替え

本タスクはコード変更を伴わないため、リファクタリングを「**#524 本文・ローカルミラーの重複・冗長・navigation drift（dangling 参照）の除去**」と読み替える。実コードの構造改善は N/A。

本タスクは最小差分（4 差分）で完結するため大規模リファクタは行わない。レビューの主眼は「**過剰削除を避けつつ、陳腐化・dangling・数の不整合を漏れなく除去できているか**」の確認である。

## 8.2 リファクタリング対象レビュー（Before / After / 理由）

| 対象 | Before（現状） | After（整合後） | 種別 | 理由 |
|------|----------------|------------------|------|------|
| 通知統合対象テーブルの #407 行 | CF rotation reminder 行が残存（実装不能スコープ） | 行削除（2 行へ縮小） | 冗長除去 | 親タスクで workflow 削除済み・配線先が消滅したため陳腐化行を除去 |
| 「参照」節 `cf-token-rotation-reminder.yml` | 削除済みファイルを直接参照 | 除去し撤廃経緯リンクへ置換 | navigation drift 除去 | dangling 参照（リンク先不在） |
| 「参照」節 `cf-token-rotation-runbook.md` | tombstone 化 runbook を参照 | 除去し撤廃経緯リンクへ置換 | navigation drift 除去 | tombstone 先への誘導は誤誘導 |
| スコープのチェックボックス文言 | 「上記 3 ワークフロー」 | 「上記 2 ワークフロー（dashboard / export）」 | 数の整合 | テーブル縮小と件数を一致させ drift を残さない |
| 冒頭の撤廃注記 | なし | 撤廃注記ブロックを追加（経緯は親タスクへリンク） | 集約・重複回避 | 経緯は親タスクを正本とし #524 へ重複記述しない（不変条件4） |

## 8.3 過剰リファクタを避ける判断（残置・不変の記録）

| 対象 | 判断 | 理由 |
|------|------|------|
| secret hygiene 行（`Token 値 / Token ID / scope 値` 列挙） | **残置（不変）** | CF token 通知撤廃後は厳密には不要だが、redaction 方針の網羅性として残しても害がない。過剰削除を避ける（Phase 3.5 で残置可と判定済み） |
| 「通知先」セクション（Workspace / Channel） | **不変** | 残り 2 件（#351 / #484）の Slack 投稿先として必須。削除すると残スコープが壊れる |
| #351 / #484 のテーブル行・スコープ記述 | **不変** | #524 本体スコープ。本タスクは越境しない（不変条件2） |
| ローカルミラーのメタ情報 YAML（`updated_date` 以外） | **不変** | `updated_date` のみ 2026-06-10 へ更新。それ以外のメタは整合不要 |

## 8.4 navigation / 参照整合の確認観点

- #524 本文に残るリンク（`post-release-dashboard.yml` / `cloudflare-analytics-export.yml` / 親 completed-tasks dir）はすべて現存パスを指すこと。
- 撤廃経緯リンク `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/` が実在 dir を指すこと（dangling を新規に生まない）。
- ローカルミラーと #524 本文の本文部分が同一であり、片側だけ整合する drift を残さないこと。

## 完了条件（Phase 8）

- [x] docs-only リファクタの読み替え（重複・冗長・navigation drift 除去）を定義した。
- [x] 対象 / Before / After / 種別 / 理由 をテーブルで記録した。
- [x] 過剰削除を避ける残置判断（secret hygiene 行・通知先セクション）を記録した。
- [x] 新規 dangling を生まないための参照整合観点を記録した。
