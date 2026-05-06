# 設計（workflow / collector / artifact schema / token scope） - token-scope-design.md

state: completed
workflow_id: issue-351-09c-post-release-dashboard-automation

## 目的

GitHub Actions workflow、collector、artifact schema、read-only token scope の設計を固定する。

## 証跡

- 本ファイルは task-specification-creator の outputs 実体要件を満たすための仕様書サイクル成果物。
- runtime evidence は後続実装サイクルで同一 path に上書きまたは追記する。

## 完了条件

- [x] 成果物 path が実体化されている
- [x] artifacts.json と outputs/artifacts.json から参照できる
