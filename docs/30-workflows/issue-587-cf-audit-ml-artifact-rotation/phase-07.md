# Phase 7: 整合性検証（#549 / SSOT）

## 目的

本タスクの設計が親 #549（production ML switch）/ 上位親 #515（ML-ready abstraction）/ SSOT 3 ファイルと矛盾していないことを検証する。重複実装・不変条件違反・rollback 不整合を排除する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. 親 #549 との整合

| 項目 | #549 の方針 | 本タスクの方針 | 整合性 |
| --- | --- | --- | --- |
| Classifier interface | 親 #515 由来を変更しない | 変更しない | OK |
| `CF_AUDIT_CLASSIFIER` env | production で `ml` 固定 | rotation 中も `ml` 維持。env は変更しない | OK |
| `ML_MODEL_PATH` op 参照 | `..._PROD` のみ | `..._PROD` + 新設 `..._CANDIDATE`（並走） | OK（並走方式で衝突なし） |
| hourly workflow | `cf-audit-log-monitor.yml` で env 切替 | 編集しない。canary は別 workflow に分離 | OK |
| rollback | env 1 行戻し（`threshold` へ） | `..._PROD` op 参照値戻し（rotation rollback） | OK（2 系統並列。互いに干渉しない） |
| D1 列 | forward-safe（削除しない） | 削除しない。`classifier_version` で識別のみ | OK |
| leakage grep | hourly post-step | `artifact-canary.ts` 内で流用 | OK（再実装なし） |
| post-switch-monitor / fallback-rate-alert | hourly run の post-step | 編集しない。promotion 後の運用で連動 | OK |

## 2. 上位親 #515 との整合

| 項目 | #515 の方針 | 本タスクの方針 | 整合性 |
| --- | --- | --- | --- |
| `MLClassifier` skeleton | threshold fallback あり | candidate load 失敗時にも fallback 発動 | OK |
| D1 schema | `classifier_used` / `classifier_version` / `confidence` 追加 | 参照のみ。schema 変更なし | OK |
| `secret-leakage-grep.ts` | hourly post-step + CI gate | candidate load 時にも流用 | OK |

## 3. SSOT 3 ファイルとの整合

| ファイル | 既存内容 | 本タスクで追記 | 整合性 |
| --- | --- | --- | --- |
| `observability-monitoring.md` | §11 系で ML production switch / 7 日観測 | rotation telemetry（candidate / canary / promotion / rollback の 4 段）+ canary evidence JSON schema | OK（既存セクションに追補） |
| `deployment-secrets-management.md` | `CF_AUDIT_ML_MODEL_PATH_PROD` op 参照記載 | `..._CANDIDATE` / `..._PREVIOUS` op 参照新設の field name のみ追記。実値非記載 | OK |
| `15-infrastructure-runbook.md` | rollback runbook（env 戻し） | rotation セクション追記。runbook 本体（`docs/30-workflows/runbooks/ml-model-artifact-rotation.md`）への相互リンク | OK（rollback 経路 2 系統を併記） |

## 4. 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #5 D1 直接アクセス禁止（`apps/api` 経由） | scripts 層なので対象外 |
| `wrangler` 直接実行禁止 | `bash scripts/cf.sh` 経由のみ。canary workflow も同様 |
| 平文 `.env` 禁止 | op 参照のみ。実値は環境変数として揮発的に渡る |
| シークレット redaction | candidate path 実値を log に出さない |
| raw feature dataset 不混入 | grep gate で検証 |
| forward-safe rollback | D1 列削除しない。`..._PROD` 戻しで互換 |

## 5. 重複実装防止チェック

| 既存実装 | 本タスクで再実装しないこと |
| --- | --- |
| `secret-leakage-grep.ts`（#515） | OK。流用のみ |
| `MLClassifier` skeleton（#515） | OK。candidate path を渡すだけ |
| `post-switch-monitor.ts`（#549） | OK。promotion 後の hourly 運用で連動するのみ |
| `fallback-rate-alert.ts`（#549） | OK。rollback トリガとして連動するのみ |
| `cf-audit-log-monitor.yml`（#549） | OK。canary は別 workflow |

## 6. 衝突可能性 / リスク

| 衝突候補 | 対策 |
| --- | --- |
| candidate と PROD が同時に hourly run で使われる | 本タスクで env を変更しない。candidate は canary workflow（手動起動）でのみ使用 |
| op 参照の field 名衝突 | `..._PROD` / `..._CANDIDATE` / `..._PREVIOUS` の suffix で区別 |
| canary workflow と hourly workflow の同時実行で staging に過負荷 | canary は `workflow_dispatch` のみ・1 hour 分の replay に制限 |
| classifier_version の値が衝突 | model 自身が報告する値に従う。collision は model 側の運用責任 |

## 完了条件

- [ ] 親 #549 / #515 との整合表が完成
- [ ] SSOT 3 ファイルとの整合表が完成
- [ ] 不変条件 6 項目すべて遵守確認
- [ ] 重複実装防止リストが完成
- [ ] 衝突候補とその対策が記録されている

## 参照資料

- `index.md`
- `phase-02.md` ・ `phase-03.md` ・ `phase-06.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/index.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 統合テスト連携

- Phase 9 で `secret-leakage-grep.ts` の流用 test、`post-switch-monitor.ts` 連動 test（mock）を計画。

## 出力

- `outputs/phase-07/main.md`（整合表 + 重複防止リスト + 衝突対策）

## Next Phase

- [Phase 8](phase-08.md): エラーハンドリング / fallback / leakage 防止
