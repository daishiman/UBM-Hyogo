# ut-gov-002-impl-pr-target-safety-gate — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-GOV-002-IMPL |
| タスク名 | pull_request_target safety gate 実 workflow 編集と dry-run 実走 |
| ディレクトリ | docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate |
| 上流 | docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/（仕様の正本） |
| 親タスク | UT-GOV-002（dry-run 仕様化） |
| Wave | 2（governance follow-up / dry-run 仕様の実装適用） |
| 実行種別 | spec_created（serial：上流仕様完成後の単独 PR） |
| 作成日 | 2026-04-30 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation |
| visualEvidence | VISUAL（GitHub Actions UI の実行ログ・required status checks 画面のスクリーンショット） |
| scope | infrastructure_governance + security |
| GitHub Issue | #204（CLOSED のまま spec_created で構築。仕様作成行為と Issue ライフサイクルを切り離す） |
| 優先度 | priority:high（fork PR 経由のトークン漏えいリスクを低減する） |

## 目的

上位原則: **trusted context では untrusted PR code を checkout / install / build / eval しない**。本タスクは UT-GOV-002（dry-run 仕様）で固定された設計・runbook・テストマトリクスに基づき、**実 workflow ファイル**を編集し、`pull_request_target` を triage / metadata 操作に限定し、untrusted build / test を `pull_request` workflow に分離する。

実装後は同等の dry-run（fork PR / same-repo PR / labeled trigger / workflow_dispatch audit）を実走し、`gh run view --log` で secrets / token 露出ゼロを目視確認、GitHub Actions UI と branch protection job 名同期のスクリーンショットを `outputs/phase-N/` に保存する。secrets rotate / OIDC 化 / security review 最終署名は対象外（後続別タスクで実施）。

## Decision Log

| 決定 | 理由 |
| --- | --- |
| Issue #204 は CLOSED のまま扱う | Issue ライフサイクルと仕様作成を切り離し、closed issue の再オープンで governance 履歴を乱さないため。 |
| 実 workflow 編集を本タスクに含める | UT-GOV-002 が docs-only に閉じたため、実 workflow への落とし込みは IMPL タスクが担うのが責務分離として最適。 |
| `workflow_run` を採用しない | secrets を fork PR build に橋渡しする経路を作らないため。triage と build/test の分離は trigger 種別だけで完結させる。 |
| visualEvidence: VISUAL に固定 | required status checks の job 名同期は GitHub Actions UI / branch protection 画面でのみ確定できるため、スクリーンショットを必須証跡とする。 |
| secrets rotate / OIDC 化を本タスク外とする | 権限境界変更と認証方式変更を同時実施するとレビュー粒度が荒くなる。実 workflow 編集の reviewability を最優先する。 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- `index.md`（本ファイル）と root / outputs `artifacts.json` の作成
- `.github/workflows/pr-target-safety-gate.yml` の追加または既存 triage workflow の境界調整
- `pull_request_target` を label / metadata 操作に限定（PR head の checkout / install / test を除去）
- untrusted build / test を `pull_request` workflow に分離（`contents: read` のみ）
- workflow デフォルト `permissions: {}` と job 単位昇格、全 `actions/checkout` への `persist-credentials: false` 強制
- fork PR / same-repo PR / labeled trigger / workflow_dispatch audit の dry-run 実走
- GitHub Actions UI / branch protection の required status checks 画面のスクリーンショット保存
- 静的検査（`actionlint` / `yq` / `grep`）の実走と結果保存
- ロールバック手順（単一 revert コミット粒度）の確立

### 含まない

