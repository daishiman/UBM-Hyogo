# Phase 3: アーキテクチャ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

Phase 2 採用 diff が CI/CD アーキテクチャ全体（branch protection / required status checks / 他 job 依存）に与える影響を確認し、PASS / MINOR / MAJOR / NO-GO 戻り先を確定する。

## アーキテクチャ確認項目

| 観点 | 確認内容 | 確認コマンド |
| --- | --- | --- |
| `coverage-gate` の required status check 登録 | dev / main の branch protection で `coverage-gate` が required になっているか | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection \| jq '.required_status_checks.contexts'` |
| `needs: [ci]` の依存整合 | `ci` job が pass しないと coverage-gate が走らない設計が維持されているか | yml 内 `needs:` キー grep |
| 他 job への影響 | `deploy` / `e2e` 等の後段 job が `coverage-gate` の continue-on-error に依存していないか | `grep -n "needs:" .github/workflows/ci.yml` |
| skip path | implementation readiness check (`steps.ready.outputs.value`) が false の場合 step 全体が skip され job は success に保たれる動作が維持されているか | yml 内 `if:` 条件確認 |

## 影響範囲レビュー

- branch protection が `coverage-gate` を required にしていない場合、hard gate 化しても merge ブロッカーにならない（warn と等価）。Phase 11 で `gh api ... protection` の実測値を取得し、必要な場合も本タスク内の Phase 12 evidence と readiness gate に吸収し、未タスク化しない。
- skip path（monorepo bootstrap 前）は引き続き job success のままだが、本リポジトリは bootstrap 済みのため通常パスでは skip されない。

## PASS / MINOR / MAJOR / NO-GO

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| PASS | yml diff 適用後に `coverage-gate` が PASS、coverage-guard exit 0、branch protection 影響なし | Phase 4 へ |
| MINOR | branch protection に未登録だが hard gate 化自体は機能する | Phase 4 進行可。本タスク内で readiness gate として追跡 |
| MAJOR | 他 job が `coverage-gate` の continue-on-error 挙動に暗黙依存しており壊れる | Phase 2 へ戻り設計再検討 |
| NO-GO | Task C / D 未完了 / main CI で metric < 80% | 本タスク中断、Task C/D へ差戻し |

## Phase 4 開始条件

- Phase 1 の GO 判定が出ている
- Phase 2 yml diff がレビュー済
- Phase 3 PASS 判定が記録されている

## Phase 13 blocked 条件

- coverage-gate dry-run で意図せず fail
- main 取り込み後の CI run が赤
- branch protection の context 名 drift（job 名変更）が発生

## 上流文書整合チェック

- `docs/30-workflows/completed-tasks/coverage-80-enforcement/`（存在時）と本タスクの位置付け（PR3/3）が一致しているか確認
- 親 wave `ci-test-recovery-coverage-80-2026-05-04` の Phase 3 architecture と Task E スコープが一致しているか確認

## 成果物

- `outputs/phase-3/phase-3-architecture-review.md`

## 完了条件

- [ ] PASS / MINOR / MAJOR / NO-GO の戻り先記載
- [ ] branch protection 影響を実測 or 仕様確認で明記
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）維持を completion 条件に明記
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] gate 重複明記（Phase 1/2/3）と整合
- [ ] simpler alternative の戻り経路が Phase 2 と矛盾しない

## 次 Phase

Phase 4（テスト設計）。
