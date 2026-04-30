# Phase 01: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 1 |
| タスク種別 | implementation |
| visualEvidence | VISUAL（GitHub Actions UI 実行ログ / branch protection required status checks 画面のスクリーンショット） |
| workflow | spec_created |
| GitHub Issue | #204（CLOSED のまま spec_created で構築。Issue ライフサイクルと仕様作成行為を切り離す） |

## 目的

上位原則「trusted context では untrusted PR code を checkout / install / build / eval しない」を **実 workflow ファイルへ実装適用** するための前提条件・スコープ境界・リスクを Phase 1 で固定する。上流 dry-run 仕様（`docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/`）の design / review / test-matrix / runbook を input として継承し、本タスクが「実 workflow 編集」「4 系統 dry-run 実走」「VISUAL evidence 取得」の 3 軸で完結することを宣言する。

## 実行タスク

- 真の論点 4 つを `outputs/phase-1/main.md` に固定する：
  - (a) `pull_request_target` の triage 専用化を実 workflow `.github/workflows/pr-target-safety-gate.yml` に適用する。
  - (b) untrusted build / lint / test を実 workflow `.github/workflows/pr-build-test.yml`（`pull_request` trigger）へ実分離する。
  - (c) fork PR / same-repo PR / labeled trigger / workflow_dispatch audit の 4 系統で dry-run を **実走** し、`gh run view --log` 上で secrets / token 露出ゼロを目視確認する。
  - (d) GitHub Actions UI の job 実行ログと branch protection の required status checks 画面を **スクリーンショット（VISUAL evidence）** として `outputs/phase-11/screenshots/` に保存する。
- スコープ境界を確定する：実 workflow 編集（追加 / 既存 triage workflow の境界調整）と dry-run 実走を本タスクで完了させる。secrets rotate（UT-GOV-002-OBS）/ OIDC `id-token: write` 化評価（UT-GOV-002-EVAL）/ security review 最終署名（UT-GOV-002-SEC）は別タスクへ委譲する。
- 命名 canonical を上流 dry-run 仕様と同期する：`pull_request_target safety gate` / `triage workflow`（= `pr-target-safety-gate.yml`）/ `untrusted build workflow`（= `pr-build-test.yml`）/ `pwn request pattern`。
- 横断依存を登録する：上流 = UT-GOV-002（dry-run 仕様）、前提 = UT-GOV-001（branch protection apply 完了で required status checks が設定済み）/ UT-GOV-007（`uses:` の SHA pin 完了）、並列 = UT-GOV-002-EVAL / SEC / OBS。
- 非スコープを明示する：secrets rotate / OIDC 化 / security review 最終署名 / secrets inventory automation / branch protection JSON の本適用 / action pin policy の本適用。
- リスクを列挙する：
  - **R-1** pwn request パターン（`pull_request_target` 下で PR head の checkout / install / build を行うと GITHUB_TOKEN 高権限下で untrusted code が実行される）。
  - **R-2** PR head checkout 混入（既存 triage workflow に PR head 参照が残ったまま統合される）。
  - **R-3** `actions/checkout` の `persist-credentials: false` 未指定によるトークン残留と副作用。
  - **R-4** required status checks の job 名 drift（workflow job 名変更が branch protection 設定と非同期化する）。
- 用語集の初版を `outputs/phase-1/main.md` に列挙する（pull_request_target / pull_request / pwn request / triage / persist-credentials / GITHUB_TOKEN / fork PR / required status checks / VISUAL evidence）。
- メタ固定値を確認する：タスク種別 `implementation` / visualEvidence `VISUAL` / scope `infrastructure_governance + security` を artifacts.json と Phase 1 で一致させる。

## 参照資料

- `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/index.md`
- `docs/30-workflows/unassigned-task/UT-GOV-002-IMPL-pr-target-safety-gate.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/index.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-3/review.md`
- `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`
- `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-template-core.md`

## 成果物

- `outputs/phase-1/main.md`

## 統合テスト連携

本 Phase は要件定義のため統合テストは実行しない。Phase 11（手動テスト）で実走する 4 系統 dry-run（fork PR / same-repo PR / labeled / workflow_dispatch audit）の入口条件（前提リスク R-1〜R-4 の解消観点）を main.md に予告として記述するに留める。

## 完了条件

- [ ] 真の論点 4 つ（(a)〜(d)）が main.md に明記されている。
- [ ] 上流 dry-run 仕様 / UT-GOV-001 / UT-GOV-007 の依存関係が列挙されている。
- [ ] 命名 canonical が上流 dry-run 仕様と一致している。
- [ ] 非スコープ宣言（secrets rotate / OIDC 化 / security 最終署名 / OBS）が明記されている。
- [ ] リスク R-1〜R-4 が main.md に列挙されている。
- [ ] 用語集初版が main.md に記載されている。
- [ ] タスク種別 `implementation` / visualEvidence `VISUAL` / scope `infrastructure_governance + security` が固定されている。
- [ ] artifacts.json の Phase 1 status が `spec_created` で同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
