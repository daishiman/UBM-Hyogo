# Phase 7 — カバレッジ確認 (task-01)

## 観点

YAML 修正のため line coverage 概念は適用しない。代わりに **「変更影響範囲が想定通り閉じているか」** を grep ベースで検証する。

## 影響範囲 grep 検証

### 1. `cache: pnpm` の残存箇所

```bash
grep -rn "cache: pnpm" .github/
```

期待結果:
- `.github/actions/setup-project/action.yml` 内の `cache: pnpm` 直書きが **0 件** (本 PR で `${{ inputs.cache }}` 化)
- 他ワークフローで `actions/setup-node@v4` 直呼びの `cache: pnpm` は本 PR で変更しない

### 2. `${{ inputs.cache }}` 参照箇所

```bash
grep -rn "inputs.cache" .github/actions/setup-project/action.yml
```

期待: 1 件 (`actions/setup-node@v4` step のみ)。`mise` 経路で誤って参照していないことを確認。

### 3. `cache: ''` 追加箇所

```bash
grep -rn "cache: ''" .github/workflows/
```

期待: `ci.yml` の `workflow-shell-lint` job のみ 1 件。

### 4. composite outputs 不変

```bash
grep -A2 "^outputs:" .github/actions/setup-project/action.yml
```

期待: `node-version` / `pnpm-version` / `setup-strategy` の 3 つが変更なしで存在。

## 副作用範囲の閉じ込め確認

| 検証 | 期待 | 実コマンド |
| ---- | ---- | ---------- |
| 変更ファイル数 | 2 | `git diff --name-only dev...HEAD \| wc -l` |
| 変更ファイル内訳 | `action.yml` + `ci.yml` のみ | `git diff --name-only dev...HEAD` |
| diff 行数 | +8 / -1 程度 | `git diff --stat dev...HEAD` |
| 他 workflow YAML への変更 | 0 | `git diff --name-only dev...HEAD -- .github/workflows/ \| grep -v '^.github/workflows/ci.yml$' \| wc -l` (0 期待) |

## 結論

影響範囲が `setup-project` composite の `cache` 制御と `workflow-shell-lint` caller の 1 箇所に閉じていることを上記 grep で機械的に保証する。
