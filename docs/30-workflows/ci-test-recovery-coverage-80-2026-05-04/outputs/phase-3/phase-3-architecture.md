# Phase 3: アーキテクチャ・タスク分解

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-04 |
| 依存 Phase | Phase 1（要件） / Phase 2（設計） |

## 目的

- Task A-E のそれぞれを独立した task spec workflow として parent-local `task-*` canonical dir に配置し、Phase 1-13 仕様書を実体化する。
- 後続仕様書の配置先 / 対象ファイル群 / 依存グラフ / wave 分割を確定する。
- PASS / MINOR / MAJOR の戻り先と Phase 4 開始条件 / Phase 13 blocked 条件を明示する。

## 後続タスク一覧

各 task spec は本 wave root と同階層に独立 dir として展開する（既存 `ut-coverage-2026-05-wave` パターンを踏襲）。

| Task | 配置先 dir | wave | 依存 | taskType | visualEvidence | 想定 PR 数 |
| --- | --- | --- | --- | --- | --- | --- |
| Task A | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-a-jsx-dev-runtime-resolve/` | wave-1 | なし | implementation | NON_VISUAL | 1 |
| Task B | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-b-apps-api-test-recovery/` | wave-1 | なし | implementation | NON_VISUAL | 1 |
| Task C | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-c-apps-web-coverage-80/` | wave-2 | Task A | implementation | NON_VISUAL | 1 |
| Task D | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-d-apps-api-coverage-80/` | wave-2 | Task B | implementation | NON_VISUAL | 1 |
| Task E | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/` | wave-3 | Task C, D | implementation | NON_VISUAL | 1 |

## 依存グラフ

```
              wave-1                    wave-2                    wave-3
            ┌─────────┐               ┌──────────┐               
            │ Task A  │ ────────────▶ │  Task C  │ ─┐
            │  (env)  │               │ (web cov)│  │
            └─────────┘               └──────────┘  │  ┌─────────┐
                                                    ├─▶│ Task E  │
            ┌─────────┐               ┌──────────┐  │  │  (gate) │
            │ Task B  │ ────────────▶ │  Task D  │ ─┘  └─────────┘
            │ (api fix)│              │ (api cov)│
            └─────────┘               └──────────┘

並列実行可能: A‖B (wave-1) / C‖D (wave-2)
直列必須: A→C, B→D, {C,D}→E
```

## Task 別 詳細仕様（後続エージェント向け input）

### Task A: apps/web vitest jsx-dev-runtime 解決

| 項目 | 内容 |
| --- | --- |
| 目的 | apps/web の test runner で `react/jsx-dev-runtime` import 解決を成立させ、61 件 test を CI で起動可能にする |
| 採用案 | Phase 2 設計の **案 1**: root `package.json#devDependencies` に `react@19.2.5` `react-dom@19.2.5` `@types/react@19.2.7` `@types/react-dom@19.2.3` を追加（apps/web と完全一致） |
| 想定変更ファイル | `package.json` (root) / `pnpm-lock.yaml` / 必要なら `vitest.config.ts` |
| 検証 | `pnpm install --frozen-lockfile` → `pnpm --filter @ubm-hyogo/web test` exit 0 / `bash scripts/coverage-guard.sh --package @ubm-hyogo/web` で coverage-summary.json 生成 |
| Phase 4 開始条件 | Phase 1-3 完了 + apps/web の現状失敗ログ取得済み |
| Phase 13 blocked 条件 | CI で jsx-dev-runtime 失敗が再発、または apps/web test 失敗が新規発生 |
| 上流ブロッカー | なし（wave-1 起点） |

### Task B: apps/api 13 test failure 修復

