# Phase 8: 統合テスト（branch protection と CI workflow の連携）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

`coverage-gate` を required context に追加した結果、CI workflow と PR merge gate が **連携して機能する** ことを確認する。

## 統合観点

| 観点 | 確認内容 | コマンド / 手順 |
| --- | --- | --- |
| context 名一致 | `gh api .../protection` の contexts 名と `.github/workflows/ci.yml` の job 名 `coverage-gate` が完全一致 | `gh api ... \| jq '.required_status_checks.contexts'` と `grep '^  coverage-gate:' .github/workflows/ci.yml` |
| GH Actions 履歴 | 適用後の最初の PR で `coverage-gate` が status check として **出現** | `gh pr checks <num>` |
| `needs:` 連鎖 | `coverage-gate` job が `ci` job の success 後に走る現状が維持 | `grep -A2 'coverage-gate:' .github/workflows/ci.yml` |
| 他 workflow 影響 | `coverage-gate` を `needs:` する他 workflow がないこと | `grep -rn 'coverage-gate' .github/workflows/` |
| skip path | bootstrap 前の skip 条件が変わらないこと | yml `if:` 確認 |

## ローカル統合実行

```bash
yamllint .github/workflows/ci.yml | tee outputs/phase-8/yamllint.log
gh workflow view ci.yml | tee outputs/phase-8/workflow-view.log
```

## 成果物

- `outputs/phase-8/integration-check.md`
- `outputs/phase-8/yamllint.log`
- `outputs/phase-8/workflow-view.log`
