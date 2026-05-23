# Phase 10: 統合テスト

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 10 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## 統合テスト方針

NON_VISUAL tooling タスクのため、E2E / browser テストは行わない。代わりに以下を統合テストとして扱う。

| ID | 検証 | 方法 |
| --- | --- | --- |
| IT-1 | schema + validator + issue-549 instance の三者結合 | Phase 9 Step 3 を CI 環境で再実行 |
| IT-2 | `--check-existence` 経路が repoRoot 解決を正しく行う | self manifest に対して existence gate を実行 |
| IT-3 | npm script 経路（`pnpm validate:phase11-paths`）が直接 node 実行と同一結果 | exit code / stdout 比較 |
| IT-4 | 親 phase-11.md の追記行が schema 参照として valid | `grep` で schema path 文字列存在確認 |
| IT-5 | issue-549 instance JSON が phase-11.md の表と一致 | 表の各行（typecheck / lint / test / build / grep-gate / runtime-observation）が JSON にも 1:1 で存在することを目視 + `jq` 確認 |

## 検証コマンド

```bash
# IT-2
mise exec -- node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js \
  docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json \
  --check-existence

# IT-3
mise exec -- pnpm validate:phase11-paths docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json

# IT-4
grep -F 'phase11-evidence-canonical-paths.schema.json' \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md

# IT-5
mise exec -- node -e "const j=require('./docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json'); console.log(j.evidence.map(e=>e.kind).sort().join(','));"
# => build,grep-gate,lint,runtime-observation,test,typecheck
```

## 期待結果

| ID | 期待 |
| --- | --- |
| IT-1 | exit 0 |
| IT-2 | exit 0 |
| IT-3 | exit 0、stdout が直接実行と一致 |
| IT-4 | 1 件以上 hit |
| IT-5 | 6 種類の kind がすべて含まれる |

## 完了条件

- [x] 統合テスト IT-1〜IT-5 が定義されている
- [x] 検証コマンドが記載されている
- [x] 期待結果が記載されている

## 成果物

- `outputs/phase-10/main.md`

## 参照資料

- `phase-04.md` / `phase-09.md`
