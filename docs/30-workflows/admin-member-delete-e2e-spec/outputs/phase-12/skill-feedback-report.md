# Skill Feedback Report

## テンプレ改善

- E2E spec の Server Component fetch は `page.route()` だけでは捕捉できないため、Phase 2/4/11 に SSR fixture gate または mock API 経路を明記する。

## ワークフロー改善

- `test:e2e file --project=x` の script 経由は全 project 展開の誤実行を招く。focused evidence は `pnpm --filter @ubm-hyogo/web exec playwright test <file> --project=<project>` を canonical にする。

## ドキュメント改善

- local desktop-chromium PASS と runtime CI PASS を混同しない。`implemented-local-runtime-pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持する。
