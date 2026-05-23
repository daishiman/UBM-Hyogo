# Phase 8: DRY 化 — Summary

## 共通テンプレ化（stale 表現の reusable パターン）

3 物理 backlink で同一の追記テンプレート（`#### 関連タスク（legacy umbrella 逆リンク）` セクション + 3 列表）を使用。理由文だけが各タスクの current 担保範囲に応じて 1 文差し替えとなる構造に整理した。

2 ledger fallback も同一の 1 文テンプレ（`legacy umbrella: <umbrella> / cleanup: <cleanup>（physical root 不在のため ledger fallback 経由で逆リンク）`）を再利用。

historical 別表（api-endpoints.md / environment-variables.md / deployment-cloudflare.md）も「行を別表へ移送し、廃止理由 1 文を併記」する同一構造で揃えた。

## 採用したテンプレ

- backlink テンプレ: `outputs/phase-05/backlink-runbook.md` § 追記テンプレート
- ledger fallback 1 文: `outputs/phase-05/backlink-runbook.md` § 追記 1 文
- historical 別表: `outputs/phase-05/file-edit-runbook.md` § api-endpoints.md L67-78

future の同種 legacy umbrella cleanup で再利用可能。
