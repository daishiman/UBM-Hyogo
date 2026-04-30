# Phase 04: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 4 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

UT-GOV-002（dry-run 仕様）が固定した観点を **実 workflow 編集 + 実 dry-run 実走** に適用するためのテスト計画を Phase 4 で確定する。`outputs/phase-4/test-matrix.md` を「実走するテスト」として読めるよう書き直し、各テストの期待結果・証跡パス・VISUAL 取得タイミングを Phase 5 ランブックが参照できる形で固定する。

## 実行タスク

- `outputs/phase-4/test-matrix.md` に dry-run マトリクスを表形式で記述する：

  | ID | シナリオ | trigger | 期待結果 | 証跡 |
  | --- | --- | --- | --- | --- |
  | T-1 | same-repo PR | `pull_request` | `pr-build-test.yml` が `permissions: { contents: read }` のみで build / test を完走、secrets 露出ゼロ | `outputs/phase-11/manual-smoke-log.md#T-1` + GitHub Actions UI スクショ |
  | T-2 | fork PR | `pull_request` | fork head が checkout されるが secrets 非参照、`GITHUB_TOKEN` は read 限定 | `#T-2` + run log + UI スクショ |
  | T-3 | labeled trigger | `pull_request_target.types: [labeled]` | `pr-target-safety-gate.yml` が label 操作のみ実行、PR head の checkout / install / test なし | `#T-3` + UI スクショ |
  | T-4 | workflow_dispatch audit | `workflow_dispatch` | 手動 audit で secrets 露出が増えないこと、permissions が固定であること | `#T-4` + UI スクショ |
  | T-5 | re-run（手動） | UI 上の re-run | 再実行で job 名・permissions が変わらず required status checks 名が一致すること | `#T-5` + branch protection 画面スクショ |

- 各テストで検証する 4 観点を統一する：(a) `permissions:` の最終効果、(b) `actions/checkout` の `ref` と `persist-credentials: false`、(c) secrets / `GITHUB_TOKEN` の参照有無、(d) `github.event.pull_request.head.*` が trusted job で eval されないこと。
- 静的検査ステップ（実走必須）を記述する：
  - `actionlint .github/workflows/*.yml`
  - `yq '.permissions' .github/workflows/pr-target-safety-gate.yml` => `{}` 期待
  - `yq '.permissions' .github/workflows/pr-build-test.yml` => `{contents: read}` 期待
  - `grep -RnE 'persist-credentials:\s*false' .github/workflows/`（全 checkout で hit）
  - `grep -RnE 'github\.event\.pull_request\.head\.(ref|sha)' .github/workflows/`（trusted workflow で hit ゼロ）
- 動的検査ステップ（承認後の実装実行時に実走）：same-repo PR / fork PR / labeled trigger / workflow_dispatch audit / manual re-run の T-1〜T-5 を実行し、`gh run view <run-id> --log` で grep して secrets / token 文字列が現れないこと、PR head SHA が triage workflow の checkout step に現れないことを確認。
- 失敗判定基準（MAJOR）：(F-1) `pull_request_target` workflow が PR head を checkout、(F-2) `persist-credentials: false` 欠落、(F-3) secrets が fork build に渡る、(F-4) トップレベル `permissions` が広範、(F-5) required status checks 名 drift。
- VISUAL evidence 取得タイミング：T-1〜T-5 の各 run について GitHub Actions UI（run summary / job permissions 表示）と branch protection 画面（required status checks 一覧）のスクリーンショットを `outputs/phase-11/screenshots/` に保存。命名は Phase 11 の `<scenario>-<view>-<YYYY-MM-DD>.png` を正本とする。
- 証跡命名規約：`outputs/phase-4/test-matrix.md`（仕様）、`outputs/phase-11/manual-smoke-log.md`（実走ログ）、`outputs/phase-11/screenshots/`（VISUAL）。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-4/test-matrix.md`（観点の上流正本）
- `outputs/phase-2/design.md`
- `outputs/phase-3/review.md`
- https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target
- https://github.com/rhysd/actionlint

## 成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-matrix.md`

## 統合テスト連携

T-1〜T-5 は Phase 5 runbook の Step 5（dry-run 実走）と Phase 11（手動テスト / VISUAL 取得）で実走する。test-matrix.md は実走テンプレートとして機能し、Phase 6 failure-cases / Phase 7 coverage と相互参照される。

## 完了条件

- [ ] dry-run マトリクス T-1〜T-5 が表形式で記述されている。
- [ ] 静的検査コマンド 5 種（actionlint / yq×2 / grep×2）が記述されている。
- [ ] 動的検査の T-1〜T-5 と `gh run view --log` 手順が記述されている。
- [ ] 失敗判定 F-1〜F-5 が MAJOR として固定されている。
- [ ] VISUAL evidence 取得タイミング・保存先・命名規約が記述されている。
- [ ] artifacts.json の Phase 4 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
