# ut-gov-002-pr-target-safety-gate-dry-run — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-GOV-002 |
| タスク名 | pull_request_target safety gate dry-run / security review |
| ディレクトリ | docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run |
| 親タスク | task-github-governance-branch-protection（completed-tasks 配下） |
| 発見元 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md（U-2） |
| Wave | 1（governance follow-up / 親タスクの U-2 を formalize） |
| 実行種別 | spec_created（serial：親タスク完了後の単独 PR） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only（Phase 1-13 はタスク仕様書整備に閉じ、実 dry-run / security review は後続実装タスクへ分離） |
| visualEvidence | NON_VISUAL |
| scope | infrastructure_governance + security |
| GitHub Issue | #145（CLOSED のまま spec を再構築。仕様作成行為と Issue ライフサイクルを切り離す） |
| 優先度 | priority:high（fork PR 経由のトークン漏えいリスクを低減する） |

## 目的

上位原則: **trusted context では untrusted PR code を checkout / install / build / eval しない**。本タスクでいう dry-run は実走そのものではなく、後続実装タスクが安全に実走できるようにする **dry-run specification / runbook** を指す。

`pull_request_target` を triage（label/auto-merge 判定）のみに限定し、PR code の checkout / install / build を `pull_request` workflow に分離した状態で **dry-run と security review を行う仕様**を Phase 1-13 で固定する。GitHub Security Lab の "pwn request" パターンに非該当であることをレビュー記録として残し、fork PR シナリオにおいて secrets / token が露出しない設計証跡を `outputs/phase-N/` 上で残す。実走証跡は後続 UT-GOV-002-IMPL で取得する。

本ワークフロー自体は **仕様書整備に閉じ**、実 workflow ファイル変更・dry-run の実走・security review の本適用は Phase 5 以降の別 PR で行う前提で粒度を区切る。

## Decision Log

| 決定 | 理由 |
| --- | --- |
| Issue #145 は CLOSED のまま扱う | Issue ライフサイクルと仕様作成を切り離し、closed issue の再オープンで governance 履歴を乱さないため。 |
| 実 workflow 編集は本タスクに含めない | `pull_request_target` の権限境界変更は実装 PR で高密度にレビューし、本タスクは設計・検証観点・証跡テンプレートを固定するため。 |
| trusted / untrusted 境界を最上位原則にする | AC-1〜AC-5 を個別ルールではなく、1つのレビュー判断基準へ集約するため。 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- 親タスク（task-github-governance-branch-protection）完了を必須前提とする依存順序の明文化
- `pull_request_target` / `pull_request` の責務分離設計（triage vs build/test）
- fork PR シナリオ（同一 repo / fork / labeled / scheduled）のテストマトリクス仕様レベル定義
- `permissions: {}` デフォルト＋ job 単位昇格、`persist-credentials: false` 全 checkout 固定の方針記述
- "pwn request" パターン（GitHub Security Lab）非該当のレビュー観点列挙

### 含まない

- 実 `.github/workflows/pr-target-safety-gate.yml` の編集（Phase 5 実装ランブック以降の別 PR）
- 実 dry-run の実走（fork PR / 実 PR を用いた smoke）
- secrets / token の rotate
- branch protection JSON の本適用（UT-GOV-001 で実施済み）
- action pin policy の本適用（UT-GOV-007 で実施済み）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | task-github-governance-branch-protection | `pull_request_target` safety gate 草案・design.md / runbook の正本。Phase 2 §6（pr-target-safety-gate.workflow.yml.draft）を input として継承 |
| 上流 | UT-GOV-001（github-branch-protection-apply） | dev / main が protected であることが dry-run 前提（required status checks が job 名と同期されている状態） |
| 上流 | UT-GOV-007（github-actions-action-pin-policy） | `uses:` が SHA pin されていることを前提に security review 観点を構築 |
| 並列 | UT-GOV-003〜006 | governance 群の並列タスク。互いに独立 |
| 下流 | 実装タスク（別途起票） | 本仕様書を input として、`.github/workflows/` の実編集 / dry-run / security review 実走を担う |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/phase-02.md | safety gate 草案の正本 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | pr-target-safety-gate.workflow.yml.draft |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-3/review.md | 親タスクの security 節（dry-run 観点の input） |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-5/runbook.md | actionlint / yq による静的検査コマンド |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md | U-2 検出根拠 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md | action pin policy の連携 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 前提タスク |
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
| 5 | 実装ランブック | phase-05.md | spec_created | outputs/phase-5/main.md, outputs/phase-5/runbook.md |
| 6 | テスト拡充 | phase-06.md | spec_created | outputs/phase-6/main.md, outputs/phase-6/failure-cases.md |
| 7 | カバレッジ確認 | phase-07.md | spec_created | outputs/phase-7/main.md, outputs/phase-7/coverage.md |
| 8 | リファクタリング | phase-08.md | spec_created | outputs/phase-8/main.md, outputs/phase-8/before-after.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-9/main.md, outputs/phase-9/quality-gate.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動テスト | phase-11.md | spec_created | outputs/phase-11/main.md, outputs/phase-11/manual-smoke-log.md, outputs/phase-11/link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md, outputs/phase-12/implementation-guide.md, outputs/phase-12/system-spec-update-summary.md, outputs/phase-12/documentation-changelog.md, outputs/phase-12/unassigned-task-detection.md, outputs/phase-12/skill-feedback-report.md, outputs/phase-12/phase12-task-spec-compliance-check.md |
| 13 | 完了確認 | phase-13.md | pending | outputs/phase-13/main.md, outputs/phase-13/local-check-result.md, outputs/phase-13/change-summary.md, outputs/phase-13/pr-template.md |

## 受入条件 (AC)

- AC-1: `pull_request_target` 内に PR head の checkout / code execution step が **置かれていない**ことが Phase 2 design.md と Phase 4 test-matrix.md で明示されている。
- AC-2: untrusted build は `pull_request` workflow に分離され、`contents: read` のみで動作する設計が Phase 2 / Phase 5 に記述されている。
- AC-3: fork PR シナリオ（same-repo PR / fork PR / labeled trigger / scheduled trigger / re-run）で token / secret が露出しない設計であることが Phase 4 / Phase 9 で証跡化される。
- AC-4: GitHub Security Lab の "pwn request" パターンに非該当である根拠（PR head checkout 分離・`persist-credentials: false`・最小 permissions）が Phase 3 review.md / Phase 9 quality-gate.md にレビュー記録として残る。
- AC-5: workflow デフォルト `permissions: {}`、job 単位昇格、全 checkout `persist-credentials: false` の 3 点が Phase 2 / Phase 5 / Phase 9 の 3 箇所で重複明記されている。
- AC-6: 親タスク（task-github-governance-branch-protection）の Phase 2 §6 草案を input として継承する旨が Phase 1（前提）/ Phase 2（依存）/ Phase 3（NO-GO 条件）で明記されている。
- AC-7: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance + security` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。
- AC-8: dry-run 実走および workflow 編集は本タスク非対象であり、Phase 5 実装ランブック以降の別 PR で行う旨が Phase 1 と Phase 13 に重複明記されている。
- AC-9: ロールバック設計（`pull_request_target` を従来構成へ revert する単一コミット粒度）が Phase 2 / Phase 5 / Phase 10 に記述されている。

## 完了条件

- [ ] 13 Phase が揃っている。
- [ ] artifacts.json と本 index.md の Phase status が一致している。
- [ ] Phase 13 はユーザー承認待ち（user_approval_required: true）。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