| 項目 | 内容 |
| --- | --- |
| 目的 | apps/api の 13 件 test 失敗を修復し coverage-summary.json 生成を可能にする |
| 想定対象 | `apps/api/src/middleware/*.test.ts` / `apps/api/src/repository/{,__tests__}/*.test.ts` / `apps/api/src/health-db.test.ts` のうち失敗中の 13 件（実ログ取得で確定） |
| 想定変更ファイル | `apps/api/src/**/*.test.ts` (失敗 13 件) / 必要に応じ `apps/api/src/**/*.ts` 実装側 / `apps/api/migrations/*.sql` 検証 / `apps/api/tsconfig*.json` |
| 検証 | `pnpm --filter @ubm-hyogo/api test` exit 0 / `pnpm --filter @ubm-hyogo/api test:coverage` で `apps/api/coverage/coverage-summary.json` 生成 |
| Phase 1 必須先行アクション | `pnpm --filter @ubm-hyogo/api test 2>&1 \| tee outputs/phase-1/api-test-baseline.log` で 13 件の実体特定 |
| 注意 | 既存 `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` が完了扱いなので、再発分（main 取り込み後の新規 regression）として扱い差分原因を Phase 1 で記録する |

### Task C: apps/web coverage 39%→80%

| 項目 | 内容 |
| --- | --- |
| 目的 | apps/web の coverage 全 metric を ≥80% に到達させる |
| 想定対象 | Phase 1 scope inventory のディレクトリ群（components/ui の残 6, components/admin/public の残未達分, lib/admin, lib/api/me-requests*, lib/url, lib/fetch） |
| 想定変更ファイル | `apps/web/src/**/__tests__/*.test.{ts,tsx}` (新規/拡充) / 必要なら被テストコードの testability 改善（純粋関数化 / DI 化） |
| 検証 | `pnpm --filter @ubm-hyogo/web test:coverage` の summary が全 metric ≥80% / `bash scripts/coverage-guard.sh --package @ubm-hyogo/web` exit 0 |
| 上流ブロッカー | Task A 完了（vitest 起動できないと coverage 計測不能） |
| 例外処置 | 80% 到達不能ファイルは `vitest.config.ts` の `coverage.exclude` に追加し、理由を `outputs/phase-12/unassigned-task-detection.md` に明記（CONST_007 後送り回避） |
| 既存資産活用 | `ut-web-cov-{01,02,03,04}` 完了仕様の `outputs/phase-2/` を参照し、duplicate test を作らない |

### Task D: apps/api coverage →80%

| 項目 | 内容 |
| --- | --- |
| 目的 | apps/api の coverage 全 metric を ≥80% に到達させる |
| 想定対象 | Task B 完了後に `apps/api/coverage/coverage-summary.json` から未達ファイルを抽出して確定 |
| 想定変更ファイル | `apps/api/src/**/*.test.ts` (新規/拡充) |
| 検証 | `pnpm --filter @ubm-hyogo/api test:coverage` 全 metric ≥80% / `bash scripts/coverage-guard.sh --package @ubm-hyogo/api` exit 0 |
| 上流ブロッカー | Task B 完了（coverage 計測成立後でないと未達ファイル特定不能） |
| 既存資産 | `ut-08a-01-public-use-case-coverage-hardening`（completed-tasks 配下）を参照、duplicate を避ける |

### Task E: coverage-gate hard gate 化

| 項目 | 内容 |
| --- | --- |
| 目的 | `.github/workflows/ci.yml` の `coverage-gate` job を hard gate 化し、80% 未達時 CI を fail させる |
| 想定変更ファイル | `.github/workflows/ci.yml` (line 56-110, `continue-on-error: true` を job レベル + step レベル両方から削除) / `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-12/implementation-guide.md` (PR3/3 完了マーク) |
| 検証 | yml grep / dev ブランチで dry-run（80% 未達状態を作って fail することを確認）/ main 取り込み後の CI run が green |
| 上流ブロッカー | Task C + Task D 両方完了（coverage 80% 達成後でないと hard gate 化で main CI が即赤化） |
| Phase 13 blocked 条件 | dry-run で意図せず fail / main 取り込み後 CI 赤 |

## 実装エージェントへの作業指示テンプレ

各 Task を実装するエージェントは、配置済み Phase 1-13 仕様書と `artifacts.json` を正本として以下を遵守すること。

