# Phase 4: 本番実行承認書

> **ステータス: NOT SIGNED (実行時署名テンプレ)**
> 本書は GO 判定の最終ゲート。本書サイン取得前は Phase 5 (本番不可逆操作) に進行しない。

## 1. 対象

| 項目 | 値 |
| --- | --- |
| taskId | UT-06 |
| taskName | 本番デプロイ実行 |
| 対象 commit SHA | TBD (実行時に確定) |
| 対象ブランチ | `feat/wt-12` (PR 経由で `main` にマージ後実行) |
| 対象リソース | `ubm-hyogo-api` / `ubm-hyogo-web` / `ubm-hyogo-db-prod` |
| 対象マイグレーション | `apps/api/migrations/0001_init.sql` (1 件) |

## 2. 関係者

| 役割 | 氏名 | サイン | 日時 |
| --- | --- | --- | --- |
| delivery 担当 (実施者) | TBD | TBD | TBD |
| レビュアー 1 | TBD | TBD | TBD |
| レビュアー 2 (任意) | TBD | TBD | TBD |
| 運用責任者 (承認権者) | TBD | TBD | TBD |

## 3. 実行ウィンドウ

| 項目 | 値 |
| --- | --- |
| 実行日 | TBD (YYYY-MM-DD JST) |
| 開始予定時刻 | TBD |
| 終了予定時刻 | TBD |
| メンテナンス通知 | TBD (必要に応じ会員向け告知) |

## 4. 前提条件 (Phase 4 までの完了確認)

- [ ] Phase 1 outputs 完成 (requirements / inventory / spec map)
- [ ] Phase 2 outputs 完成 (deploy-design / rollback-runbook / env-binding-matrix)
- [ ] Phase 3 design-review.md GO 判定 (条件付きを含む)
- [ ] Phase 4 verify-suite-result.md 全 PASS
- [ ] Phase 4 preflight-checklist.md 全 PASS

## 5. abort 条件

下記いずれか発生時は **即座に Phase 5 を中止し Phase 6 ロールバック** に移行:

1. verify suite で FAIL が発生
2. Step 1 D1 バックアップが取得不能
3. Step 2 D1 マイグレーションが部分適用で停止
4. Step 3/4 wrangler deploy が認証/binding エラーで停止
5. Step 5 直後 smoke で AC-1 / AC-2 / AC-4 のいずれかが FAIL
6. Cloudflare 側で広域障害発生 (status.cloudflare.com)

## 6. エスカレーション

| 状況 | 連絡先 |
| --- | --- |
| 通常異常 | 運用責任者 (本書 §2) |
| Cloudflare 障害 | 運用責任者 + Cloudflare サポート (有料プラン契約時) |
| データ消失リスク | 運用責任者 + 全レビュアー即時同期 |

## 7. GO 判定

- 判定: TBD (GO / NO-GO)
- 判定根拠: 本書 §4 全 GREEN かつ §2 サイン全件取得
- 判定日時: TBD
- 判定者: 運用責任者 (本書 §2)

## 8. 実行後

- 実行結果は `outputs/phase-05/deploy-execution-log.md` に記録
- smoke 結果は `outputs/phase-11/smoke-test-result.md` に記録
- 最終 GO/NO-GO 振り返りは `outputs/phase-10/go-nogo.md` に記録
