# [#236] [task-ut21-phase11-smoke-rerun-real-env-001] Phase 11 smoke の実環境再実行（NON_VISUAL 証跡更新）

## メタ情報

```yaml
issue_number: 236
title: [task-ut21-phase11-smoke-rerun-real-env-001] Phase 11 smoke の実環境再実行（NON_VISUAL 証跡更新）
state: OPEN
priority: 中
scale: -
category: 改善
status: -
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/236
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 目的

UT-21 Phase 11 で残存した smoke 証跡の TBD 部分を、実 secrets（`SYNC_ADMIN_TOKEN` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID`）と実 D1（staging）環境で再実行し、NON_VISUAL 証跡として `outputs/phase-11/` 配下を更新する。

UI 変更を伴わないため screenshot は取得しない（`visualEvidence=NON_VISUAL`）。代わりに以下を残す:
- `bash scripts/cf.sh` 実行ログ
- `wrangler tail` 出力
- `sync_jobs` の SELECT 結果
- 認可境界（401 / 403 / 200 / 409）の curl 実行ログ

## スコープ

### 含むもの
- `POST /admin/sync/schema` を staging で Bearer 付き / 不正 Bearer / Bearer なし / 同種 job 実行中の 4 ケースで叩く
- `POST /admin/sync/responses` を同 4 ケースで叩く
- `sync_jobs` テーブルの結果 SELECT（status / metrics_json / started_at / finished_at）を証跡化
- `wrangler tail` でエラー有無を確認
- 結果を `outputs/phase-11/` 配下のログファイルへ追記（既存 TBD を実値に置換）

### 含まないもの
- production 環境での実行（staging のみ）
- 新規実装の追加
- screenshot
- commit / PR 作成

## 依存関係

| 種別 | 対象 |
| --- | --- |
| 上流 | task-ut21-forms-sync-conflict-closeout-001（親 close-out） |
| 上流 | UT-25-cloudflare-secrets-sa-json-deploy（secrets が staging 配備済み） |
| 上流 | 03a / 03b 実装完了（staging deploy 済み） |
| 上流 | 09b runbook（smoke 手順正本） |
| 上流 | UT-24-staging-deploy-smoke-test |

## 苦戦箇所

- **症状**: Phase 11 smoke 証跡が TBD のまま残存。
- **原因**: UT-21 実装当時、staging 環境の secrets / D1 が未配備で、模擬値での smoke しかできなかった。
- **Bearer guard 実環境再現の難しさ**: local ではトークンを mock しがちだが、実環境では `wrangler secret put` 経由の値と request header が一致するかが本物の検証ポイント。op:// 参照経由の `SYNC_ADMIN_TOKEN` が `bash scripts/cf.sh` 実行時に揮発的に注入されるため、CLI ログに値が残らないことも要確認。
- **同種 job 409 の再現**: 単発呼び出しでは出ない。バックグラウンドで 1 本走らせて即座にもう 1 本叩く必要があり、タイミング設計が必要。
- **証跡形式**: NON_VISUAL のため screenshot 不要。HTTP status / response body / `sync_jobs` SELECT 結果 / `wrangler tail` 抜粋の 4 点セットを揃える。
- **再発防止**: smoke 再実行は secrets 配備直後に runbook に組み込む。TBD 残しを許容しない。

---

Task spec: [docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md](https://github.com/daishiman/UBM-Hyogo/blob/main/docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md)
