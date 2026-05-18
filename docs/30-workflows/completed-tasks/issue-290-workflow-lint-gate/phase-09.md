# Phase 9: 品質ゲート

[実装区分: 実装仕様書]

## 品質ゲート

| Gate | 内容 | コマンド / 確認 | Pass 条件 |
| --- | --- | --- | --- |
| G1 | actionlint clean | `./actionlint -color .github/workflows/*.yml` | exit 0 |
| G2 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| G3 | lint | `mise exec -- pnpm lint` | exit 0 |
| G4 | CI workflow-shell-lint pass | GitHub Actions tab | success |
| G5 | 自己 lint 残置 | rg 確認 | 2 ファイルで hit |
| G6 | runbook / decision 存在 | file 存在確認 | 両方 exist |
| G7 | yamllint 非導入 | `! command -v yamllint || true` を CI で要求しない | yamllint 依存なし |
| G8 | artifacts parity | `cmp -s artifacts.json outputs/artifacts.json` | exit 0 |
| G9 | Phase 12 strict 7 | `find outputs/phase-12 -maxdepth 1 -type f` | 7 canonical files 以上 |
| G10 | same-wave sync | `rg -n "Issue #290|workflow lint gate" .claude/skills/aiworkflow-requirements` | canonical references hit |

## 不合格時の対応

- G1 失敗: 該当 workflow を最小修正 → 再実行
- G4 失敗: ログから actionlint error を抽出し G1 と同じフロー

## カバレッジ目標

| 指標 | 現状 | 目標 | 達成 |
| --- | --- | --- | --- |
| actionlint カバー workflow | 11/32 (34%) | 32/32 (100%) | Phase 5 完了時 |
| yamllint 採否文書化 | 0% | 100% | Phase 2 outputs 配置時 |
| runbook 整備 | 0% | 100% | Phase 5 完了時 |

## タスク100%実行確認【必須】

- [ ] G1-G10 を Phase 11 / Phase 12 evidence に記録する
