# Phase 12 Output: Implementation Guide

## Part 1: 中学生レベル

観測性マトリクスは「どの警告ランプを見るかを書いた表」。たとえば学校の防災係が、校舎の火災報知器を 5 か所見る必要があるのに、点検表に 2 か所しか書いていなければ、残り 3 か所の異常に気づけない。今回の修正では、05a の手動観測対象にする 5 workflow（`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`）を表へそろえ、ファイル名・画面に出る名前・job id・branch protection の confirmed context を混ぜずに確認できるようにした。

## Part 2: 技術者レベル

`observability-matrix.md` に dev / main の観測対象を追加し、`workflow file` / `display name` / `trigger` / `job id` / `required status context` の分離表を設けた。`required status context` は UT-GOV-001 / UT-GOV-004 の confirmed contexts（`ci` / `Validate Build` / `verify-indexes-up-to-date`）を正とし、`workflow display name / job id` 形式の候補表示と混同しない。

### API / TypeScript / 設定境界

本タスクは docs-only / NON_VISUAL のため、新規 API、TypeScript 型、runtime 定数、環境変数、設定可能パラメータは追加しない。実装仕様として固定する対象は、既存 GitHub Actions workflow の識別子と 05a `observability-matrix.md` に記録する文書契約のみ。

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| TypeScript 型定義 | N/A | アプリケーションコード・shared schema を変更しない |
| API シグネチャ | N/A | HTTP / IPC / repository API を追加しない |
| 使用例 | 下表の識別子参照 | 運用者は workflow file / display name / job id / required context を分けて参照する |
| 設定可能パラメータ / 定数 | N/A | GitHub Actions YAML の現行値を仕様化するだけで、新規設定値は増やさない |

| Contract | Current value |
| --- | --- |
| Task type | docs-only / NON_VISUAL |
| Target workflow set | `ci.yml`, `backend-ci.yml`, `validate-build.yml`, `verify-indexes.yml`, `web-cd.yml` |
| Out-of-scope workflow set | `e2e-tests.yml`, `pr-build-test.yml`, `pr-target-safety-gate.yml` |
| Confirmed required contexts | `ci`, `Validate Build`, `verify-indexes-up-to-date` |
| Notification state | Discord / Slack notification steps are not implemented in the target 5 workflow files |

Edge cases:

- `verify-indexes.yml` is `push: main` and `pull_request: main/dev`; it is not a generic `push: main/dev` workflow.
- Deploy workflows (`backend-ci.yml`, `web-cd.yml`) have deploy jobs but no confirmed required status context in the current branch protection set.
- Scope-out workflow handling is delegated instead of folded into 05a, so future SSOT expansion must happen through `task-ref-cicd-workflow-topology-drift-001` / `UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE`.

## 視覚証跡

本タスクは docs-only / NON_VISUAL のため UI/UX 変更なし。Phase 11 のスクリーンショットは作成しない。代替証跡は `outputs/phase-11/manual-test-result.md` の bash コマンド実行ログ。
