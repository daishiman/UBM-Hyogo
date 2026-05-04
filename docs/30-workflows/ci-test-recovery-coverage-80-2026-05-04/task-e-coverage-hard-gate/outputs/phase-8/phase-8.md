# Phase 8: 統合テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

workflow yml 変更が他 CI job（`ci`、deploy 系）と矛盾しないことをローカル / GitHub Actions 双方で確認する。

## 統合観点

| 観点 | 確認内容 | コマンド / 手順 |
| --- | --- | --- |
| `needs: [ci]` 連鎖 | `ci` job が pass しないと `coverage-gate` が走らない設計が維持 | `grep -A2 "coverage-gate:" .github/workflows/ci.yml` |
| 他 workflow への影響 | `.github/workflows/*.yml` の中で `coverage-gate` を `needs:` に持つ workflow がないか | `grep -rn "coverage-gate" .github/workflows/` |
| skip path | bootstrap 前の skip 動作が壊れていないか | yml の `if: steps.ready.outputs.value` 条件確認 |
| upload-artifact | `Upload coverage report` step が `if: always()` のまま、hard gate 後も artifact 取得可能か | yml 内該当 step 確認 |

## ローカル CI 模擬実行

```bash
# 全 workflow の lint
for f in .github/workflows/*.yml; do
  echo "== $f =="
  yamllint "$f" || echo "yamllint failed: $f"
done

# coverage-guard 単独実行（CI と同じ env）
CI=true bash scripts/coverage-guard.sh
```

## 成果物

- `outputs/phase-8/integration-check.md`（統合観点の確認結果）

## 完了条件

- [ ] 4 観点すべて確認済
- [ ] yamllint exit 0
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）維持
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] 他 workflow への影響 grep が実施されている
- [ ] upload-artifact の always() 維持が確認されている

## 次 Phase

Phase 9（品質検証）。
