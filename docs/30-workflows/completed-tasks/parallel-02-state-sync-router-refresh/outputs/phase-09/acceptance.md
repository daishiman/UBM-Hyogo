# Phase 09: 受入確認

## AC 別判定

| AC | 内容 | 判定 | Evidence |
| --- | --- | --- | --- |
| AC-1 | `VisibilityRequestDialog` success branch で `router.refresh → onSubmitted → onClose` 順序固定 | PASS | `VisibilityRequestDialog.tsx` lines 79-82 |
| AC-2 | `DeleteRequestDialog` success branch で同順序固定 | PASS | `DeleteRequestDialog.tsx` line 71 周辺 |
| AC-3 | 失敗 (409/422/network) 時に `router.refresh()` を呼ばない | PASS | success branch (`if (res.ok)`) 内のみに配置・spec で否定アサート済み |
| AC-4 | VisibilityRequestDialog.component.spec.tsx に refresh 検証ケース追加 + green | PASS | +43 行、vitest 全 green |
| AC-5 | DeleteRequestDialog.component.spec.tsx に同上 | PASS | +59 行、vitest 全 green |
| AC-6 | 既存テスト non-regression green | PASS | 562 passed / 1 skipped |
| AC-7 | Playwright e2e で `RequestPendingBanner` 即時表示が screenshot 記録 | PASS | `outputs/phase-11/screenshots/*.png` 5 files |
| AC-8 | typecheck / lint / unit test PASS | PASS | `pnpm typecheck` PASS、`pnpm lint` PASS、`pnpm --filter @ubm-hyogo/web test` PASS |

## 総合判定

- **local evidence: PASS**（AC-1〜AC-8）
- **visual evidence: PASS**（AC-7 / VISUAL screenshot 5 files captured）

Phase 13 (commit/push/PR) は user gate 前のため blocked。
