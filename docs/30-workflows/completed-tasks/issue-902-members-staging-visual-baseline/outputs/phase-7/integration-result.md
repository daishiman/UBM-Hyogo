# Phase 7 — Integration Result

## 1. 統合対象

- `staging-visual` Playwright project（`apps/web/playwright.config.ts` L236-250）への 2 spec 自動マッチ
- `.github/workflows/playwright-smoke.yml` の `staging-visual` job 名表記同期

## 2. 統合観点

| 観点 | 結果（spec 段階） |
|------|----------------|
| `testMatch: /visual-staging\/.*\.spec\.ts$/` への自動マッチ | spec 追加で成立（config 変更不要） |
| baseURL `stagingBaseURL` 継承 | project 設定継承で成立 |
| `-staging-visual-chromium-linux.png` snapshot 命名 | snapshot prefix は project 名 + browser + os で project 全体共通 → 既存 4 spec と同形式 |
| `staging-visual` job artifact upload glob `**/*-staging-visual-chromium-linux.png` | 新 spec 配下の baseline も glob match |

## 3. 統合リスク

| Risk | 対応 |
|------|------|
| `PLAYWRIGHT_MEMBER_DETAIL_ID` 未注入で CI 実行 | `test.skip` 経由で job は green（skipped カウント計上） |
| baseline 不在 PR で job fail | 2 段階フロー（dispatch 生成 → commit → 再 push）で解消（既存運用継承） |
| member-detail seed 削除 | `test.skip` フォールバック有効 |