1. 配置先 dir: 上表「配置先 dir」を使用。同階層に `index.md` / `artifacts.json` / `phase-*.md` (1-13) / `outputs/phase-*/` を生成。
2. メタ情報: `taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created`。
3. 不変条件: CLAUDE.md の #5 (D1 access apps/api 限定) / #6 (GAS prototype 不昇格) を継承。
4. coverage AC: Statements/Branches/Functions/Lines いずれも ≥80%。`bash scripts/coverage-guard.sh` exit 0 を Phase 6/9/11 完了条件に必ず記載。
5. Phase 11 evidence (NON_VISUAL): `coverage-result.md` / `regression-check.md` / `manual-evidence.md` の 3 点を必須。
6. Phase 12 必須 7 ファイル: `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`。
7. CONST_007: 各 Task で発生した未解決事項は別 PR / 別 wave に送らず、本 Task の `unassigned-task-detection.md` に「除外理由付き 0 件 close」「設定 exclude 採用」「fixture 追加で確定」などの形で吸収する。

## PASS / MINOR / MAJOR 戻り先

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| PASS | 全 AC を満たし validation matrix 全コマンド exit 0 | Phase 4 へ進む |
| MINOR | 個別ファイル除外で coverage 80% 達成可能、または fixture 不足のみ | Phase 4 で fixture 補強、追跡テーブルへ記録 |
| MAJOR | 案 1 で jsx-dev-runtime 解決不能 / Task B test 失敗が 13 件超に増加 / coverage 80% 不達 | Phase 2 へ戻り Fallback 案検討、最悪は scope 縮退 |

## NO-GO 条件（Phase 13 blocked）

- main 取り込み後の CI run が赤（jsx-dev-runtime 再発 / 新規 test failure / coverage<80%）
- coverage-gate hard gate 化後 dev ブランチで 80% 未達 PR が merge 可能になっている
- pnpm-lock.yaml が wave 内で衝突未解消

## simpler alternative の検討

| 検討案 | 採否 | 理由 |
| --- | --- | --- |
| jsx-dev-runtime 失敗の test だけ skip して PR を出す | ✗ | AC-2 違反 / coverage 計測も成立しないため根本解決にならない |
| coverage threshold を一時的に 50% に下げる | ✗ | AC-7 / coverage-80-enforcement 仕様書違反 |
| Task A-E を 1 PR に統合 | △ | レビュー困難・rollback 困難。原則 5 PR とし、wave 内並列のみ可 |
| Task C/D を ut-coverage-2026-05-wave の wave-2 に戻す | ✗ | 既存 wave は完了済みファイル群を含むため重複が発生する。残未達分のみを Task C/D に集約する方が clean |

## 参照資料

| 参照資料 | パス |
| --- | --- |
| Phase 1 | `outputs/phase-1/phase-1-requirements.md` |
| Phase 2 | `outputs/phase-2/phase-2-design.md` |
| Phase テンプレ | `.claude/skills/task-specification-creator/references/phase-template-core.md` §「Phase 3 のポイント」 |
| 既存 wave | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` |
| 完了済み precondition | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` |
| 完了済み web cov | `docs/30-workflows/completed-tasks/ut-web-cov-{01,02,03,04}-*/` |
| coverage-gate 既存仕様 | `docs/30-workflows/completed-tasks/coverage-80-enforcement/` |
| CI workflow | `.github/workflows/ci.yml` |

## 完了条件

- [x] Task A-E の配置先 dir / 依存 / wave / taskType / visualEvidence 確定
- [x] 各 Task の対象ファイル群と検証コマンド明示
- [x] 依存グラフ図示
- [x] PASS / MINOR / MAJOR / NO-GO 戻り先記載
- [x] simpler alternative 検討記録
- [x] 実装エージェント向け作業指示テンプレ記載

## 次 Phase

Phase 4（テスト設計）以降は Task A-E それぞれの workflow root で個別に展開する。本 wave root の Phase 4-13 は Task A-E 全完了時の集約 evidence ハブとして機能する（Phase 11 は各 Task の evidence link 集約 / Phase 12 は本 wave 全体の implementation guide）。
