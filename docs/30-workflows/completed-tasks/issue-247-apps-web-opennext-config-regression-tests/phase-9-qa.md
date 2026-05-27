# Phase 9 — QA

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. QA コマンド一覧

```bash
# 型チェック
pnpm typecheck

# Lint
pnpm lint

# 本 spec のみ
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts

# web 全 spec 回帰確認
pnpm --filter @ubm-hyogo/web test
```

## 2. CI gate 影響確認

| gate | 期待 |
|------|------|
| `verify-indexes-up-to-date` | drift なし（aiworkflow indexes 反映後に check） |
| `verify-gate-metadata` | 本 workflow `artifacts.json` schema valid |
| `verify-phase12-compliance` | Phase 12 strict 7 + 9 見出し + Phase 11 evidence 表 pass |
| `verify-coverage-exclude-ratio` | 新規 source 0 行のため影響なし |
| `pr-build-test` | spec 1 件追加。pass 期待 |

## 3. 受入確認

| AC | 確認方法 |
|----|---------|
| AC1〜4 | vitest 4 pass |
| AC5 | CI workflow run page で job 名表示・status 確認 |

## 4. DoD

- 上記すべて green
- drift 挿入による fail を Phase 11 で別途確認
