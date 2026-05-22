# Phase 6 — テスト拡充 evidence

fixture 3 種を追加し T-3b-5..7 がローカルで再現することを確認。retry 設定は既存 `apps/web/playwright.config.ts` の `retries: process.env.CI ? 2 : 0` を維持。CI 実 run の retry/flakiness 観測は PR 作成後の workflow run で行う。
