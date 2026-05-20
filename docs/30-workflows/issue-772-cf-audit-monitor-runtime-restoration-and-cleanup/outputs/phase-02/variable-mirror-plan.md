# Variable mirror plan (repo-level)

Status: `LOCAL_SPEC_READY / EXECUTION_PENDING_USER_GATE`

## Boundary

`.github/workflows/cf-audit-log-monitor.yml` が参照する `vars.*` のうち repo-level に投入が必要なものを documents する。値の決定（特に production env 側に未投入のもの）は user 判断。`gh api -X POST` の実行は user 承認後のみ。

## 投入対象

| Name | workflow yaml 位置 | repo-level 現状 | production env 現状 | 投入要否 | 推奨値 |
| --- | --- | --- | --- | --- | --- |
| `CF_AUDIT_CLASSIFIER` | L41 | 不在 | `ml`（2026-05-09） | **要** | `ml`（踏襲） |
| `ML_MODEL_PATH` | L42 | 不在 | 未確認 | **要** | user 判断 |
| `CF_AUDIT_IF_MODEL` | L43 | 不在 | 未確認 | **要** | user 判断 |
| `CF_AUDIT_XGB_MODEL` | L44 | 不在 | 未確認 | **要** | user 判断 |
| `CF_AUDIT_WORKERS_AI_URL` | L45 | 不在 | 未確認 | **要** | user 判断 |
| `CLOUDFLARE_ACCOUNT_ID` | L67, L77 | **存在** | n/a | 不要 | — |
| `CF_AUDIT_CLASSIFIER_VERSION` | L94 | 不在 | 未確認 | **要** | user 判断 |
| `EMAIL_FROM` | L114 | 不在 | 未確認 | **要** | user 判断 |
| `EMAIL_TO` | L115 | 不在 | 未確認 | **要** | user 判断 |

## 値決定フロー

```bash
# 1. production env 側 var 値を確認（参考、踏襲可否判断用）
gh api repos/daishiman/UBM-Hyogo/environments/production/variables \
  | jq '.variables[] | select(.name | startswith("CF_AUDIT_") or startswith("ML_") or startswith("EMAIL_"))'

# 2. user 判断: production env 側の値を repo-level に踏襲してよいか、別値を入れるか
# 3. 投入（実行は user-gated）
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=<NAME> -f value=<VALUE>
```

## 値決定の合格基準

| 対象 | 合格基準 | 失敗時の切り分け |
| --- | --- | --- |
| `CF_AUDIT_CLASSIFIER` | production env 既設値 `ml` を踏襲する、または user が別値を明示する | classifier 経路だけが fail する場合は variable 値起因として扱う |
| `ML_MODEL_PATH` / `CF_AUDIT_IF_MODEL` / `CF_AUDIT_XGB_MODEL` / `CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_CLASSIFIER_VERSION` | production env 側に値があれば同値を repo-level に mirror。production env 側にも値が無い場合は user が空値不可 / 投入値 / classifier fallback のいずれかを明示する | `Analyze and alert` / `Build hourly snapshot` の model path・classifier version failure と secret 401/403 を分離する |
| `EMAIL_FROM` / `EMAIL_TO` | notification step が dry_run でも環境変数欠落で落ちない値を user が確認する | fallback notification step のみ fail する場合は mail variable 起因として扱う |

dry_run が fail した場合は、まず failing step 名で `Fetch audit logs into D1` = secret/API token 系、`Analyze and alert` = classifier / Workers AI / GitHub issue 系、`Evaluate fallback rate notification` = email/slack notification 系に分類し、値未確定のまま runtime restored と扱わない。

## 不変条件

1. `EMAIL_WEBHOOK_URL` は secret（前ファイル）。`EMAIL_FROM` / `EMAIL_TO` は var で別管理
2. `CF_AUDIT_CLASSIFIER` を `ml` 以外（threshold / isolation-forest / xgboost / workers-ai）に切り替える場合は別タスクスコープ
3. var 値が後段で workflow を別経路に切り替える可能性があるため、初回投入は production env 側の既設値を踏襲する
4. 値は **非機密** であるため evidence MD に記録してよいが、トークン形式の値が混入していないことを Phase 11 leakage grep で確認する

## 失敗時 rollback

投入後に hourly が想定外の経路で fail した場合、別途 user が明示承認した削除 approval marker を記録してから `gh api -X DELETE /repos/daishiman/UBM-Hyogo/actions/variables/<name>` で削除し、production env 側の値を再確認。
