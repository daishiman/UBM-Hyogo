# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 5 |
| 状態 | implemented-local |
| visualEvidence | NON_VISUAL |

## 実装方針

既存の `.claude/skills/task-specification-creator/scripts/validate-*.js` と同じ ESM / node:test 形式に揃える。外部 schema engine dependency は追加せず、既存 `validate-schema.js` と同等の軽量検証を採用する。

## 実装手順

1. `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json` を追加する。
2. `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js` を追加する。
3. validator は必須 key、enum、重複 id、安全な workflow 相対 path、任意の `--check-existence` を検証する。
4. `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs` で正常系 / schema 違反 / enum 違反 / 重複 id / path 不存在 / path 存在を固定する。
5. root `package.json` に `validate:phase11-paths` を追加する。
6. 親 Issue #549 に `outputs/phase-11/canonical-paths.json` を追加し、`phase-11.md` と `outputs/phase-11/main.md` から参照する。
7. Phase 11 evidence と Phase 12 strict 7 outputs を配置する。

## 検証コマンド

```bash
node .claude/skills/task-specification-creator/scripts/validate-schema.js \
  --schema schemas/phase11-evidence-canonical-paths.schema.json \
  --data docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json

node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs

pnpm validate:phase11-paths \
  docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json \
  --check-existence

pnpm validate:phase11-paths
pnpm typecheck
pnpm lint
pnpm indexes:rebuild
```

## 禁止事項

commit / push / PR 作成はユーザー承認後のみ。Phase 5 では実装と検証ログ取得までに限定する。

## DoD

- [x] schema ファイルが存在する
- [x] validator CLI が存在する
- [x] validator test が存在する
- [x] package script が存在する
- [x] 親 Issue #549 manifest が存在する
- [x] Phase 11 / Phase 12 outputs が存在する

## 成果物

- `outputs/phase-05/main.md`
