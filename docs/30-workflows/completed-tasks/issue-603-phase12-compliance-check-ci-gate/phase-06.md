# Phase 6: 周辺実装（workflow / fixture）

## 目的

`.github/workflows/verify-phase12-compliance.yml` と pass / fail fixture を実装する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 変更対象ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `.github/workflows/verify-phase12-compliance.yml` | 新規 | PR 起動 / workflow 自身・`package.json`・`docs/30-workflows/**`・検証 script/test/fixture・canonical template の paths filter / Node 24 / pnpm 10 / `pnpm test:phase12-compliance` + `pnpm verify:phase12-compliance` 実行 |
| `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | 9 canonical heading 全て含む |
| `scripts/__tests__/fixtures/phase12-compliance/pass/artifacts.json` | 新規 | `workflow_state=spec_created` |
| `scripts/__tests__/fixtures/phase12-compliance/fail-missing-file/outputs/phase-12/.gitkeep` | 新規 | compliance-check.md が無い root |
| `scripts/__tests__/fixtures/phase12-compliance/fail-missing-file/artifacts.json` | 新規 | `workflow_state=spec_created` |
| `scripts/__tests__/fixtures/phase12-compliance/fail-missing-heading/outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | heading 9 項目中 1 つ欠落 |
| `scripts/__tests__/fixtures/phase12-compliance/fail-missing-heading/artifacts.json` | 新規 | `workflow_state=spec_created` |
| test 内 short template | 新規 | Required Sections が 1 件しか無い drift-detection 入力 |

## workflow 骨格

```yaml
name: verify-phase12-compliance
on:
  pull_request:
    paths:
      - 'docs/30-workflows/**'
      - '.github/workflows/verify-phase12-compliance.yml'
      - 'package.json'
      - 'scripts/verify-phase12-compliance.ts'
      - 'scripts/lib/phase12-compliance/**'
      - 'scripts/__tests__/verify-phase12-compliance.test.ts'
      - 'scripts/__tests__/fixtures/phase12-compliance/**'
      - '.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md'
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: jdx/mise-action@v2
      - run: pnpm install --frozen-lockfile
      - name: Verify phase-12 compliance
        env:
          GITHUB_BASE_REF: origin/${{ github.base_ref }}
        run: |
          git fetch origin ${{ github.base_ref }}
          pnpm test:phase12-compliance
          pnpm verify:phase12-compliance
```

## 完了条件

- [ ] workflow yaml の syntax 確認（`actionlint` 等あれば実行）
- [ ] fixture 3 種 + short template test 入力を配置
- [ ] focused test（Phase 9）が fixture と changed-root collection を検証する path を確定

## Next Phase

- [Phase 7](phase-07.md): 横断整備
