# タスク仕様書: Issue #587 — CF audit ML model artifact rotation

[実装区分: 実装仕様書]

判定根拠: 本タスクは Issue #549（production ML switch / completed）の派生 follow-up であり、次世代 ML model artifact を投入する際の rotation（candidate evaluation → canary → promotion → rollback）を再現可能にするための運用基盤を整える。新規 runbook（`docs/30-workflows/runbooks/ml-model-artifact-rotation.md` または `15-infrastructure-runbook.md` への追記）、新規 script（`scripts/cf-audit-log/rotation/artifact-canary.ts` / `rotation-evidence-collector.ts`）、focused test、candidate workflow（`.github/workflows/cf-audit-log-artifact-canary.yml`）、SSOT 同期（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）を伴う。コード変更と運用 evidence 双方を必要とするため、CONST_004 のデフォルトに従い実装仕様書として作成する。Issue #587 は CLOSED（2026-05-09T22:42:19Z）であり、open/close 操作は行わず CLOSED 維持で `Refs #549, #587` のみを使う。`Closes` / `Fixes` / `Resolves` は使わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-587-cf-audit-ml-artifact-rotation |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/587 |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| 上位親タスク | `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/` |
| 配置先 | `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/` |
| 作成日 | 2026-05-10 |
| 状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` を同値配置（`cmp -s artifacts.json outputs/artifacts.json` で検証） |
| 優先度 | LOW（issue label `priority:low`） |
| Wave | follow-up（Issue #549 派生 D-FU-02） |
| 想定 PR 数 | 1（本サイクル: rotation scripts + canary workflow contract + runbook + SSOT 同期）。次世代 model 投入の実 rotation merge は Gate-R0〜R3 通過後の別サイクル |
| coverage AC | 適用外（`scripts/cf-audit-log/rotation/` / `.github/workflows/` / `docs/` 配下。focused unit test + canary dry-run test を追加） |

## 着手判断（着手 Gate）

本タスクは外部依存待ち（CONST_007 例外条件 1）に該当する。本サイクルでは rotation scripts と canary workflow contract、runbook、SSOT 同期を整備するが、**実際の次世代 artifact 投入は以下の Gate を通過するまで実行しない**:

- Gate-R0: Issue #549 が `pass_runtime_synced` で 7 日観測完走している、または本タスク Phase 4 で同等の前提整備完了 evidence を記録できること。未成立なら次世代 artifact 投入は不可。
- Gate-R1: candidate artifact が staging で offline replay + leakage grep clean で評価され、precision / recall proxy が現行 artifact を下回っていないこと（`outputs/phase-11/` evidence で確認）
- Gate-R2: fallback rate / p95 latency が許容範囲内（fallback rate < 5%、p95 latency が現行 artifact の 1.5x 以内）
- Gate-R3: rotation runbook の rollback 経路（candidate を破棄して current artifact に固定する手順）が承認 evidence 付きで確定していること
- Gate-R-Fail: Gate-R1 不成立時は candidate を破棄し、current artifact を維持。FU-03-C #548 へ差し戻して artifact 再選定する

## 苦戦箇所（Issue #587 本文より）

artifact rotation は Issue #549 の env 切替よりも寿命が長く、次世代 model 投入時に以下 4 系統が同時に関係する:

1. **candidate path 管理**: `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE`（新設）と `..._PROD`（現行）の 2 系統を並走させ、canary 期間中はどちらの artifact が使用中かを `classifier_version` で識別する
2. **canary 評価**: staging で candidate artifact を load し、offline replay + leakage grep を実行し JSON evidence を出力する
3. **promotion**: candidate 評価 OK で `..._PROD` を candidate に書き換える PR を出す。失敗時は candidate を破棄し `..._PROD` を変更しない
4. **rollback**: promotion 後に異常があった場合、`..._PROD` を 1 つ前の artifact path に戻す。D1 列 `classifier_version` は forward-safe で残置

## リスクと対策（forward-safe rollback）

| リスク | 検知 | 対策（rollback） |
| --- | --- | --- |
| candidate artifact load 失敗 | `artifact-canary.ts` の load 段階で fail | candidate を破棄。`..._PROD` 変更なし |
| leakage grep positive | candidate の Issue body / log artifact 中に secret 検出 | canary を exit 1。promotion 不可 |
| canary 後の precision/recall 劣化 | offline replay で baseline 比較 | candidate 破棄。FU-03-C へ差し戻し |
| promotion 後の fallback rate 上昇 | hourly run の fallback rate alert（#549 由来） | `..._PROD` を 1 つ前の path（previous artifact）に戻す PR を即時作成 |
| candidate path の漏洩 | grep gate（log / commit / docs） | revoke + secret rotate runbook |
| raw feature dataset の混入 | commit 検査 + artifact upload 検査 | 該当 commit を revert。dataset を `.gitignore` 化 |

> **forward-safe rollback 原則**: D1 列 `classifier_version` は rotation の rollback でも削除しない。`..._PROD` op 参照値（path 文字列）の差し替えのみで完全互換に復帰できる構造を担保する。

## 検証方法（canary dry-run + promotion sanity）

- **candidate offline replay**: `artifact-canary.ts --candidate <op-ref> --baseline <op-ref> --out <json>` で staging に candidate を load し、過去 N 時間分の event を replay し precision/recall proxy / fallback rate / p95 latency を集計
- **leakage grep**: candidate artifact load 時に `secret-leakage-grep.ts`（既存 #515 由来）を流用し、log / Issue body の secret 検出を確認。positive 時は exit 1
- **rotation evidence collector**: `rotation-evidence-collector.ts --canary-out <json> --baseline-out <json> --result <json>` で canary 結果と baseline を 1 ファイルに集約し、promotion PR に添付する
- **promotion sanity**: promotion 直後の hourly run 1 回分で `classifier_version` が candidate に切替わったことを確認

## スコープ

### 含む（scope in）

- 新規 script `scripts/cf-audit-log/rotation/artifact-canary.ts`（staging で candidate を load + offline replay + leakage grep の dry-run）
- 新規 script `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts`（canary / baseline / rollback evidence を JSON で集約）
- focused test `scripts/cf-audit-log/rotation/__tests__/artifact-canary.test.ts` / `rotation-evidence-collector.test.ts`
- 新規 workflow `.github/workflows/cf-audit-log-artifact-canary.yml`（`workflow_dispatch` 起動 / candidate path を `inputs.candidatePath` に取る）
- 新規 secret 設計: `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE`（candidate 用 op 参照、実値は記載しない）
- runbook `docs/30-workflows/runbooks/ml-model-artifact-rotation.md`（または `15-infrastructure-runbook.md` への ML model artifact rotation セクション追記）
- 既存 `secret-leakage-grep.ts` の流用（candidate artifact load 時にも適用）
- `classifier_version` 列の rotation 利用文言を SSOT に追記（D1 schema 変更なし）
- SSOT 同期: observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook

### 含まない（scope out / Gate 後・別タスク）

- 次世代 ML model 学習・選定（FU-03-B 別タスク）
- artifact フォーマット選定（FU-03-C #548）
- 自動 rotation スケジューラ（cron / scheduled workflow による定期 rotation）
- raw feature dataset の保存・配布（unassigned-task の備考により禁止）
- Slack / メール通知拡張（親 #408）
- production の `..._PROD` op 参照値そのものの差し替え（次世代 model 投入の別サイクルで実施）

## 不変条件・正本仕様との整合

- 不変条件 #5（D1 直接アクセス禁止 / `apps/api` 経由）: 本タスクは `scripts/` 層であり対象外
- Cloudflare CLI: `bash scripts/cf.sh` 経由のみを使用（`wrangler` 直接実行禁止）
- シークレット: `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` および新設 `..._CANDIDATE` の op 参照のみ。実値は仕様書・コミット・log に出さない
- 親 #549 の `Classifier` interface / forward-safe rollback / leakage grep をそのまま継承し、追加破壊変更を行わない
- raw feature dataset は commit せず、artifact upload にも含めない

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #549 (production ML switch) | env 切替・7 日観測の正本 |
| 上流 | Issue #515 (ML-ready abstraction) | Classifier interface / D1 列 / leakage grep の正本 |
| 上流 | FU-03-C #548 (offline replay) | candidate 評価ロジックの正本 |
| 上流 | `.github/workflows/cf-audit-log-monitor.yml` | hourly run の参照 |
| 上流 | `scripts/cf-audit-log/classifier/ml.ts` | candidate load 経路 |
| 上流 | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | leakage grep gate |
| 関連 | aiworkflow-requirements observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook | SSOT 同期先 |
| external | Gate-R0〜R3 通過 | 次世代 artifact 実投入の前提 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md` | 起票元 unassigned-task |
| 必須 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/index.md` | 親タスク仕様 |
| 必須 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md` | 親タスク実装ガイド |
| 必須 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/unassigned-task-detection.md` | FU-02 起票元 |
| 必須 | `.github/workflows/cf-audit-log-monitor.yml` | hourly run 参照 |
| 必須 | `scripts/cf-audit-log/classifier/ml.ts` | candidate load 経路 |
| 必須 | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | leakage grep gate |
| 参考 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rotation runbook 同期先 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | SSOT 同期先 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | SSOT 同期先 |

## AC（Acceptance Criteria）

- AC-1: artifact rotation runbook が `docs/30-workflows/runbooks/ml-model-artifact-rotation.md`（または `15-infrastructure-runbook.md` の "ML model artifact rotation" セクション）に追記され、candidate evaluation → canary → promotion → rollback の 4 段が 1 ページで読める
- AC-2: `scripts/cf-audit-log/rotation/artifact-canary.ts` が candidate path（op 参照）を input に取り、staging で offline replay + leakage grep を実行し JSON 出力する
- AC-3: canary 結果 JSON に `precisionProxy` / `recallProxy` / `fallbackRate` / `p95LatencyMs` / `leakageHits` を必須 field として含む
- AC-4: leakage grep が positive のとき `artifact-canary.ts` は exit 1 で fail し、PR / promotion を阻止する
- AC-5: rollback 手順は `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` の op 参照値を 1 つ前の artifact path に戻す PR 1 行で完結し、D1 列 `classifier_version` を削除しない
- AC-6: `ML_MODEL_PATH` / `..._CANDIDATE` の op 参照のみで実値は仕様書・コミット・log に出ない（grep gate test を含める）
- AC-7: focused test pass、global typecheck/lint は既存 `@sentry/*` known-failure 以外の新規エラー 0 件
- AC-8: `bash scripts/cf.sh` ラップ。`wrangler` 直接実行ゼロ
- AC-9: SSOT（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）に rotation 手順が反映
- AC-10: PR 本文に `Refs #549, #587` を含み、issue は閉じない（`Closes` を使わない）
- AC-11: raw feature dataset がコミット・artifact upload に含まれない grep evidence（`outputs/phase-11/evidence/dataset-grep.log`）を取得
- AC-12: Phase 12 で本サイクル外（次世代 model 学習 / 自動 rotation スケジューラ / 通知拡張）が `outputs/phase-12/unassigned-task-detection.md` に未タスクとして起票される

## 実装ファイル一覧（抜粋・Phase 5/6 で詳細確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/cf-audit-log/rotation/artifact-canary.ts` | 新規 | candidate を staging で load + offline replay + leakage grep（dry-run） |
| `scripts/cf-audit-log/rotation/rotation-evidence-collector.ts` | 新規 | canary / baseline / rollback evidence を JSON で集約 |
| `scripts/cf-audit-log/rotation/__tests__/artifact-canary.test.ts` | 新規 | canary focused test |
| `scripts/cf-audit-log/rotation/__tests__/rotation-evidence-collector.test.ts` | 新規 | evidence collector focused test |
| `.github/workflows/cf-audit-log-artifact-canary.yml` | 新規 | `workflow_dispatch` で candidate path を input に取る canary workflow |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | 参照 | candidate artifact load 時に流用（再実装しない） |
| `scripts/cf.sh` | 参照 | candidate artifact 配布の wrapper |
| `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` | 新規 | rotation runbook 4 段（candidate evaluation / canary / promotion / rollback） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | rotation セクション追記（runbook 本体と相互リンク） |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | rotation telemetry / canary evidence schema 追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | `..._CANDIDATE` op 参照新設追記 |

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点 | phase-01.md |
| 2 | 既存実装調査（#549 成果 / workflow / runbook / leakage grep） | phase-02.md |
| 3 | 設計（candidate evaluation / canary workflow / rollback / evidence schema） | phase-03.md |
| 4 | 環境準備 / 前提条件確認（着手 Gate-R0 と staging verify） | phase-04.md |
| 5 | データモデル / artifact path schema / evidence JSON schema | phase-05.md |
| 6 | 実装サイクル handoff（関数シグネチャ / PR diff contract） | phase-06.md |
| 7 | 整合性検証（#549 / SSOT） | phase-07.md |
| 8 | エラーハンドリング / fallback / leakage 防止 | phase-08.md |
| 9 | テスト計画（unit / canary dry-run / leakage grep） | phase-09.md |
| 10 | デプロイ / canary workflow 起動手順 / rollback runbook | phase-10.md |
| 11 | 実行 evidence（NON_VISUAL: typecheck / lint / canary dry-run / leakage grep result） | phase-11.md / outputs/phase-11/main.md |
| 12 | 実装ガイド・未タスク（次世代 model 学習・自動 rotation）・skill feedback | outputs/phase-12/* |
| 13 | PR 作成（`Refs #549, #587`） | outputs/phase-13/main.md |

各 Phase 詳細は `phase-NN.md` を参照（Phase 1-13 は本仕様書で確定済み）。

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md) ・ [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## Phase 状態

| Phase | state | 根拠 |
| --- | --- | --- |
| 1-10 | completed | contract / design / handoff を作成済み |
| 11 | completed_local_evidence | typecheck / lint / focused tests / canary dry-run / rotation evidence / leakage / dataset grep を取得済み |
| 12 | completed | strict 7 outputs、same-wave SSOT sync、artifacts parity を配置済み |
| 13 | blocked_pending_user_approval | commit / push / PR はユーザー明示承認まで実行禁止 |

## Decision Log

| 日付 | 決定 |
| --- | --- |
| 2026-05-10 | 本 root は `implemented_local_runtime_pending / implementation / NON_VISUAL` として閉じる。Issue #587 / #549 はどちらも CLOSED 維持。rotation scripts / canary workflow / local fixture canary evidence は same-wave 実装済み、production artifact promotion は Gate-R0〜R3 と user approval 後の runtime operation に分離する。PR 文脈は `Refs #549, #587` のみを使い、Issue state mutation は行わない。 |

## DoD（Definition of Done・全 Phase 共通）

- [ ] AC-1〜AC-12 すべての evidence が `outputs/phase-11/` 配下に保存されている。
- [ ] `pnpm typecheck` は既存 `@sentry/*` dependency missing 以外の新規エラー 0 件であることを記録する。
- [ ] `pnpm lint` は既存 `@sentry/*` dependency missing 以外の新規エラー 0 件であることを記録する。
- [ ] focused Vitest（artifact-canary / rotation-evidence-collector）すべて pass。
- [ ] candidate artifact 投入の実 rotation merge は Gate-R0〜R3 通過後にのみ別サイクルで行う旨が runbook に明記されている。
- [ ] secret leakage grep gate が `artifact-canary.ts` 内で適用され、検出時 fail することが test で確認されている。
- [ ] D1 列 `classifier_version` の forward-safe 性が staging migration list で再確認されている（破壊的 DOWN は実施しない）。
- [ ] SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）が更新されている。
- [ ] Phase 12 の 7 必須ファイルが `outputs/phase-12/` に実体として存在する。
- [ ] PR 本文に `Refs #549, #587` を含み、issue は閉じない（`Closes` を使わない）。
- [ ] raw feature dataset が commit / artifact upload に含まれていない grep evidence が取得されている。
