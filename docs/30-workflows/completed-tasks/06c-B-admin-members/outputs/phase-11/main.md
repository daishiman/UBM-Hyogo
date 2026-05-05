# Phase 11 Main — 手動 smoke / 実測 evidence（placeholder 確定）

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `11 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| evidence_executed | `false` |

## Scope Boundary

本仕様書作成タスクでは実測しない。本 Phase の出力は **evidence path placeholder の確定** と **smoke 手順の凍結** のみ。
実測は Phase 5 完了後に実装担当が staging で実行し、本ファイルとは別に下表 path の実 evidence を配置する。

## evidence placeholder（取得対象）

| 種別 | path（placeholder） |
| --- | --- |
| screenshot 一覧 | `outputs/phase-11/screenshots/admin-members-list.png` |
| screenshot 詳細 | `outputs/phase-11/screenshots/admin-members-detail.png` |
| screenshot delete confirm | `outputs/phase-11/screenshots/admin-members-delete.png` |
| curl GET list | `outputs/phase-11/curl/admin-members-list.txt` |
| curl GET detail | `outputs/phase-11/curl/admin-members-detail.txt` |
| curl POST delete | `outputs/phase-11/curl/admin-members-delete.txt` |
| curl POST restore | `outputs/phase-11/curl/admin-members-restore.txt` |
| wrangler tail（admin handler ログ） | `outputs/phase-11/wrangler-tail.txt` |
| audit_log SELECT | `outputs/phase-11/d1/audit-log.txt` |
| redaction checklist | `outputs/phase-11/redaction-checklist.md` |

## smoke 手順（凍結）

1. staging に admin role の test user で login し、`/admin/members` に到達する。
2. 検索 `filter` / `q` / `zone` / repeated `tag` / `sort` / `density` を組合せて結果が変わることを確認、screenshot 取得。
3. 右ドロワー詳細を開き、基本情報・audit log が表示されることを確認。
4. delete 実行し、list で `filter=deleted` 時のみ表示されることを確認。
5. restore 実行し、通常 list に戻ることを確認。
6. audit_log を D1 で SELECT し、delete / restore が actor / target / action / timestamp で記録されることを確認。
7. role 変更 UI / API が存在しないことを確認（404 / 405）。
8. member ロールでアクセス → 403 を確認。
9. 未ログインアクセス → 401 / login redirect を確認。

## redaction 要件（実測時）

- screenshot は seeded / sanitized fixture のみ。実会員 name / email を映さない。
- curl 出力に `Authorization` header の値（cookie / token）を残さない。redact して保存。
- D1 SELECT は `actor / target / action / timestamp` 列のみ。`before` / `after` JSON や email を出力しない。
- evidence は staging 環境のみ。production を触らない。

## 実測前 gate（Phase 10 blocker）

- [ ] B1: 06b-A session resolver が staging に着地している
- [ ] B2: audit_log migration が staging に適用されている
- [ ] B3: require-admin の admin role 判定基準が確定し、test user に admin が付与されている
- [ ] B4: 検索 index が staging に適用されている

## 完了条件チェック

- [x] evidence path placeholder 全 10 件確定
- [x] smoke 手順 9 ステップが再現可能
- [x] redaction 要件確定
- [x] 実測 gate（B1〜B4）明示

## 次 Phase への引き渡し

Phase 12 へ、evidence path placeholder と smoke 手順、実測 gate を渡す。
