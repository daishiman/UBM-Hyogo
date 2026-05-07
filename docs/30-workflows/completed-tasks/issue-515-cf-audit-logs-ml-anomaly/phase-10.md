# Phase 10: デプロイ / migration apply / workflow env 追加 / rollback 計画

## 目的

本サイクル内で実施する staging 反映と、Gate 通過後 production への切替手順を確定する。

## デプロイ範囲（本サイクル）

| 項目 | 範囲 | 手順 |
| --- | --- | --- |
| コード | `scripts/cf-audit-log/` 新規 + 編集ファイル群 | PR merge により main へ |
| migration | `apps/api/migrations/0016_cf_audit_log_classification.sql` | staging のみ apply |
| workflow | `.github/workflows/cf-audit-log-monitor.yml` env 追記 | PR merge と同時に有効化（既定値 `threshold` のため動作変更なし） |
| SSOT | observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook | PR と同 commit |

## staging migration apply 手順

```bash
# 1. migration list 事前確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# 2. apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# 3. 適用後検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "PRAGMA table_info(cf_audit_log);"
# → classifier_used / classifier_version / confidence 列の存在を確認
```

## production への切替（**本サイクル外** / Gate 通過後）

以下は別 PR で実施する手順を仕様書として記録するのみ。

```bash
# Step 1: production migration apply
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# Step 2: GitHub Actions の repository variables 更新
gh variable set CF_AUDIT_CLASSIFIER --body "ml"
gh secret set ML_MODEL_PATH --body "<path or URL>"

# Step 3: 観測（hourly run × 7 日以上）
gh run list --workflow=cf-audit-log-monitor.yml --limit 50
```

## Rollback 計画

### 即時 rollback（コード差戻し不要）

```bash
# Step 1: GitHub Actions variables を threshold に戻す
gh variable set CF_AUDIT_CLASSIFIER --body "threshold"
# 次回 hourly run から threshold 動作に戻る
```

### コード rollback（PR revert）

- `git revert <merge-commit>` で全変更を一括戻し
- D1 列はデータとして残るが NULL / DEFAULT で問題なし
- D1 列削除（DOWN SQL）は手動で apply する

### migration rollback（必要時のみ）

phase-05 に記述した DOWN SQL を手動 apply。

## 完了条件

- [ ] 本サイクル staging apply 手順を確定
- [ ] production 切替手順（Gate 後）を仕様書として記録
- [ ] rollback 3 段階（即時 env / code revert / migration DOWN）を確定
- [ ] production migration apply は本サイクルで **実行しない** ことを明記

## 出力

- `outputs/phase-10/main.md`

## 参照資料

- `index.md`
- `phase-05.md` ・ `phase-08.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 統合テスト連携

- Phase 11 で staging apply 後の `PRAGMA table_info` 出力を evidence として保存

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 10-1 | この Phase の契約を確定する |
| 10-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
