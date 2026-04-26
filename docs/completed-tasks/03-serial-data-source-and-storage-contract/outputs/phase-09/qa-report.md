# Phase 9 / qa-report.md — 品質保証スキャン結果

## 1. runbook link 切れチェック

| runbook | 参照先 | 期待 path | 判定 |
| --- | --- | --- | --- |
| d1-bootstrap-runbook | data-contract | outputs/phase-02/data-contract.md | OK（実体存在） |
| d1-bootstrap-runbook | rollback 手順 | 同 runbook §6 / §7 | OK（自己完結） |
| d1-bootstrap-runbook | 異常系 | outputs/phase-06/failure-cases.md | OK |
| sync-deployment-runbook | sync-flow | outputs/phase-02/sync-flow.md | OK |
| sync-deployment-runbook | constants | outputs/phase-08/refactor-record.md | OK |
| sync-deployment-runbook | migration | outputs/phase-05/d1-bootstrap-runbook.md | OK |

link 切れ: 0 件。

## 2. D1 migration 互換性チェック

| 変更種別 | forward 互換 | backward 互換 | rollback 参照 |
| --- | --- | --- | --- |
| 列追加（NULL 許容） | OK | OK | d1-bootstrap-runbook §6.1 |
| 列削除 | NG（要 view） | NG | d1-bootstrap-runbook §6.2 |
| 列リネーム | NG（view 経由必須） | NG | d1-bootstrap-runbook §6.2 |
| index 追加 | OK | OK | 不要 |
| 0001_init.sql 初期 | N/A | N/A | dump-restore (§7) |

## 3. Secrets 漏洩チェック

| 項目 | 結果 |
| --- | --- |
| service account JSON 実値混入 | 0 件（placeholder のみ） |
| OAuth token / base64 断片 | 0 件 |
| 1Password を local canonical | OK（CLAUDE.md Secrets 管理に準拠） |
| Cloudflare Secrets と GitHub Secrets の混線 | なし（refactor-record §2 で配置先を分離） |
| `GOOGLE_SERVICE_ACCOUNT_JSON` 表記 | placeholder 統一 |

## 4. 不変条件 1〜7 違反スキャン

| # | 不変条件 | 対象 phase | 判定 | 根拠 |
| --- | --- | --- | --- | --- |
| 1 | schema をコードに固定しすぎない | 02 / 08 | OK | raw_payload で drift 吸収 (A7) |
| 2 | consent キー統一 | 02 / 08 | OK | publicConsent / rulesConsent / public_consent / rules_consent のみ |
| 3 | responseEmail は system field | 02 | OK | mapping/schema で system field 列に隔離 |
| 4 | admin-managed data 分離 | 02 / 05 | OK | `member_status` の admin-managed columns / 後続 admin tables と sync 対象列を分離 |
| 5 | D1 直接アクセスは apps/api 限定 | 02 / 05 | OK | sync は apps/api/src/sync/ のみ |
| 6 | GAS prototype を本番化しない | 全 phase | OK | apps/api は Hono 実装、GAS ロジック未持込 |
| 7 | Form 再回答を本人更新経路 | 02 | OK | sync 経路で D1 直接 UPDATE しない |

違反: 0 件。

## 5. 命名規則 / 無料枠チェック

| 対象 | 基準 | 判定 |
| --- | --- | --- |
| task dir | wave + mode + kebab-case | OK (`03-serial-data-source-and-storage-contract`) |
| secret 名 | ALL_CAPS_SNAKE_CASE | OK (`GOOGLE_SERVICE_ACCOUNT_JSON`) |
| D1 schema 列名 | snake_case | OK (`public_consent` 等) |
| D1 行数 / DB サイズ | 無料枠（5GB / 5M rows） | OK（推定数千 rows） |
| sync cron 頻度 | Workers 無料枠（100K req/day） | OK（1h 周期 = 24 invocations/day） |
| Sheets API quota | 60 req/min/user | OK（1h sync 1 回） |

## 6. 命名規則・参照整合性

- 全 outputs パスが `outputs/phase-XX/*.md` 形式
- artifacts.json と phase-*.md の outputs 一覧が一致（5 点同期は Phase 12 で最終確認）

## 7. blocker

なし。

## 8. 完了条件チェック

- [x] link 切れ 0 件
- [x] D1 migration の forward / backward 判定が全行埋まる
- [x] Secrets 実値混入 0 件
- [x] 不変条件 1〜7 違反 0 件
- [x] qa-report.md を Phase 10 から参照可能
