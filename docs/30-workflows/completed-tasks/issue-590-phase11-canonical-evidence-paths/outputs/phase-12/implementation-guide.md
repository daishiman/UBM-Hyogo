# Implementation Guide

## Part 1: 中学生レベルの説明

Phase 11 の証跡ファイルは「どこに保存するか」を毎回文章だけで書くと、名前や場所が少しずつずれる。そこで、保存場所の一覧を `canonical-paths.json` にして、validator が機械的に確認できるようにした。

## Part 2: 技術者向け

- Schema: `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json`
- Validator: `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js`
- Test: `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs`
- Package script: `pnpm validate:phase11-paths`

`--check-existence` は `workflowDir + evidence[].path` を repo root 配下に解決し、absolute path / `..` traversal / workflow root escape を拒否する。親 workflow の post-merge runtime observation は manifest 上で予約するが、実体存在 gate は実取得サイクルまで適用しない。
