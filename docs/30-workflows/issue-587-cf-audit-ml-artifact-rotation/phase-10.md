# Phase 10: デプロイ / canary workflow 起動手順 / rollback runbook

## 目的

実装サイクルで rotation scripts / canary workflow を staging に入れた後の、canary 起動手順、promotion 手順、rollback 手順、SSOT 同期手順を 1 ページで読める runbook 形に確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. runbook 配置

```
docs/30-workflows/runbooks/ml-model-artifact-rotation.md  ← 本体（新規）
docs/00-getting-started-manual/specs/15-infrastructure-runbook.md  ← 編集（rotation セクション追記 + 本体への相互リンク）
```

本体に 4 段（candidate evaluation / canary / promotion / rollback）を記述、`15-infrastructure-runbook.md` には要約 + 相互リンクを置く。

## 2. canary 起動手順

```
前提:
  - Gate-R0-1〜R0-5（Phase 4）すべて pass
  - candidate artifact が staging に配置済み
  - op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE が op に登録済み

手順:
  1. gh workflow run cf-audit-log-artifact-canary.yml \
        -f candidatePath="op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE" \
        -f replayWindowHours=1
  2. gh run list --workflow=cf-audit-log-artifact-canary.yml --limit=1 で最新 run 確認
  3. gh run view <run-id> --log で leakage grep / metrics 結果を確認
  4. gh run download <run-id> で rotation-evidence.json を取得
  5. evidence を outputs/phase-11/evidence/canary-dry-run.json に保存
```

`bash scripts/cf.sh` 経由が必要な step（artifact upload / D1 read）は workflow 内部で wrap される。手動実行で `wrangler` を直接呼ばない。

## 3. promotion 手順（Gate-R1〜R3 通過時）

```
前提:
  - Gate-R1: candidate.precision/recall >= baseline
  - Gate-R2: fallbackRate < 0.05 / p95Latency <= baseline * 1.5
  - Gate-R3: runbook 承認 evidence あり
  - rotation-evidence.json の decision = 'promotion_pr_pending'

手順:
  1. op item edit ubm-hyogo-env --vault Employee \
        CF_AUDIT_ML_MODEL_PATH_PREVIOUS=<現 PROD 値>
        ※ 実値は op CLI 内のみ。screen / log に出さない
  2. op item edit ubm-hyogo-env --vault Employee \
        CF_AUDIT_ML_MODEL_PATH_PROD=<candidate 値>
  3. promotion 確認用に hourly run を手動 trigger
        gh workflow run cf-audit-log-monitor.yml
  4. 1 hour 後に classifier_version が candidate に切替わったことを D1 で確認
        bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
            --command "SELECT classifier_version, COUNT(*) FROM cf_audit_log \
                       WHERE created_at > datetime('now','-1 hours') GROUP BY 1"
  5. rotation-evidence.json の decision を 'promotion_merged' に更新（手書き）
```

promotion 自体は op vault の値書き換え + hourly run の自然切替で完結。workflow YAML 編集や PR は不要（`ML_MODEL_PATH` は env 経由で op を参照するため）。

## 4. rollback 手順（forward-safe 1 step）

```
発火条件:
  - hourly run の fallback rate alert（#549 既存）が発火
  - precision/recall の手動評価で劣化検知
  - leakage 検出（hourly post-step）

手順:
  1. op item edit ubm-hyogo-env --vault Employee \
        CF_AUDIT_ML_MODEL_PATH_PROD=<CF_AUDIT_ML_MODEL_PATH_PREVIOUS の値>
        ※ promotion 時に保存した previous path に戻す
  2. hourly run を待つ（または手動 trigger）
  3. classifier_version が previous に戻ったことを D1 で確認
  4. rotation-evidence.json の decision を 'rollback_merged' に更新
  5. candidate を破棄するなら op item edit で ..._CANDIDATE をクリア
        （次回 rotation まで残置でも可）

不変:
  - D1 列（classifier_used / classifier_version / confidence）は削除しない（forward-safe）
  - hourly workflow の env (CF_AUDIT_CLASSIFIER) は変更しない（ml 維持）
  - #549 の env 戻し rollback とは独立。両方を併用可能
```

## 5. SSOT 同期手順

```
1. .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
     - rotation telemetry セクション追加
     - canary evidence JSON schema を記述
     - rotation の 4 段（candidate / canary / promotion / rollback）の運用順を記述

2. .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
     - op item: Employee/ubm-hyogo-env
     - field: CF_AUDIT_ML_MODEL_PATH_CANDIDATE（新設）
     - field: CF_AUDIT_ML_MODEL_PATH_PREVIOUS（新設）
     - 実値は記載しない

3. docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
     - "ML model artifact rotation" セクション追記
     - docs/30-workflows/runbooks/ml-model-artifact-rotation.md への相互リンク
     - rollback の 1 step を要約

4. mise exec -- pnpm indexes:rebuild
     - skill indexes 再生成（rotation キーワード追加）
```

## 6. PR 作成（Phase 13 で実施）

- branch: `feat/issue-587-cf-audit-ml-artifact-rotation`
- base: `dev`
- body: `Refs #549, #587`（`Closes` 不使用）
- evidence: `outputs/phase-11/` 配下 + `outputs/phase-12/` strict 7 file
- スクリーンショット: NON_VISUAL のため記載なし

## 7. 自動化対象外

| 項目 | 理由 |
| --- | --- |
| 自動 rotation スケジューラ | 本サイクル scope out。Phase 12 で未タスク起票 |
| 自動 promotion | 誤動作リスクが高く、Gate-R3 は人手承認必須 |
| 自動 rollback | fallback rate alert は通知のみ。実 rollback は人手 |

## 完了条件

- [ ] runbook 本体 4 段の構成を確定
- [ ] canary 起動手順 5 step を確定
- [ ] promotion 手順 5 step を確定
- [ ] rollback 手順 5 step（forward-safe 1 step + 確認）を確定
- [ ] SSOT 同期手順 4 step を確定
- [ ] 自動化対象外 3 項目を明記

## 参照資料

- `index.md`
- `phase-03.md` ・ `phase-06.md` ・ `phase-07.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-10.md`

## 統合テスト連携

- Phase 11 で canary 起動の手動実行 evidence、Phase 12 で SSOT 同期 evidence を取得する。

## 出力

- `outputs/phase-10/main.md`（runbook 構成 + 4 手順 + SSOT 同期）

## Next Phase

- [Phase 11](phase-11.md): 実行 evidence
