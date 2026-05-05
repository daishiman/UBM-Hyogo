# Lessons Learned: ci-test-recovery-coverage-80-2026-05-04（CI hard gate 化 / TARGETS drift 構造除去）

> 由来: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/`
> 作成日: 2026-05-04
> タスク種別: governance / quality / NON_VISUAL / implementation_started
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,phase12-task-spec-compliance-check,unassigned-task-detection,skill-feedback-report,documentation-changelog}.md`

## 概要

`coverage-80-enforcement` の 3 段階 PR ロードマップ最終段（PR3/3）に相当する hard gate 化を、CI run 25297513424 を起点とする `ci-test-recovery-coverage-80-2026-05-04` の Task E として実装した。

責務分離:

- **`.github/workflows/ci.yml#coverage-gate`**: job/step 両方の `continue-on-error: true` を削除し、coverage 不足を即 fail に昇格
- **`scripts/coverage-guard.sh`**: full mode の `pnpm -r --workspace-concurrency=1 test:coverage` を撤去し、`TARGETS` array (`apps/api`, `apps/web`, `packages/shared`) を `pnpm --filter <name> test:coverage` で逐次実行する形に統一
- **`scripts/coverage-guard.test.ts`**: 「full mode で `-r` を使わない」「CI が `continue-on-error` を含まない」を契約テストとして固定（`spawnSync` + `readFileSync` による静的検査ハイブリッド）

## 正本 4 系（coverage-80-enforcement と同一 SSOT を継承）

| 系 | ファイル | 役割 |
| --- | --- | --- |
| 正本（仕様） | `references/quality-requirements-advanced.md` §カバレッジ閾値設定 | hard gate 化 / 再混入防止 policy 反映 |
| 正本（手順） | `task-specification-creator/references/coverage-standards.md` | 強制経路 3 種は不変 |
| 実行設定 | `vitest.config.ts` の `coverage` セクション | 計測対象は不変 |
| 判定スクリプト | `scripts/coverage-guard.sh` + `scripts/coverage-guard.test.ts` | 実行対象 = 判定対象に固定 |

## 苦戦箇所 3 件

### L-CITR-COV80-001: TARGETS と実行対象の drift（最大の構造的バグ）

`scripts/coverage-guard.sh` の full mode は当初 `cd "$ROOT_DIR" && pnpm -r --workspace-concurrency=1 test:coverage` を呼んでいたが、`pnpm -r` は monorepo root を含むすべての package で `test:coverage` を起動するため、判定対象（`TARGETS=(apps/api apps/web packages/shared)`）と実行対象がズレる。root の `test:coverage` が定義されないと exit 1 で全体が ENV ERROR になる、または root 由来の `coverage/coverage-summary.json` が誤検出される。

- **教訓**: 「実行する package = 判定する package」を不変条件として固定する。`run_tests` 内で `TARGETS` を for-loop し `pnpm --filter <name> test:coverage` を逐次起動する設計に統一。`-r` の便利さは drift コストと釣り合わない。
- **再発防止**: `coverage-guard.test.ts` に「full mode でも `-r` を呼ばない」契約テストを追加（`spawnSync` で `pnpm` を fake binary 化し、引数列に `-r` が現れないことを assert）。シェル実装側にも「Full mode intentionally runs the same TARGETS that are later aggregated」コメントを inline で残し、将来の "シンプル化" 圧力に対する根拠を残す。

### L-CITR-COV80-002: hard gate 化の再混入リスク

`continue-on-error: true` は CI の段階導入で頻繁に挿入されるため、3 段階 PR の最終段で削除しても次の任意の改修で容易に復活する（特に flaky テスト沈静化や緊急 hotfix の局面）。soft → hard 移行を一度成立させても、構造的な再混入防止がないと L-COV80-004（soft → hard 切替忘却）と同型の問題が再発する。

