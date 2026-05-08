# タスク仕様書: Issue #549 — Cloudflare Audit Logs ML 本番 production switch

[実装区分: 実装仕様書]

判定根拠: 本タスクは Issue #515（ML-ready abstraction）/ FU-03-C #548（offline replay 評価）の成果を踏まえ、production 環境の `.github/workflows/cf-audit-log-monitor.yml` の env を `CF_AUDIT_CLASSIFIER=threshold` から `=ml` へ切り替え、model artifact 配布経路（R2 / Workers AI binding 等の `ML_MODEL_PATH`）の本番投入と、forward-safe rollback 手順、post-switch 7 日観測のテレメトリ整備を伴う。コード変更（workflow YAML / runbook / observation script / fallback rate alert / leakage grep gate）と運用 evidence の双方を必要とするため、CONST_004 のデフォルトに従い実装仕様書として作成する。Issue #549 は CLOSED だが、ユーザー指示「クローズドのままタスク仕様書を作成する」に従い open/close 操作は行わず `Refs #549` で連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-549-cf-audit-ml-production-switch |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/549 |
| 起票元 unassigned-task | `docs/30-workflows/completed-tasks/issue-515-production-ml-switch.md` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/` |
| 配置先 | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/` |
| 作成日 | 2026-05-08 |
| 状態 | implemented-local / workflow-switch-pending-gate |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（issue label `priority:low`） |
| Wave | follow-up（Issue #515 派生 D / FU-03-C #548 完了後） |
| 想定 PR 数 | 1（本サイクル: local observation scripts + docs + SSOT 同期）。workflow env 切替 / model artifact 本番配布 / hourly post-step 組込みは Gate-A〜C 通過後の別サイクル |
| coverage AC | 適用外（`.github/workflows/` / `scripts/cf-audit-log/observation/` 配下。focused unit test + observation dry-run test を追加） |

## 着手判断（着手 Gate）

本タスクは外部依存待ち（CONST_007 例外条件 1）に該当する。local observation scripts と docs/SSOT は今サイクルで実装・同期するが、**production env 切替は以下の Gate を通過するまで実行しない**:

