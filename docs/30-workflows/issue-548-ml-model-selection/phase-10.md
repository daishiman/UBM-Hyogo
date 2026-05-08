# Phase 10: デプロイ / モデル artifact 配置 / workflow env / rollback

## 目的

本サイクルでは production switch を行わないため、デプロイ作業は **(1) staging / fixture 上の artifact 配置確認、(2) workflow env 追加（既定値 `threshold` 維持）、(3) rollback 訓練手順の文書化** に限定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## デプロイ作業（本サイクル）

| 項目 | 内容 |
| --- | --- |
| D-1 | `tests/fixtures/cf-audit/labeled-90day.jsonl` / `model-*.json` を repo にコミット（fixture サイズ < 1MB） |
| D-2 | `outputs/phase-11/comparison-metrics.json` / `model-comparison-report.md` を生成し commit |
| D-3 | `.github/workflows/cf-audit-log-monitor.yml` 編集: `CF_AUDIT_IF_MODEL` / `CF_AUDIT_XGB_MODEL` / `CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN` env を job step に渡せるようにする。production 既定は **未設定**（factory が threshold fallback） |
| D-4 | `CF_AUDIT_CLASSIFIER` の production 既定は `threshold` のまま。`isolation-forest` / `xgboost` / `workers-ai` への切替は FU-03-D で実施 |

## モデル artifact 配置（将来計画）

本サイクルでは fixture 配置のみ。本番では以下方針を Phase 12 implementation-guide で記述する:

| artifact | 配置先候補 | 採用方針 |
| --- | --- | --- |
| isolation-forest model | R2 bucket `cf-audit-models/` | FU-03-D で確定 |
| xgboost model | 同上 | FU-03-D で確定 |
| Workers AI | binding 経由 | FU-03-D で `AI` binding 設定 |

## rollback 手順（本サイクルで提供する手順書）

```bash
# 即時 rollback (env 1 行戻し)
gh variable set CF_AUDIT_CLASSIFIER --body "threshold"

# code rollback (factory 変更を revert)
git revert <PR_SHA>

# artifact rollback (model 配置を空に)
gh variable delete CF_AUDIT_IF_MODEL
gh variable delete CF_AUDIT_XGB_MODEL
gh variable delete CF_AUDIT_WORKERS_AI_URL
```

## CI gate

- typecheck / lint / focused test / leakage grep をすべて pass しないと PR mergeable にならない
- comparison report の存在を `outputs/phase-11/` で grep（手動確認）

## 完了条件

- [ ] D-1〜D-4 を `phase-10.md` に記述
- [ ] rollback 3 段階手順を確定
- [ ] production 既定値が `threshold` のままであることを確認

## 出力

- `phase-10.md`

## 参照資料

- `index.md`
- 親 #515 phase-10
- `.github/workflows/cf-audit-log-monitor.yml`

## 統合テスト連携

- D-3 の workflow 編集差分を Phase 11 evidence で確認

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 の成果物を上流契約として参照する。
