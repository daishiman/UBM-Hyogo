# Phase 3 主成果物 — 設計レビューゲート

> 仕様: `phase-03.md`

## 代替案比較

### 案 1（採用）: 単一 OAuth client / 段階適用 runbook

| 観点 | 評価 |
| --- | --- |
| 価値性 | PASS（B-03 解除と staging evidence 上書きを 1 タスクで完結） |
| 実現性 | PASS（既存 Google Cloud / Cloudflare / 1Password 運用と整合） |
| 整合性 | PASS（02-auth.md / environment-variables.md / 不変条件と整合） |
| 運用性 | PASS（runbook 化により再現可能） |

### 案 2（不採用）: staging と production で別 OAuth client

| 観点 | 評価 |
| --- | --- |
| 整合性 | **MAJOR**（consent screen は project 単位で 1 つしか production publish できない → verification 取得 client が drift） |
| 運用性 | **MAJOR**（secrets 配置表が 2 client 分に増え DRY 違反） |

→ MAJOR で不採用。

### 案 3（不採用）: testing user 拡大運用のみで verification 保留

| 観点 | 評価 |
| --- | --- |
| 価値性 | **MAJOR**（B-03 解除されず、本番公開不可） |
| 運用性 | **MAJOR**（会員追加のたびに testing user 登録が必要） |

→ MAJOR で不採用。ただし B-03 解除条件 c（暫定退避路）として案 1 内に保持。

## レビュー観点と判定

| # | 観点 | 判定 |
| --- | --- | --- |
| 1 | 真の論点（configuration 単一正本 + 段階適用）が Phase 1/2 で一貫 | PASS |
| 2 | AC-1〜AC-12 が index と phase-01 で完全一致 | PASS |
| 3 | 単一 OAuth client / 単一 consent screen 方針が確定 | PASS |
| 4 | scope が最小権限（openid / email / profile）に固定 | PASS |
| 5 | secrets 配置表に実値が混入しない（`op://` 参照のみ） | PASS |
| 6 | `wrangler login` 排除と `scripts/cf.sh` 単一経路 | PASS |
| 7 | privacy / terms / home の 200 必須が runbook に明記 | PASS |
| 8 | 段階適用フロー A→B→C のゲート条件が定義済 | PASS |
| 9 | B-03 解除条件 a/b/c の優先順位確定 | PASS |
| 10 | 不変条件違反なし | PASS |
| 11 | branch protection / solo 運用ポリシー違反なし | PASS |
| 12 | screenshot に secret/token が映らない撮影方針 | PASS |

## 総合判定

**PASS**（MAJOR 0 / MINOR 0） → Phase 4 へ進む。