- Gate-0: 90 日 baseline 条件を満たした、または同等の例外承認 evidence で置換したことを記録する。未成立なら production switch は不可。
- Gate-A: FU-03-C (#548) の offline replay で **ML モデルが threshold より precision / recall が改善** したことが evidence (`outputs/phase-11/`) で確認できること
- Gate-B: FU-03-C で fallback rate と Issue body redaction（secret leakage grep）が許容範囲内であること
- Gate-C: rollback runbook approval / governance evidence（solo-dev 運用では CODEOWNERS required review ではなく、rollback 手順・承認ログ・`Refs #549` 境界の記録）を得ていること
- Gate-D（Gate-A 不成立時）: production switch せず threshold を継続。model artifact のみ stage 環境で再評価する

## 苦戦箇所（Issue #549 本文より）

production 切替は次の 4 系統が同時に関係する:

1. **GitHub Actions env**: `.github/workflows/cf-audit-log-monitor.yml` の `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` env の production 値設定
2. **D1 migration**: `cf_audit_log` の `classifier_used` / `classifier_version` / `confidence` カラム（Issue #515 で追加済み）の forward-safe 維持確認
3. **model artifact 配布**: R2 / Workers AI binding 等への artifact 投入と `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照経路
4. **rollback 手順**: env 戻し / artifact 不整合時のフェイルセーフ / D1 列残置

## リスクと対策（forward-safe rollback）

| リスク | 検知 | 対策（rollback） |
| --- | --- | --- |
| ML 切替後の誤検知率上昇 | hourly run の Issue 起票数 / FP rate を 7 日観測 | `CF_AUDIT_CLASSIFIER=threshold` に戻す（env 1 行） |
| ML 切替後の見逃し（FN）増加 | 既知 anomaly fixture を hourly に流す canary | `CF_AUDIT_CLASSIFIER=threshold` に戻す |
| model artifact load 失敗 | `MLClassifier` skeleton の threshold fallback が発動 / fallback rate 計測 | fallback rate > 5% で env 戻し |
| Issue body に raw secret 混入 | leakage grep gate（CI / hourly post-step） | 即時 env 戻し + Issue 削除 + revoke token |
| D1 追加列の非互換 | staging で migration list 確認 | 列は **残す**（forward-safe）。env のみ戻す |

> **forward-safe rollback 原則**: D1 追加列 (`classifier_used` / `classifier_version` / `confidence`) は rollback でも削除しない。env (`CF_AUDIT_CLASSIFIER`) を `threshold` に戻すだけで完全互換に復帰できる構造を Issue #515 で担保済み。

## 検証方法（post-switch 7 日観測）

- production **dry-run**: `--dry-run` フラグで 1 hour 分の event を ML classifier に通し、Issue 起票なしで結果を JSON 出力
- **hourly run 7 日観測**: 7 日間の hourly run について以下を計測
  - Issue 起票数（threshold 期 baseline と比較）
  - fallback rate（`classifier_used = 'threshold'` の割合 / `ml` 設定下で）
  - precision / recall proxy（手動 label がある場合）
  - p95 latency
- **Issue body redaction**: `secret-leakage-grep.ts` を hourly post-step として hooked し、production Issue body / log artifact を grep
- **fallback rate alert**: fallback rate > 5% を超えた場合、別 GitHub Issue を起票して通知

## スコープ

### 含む（scope in）

- `.github/workflows/cf-audit-log-monitor.yml` の `env` を production env で `CF_AUDIT_CLASSIFIER=ml` / `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` に切り替える実装サイクル用 contract（本サイクルでは YAML を編集しない）
- model artifact 本番配布（R2 / Workers AI binding 経由）の手順 contract（`bash scripts/cf.sh` ラップ）
- post-switch 7 日 observation script (`scripts/cf-audit-log/observation/post-switch-monitor.ts`) と JSON 出力 contract / local 実装
- fallback rate alert（hourly run の集計 → 閾値超で GitHub Issue 起票）contract / local 実装
- Issue body redaction の hourly grep gate 強化（既存 `secret-leakage-grep.ts` の `--exit-on-detect` / `--stdin` / `--count-only` / directory scan 対応。workflow hooked step 組み込みは Gate 後）
- rollback runbook（`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 追記）
- SSOT 同期: observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook

### 含まない（scope out / Gate 後・別タスク）

- 90 日 baseline 作成（FU-03-A 別タスク）
- ML モデル学習・選定（FU-03-B 別タスク）
- model artifact のフォーマット選定（FU-03-C #548 で確定済みを前提）
- Slack / メール alerting 拡張（親 #408 の GitHub Issue 起票に閉じる）
- 外部 SIEM へのバルクエクスポート

## 不変条件・正本仕様との整合

- 不変条件 #5（D1 直接アクセス禁止 / `apps/api` 経由）: 本タスクは scripts 層であり対象外
- Cloudflare CLI: `bash scripts/cf.sh` 経由のみを使用（`wrangler` 直接実行禁止）
- シークレット: `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照のみ。実値は記載・コミットしない
- 親 #515 の `Classifier` interface / forward-safe rollback / leakage grep をそのまま継承し、追加破壊変更を行わない

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #515 (ML-ready abstraction) | classifier 抽象 / D1 列 / leakage grep の正本 |
| 上流 | FU-03-C #548 (offline replay) | model artifact 選定の evidence |
| 上流 | `.github/workflows/cf-audit-log-monitor.yml` | env 切替対象 |
| 上流 | `scripts/cf-audit-log/classifier/ml.ts` | production model load 経路 |
| 上流 | `apps/api/migrations/0016_cf_audit_log_classification.sql` | forward-safe 列 |
| 関連 | aiworkflow-requirements observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook | SSOT 同期先 |
| external | Gate-A〜C 通過 | production env 切替の前提 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/issue-515-production-ml-switch.md | 親 unassigned-task 正本 |
| 必須 | docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md | 親タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md | 親タスク実装ガイド |
| 必須 | .github/workflows/cf-audit-log-monitor.yml | env 切替対象 |
| 必須 | scripts/cf-audit-log/classifier/ml.ts | production model load 経路 |
| 必須 | scripts/cf-audit-log/evaluation/secret-leakage-grep.ts | leakage grep gate |
| 参考 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | rollback runbook 同期先 |
| 参考 | .claude/skills/aiworkflow-requirements/references/observability-monitoring.md | SSOT 同期先 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | SSOT 同期先 |

## AC（Acceptance Criteria）

- AC-1: `.github/workflows/cf-audit-log-monitor.yml` の production env で `CF_AUDIT_CLASSIFIER=ml` / `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` を設定する実装サイクル用 PR diff contract が用意され、Gate-A〜C と rollback approval の経路が runbook に明記されている。
- AC-2: model artifact 配布手順が `bash scripts/cf.sh` 経由のラッパー化されており、`wrangler` 直接実行が含まれない。
- AC-3: post-switch 7 日 observation の集計 script が JSON を出力し、`Issue 起票数 / fallback rate / p95 latency / leakage grep result` を必須 field として含む。
- AC-4: fallback rate > 5% を 3 hour 連続で超えた場合に GitHub Issue を起票する alert step が workflow に組み込まれている。
- AC-5: hourly run の post-step に `secret-leakage-grep.ts` が組み込まれ、検出時 exit 1 で hourly run を fail させる。
- AC-6: rollback runbook（env 戻し / D1 列残置 / artifact 不整合対応）が `15-infrastructure-runbook.md` に 3 step 以内で記述されている。
- AC-7: D1 列 `classifier_used` / `classifier_version` / `confidence` の forward-safe 性が staging migration list で再確認され、production apply は本タスクで実施しない（既に Issue #515 で apply 済み前提）。
- AC-8: 関連 focused test はローカルで pass。global `pnpm typecheck` / `pnpm lint` は既存 `@sentry/*` dependency missing により exit 1 のため、Issue #549 由来エラー 0 件として known-failure 境界を記録する。
- AC-9: SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）に production switch / 7 日観測 / rollback が反映されている。
- AC-10: skeleton dry-run で Issue 起票なしの snapshot 生成 evidence が `outputs/phase-11/` に保存されている。実 ML artifact load 動作確認は Gate 後の production switch 実装サイクルで取得する。
- AC-11: PR 本文に `Refs #549` を含み、issue は閉じない（`Closes` を使わない）。
- AC-12: Phase 12 で本サイクル外（90 日 baseline / モデル学習 / artifact フォーマット選定）が `outputs/phase-12/unassigned-task-detection.md` に未タスクとして起票される。

## 実装ファイル一覧（抜粋・Phase 5/6 で詳細確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集 | production env で `CF_AUDIT_CLASSIFIER=ml` / `ML_MODEL_PATH` 設定、leakage grep / fallback alert の post-step 追加 |
| `scripts/cf-audit-log/observation/post-switch-monitor.ts` | 新規 | 7 日 observation 集計 (JSON 出力) |
| `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | 新規 | fallback rate 閾値超で Issue 起票 |
| `scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts` | 新規 | observation focused test |
| `scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` | 新規 | alert focused test |
| `scripts/cf.sh`（既存） | 参照 | model artifact 配布の wrapper |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | rollback runbook + 7 日観測手順追記 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | production switch 手順追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | `ML_MODEL_PATH` production env 値の op 参照追記 |

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点 | phase-01.md |
| 2 | 既存実装調査（#515 成果物 / workflow / runbook） | phase-02.md |
| 3 | 設計（env 切替 / artifact 配布 / 7 日観測 / rollback） | phase-03.md |
| 4 | 環境準備 / 前提条件確認（着手 Gate と production verify） | phase-04.md |
| 5 | データモデル / D1 列 forward-safe 確認 / artifact path schema | phase-05.md |
| 6 | 実装サイクル handoff（関数シグネチャ / PR diff contract / rollback） | phase-06.md |
| 7 | 整合性検証（#515 / FU-03-C #548 / SSOT） | phase-07.md |
| 8 | エラーハンドリング / fallback / leakage 防止 | phase-08.md |
| 9 | テスト計画（unit / observation dry-run / leakage grep） | phase-09.md |
| 10 | デプロイ / workflow env 切替手順 / rollback runbook | phase-10.md |
| 11 | 実行 evidence（NON_VISUAL: typecheck / lint / dry-run / 7 日観測 sample） | outputs/phase-11/main.md |
| 12 | 実装ガイド・未タスク（90 日 baseline / モデル学習）・skill feedback | outputs/phase-12/* |
| 13 | PR 作成（`Refs #549`） | outputs/phase-13/main.md |

各 Phase 詳細は `phase-NN.md` を参照（Phase 1-13 は本仕様書で確定済み）。

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md) ・ [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（Definition of Done・全 Phase 共通）

- [ ] AC-1〜AC-12 すべての evidence が `outputs/phase-11/` 配下に保存されている。
- [ ] `pnpm typecheck` は既存 `@sentry/*` dependency missing 以外の新規エラー 0 件であることを記録する。
- [ ] `pnpm lint` は既存 `@sentry/*` dependency missing 以外の新規エラー 0 件であることを記録する。
- [ ] focused Vitest（post-switch-monitor / fallback-rate-alert）すべて pass。
- [ ] `CF_AUDIT_CLASSIFIER=ml` への切替が PR diff として用意され、production apply は rollback approval/governance evidence + Gate-A〜C 通過後にのみ merge する旨が runbook に明記されている。
- [ ] secret leakage grep gate が hourly run の post-step に組み込まれ、検出時 fail することが test で確認されている。
- [ ] D1 列の forward-safe 性が staging migration list で再確認されている（破壊的 DOWN は実施しない）。
- [ ] SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）が更新されている。
- [ ] Phase 12 の 7 必須ファイルが `outputs/phase-12/` に実体として存在する。
- [ ] PR 本文に `Refs #549` を含み、issue は閉じない（`Closes` を使わない）。
