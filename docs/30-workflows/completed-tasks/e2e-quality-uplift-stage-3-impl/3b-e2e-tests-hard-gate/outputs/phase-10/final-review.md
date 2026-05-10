# Phase 10 — 最終レビュー evidence

| AC | 状態 |
|----|------|
| AC-02 (`pnpm e2e` + 80% gate + smoke fail) | ✅ workflow / coverage gate / smoke step 構成で満たす（fixture で 79.99% fail を再現） |
| AC-03 (reporter に monocart, 既存 維持) | ✅ playwright.config.ts L46-61 |
| AC-04 (artifact upload v4) | ✅ workflow の 3 種 upload step |
| AC-3b-1 (PR to dev/main で job 起動) | ⏳ CI runtime（PR 作成後観測） |
| AC-3b-4 (coverage artifact retention 14d) | ✅ workflow `retention-days: 14` |
| AC-3b-5 (failure 時のみ HTML report retention 7d) | ✅ workflow `if: failure()` + `retention-days: 7` |
| AC-3b-6 (reporter 4 件・既存維持) | ✅ |
