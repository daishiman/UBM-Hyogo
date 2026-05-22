# Phase 10: 実装後検証 / Definition of Done

## 目的

production switch（`CF_AUDIT_CLASSIFIER=threshold` → `=ml`）merge 後、7 日間の post-switch observation 完了までに通過すべき Definition of Done を確定する。検証コマンド、不合格時の rollback 判定基準、rollback 実行コマンドを 1 ヶ所に集約し、Phase 11 evidence の保存契約と紐付ける。

## 前 Phase 依存

- Phase 8: CI gate / forward-safe rollback 検証スクリプト / governance
- Phase 9: 7 日 observation 運用手順 / alert 条件 / runbook 起動マッピング

## 完了条件

- [ ] 全 DoD チェックリストを列挙し、各項目に検証コマンドを紐付ける
- [ ] post-switch 24h / 7 日の節目で実行する検証コマンドを確定する
- [ ] 不合格時の rollback 判定基準（fallback rate / leakage / hourly run / FN / latency）と実行コマンドを確定する
- [ ] D1 列が forward-safe に残置されていることを最終確認する手順を含める

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 10-1 | DoD チェックリストを列挙する |
| 10-2 | 24h / 7 日節目の検証コマンドを確定する |
| 10-3 | 不合格時の rollback 判定基準と実行コマンドを確定する |
| 10-4 | D1 forward-safe 最終確認手順を含める |

## 1. Definition of Done チェックリスト

### 1-1. PR / merge

- [ ] PR がレビュー（CODEOWNERS 文書化のみ・solo dev では self-merge 可）を経て merge 済み
- [ ] merge 後、`.github/workflows/cf-audit-log-monitor.yml` の production env で `CF_AUDIT_CLASSIFIER=ml` / `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` が反映されている
- [ ] PR 本文に `Refs #549` を含み、`Closes` を使っていない

### 1-2. CI / 静的検証

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] focused Vitest（`scripts/cf-audit-log/observation/__tests__/`）すべて pass
- [ ] `verify-indexes-up-to-date` pass（SSOT 3 ファイル更新後）

### 1-3. Post-switch 24h

- [ ] 切替後 24h 以内の hourly run（最大 24 件）がすべて `conclusion=success`
- [ ] 24h 内の fallback rate mean が 5% 未満
- [ ] 24h 内の leakage grep 検出 0 件
- [ ] dry-run baseline が `outputs/phase-11/observation/dry-run-baseline.json` に保存済み

### 1-4. Post-switch 7 日（168 hour）

- [ ] 7 日間の hourly run 成功率 ≥ 167/168（連続 2 回 fail なし）
- [ ] 7 日終端 fallback rate mean が 5% 未満（baseline 内）
- [ ] Issue 起票数が threshold 期 baseline の mean ± 2σ 内
- [ ] p95 latency が baseline +30% 内
- [ ] leakage grep の 7 日合計検出 0 件
- [ ] hourly JSON snapshot 168 件 + 日次サマリ 7 件 + 7 日終端サマリが `outputs/phase-11/observation/` に保存済み

### 1-5. Governance / runbook

- [ ] post-switch-observation runbook が `docs/30-workflows/issue-549-cf-audit-ml-production-switch/runbooks/post-switch-observation.md` に commit 済み
- [ ] rollback runbook（3 step）が `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に追記され commit 済み
- [ ] CODEOWNERS の構文エラーがない（`gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}`）

### 1-6. D1 forward-safe

- [ ] production の `cf_audit_log` テーブルに `classifier_used` / `classifier_version` / `confidence` の 3 列が残っている
- [ ] migration `0016_cf_audit_log_classification` が applied 済み
- [ ] 本タスク内で破壊的 DOWN SQL を作成・実行していない

## 2. 検証コマンド

### 2-1. CI / 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__
```

### 2-2. Post-switch 24h 検証

```bash
# hourly run 24h
gh run list --workflow cf-audit-log-monitor.yml --limit 24 \
  --json status,conclusion,createdAt \
  --jq '[.[] | select(.conclusion!="success")] | length'
# 期待: 0

# 直近 24h の hourly snapshot を集計
mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
  --aggregate --window 24h \
  --input outputs/phase-11/observation/ \
  --output outputs/phase-11/observation/summary-24h.md
```

### 2-3. Post-switch 7 日（168 hour）検証

```bash
# 7 日 (168 hour) の hourly run
gh run list --workflow cf-audit-log-monitor.yml --limit 168 \
  --json status,conclusion,createdAt > outputs/phase-11/observation/runs-7day.json

# 7 日終端サマリ
mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
  --aggregate --window 7d \
  --input outputs/phase-11/observation/ \
  --output outputs/phase-11/observation/summary-7day.md
```

