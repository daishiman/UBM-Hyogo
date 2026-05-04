# ci-test-recovery-coverage-80-2026-05-04 — 実行順序ガイド

| 項目 | 値 |
| --- | --- |
| 起票日 | 2026-05-04 |
| 起票根拠 | main ブランチ CI run 25297513424 (2026-05-04T02:04Z) で apps/web 36/61 test 失敗 + apps/api 13 test 失敗 + coverage<80% baseline 継続 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 全タスク数 | 5 (wave-1 並列 2 + wave-2 並列 2 + wave-3 直列 1) |
| 担当 worktree | `.worktrees/task-20260504-104916-wt-9`（本仕様書 root の起点） |

---

## 起票背景

### CI 失敗の確定状況（main run 25297513424 / 2026-05-04T02:04Z）

| scope | 失敗内容 | 根本原因仮説 |
| --- | --- | --- |
| apps/web | 36 test files failed / 25 passed (61 total) | 全失敗が `Failed to resolve import "react/jsx-dev-runtime"` で停止。`react` は `apps/web/package.json` のみに宣言されており、root vitest（`vitest.config.ts` を `--root=../..` で起動）の deps optimizer / pnpm hoisting が `react/jsx-dev-runtime` サブパスを CI 環境で解決できていない。ローカルでは `node_modules/react/jsx-dev-runtime.js` が hoist されているため再現しないことがある。 |
| apps/api | 13 test 失敗で coverage 計測不能（baseline 2026-05-01） | 既存 wave doc `ut-coverage-2026-05-wave/README.md` に記録。test ファイルは 104 件存在（`apps/api/src/**/*.test.ts`）。 |
| coverage | apps/web total 39.39 / 68.01 / 43.51 / 39.39 (Stmts/Branches/Funcs/Lines) | Issue #320 wave で部分対応済みだが本 wave 未完。 |

### coverage baseline 2026-05-01

| package | Lines | Branches | Functions | Statements |
| --- | ---: | ---: | ---: | ---: |
| packages/shared | 96.79 | 87.67 | 100 | 96.79 |
| packages/integrations/google | 89.16 | 80.6 | 88.23 | 89.16 |
| packages/integrations | 100 | 100 | 100 | 100 |
| **apps/web** | **39.39** | **68.01** | **43.51** | **39.39** |
| apps/api | 計測不能 | 計測不能 | 計測不能 | 計測不能 |

### 既存 wave との関係

- `docs/30-workflows/ut-coverage-2026-05-wave/` — 同一スコープの既存仕様。`ut-web-cov-01/03/04` は完了済み (`completed-tasks/`)。`ut-web-cov-02-public-components-coverage` と `ut-08a-01-public-use-case-coverage-hardening` は完了済み完成扱い。
- 残課題: (1) CI 上で apps/web vitest が起動しない jsx-dev-runtime 解決問題、(2) apps/api 13 test failure 修復後の coverage 引き上げ、(3) coverage-gate hard gate 化。
- 本 wave は **既存 wave の後段ブロッカー解消 + hard gate 化** に集中する。spec 重複は避け、既存 completed 仕様は参照のみ。

---

## 実行順序

```
[wave-1: 並列]                          [wave-2: 並列]                            [wave-3: 直列]
                                       ┌─ Task C (web coverage 39→80%)       
Task A (jsx-dev-runtime fix) ─────────▶│                                  ──▶ Task E (coverage-gate hard gate 化)
Task B (api 13 test failure repair) ──▶└─ Task D (api coverage 0→80%)         
```

| Wave | Task ID | 役割 | 依存 |
| ---- | ------- | ---- | ---- |
| wave-1 | Task A | apps/web vitest 環境修復（react/jsx-dev-runtime 解決） | なし |
| wave-1 | Task B | apps/api 13 件 test 失敗修復 | なし |
| wave-2 | Task C | apps/web カバレッジ 39%→80% 補強（残未達ファイル） | Task A 完了 |
| wave-2 | Task D | apps/api カバレッジ →80% 補強 | Task B 完了 |
| wave-3 | Task E | coverage-gate hard gate 化（`continue-on-error` 削除 + 閾値検証 + threshold drift 防止） | Task C + D 完了 |

### 並列性の根拠

- Task A (web 環境) と Task B (api test code) は対象パッケージが完全分離。`pnpm-lock.yaml` 競合のみリスク。
- Task C (web src + test) と Task D (api src + test) は対象パッケージが完全分離。
- Task E は両 wave-2 の coverage 達成を前提とするため直列。

---

## 共通仕様

- AC 数値目標: Statements ≥80% / Branches ≥80% / Functions ≥80% / Lines ≥80%（全パッケージ）
- 検証経路: `bash scripts/coverage-guard.sh` exit 0
- Phase 12 必須 7 成果物: `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`
- 不変条件: #5（D1 access は apps/api に閉じる）/ #6（GAS prototype 不昇格）。CONST_007（後送り禁止）を全 5 タスクに適用。

---

## 後続エージェント向け参照ファイル

| 用途 | パス |
| --- | --- |
| skill 正本 | `.claude/skills/task-specification-creator/SKILL.md` |
| Phase テンプレ | `.claude/skills/task-specification-creator/references/phase-template-core.md` 他 |
| 既存 wave 仕様 | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` |
| 既存 precondition 完了仕様 | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` |
| 既存 web 完了仕様 | `docs/30-workflows/completed-tasks/ut-web-cov-{01,02,03,04}-*/` |
| coverage gate 仕様 | `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-12/implementation-guide.md` |
| CI workflow | `.github/workflows/ci.yml` (job: coverage-gate, line 56-110) |
| coverage 検証 script | `scripts/coverage-guard.sh` |
| root vitest config | `vitest.config.ts` |
| web package | `apps/web/package.json` (react 19.2.5 dep / @vitejs/plugin-react は root) |
| api package | `apps/api/package.json` |
| pnpm workspace | `pnpm-workspace.yaml` |
| 本 wave 設計書 | `outputs/phase-{1,2,3}/phase-*.md` |
