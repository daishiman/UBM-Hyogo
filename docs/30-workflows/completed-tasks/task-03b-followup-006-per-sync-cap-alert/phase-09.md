[実装区分: 実装仕様書]

# Phase 9: デプロイ前検証 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-08.md

## 成果物

- phase-09.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## 1. dry-run 検証

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
```

期待: `[[analytics_engine_datasets]]` ブロックが parse され、binding `SYNC_ALERTS` が宣言されたと dry-run ログに出る。

## 2. staging deploy（user 明示指示後）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

実施は user 承認後のみ。本仕様書作成段階では実施しない。

## 3. staging post-deploy 検証

- `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT job_id, json_extract(metrics_json, '$.writeCapHit') AS hit FROM sync_jobs WHERE job_type='response_sync' AND started_at >= '<deploy_started_at>' ORDER BY started_at DESC, job_id DESC LIMIT 5;"`
- 期待: deploy 後の新規成功 job では `hit` が `0` または `1` を返す（旧行の NULL は後方互換として許容）
- Analytics Engine の dataset `sync_alerts` は dashboard 目視ではなく、可能な場合は Cloudflare API / wrangler analytics query の取得ログを NON_VISUAL evidence とする。API 取得不可の場合のみ dashboard URL と取得不能理由を記録する

## 4. ロールバック手順

万一 deploy 後に異常があれば:

```bash
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env staging
```

`writeCapHit` フィールドの追加は zod optional のため、旧バージョンでも metrics_json に余分な key が残っても問題なく動作する（破壊的変更なし）。

## 完了条件

- dry-run ログが取得され `outputs/phase-09/staging-dry-run.log` に保存可能な粒度
- staging deploy / post-deploy 検証手順が user 承認後に即実行できる粒度で文書化
- ロールバック手順が明示
