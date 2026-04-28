# Phase 4: preflight チェックリスト

> **ステータス: NOT EXECUTED (実行時記録テンプレ)**

## 1. 環境

- [ ] `mise install` で Node 24.15.0 / pnpm 10.33.2 を解決済
- [ ] `bash scripts/cf.sh --version` = package/lockfile と一致
- [ ] `bash scripts/cf.sh whoami` で UBM 兵庫アカウント確認
- [ ] 実行端末から Cloudflare API への到達確認

## 2. リソース存在

- [ ] D1 database `ubm-hyogo-db-prod` 存在
- [ ] Workers `ubm-hyogo-api` 名空き or 既存上書き許可
- [ ] Workers/Pages `ubm-hyogo-web` 名空き or 既存上書き許可
- [ ] 必要 Secrets が apps/api / apps/web の両方に配置済 (`wrangler secret list`)

## 3. ソース・ビルド

- [ ] 対象 commit SHA を `outputs/phase-04/production-approval.md` に記録
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api build` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` PASS
- [ ] `apps/api/migrations/` に当日適用予定の SQL のみが存在 (本タスクでは 0001_init.sql のみ)

## 4. バックアップ・復旧準備 (AC-7 / AC-8)

- [ ] Phase 5 用バックアップ出力先 `outputs/phase-05/` 確保
- [ ] `restore-empty.sql` 雛形が準備済 (0001_init.sql の DROP 相当)
- [ ] rollback-runbook.md §1〜§4 を delivery 担当が机上確認済
- [ ] 直前 deployment_id を staging で取得・rollback 予行成功 (本タスク docs-only のため未実施)

## 5. 承認

- [ ] delivery 担当 サイン
- [ ] レビュアー (1 名以上) サイン
- [ ] 運用責任者 サイン
- [ ] 実行ウィンドウを `production-approval.md` に記録
- [ ] abort 条件 (verify FAIL / 異常系発動 / Cloudflare 障害) 合意

## 6. 不合格項目 (実行時記録)

| # | 項目 | 状態 | 是正アクション | 担当 | 是正期限 |
| --- | --- | --- | --- | --- | --- |
| - | - | - | - | - | - |

## 7. preflight 合否判定

- 合否: TBD (PASS / FAIL)
- 不合格項目があれば全て GREEN になるまで Phase 5 進行不可
- 全 PASS の場合、`outputs/phase-04/production-approval.md` の GO 記名へ進む
