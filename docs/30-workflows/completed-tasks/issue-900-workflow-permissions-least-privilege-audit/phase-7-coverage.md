# Phase 7: カバレッジ

## 7.1 適用範囲

YAML 設定変更のため vitest coverage 対象外。`pnpm test:coverage` 結果に影響を与えない。

## 7.2 構造カバレッジ

| 観点 | カバー方法 |
|------|-----------|
| 全 workflow に top-level permissions | `scripts/verify-workflow-top-level-permissions.sh`（Phase 6） |
| job-level 宣言保持 | `git diff dev` で `^-` 行が permissions block 以外に出ないこと（Phase 4 Gate 4） |
| actionlint 合格 | CI `ci.yml:52-56` step |
| required context 名不変 | `git diff dev -- .github/workflows/` の grep 検証（Phase 4 Gate 3） |

## 7.3 カバレッジ合格条件

Phase 4 の Gate 1〜4 すべて PASS で構造カバレッジ 100%。