- **教訓**: hard gate の状態を CI YAML 上の inline policy comment と、`coverage-guard.test.ts` の静的検査契約の二段で固定する。ファイル parse + `not.toMatch(/^\s*continue-on-error:/m)` を使い coverage-gate ジョブの段落に対して構造検査する。
- **再発防止**: 同一 wave で `references/deployment-gha.md` / `quality-requirements-advanced.md` / `deployment-branch-strategy.md` の 3 箇所に hard gate 化済み + 再混入防止 policy を反映し、policy drift が起きないようにする（today 確認: 3 ファイル同期済み）。

### L-CITR-COV80-003: branch protection contexts の user-gated 境界

`coverage-gate` job が hard gate 化されても、branch protection の `required_status_checks.contexts` に `coverage-gate` が登録されていなければ、PR は merge 可能なまま fail を視認する状態に留まる。本タスクの code 側は完了するが、登録自体は UT-GOV-001 second-stage reapply と同じ user 承認ゲートに依存する。

- **教訓**: implementation 完了 = governance 完了ではない。Phase 12 で「user-gated 1 件（branch protection PUT）」を unassigned-task として明示分離し、code merge と protection PUT の依存順序を documentation-changelog で 5 重明記する。
- **再発防止**: `docs/30-workflows/unassigned-task/task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001.md` を `task-specification-creator` フォーマットで配置（HIGH / user-gated）。`references/deployment-branch-strategy.md` に「approval 待ち」ノートを残し、fresh GET 取得は承認後に再実施。

## NON_VISUAL Phase 12 Part 1 / Part 2 構成の適用知見

- Part 1（中学生レベル）は coverage-80-enforcement の「カバレッジ通信簿 / 鶏卵問題」例え話を継承し、本タスクは「最終段（hard gate 化）/ 再混入防止 / 配線（branch protection）」の 3 例えに絞る。
- Part 2（開発者技術詳細）は `coverage-guard.sh` の `run_tests` 関数差分、`coverage-guard.test.ts` の `spawnSync` + `readFileSync` 静的検査パターン、CI YAML diff（job/step 両 `continue-on-error` 削除）を網羅する。
- Phase 11 evidence は NON_VISUAL: `coverage-result.md` / `regression-check.md` / `manual-evidence.md` / `manual-smoke-log.md` / `link-checklist.md` の 5 点を Task E `outputs/phase-11/` に置き、runtime evidence は user 承認後の hard gate 実走 CI 結果で確定。

## branch protection / contexts 登録の上流前提（5 重明記継承）

UT-GOV-004 完了 → UT-GOV-001 contexts 登録 → coverage-80-enforcement PR③ hard gate 化（本タスク Task E で実装）→ branch protection contexts に `coverage-gate` 追加（user-gated）。本タスク wave では code merge までを完了し、protection PUT は unassigned-task で別承認 wave に分離する。

## 実行タイミングまとめ

| 操作 | タイミング |
| --- | --- |
| LOGS.md / quality-requirements-advanced / deployment-gha / deployment-branch-strategy / artifact-inventory / lessons-learned 追記 | 本 wave |
| commit / push / PR 作成 | Phase 13 user 承認後 |
| `pnpm indexes:rebuild`（topic-map 再生成） | PR merge 後の別オペレーション |
| branch protection contexts に `coverage-gate` 追加 | PR merge + user 承認後、UT-GOV-001 経由 |

## 関連リソース

- `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/`（Task A〜E、Phase 1-13 仕様書 / outputs）
- `docs/30-workflows/completed-tasks/coverage-80-enforcement/`（前段 PR1/2 の正本ロードマップ）
- `docs/30-workflows/unassigned-task/task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001.md`
- `scripts/coverage-guard.sh` / `scripts/coverage-guard.test.ts`
- `.github/workflows/ci.yml`（`coverage-gate` job / hard gate）
- `references/lessons-learned-coverage-80-enforcement-2026-04.md`（前段 lessons / SSOT 4 系の継承元）
- `references/lessons-learned-utgov001-second-stage-reapply-2026-04.md`（contexts 登録の user-gated 境界）
- `references/quality-requirements-advanced.md` / `references/deployment-gha.md` / `references/deployment-branch-strategy.md`（hard gate 化 policy 同期点）
