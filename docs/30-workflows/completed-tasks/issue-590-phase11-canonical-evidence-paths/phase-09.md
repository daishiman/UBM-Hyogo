# Phase 9: ローカル検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 9 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## ローカル検証コマンド一式

```bash
# 0) Node 環境確認
mise exec -- node -v   # v24.x 期待
mise exec -- pnpm -v   # 10.x 期待

# 1) schema compile
mise exec -- node .claude/skills/task-specification-creator/scripts/validate-schema.js \
  --schema schemas/phase11-evidence-canonical-paths.schema.json \
  --data docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json

# 2) validator unit tests
mise exec -- node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs

# 3) issue-549 instance dry-run validation
mise exec -- node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json

# 4) self manifest の `--check-existence` 経路
mise exec -- node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js \
  docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json \
  --check-existence
echo "exit=$?"

# 5) typecheck / lint（差分起因エラーのみ確認）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 6) npm script 経由
mise exec -- pnpm validate:phase11-paths \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json
```

## 期待結果

| Step | 期待 |
| --- | --- |
| 1 | `schema OK` |
| 2 | テスト全件 pass（T-1〜T-11） |
| 3 | `OK` |
| 4 | self manifest は evidence 実体が存在するため exit 0 |
| 5 | 本 PR 差分起因のエラー 0 件（既存 known failure は許容） |
| 6 | exit 0 |

## 既知 failure boundary

- `pnpm typecheck` / `pnpm lint` はリポジトリ全体 gate のため、必要時は本タスク差分起因エラーの有無を切り分ける。
- 親 #549 の post-merge runtime observation file は本 PR では取得しないため、親 manifest には `--check-existence` を適用しない。

## 完了条件

- [x] 検証コマンド一式が列挙されている
- [x] 期待結果が明記されている
- [x] 既知 failure boundary が記載されている

## 成果物

- `outputs/phase-09/main.md`

## 参照資料

- `phase-04.md` / `phase-05.md`
