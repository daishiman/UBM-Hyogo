# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]`

## 目的

`SMOKE-COVERAGE-MATRIX.md` の `loading.tsx` 行が runtime 観測ステータスへ確実に置換され、5 軸（status / DOM / token / a11y / interaction）の充足を確認する。

## チェック項目

| 軸 | 行 19 期待値 | 充足元 |
|----|-------------|--------|
| Status | `loading-boundary-200`（200 系・遅延後 final） | Playwright `expect.response.status()` または goto 戻り値で確認可能 |
| DOM marker | `[data-page="smoke-loading-state"]` (boundary) → `[data-page="smoke-loading-state-fixture"]` (final) | Phase 5 で実装 |
| Token | `TOKEN-SSOT` | root `loading.tsx` と同 utility・raw HEX なし。`verify-design-tokens` gate pass |
| A11y | `A11Y-DEFAULT` | `role="status"` + `aria-live="polite"` |
| Interaction | `-` (interaction なし。loading は受動 UI) | matrix 規約で受動 surface は `-` |

## 変更対象ファイル

| パス | 種別 | 概要 |
|------|------|------|
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 編集 | 行 19 の 5 軸欄を上表の値で確定 |

## 検証コマンド

```bash
grep -n "loading.tsx" docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
# 行 19 が N/A-runtime-observation を含まないことを確認

mise exec -- pnpm exec playwright test apps/web/tests/e2e/staging-smoke.spec.ts \
  --grep "staging smoke / loading state" --reporter=list
```

## DoD（Phase 7）

- matrix 行 19 から `N/A-runtime-observation` 文字列が消えていること。
- `Coverage by axis` セクションの `A11y runtime` の分子が +1 されていること。
- すべての fixture テストが green。
