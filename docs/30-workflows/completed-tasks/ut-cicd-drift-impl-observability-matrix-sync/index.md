# UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| task_id | UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC |
| 機能名 | observability-matrix-workflow-name-sync |
| 親タスク | UT-CICD-DRIFT |
| GitHub Issue | [#286](https://github.com/daishiman/UBM-Hyogo/issues/286) |
| 作成日 | 2026-05-01 |
| 優先度 | 高 |
| 規模 | 小規模 |
| カテゴリ | 改善 / docs-only |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| ステータス | spec_created |
| 総Phase数 | 13 |

---

## 真の論点

`docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` が `ci.yml` / `validate-build.yml` のみを観測対象として列挙しており、本タスク対象の 5 workflow（`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`）と drift している。`.github/workflows/` には他に `e2e-tests.yml` / `pr-build-test.yml` / `pr-target-safety-gate.yml` も存在するが、本タスクでは Phase 12 の未タスク委譲対象として扱い、05a の手動観測 SSOT へは混ぜない。

本タスクは SSOT を 5 本へ同期し、workflow file name / display name / trigger / job id / required status context を分離した mapping 表と Discord / Slack 通知未実装の current facts を docs にのみ反映する。新規通知実装、branch protection 変更、workflow 構造変更はスコープ外。

## 範囲

### 含む

- SSOT に本タスク対象 5 workflow 全件を列挙する
- 各 workflow の現実体 trigger / job 構造を記述する
- Discord / Slack 通知未実装の current facts 注記を追加する
- Phase 11 NON_VISUAL 必須3点と Phase 12 canonical 7 ファイルを出力する
- 既存未タスク `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC.md` を移管済みに更新する

### 含まない

- `.github/workflows/` の変更
- Discord / Slack 通知の実装
- branch protection の `required_status_checks` 変更
- `08a` / `08b` / `ut-04` など本タスク外 workflow の削除・移動

## 受入条件

- [x] AC-1: `observability-matrix.md` に本タスク対象 5 workflow すべてが列挙される
- [x] AC-2: 各 workflow の trigger と job id が記述される
- [x] AC-3: Discord / Slack 通知未実装の current facts が記載される
- [x] AC-4: Phase 12 documentation-changelog に同期記録が残る
- [x] AC-5: workflow file name / workflow display name / trigger / job id / required status context を分離した mapping 表が記述される

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計 | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | テスト作成 | [phase-04.md](phase-04.md) | spec_created |
| 5 | 実装 (docs sync) | [phase-05.md](phase-05.md) | spec_created |
| 6 | テスト拡充 | [phase-06.md](phase-06.md) | spec_created |
| 7 | カバレッジ確認 | [phase-07.md](phase-07.md) | spec_created |
| 8 | リファクタリング | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | spec_created |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | spec_created |
| 11 | 手動テスト検証 | [phase-11.md](phase-11.md) | spec_created |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | spec_created |
| 13 | PR作成 | [phase-13.md](phase-13.md) | pending_user_approval |

## 依存関係

| 種別 | 対象 | 関係 |
| --- | --- | --- |
| 親 | UT-CICD-DRIFT (#58) | 派生委譲 |
| 関連 | 05a-parallel-observability-and-cost-guardrails | SSOT 提供元 |
| 関連 | UT-GOV-001 / UT-GOV-004 | status context 照合元 |

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 | D1 への直接アクセスは apps/api に閉じる | 影響なし（docs-only） |
| #6 | GAS prototype を本番昇格しない | 影響なし |

## Phase完了時の必須アクション

1. タスク完全実行
2. 成果物確認
3. `artifacts.json` / `outputs/artifacts.json` parity 確認
4. 完了条件チェック明記