- secrets rotate
- OIDC 化（`id-token: write` 化評価は別タスク UT-GOV-002-EVAL）
- security review の最終署名（別タスク UT-GOV-002-SEC）
- secrets inventory automation（別タスク UT-GOV-002-OBS）
- branch protection JSON の本適用（UT-GOV-001 で実施済み）
- action pin policy の本適用（UT-GOV-007 で実施済み）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | UT-GOV-002（dry-run 仕様） | 設計・runbook・テストマトリクス・"pwn request" 非該当根拠の正本 |
| 上流 | task-github-governance-branch-protection | `pr-target-safety-gate.workflow.yml.draft` の起点 |
| 上流 | UT-GOV-001（github-branch-protection-apply） | dev / main が protected で required status checks 設定済みであること |
| 上流 | UT-GOV-007（github-actions-action-pin-policy） | `uses:` が SHA pin されていることを実装前提とする |
| 並列 | UT-GOV-002-EVAL / SEC / OBS | 評価・セキュリティレビュー・観測自動化は別タスクとして分離（互いに独立） |
| 下流 | （実走後の運用） | required status checks の名前が変わった場合 UT-GOV-004 の追従が必要 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/index.md | 上流仕様の入口 |
| 必須 | docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-2/design.md | 責務分離設計（triage vs build/test） |
| 必須 | docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-3/review.md | "pwn request" 非該当の 5 箇条 |
| 必須 | docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-4/test-matrix.md | dry-run マトリクス T-1〜T-5 |
| 必須 | docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-5/runbook.md | actionlint / yq / gh の実走手順 |
| 必須 | docs/30-workflows/unassigned-task/UT-GOV-002-IMPL-pr-target-safety-gate.md | 本タスクの 1 ページ仕様（起点） |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | required status checks の現状 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md | action pin policy 連携 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 のテンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 参考 | https://securitylab.github.com/research/github-actions-preventing-pwn-requests/ | "pwn request" 解説（GitHub Security Lab） |
| 参考 | https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target | `pull_request_target` 公式仕様 |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主な成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-1/main.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-2/main.md, outputs/phase-2/design.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-3/main.md, outputs/phase-3/review.md |
| 4 | テスト設計 | phase-04.md | spec_created | outputs/phase-4/main.md, outputs/phase-4/test-matrix.md |
| 5 | 実装ランブック | phase-05.md | spec_created | outputs/phase-5/main.md, outputs/phase-5/runbook.md, .github/workflows/pr-target-safety-gate.yml, .github/workflows/pr-build-test.yml（実ファイル） |
| 6 | テスト拡充 | phase-06.md | spec_created | outputs/phase-6/main.md, outputs/phase-6/failure-cases.md |
| 7 | カバレッジ確認 | phase-07.md | spec_created | outputs/phase-7/main.md, outputs/phase-7/coverage.md |
| 8 | リファクタリング | phase-08.md | spec_created | outputs/phase-8/main.md, outputs/phase-8/before-after.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-9/main.md, outputs/phase-9/quality-gate.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動テスト | phase-11.md | spec_created | outputs/phase-11/main.md, outputs/phase-11/manual-smoke-log.md, outputs/phase-11/screenshots/（GitHub Actions UI / branch protection 画面） |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md, outputs/phase-12/implementation-guide.md, outputs/phase-12/system-spec-update-summary.md, outputs/phase-12/documentation-changelog.md, outputs/phase-12/unassigned-task-detection.md, outputs/phase-12/skill-feedback-report.md, outputs/phase-12/phase12-task-spec-compliance-check.md |
| 13 | 完了確認 | phase-13.md | pending | outputs/phase-13/main.md, outputs/phase-13/local-check-result.md, outputs/phase-13/change-summary.md, outputs/phase-13/pr-template.md |

## 受入条件 (AC)

- AC-1: `.github/workflows/pr-target-safety-gate.yml` が `pull_request_target` を triage / metadata 操作（label / コメント / auto-merge 判定）にのみ使用し、PR head の checkout / install / build step が **置かれていない**。
- AC-2: untrusted build / test は `.github/workflows/pr-build-test.yml`（または同等 `pull_request` workflow）に分離され、`permissions: { contents: read }` のみで動作する。
- AC-3: 全 workflow のデフォルト `permissions: {}`、job 単位の最小昇格、全 `actions/checkout` の `persist-credentials: false` の 3 点が満たされていることを `actionlint` / `yq` / `grep` の実走ログで証跡化している。
- AC-4: fork PR / same-repo PR / labeled trigger / workflow_dispatch audit の 4 系統で smoke 実走し、`gh run view --log` 上で secrets / token 露出がないことを目視確認した結果が `outputs/phase-11/manual-smoke-log.md` に記録されている。
- AC-5: GitHub Actions UI と branch protection の required status checks の job 名が同期されているスクリーンショットが `outputs/phase-11/screenshots/` に保存されている。
- AC-6: ロールバック手順（safety gate 適用前へ戻す単一 `git revert` コミット）が Phase 5 / Phase 10 に記述され、required status checks 名 drift の検知コマンド（`gh api repos/:owner/:repo/branches/main/protection`）が併記されている。
- AC-7: GitHub Security Lab の "pwn request" 非該当 5 箇条（PR head 非 checkout / `workflow_run` 非採用 / `head.*` 非 eval / `persist-credentials: false` / 最小 permissions）が Phase 3 / Phase 9 で重複明記されている。
- AC-8: secrets rotate / OIDC 化 / security review 最終署名が本タスク非対象であり、別タスク（UT-GOV-002-EVAL / SEC / OBS）への委譲が Phase 1 / Phase 13 で明記されている。
- AC-9: タスク種別 `implementation` / `visualEvidence: VISUAL` / `scope: infrastructure_governance + security` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。

## 完了条件

- [ ] 13 Phase が揃っている。
- [ ] root `artifacts.json` / `outputs/artifacts.json` / 本 index.md の Phase status が一致している。
- [ ] Phase 13 はユーザー承認待ち（user_approval_required: true）。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
- [ ] Issue #204 は CLOSED のまま扱い、再オープンしない。