### 2-4. D1 forward-safe 最終確認

```bash
# migration 履歴
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
# 期待: 0016_cf_audit_log_classification が applied 済み

# 列存在確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "PRAGMA table_info(cf_audit_log);"
# 期待: classifier_used / classifier_version / confidence の 3 列

# 直近 24h の classifier 分布（rollback 状況確認）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT classifier_used, COUNT(*) FROM cf_audit_log WHERE created_at >= datetime('now','-24 hours') GROUP BY classifier_used;"
```

### 2-5. Governance 確認

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
# 期待: {"errors":[]}

gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | grep -E '"required_pull_request_reviews"|"lock_branch"|"enforce_admins"'
```

## 3. 不合格時の rollback 判定基準

| トリガ | 判定基準 | 起動 runbook | 実行コマンド |
| --- | --- | --- | --- |
| fallback rate | mean > 5%、または 3 hour 連続 > 5% | rollback runbook §1 | §3-1 PR 経由 rollback |
| leakage grep 検出 | 1 件以上 | rollback runbook §emergency | §3-1 PR 経由 + 該当 Issue 削除 + token revoke |
| hourly run 失敗 | 連続 2 回 fail（structural 起因と判明） | post-switch-observation §run-failure | workflow log 確認 → 必要なら §3-1 |
| Issue 起票数 | baseline mean ± 2σ 超（FN または FP 悪化） | post-switch-observation §judge | §3-1 + FU-03-C #548 差し戻し Issue 起票 |
| p95 latency | baseline +30% 超 | post-switch-observation §latency | artifact 軽量化検討 Issue 起票（rollback 任意） |

### 3-1. Rollback 実行コマンド

```bash
# Step 1: env を threshold に戻す PR を作成
git checkout -b rollback/cf-audit-classifier-threshold dev
# .github/workflows/cf-audit-log-monitor.yml の production env を threshold に書き換え
git add .github/workflows/cf-audit-log-monitor.yml
git commit -m "rollback: revert CF_AUDIT_CLASSIFIER to threshold (Refs #549)"
git push -u origin rollback/cf-audit-classifier-threshold
gh pr create --base dev --title "rollback: CF_AUDIT_CLASSIFIER=threshold (Refs #549)" \
  --body "post-switch observation で <理由> を検出したため env を threshold に戻す。D1 列は forward-safe のため残置。Refs #549"

# Step 2: merge 後の rollback 確認
gh run list --workflow cf-audit-log-monitor.yml --limit 1 --json conclusion
# 期待: 直後の hourly run が success かつ classifier_used が threshold

# Step 3: D1 forward-safe 最終確認（§2-4 と同じ）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "PRAGMA table_info(cf_audit_log);"
```

> rollback でも D1 列は **削除しない**。次回 ML 切替時に migration 不要で再利用する（forward-safe）。

## 4. AC との対応

| AC | 担保箇所 |
| --- | --- |
| AC-1 | §1-1 PR / merge |
| AC-2 | §3-1 のすべての Cloudflare 操作が `bash scripts/cf.sh` 経由 |
| AC-3 | §2-3 7 日終端サマリの必須 field |
| AC-4 | §3 fallback rate トリガ |
| AC-5 | §1-4 leakage grep 0 件 |
| AC-6 | §1-5 rollback runbook |
| AC-7 | §1-6 / §2-4 D1 forward-safe |
| AC-8 | §2-1 |
| AC-9 | §1-5 |
| AC-10 | §1-3 dry-run baseline |
| AC-11 | §1-1 `Refs #549` |

## 出力

- `outputs/phase-10/main.md`

## Handoff

- Phase 11: 本 Phase の検証コマンド出力（typecheck / lint / vitest / 24h 集計 / 7 日終端サマリ / D1 PRAGMA / migration list / codeowners errors）を evidence として `outputs/phase-11/` に保存する。
- Phase 12: 本 Phase の DoD checklist を `outputs/phase-12/implementation-guide.md` に転記し、運用引継ぎの基本契約として明記する。
- Phase 13: PR 本文の Test plan / DoD セクションは本 Phase の checklist を base に組み立て、`Refs #549` を必ず含める。

## 参照資料

- `index.md`
- `phase-01.md` / `phase-03.md` / `phase-08.md` / `phase-09.md`
- `CLAUDE.md`（Cloudflare CLI / Branch protection / sync:check）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/phase-10.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- 7 日終端時点で `outputs/phase-11/observation/summary-7day.md` を生成し、Phase 9 集計 script の出力と整合することを確認する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 8 / Phase 9 の成果物を上流契約として参照する。

## 成果物/実行手順

本 Phase の成果物は `phase-10.md`。deploy / env switch / rollback command は Gate 後の実装サイクルでのみ実行する。
