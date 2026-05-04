# Phase 9: セキュリティ・品質ゲート — outputs/main

## 判定

`PASS_WITH_BLOCKER`（required context 確認 OK / strict 0 violations 未達）。

## branch protection 正本確認

`phase-11/evidence/branch-protection-main.json` / `branch-protection-dev.json` の実 API レスポンスより:

| branch | required_status_checks.contexts | 結論 |
| --- | --- | --- |
| main | `["ci","Validate Build"]` | `ci` 含む。AC-2 充足 |
| dev | （同 evidence 参照） | `ci` 含む |

PUT 操作は実施せず（scope out）。

## suppression 監査

- `// stablekey-allow` 系の suppression コメントは禁止する設計（scripts/lint-stablekey-literal.mjs は allow-list を path で管理）。
- 現行 violations 148 件は本来コードの実体であり、ignore で隠していない。

## solo dev policy 整合

- `required_pull_request_reviews=null` / `enforce_admins=true` / linear history / no-force-push という solo 運用ポリシーと整合。
- 本タスクは required reviewer 数を変えない。

## 完了条件チェック

- [x] required context 名 drift なし。
- [x] suppression 抜け道なし。
