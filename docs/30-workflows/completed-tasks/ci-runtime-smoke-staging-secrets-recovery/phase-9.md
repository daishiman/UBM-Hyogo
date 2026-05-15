# Phase 9: 品質保証

## 実行コマンド

```bash
# 1. YAML lint
mise exec -- pnpm exec actionlint .github/workflows/runtime-smoke-staging.yml \
                                  .github/workflows/verify-workflow-doc-refs.yml

# 2. shell lint
shellcheck scripts/ci/verify-workflow-doc-refs.sh \
           scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh

# 3. guard 単体実行
bash scripts/ci/verify-workflow-doc-refs.sh

# 4. テストスイート
bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh

# 5. lefthook で staged file の lint 通過確認
mise exec -- pnpm lint
```

## 判定基準

| 項目 | PASS 条件 |
|------|-----------|
| actionlint | warning 0 / error 0 |
| shellcheck | error 0（info は許容） |
| guard 単体実行 | exit 0 + `OK (N references checked across M files)` |
| テストスイート | 全 TC PASS、`SUMMARY: 7 passed / 0 failed` |
| `pnpm lint` | 既存 pass を維持 |

## 既存テスト破壊リスク

- `runtime-smoke-staging.yml` の修正は error メッセージ文字列のみ。挙動同値。
- 新規 workflow は paths filter で `.github/workflows/**` 変更時のみ trigger。既存 backend-ci には影響なし。
