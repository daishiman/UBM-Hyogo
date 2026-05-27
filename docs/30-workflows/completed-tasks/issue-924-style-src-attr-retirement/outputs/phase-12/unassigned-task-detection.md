# Phase 12: 未割り当てタスク検出 — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

## 1. Summary

**unassigned candidates: 0 件**

## 2. 検出観点

| 観点 | 該当の有無 | 判定 |
|------|-----------|------|
| `style-src-attr` 削除に伴う他 directive 派生作業 | なし | nonce 仕様（#871）不変条件として固定済み |
| `style={{...}}` 撤去のスコープ外漏れ | なし | 17 ファイル全件を Phase 5 で明示。`ImageResponse` 2 ファイルは CSP 対象外として除外を文書化 |
| Avatar 12 bucket 色値の OKLch 化 | スコープ内 | Phase 5 / 12 で `tokens.css` 追記を実装計画に含む |
| Icon 非標準 size 棚卸し | スコープ内 | Phase 5 実装着手時に `rg "<Icon\s.*size="` を実行し丸め方針を確定 |
| ZoneDistribution の SVG accessibility（`role` / `aria-label`） | スコープ内 | 実装時に SVG `<title>` / `aria-label` を付与（既存 a11y 契約に整合） |
| CSP enforce 切替 | 別 followup | 親 cycle #871 の前提どおり別タスクとして既存（本サイクルでは扱わない） |
| `Reporting-Endpoints` / `report-to` 強化 | 別 followup | 既存スコープ外と Phase 1 で明示 |

## 3. CONST_007 判定

51 箇所のうち約 30 箇所は静的 className 置換で機械的、動的ケース 3 種は各 1 ファイルで完結。**1 サイクル完了可能**と判定。先送り（unassigned 切り出し）は行わない。

## 4. 結論

新規発行すべき issue / followup は **0 件**。本ワークフロー単独で完結する。
