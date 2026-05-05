# タスク仕様書: Issue #475 — branch protection に coverage-gate required context を追加

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-475-branch-protection-coverage-gate |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/475 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001.md` |
| 親 wave | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/`（historical source。current worktree で親 wave cleanup 差分がある場合でも、本タスクは source unassigned-task と `.github/workflows/ci.yml` を実行時正本にする） |
| 配置先 | `docs/30-workflows/issue-475-branch-protection-coverage-gate/` |
| 作成日 | 2026-05-05 |
| 状態 | runtime_evidence_captured_gate_b_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — GitHub branch protection を `gh api PUT` で実適用するためコード（CLI 実行 / docs 更新）変更を伴う。ユーザー指定が closed Issue ベースの仕様書化であっても、目的（hard gate を merge gate として実機能化）達成には repo settings 変更と SSOT ドキュメント (`deployment-branch-strategy.md`) 同期が必須のため CONST_004 に従い実装仕様書として作成する。 |
| 優先度 | HIGH |
| 想定 PR 数 | 1（`docs/30-workflows/issue-475-...` + source unassigned-task status link + aiworkflow applied-evidence indexes。Gate A は外部適用済みとして fresh GET で観測済み。commit/push/PR と throwaway PR の経験的 merge gate 観測は Gate B 承認後） |
| coverage AC | 適用外（CI/CD 設定 + docs のみ。ソースコード変更なし） |

## 目的

`ci-test-recovery-coverage-80-2026-05-04` Task E で `coverage-gate` job を hard gate 化したが、GitHub branch protection の `required_status_checks.contexts` に `coverage-gate` が登録されていないため merge gate として機能していない。本タスクで `main` / `dev` 両ブランチの branch protection に `coverage-gate` を追加し、coverage 80% 未達 PR が merge できない状態を確定する。SSOT である `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の current applied 表も同 wave で同期する。

## スコープ

### 含む

- `gh api PUT /repos/daishiman/UBM-Hyogo/branches/main/protection` で `required_status_checks.contexts` に `coverage-gate` を append
- `gh api PUT /repos/daishiman/UBM-Hyogo/branches/dev/protection` で同様に追加（main 安定確認後）
- 適用前 / 適用後の fresh GET evidence 取得・drift 検証
- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の current applied 表更新
- 既存 contexts (`ci` / `Validate Build` 等) を破壊しないこと

### 含まない

- branch protection の他項目（`required_pull_request_reviews` / `lock_branch` / `enforce_admins` など fresh GET で得た現行値）の変更
- 新規 CI job 追加（Task E で実装済み）
- coverage 閾値 80% 自体の見直し
- `.github/workflows/ci.yml` の修正

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Task E hard gate 化 | context 名 `coverage-gate` を GitHub 内部 DB に登録するため main 上で1回以上 success が必要（PR #477 で main merge 済） |
| 上流 | Task C / D coverage 80% 達成 | hard gate 化前提の閾値達成が main に取り込まれていること |
| 下流 | 全 PR | 完了後 `coverage-gate` 失敗で merge button が disabled になる |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| Task E hard gate 化 main 取り込み済 | `gh run list -b main -w ci.yml --limit 5` で main 最新 CI に `coverage-gate` job が success 1 件以上 |
| Task C/D coverage 80% main 取り込み済 | `gh run view <ID> --log` で全 metric ≥80% |
| Gate A: external PUT 承認 | 消化済み（外部適用後の fresh GET evidence を Phase 11 に保存）。追加 PUT は実行しない |
| Gate B: git publish 承認 | commit / push / PR 作成は Phase 13 直前に別途確認 |

## 苦戦箇所・知見（unassigned-task からの継承）

1. **context 名の登録タイミング**: 対象 job が GitHub Actions で1回以上完走しないと内部 DB に context 名が登録されず PUT 422。事前に `gh run list -b main -w ci.yml` で確認必須。
2. **既存 contexts 破壊防止**: `gh api PUT .../protection` は contexts を全置換する。GET → append → PUT の順で完全配列を渡す（`jq` で組み立て）。
3. **dev / main の段階適用**: dev を先に hard gate 化すると Task A-E 自身の merge が block される可能性。**main → dev の2段階**で適用する。
4. **solo 開発 invariant 維持**: `required_pull_request_reviews` / `lock_branch` / `enforce_admins` など既存 protection 値は fresh GET の現行値を正として触らない。PUT 前後で normalized diff により `coverage-gate` 追加以外の drift がないことを確認。

## DoD（完了条件）

- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` の `required_status_checks.contexts` に `coverage-gate` が含まれる
- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の同 contexts に `coverage-gate` が含まれる
- [ ] solo 開発 invariant 3点 drift なし
- [ ] 既存 contexts (`ci` / `Validate Build` 等) が消えていない
- [ ] `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` の current applied 表更新
- [ ] coverage 未達 検証 PR で merge button が disabled になる挙動を1件確認

## 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/475
- unassigned-task spec: `docs/30-workflows/unassigned-task/task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001.md`
- 実装根拠: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/outputs/phase-12/implementation-guide.md`
- branch protection SSOT: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
- 過去先例: `docs/30-workflows/unassigned-task/UT-19-github-branch-protection-manual-apply.md`

## Phase 一覧

| Phase | 目的 | 状態 |
| --- | --- | --- |
| 1 | 要件定義・GO 判定 | spec_created |
| 2 | PUT body 設計（main / dev） | spec_created |
| 3 | アーキテクチャ確認（影響範囲） | spec_created |
| 4 | 検証シナリオ設計 | spec_created |
| 5 | 実装（PUT 実行 + SSOT 更新） | spec_created |
| 6 | カバレッジ確認（適用外） | spec_created |
| 7 | カバレッジ判定（適用外） | spec_created |
| 8 | 統合テスト（context 連携） | spec_created |
| 9 | 品質検証 | spec_created |
| 10 | 最終レビュー・rollback 経路 | spec_created |
| 11 | 手動テスト / runtime evidence | runtime_evidence_captured_merge_pr_empirical_pending |
| 12 | ドキュメント整備（必須7成果物） | completed_runtime_evidence_synced_gate_b_pending |
| 13 | コミット・PR 作成（blocked placeholder） | blocked_pending_gate_b_git_publish_and_empirical_pr |

## Phase Links

- [Phase 1](phase-01.md)
- [Phase 2](phase-02.md)
- [Phase 3](phase-03.md)
- [Phase 4](phase-04.md)
- [Phase 5](phase-05.md)
- [Phase 6](phase-06.md)
- [Phase 7](phase-07.md)
- [Phase 8](phase-08.md)
- [Phase 9](phase-09.md)
- [Phase 10](phase-10.md)
- [Phase 11](phase-11.md)
- [Phase 12](phase-12.md)
- [Phase 13](phase-13.md)
