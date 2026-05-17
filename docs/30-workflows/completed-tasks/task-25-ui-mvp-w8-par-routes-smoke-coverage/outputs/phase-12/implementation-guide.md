# Implementation Guide

## Part 1: 中学生レベル

なぜこの matrix が必要かというと、テストが「どの画面を守っていて、どの部品はまだ直接見ていないか」を人間が同じ表で確認できるようにするためです。何をしたかは、その確認表を current worktree の事実に合わせて作ったことです。

たとえば、この matrix は建物の点検表のようなものです。画面という部屋が 19 個あり、17 個は外から実際に開けて確認でき、2 個は内側の部品として点検方法を別に書きます。

### 今回作ったもの

今回は実際に自動で巡回している URL が 17 個で、`error.tsx` と `loading.tsx` は部品として存在するけれど安定して開く専用 URL がありません。そのため、表では 17 個を実行済み smoke、2 個を component surface と分けて書く `SMOKE-COVERAGE-MATRIX.md` を作りました。

## Part 2: 技術者レベル

`SMOKE-COVERAGE-MATRIX.md` は current worktree の smoke contract を SSOT とし、17 regular URL entries と 2 deterministic component fixture routes を列挙する。visual baseline は `apps/web/playwright/tests/visual/*.spec.ts` の 4 ファイルに限定する。

Token axis は runtime computed style を全行で再検査せず、既存 `verify-design-tokens / verify-design-tokens` gate に委譲する。A11y axis は current smoke の Axe profileに合わせ、`error.tsx` と `loading.tsx` は deterministic `/smoke` fixture で runtime observation を記録する。

### 型定義

```ts
type CoverageAxis = 'status' | 'dom' | 'token' | 'a11y' | 'interaction'

interface SmokeCoverageRow {
  surface: string
  auth: 'public' | 'member' | 'admin' | 'public surface'
  status: string
  domAssertion: string
  tokenAxis: 'TOKEN-SSOT'
  a11y: 'A11Y-DEFAULT' | 'fixture-runtime-observation'
  interactionSmoke: string
  visualBaseline: string
  existingSpec: string[]
}
```

### CLIシグネチャ

```bash
validateTask25SmokeCoverageMatrix <workflow-dir>
```

### 使用例

```bash
grep -E '^\\| [0-9]+ \\|' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md | wc -l
rg -n "path: '" apps/web/playwright/tests/full-smoke.spec.ts
ls apps/web/playwright/tests/visual/*.spec.ts
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage
```

Use the commands as a static verification API: the matrix row count must be 19, the executable route count must be 17, and the visual baseline list must stay at 4 until a later visual-baseline task changes that contract.

### エラーハンドリング

If a static verification command returns a count different from the expected contract, keep `workflow_state=spec_created` and update the matrix before claiming Phase 12 consistency.

### エッジケース

Component-only surfaces are intentionally not counted as executable URL entries.

### 設定項目と定数一覧

| Case | Handling |
| --- | --- |
| `error.tsx` deterministic throw route | Covered by `/smoke/error-boundary` and `staging-smoke.spec.ts` |
| `loading.tsx` deterministic latency control | Resolved by `task-25-followup-loading-state-observation-fixture` via `/smoke/loading-state` |
| workflow step label says `Run 19-route smoke` | Treat as stale label; current executable contract is the `ROUTES[]` array |
| token drift check changes name | Update the matrix CI gate reference and aiworkflow inventory in the same wave |

### テスト構成

| Layer | Source |
| --- | --- |
| URL smoke | `apps/web/playwright/tests/full-smoke.spec.ts` |
| Visual baseline | `apps/web/playwright/tests/visual/*.spec.ts` |
| Phase output validator | `validate-phase-output.js` |
| Phase 12 heading gate | `pnpm run verify:phase12-compliance` |
