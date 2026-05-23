# Phase 6: テスト拡充

`[実装区分: 実装仕様書]`

## 目的

Phase 5 で追加した最小 2 ケースに加え、latency 境界値・二重ガード・query 不正値の deterministic 観測を拡充し、flake / regression リスクを抑える。

## 追加テストケース

| ID | ケース | 期待値 |
|----|--------|--------|
| TC-04 | `?delay=3500`（上限超過） | `clampDelay` が 3000ms に丸める。boundary 可視 → 3000ms 後に最終 render 可視。所要時間が 3000ms +- 1000ms 範囲 |
| TC-05 | `?delay=abc`（不正値） | 既定 1500ms にフォールバック。boundary 可視 → 最終 render 可視 |
| TC-06 | `?delay=-1`（負値） | 既定 1500ms にフォールバック |
| TC-07 | a11y profile assertion | `await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite")` |
| TC-08 | boundary と最終 render の DOM marker が排他的 | navigation 完了後は `[data-page="smoke-loading-state"]` が detached、`[data-page="smoke-loading-state-fixture"]` のみ可視 |
| TC-09 | fixture guard focused unit | flag absent / production / process env fallback の 3 分岐を `fixture-guard.spec.ts` で固定 |

## 変更対象ファイル

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/tests/e2e/staging-smoke.spec.ts` | 編集 | TC-04..TC-08 を `staging smoke / loading state` describe 内に追加 |
| `apps/web/app/__smoke__/_lib/fixture-guard.spec.ts` | 新規 | TC-09 を追加 |

## 実装上の注意

- TC-04 の所要時間計測は `Date.now()` 差分で行い、上限・下限 tolerance を ±1000ms に設定（CI 環境の noise 吸収）。
- TC-08 では `await expect(page.locator('[data-page="smoke-loading-state"]')).toHaveCount(0)` を最終 render 後に assert。
- remote staging smoke では fixture env が有効な前提のため、guard negative / production 分岐は unit test と Phase 11 local manual evidence に分離する。
- Playwright `test.step` で boundary 観測ステップを分割し、失敗時の root cause をトレースしやすくする。

## ローカル実行コマンド

```bash
mise exec -- pnpm exec playwright test apps/web/tests/e2e/staging-smoke.spec.ts \
  --grep "staging smoke / loading state" --repeat-each=3
```

## DoD（Phase 6）

- TC-01..TC-08 が `--repeat-each=10` で 10 回連続 pass（現行 5 focused Playwright tests = 合計 50 run の flake 率 0%）。
- TC-09 の focused unit test が pass。
- 追加 case による全体所要時間増加が 12 秒未満（CI smoke 予算内）。
