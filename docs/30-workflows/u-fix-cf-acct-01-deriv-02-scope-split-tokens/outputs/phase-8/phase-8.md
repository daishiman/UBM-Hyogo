# Phase 8: リファクタリング判断

## 評価対象

`backend-ci.yml` と `backend-ci.yml` の job 構造はほぼ同一（差分は Secret 名と `--env` 値）のため、reusable workflow `.github/workflows/deploy-shared.yml` への抽出余地がある。

## 抽出する場合の構造

```yaml
# deploy-shared.yml (reusable)
on:
  workflow_call:
    inputs:
      env:
        type: string
        required: true
    secrets:
      CF_TOKEN_WORKERS: { required: true }
      CF_TOKEN_D1: { required: true }
      CF_TOKEN_PAGES: { required: true }
```

```yaml
# backend-ci.yml
jobs:
  deploy:
    uses: ./.github/workflows/deploy-shared.yml
    with: { env: staging }
    secrets:
      CF_TOKEN_WORKERS: ${{ secrets.CF_TOKEN_WORKERS_STAGING }}
      CF_TOKEN_D1:      ${{ secrets.CF_TOKEN_D1_STAGING }}
      CF_TOKEN_PAGES:   ${{ secrets.CF_TOKEN_PAGES_STAGING }}
```

## 判断基準

| 観点 | 抽出する | 抽出しない |
| --- | --- | --- |
| 可読性 | 中央化で◎ | 重複だが直接読める△ |
| デバッグ性 | reusable 経由で job log が間接化△ | 直接 log で◎ |
| 変更追従コスト | 1 ファイル更新で済む◎ | 2 ファイル同期△ |
| solo 運用との適合 | Yes | Yes |

## 採用判定

**採用: 抽出する**（変更追従コストが運用上の最大リスクのため）。ただし staging 7 日 green 達成後の Phase 11 後半で実施し、Phase 5 時点では 2 ファイル並列とする（risk 段階分離）。

## 成果物

- `outputs/phase-8/refactor-decision.md`
- `outputs/phase-8/deploy-shared-yaml-draft.md`
