# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Task E（coverage-gate hard gate 化）の AC を確定し、Task C / Task D の完了を実測値で確認した上で、本タスク開始可否（GO / NO-GO）を判定する。

## Step 0: P50 チェック（必須）

```bash
git log --oneline -- .github/workflows/ci.yml | head -20
awk '/^  coverage-gate:/{in_gate=1} in_gate && /^  [A-Za-z0-9_-]+:/{if ($1 != "coverage-gate:") in_gate=0} in_gate && /^[[:space:]]*continue-on-error:/{print; found=1} END{exit found ? 1 : 0}' .github/workflows/ci.yml
grep -n "PR1/3\|PR3/3" .github/workflows/ci.yml scripts/coverage-guard.sh
```

期待: 現在は `coverage-gate` job 範囲に YAML key としての `continue-on-error:` が存在しない。過去のCIが通った原因確認では、base revision 側に `coverage-gate` job と `Run coverage-guard` step の **2 箇所** の `continue-on-error: true` があったことを `git show HEAD:.github/workflows/ci.yml` 等で確認する。

## Phase 1 必須先行アクション（GO 条件確定）

1. **直前 main CI run の coverage 実測確認**:
   ```bash
   gh run list --branch main --workflow ci.yml --limit 3
   gh run view <RUN_ID> --log | grep -E "coverage|Statements|Branches|Functions|Lines" | tee outputs/phase-1/main-ci-coverage-baseline.log
   gh run download <RUN_ID> -n coverage-report -D outputs/phase-1/coverage-artifact/ || true
   ```
2. apps/web / apps/api / packages/* の **全 metric ≥80%** であることを `coverage-summary.json` から検証:
   ```bash
   for f in outputs/phase-1/coverage-artifact/*/coverage-summary.json; do
     echo "== $f =="
     jq '.total | {lines: .lines.pct, branches: .branches.pct, functions: .functions.pct, statements: .statements.pct}' "$f"
   done | tee outputs/phase-1/coverage-baseline-summary.md
   ```
3. **NO-GO 条件**: いずれか 1 metric でも 80% 未満なら CI push 前に Task C（apps/web < 80%）または Task D（apps/api < 80%）へ戻し、その旨を `outputs/phase-1/no-go-decision.md` に記録する。現存 summary が全 metric 80% 以上の場合は hard gate 差分と再発防止テストを進める。

## Acceptance Criteria

- **AC-1**: `.github/workflows/ci.yml` の `coverage-gate` job 定義から `continue-on-error: true` (job レベル) が削除される
- **AC-2**: 同 workflow の `Run coverage-guard` step から `continue-on-error: true` (step レベル) が削除される
- **AC-3**: inline comment の `PR1/3` 文言が `PR3/3 完了 / hard gate 化済` に更新される
- **AC-4**: `gh workflow view ci.yml` で `coverage-gate` job 定義に `continue-on-error` キーが現れない
- **AC-5**: 本タスクのブランチを push し、`coverage-gate` job が PASS したことを runtime evidence として記録（apps/web / apps/api / packages/* 全 metric ≥80% 維持）
- **AC-6**: `bash scripts/coverage-guard.sh` exit 0
- **AC-7**: `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-12/implementation-guide.md`（存在時）に PR3/3 完了履歴が追記される。存在しない場合は `unassigned-task-detection.md` に記録のみで close

## 不変条件

- CLAUDE.md 不変条件 #5 / #6 を継承
- coverage 閾値 80% は引き上げ・引き下げしない（本タスクは continue-on-error 削除のみ）
- workflow yml 編集スコープを `coverage-gate` job 範囲（line 56-110）に限定する

## Gate 重複明記（T-6 AC-5 / Issue #161 対応）

| Phase | gate 表現 |
| --- | --- |
| Phase 1（前提条件） | Task C + Task D 両方完了で main CI の全 metric ≥80% を実測確認 |
| Phase 2（依存順序） | Task C / D 完了前の Phase 4 着手禁止 |
| Phase 3（NO-GO 条件） | metric < 80% / Task C, D 未完了時は本タスクを開始しない |

## 統合テスト連携

- Task C / Task D の coverage evidence を `outputs/phase-1/` に取得し本タスク前提として固定する。
- 本タスク完了後、親 wave `ci-test-recovery-coverage-80-2026-05-04` の Phase 11 集約 evidence に統合する。

## 多角的チェック観点（AI が判断）

- yml diff が job レベル + step レベルで漏れなく適用されているか
- inline comment の更新で gate 履歴（PR1/3 → PR3/3）が後続レビュアーに辿れる形になっているか
- hard gate 化後、緊急時 hotfix で coverage 一時低下が起きた場合の rollback 経路が明示されているか

## サブタスク管理

- [ ] main CI run baseline coverage 取得
- [ ] coverage-baseline-summary.md 作成（全 package 全 metric pct）
- [ ] GO / NO-GO 判定記録

## 成果物

- `outputs/phase-1/main-ci-coverage-baseline.log`
- `outputs/phase-1/coverage-baseline-summary.md`
- `outputs/phase-1/go-no-go-decision.md`

## 完了条件

- [ ] AC-1〜AC-7 がすべて文書化されている
- [ ] main CI baseline で全 metric ≥80% を実測確認、または NO-GO 判定で Task C/D へ差戻し
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（apps/api / apps/web / packages/* 全パッケージ）を Phase 1 baseline で確認
- [ ] `bash scripts/coverage-guard.sh` exit 0 が baseline で取れている

## タスク 100% 実行確認【必須】

- [ ] AC × 7 すべて記載
- [ ] Gate 重複明記 3 箇所
- [ ] NO-GO 条件記載
- [ ] artifacts.json.metadata.visualEvidence = NON_VISUAL を index.md と同期確認

## 次 Phase

Phase 2（設計）。GO 判定後のみ進行。
