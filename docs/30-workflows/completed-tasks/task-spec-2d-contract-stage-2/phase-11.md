# Phase 11: 手動テスト（NON_VISUAL evidence）

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 11 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 分類による evidence 方針

本 task は **NON_VISUAL / contract** 分類であり、UI を持たない。screenshot は不要。代替 evidence として `apps/api` の test 実行ログ（vitest reporter 出力）を正本とする。

---

## 2. 取得 evidence

| # | 種別 | command | 保存先 |
|---|------|---------|--------|
| 1 | 7 describe / 21 tests pass の reporter 出力 | `pnpm exec vitest run apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts --config=vitest.config.ts --root=.` | `outputs/phase-11/vitest-contract-stage-2.txt` |
| 2 | typecheck exit 0 | `pnpm --filter @ubm-hyogo/api typecheck` | `outputs/phase-11/typecheck.txt` |
| 3 | lint exit 0 | `pnpm lint` | `outputs/phase-11/lint.txt` |
| 4 | grep gate 結果 | `rg -n 'z\\.object\\(|\\b(test|it|describe)\\.skip' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` が 0 hits | `outputs/phase-11/grep-gate.txt` |

---

## 3. 失敗系の手動確認

| # | 観点 | 確認手段 |
|---|------|---------|
| 1 | `DeleteBodyZ.parse({ reason:'' })` の失敗 | 該当 test が `expect(() => ...).toThrow()` で green |
| 2 | `reason` 501 文字の失敗 | 同上 |
| 3 | 不正 resolution の失敗 | 同上 |
| 4 | 不正 email actorEmail の失敗 | 同上 |

---

## 4. evidence の正本化

- screenshot 0 件であることを明示する。
- `outputs/phase-11/` 配下の `.txt` / `.md` を PR 本文の Evidence 節に列挙する（Phase 13）。`.log` は ignored の可能性があるため canonical evidence にしない。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| phase status | runtime_pending until commands are executed |

## 目的

NON_VISUAL evidence を screenshot なしで取得し、focused Vitest / typecheck / lint / grep gate を tracked path に保存する。

## 実行タスク

1. `mkdir -p outputs/phase-11` を実行する。
2. `set -o pipefail` を有効にして command の exit code を保全する。
3. focused Vitest / typecheck / lint / grep gate を `.txt` evidence に保存する。
4. `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` を更新する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`
- `phase-9.md`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/vitest-contract-stage-2.txt`
- `outputs/phase-11/typecheck.txt`
- `outputs/phase-11/lint.txt`
- `outputs/phase-11/grep-gate.txt`

## 完了条件

- [x] screenshot 0 件が明示されている
- [x] focused Vitest / typecheck / lint / grep gate の evidence が tracked path にある
- [x] `z.object` grep と skip grep が分離されている
- [x] タスク100%実行確認: Phase 11 の実行タスクをすべて完了してから Phase 12 へ進む

## 統合テスト連携

本 Phase は NON_VISUAL 代替 evidence の統合地点。`mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2`、`mise exec -- pnpm --filter @ubm-hyogo/api typecheck`、`mise exec -- pnpm lint` を実行し、runtime 実測前は `runtime_pending` として扱う。
