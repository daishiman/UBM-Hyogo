# task-08b-firefox-mobile-chromium-projects-001

## 概要

Playwright の browser project に firefox / mobile-chromium を追加して PR / push CI gate に昇格する判断と実装。08b scaffold 時点では firefox は config に存在するが gate 化されておらず、09b release runbook の品質基準と Cloudflare 無料枠予算が確定するまで保留されている。

## 苦戦箇所【記入必須】

- 対象: `apps/web/playwright.config.ts` の `projects` 配列および `.github/workflows/e2e-tests.yml`
- 症状: scaffolding-only 段階では desktop chromium のみ実走前提で gate 設計。firefox / mobile-chromium を追加すると Actions 実行時間が 2〜3 倍化し、無料枠 2,000 分/月を超過する懸念があるが、超過試算が未実施
- 参照: `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` の U-4

## スコープ（含む/含まない）

含む:

- firefox / mobile-chromium project の `playwright.config.ts` への追加
- 各 project の実走時間 / Actions 分消費試算と無料枠予算との突合
- 段階的 gate 昇格戦略（nightly のみ → PR gate）
- browser 固有 fail の triage runbook

含まない:

- webkit / safari project の追加（macOS runner が必要で別途検討）
- Browserstack 等の有償サービス導入
- mobile native (iOS/Android) の E2E

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Actions 無料枠 2,000 分/月の超過 | nightly schedule + PR は changed file ベースで分岐、試算結果を ADR 化 |
| firefox 固有のレイアウト崩れで chromium PASS / firefox FAIL の split | browser 固有 issue は `browser:firefox` ラベルで triage runbook を整備 |
| mobile-chromium の viewport 設定 drift | `devices['Pixel 7']` 等の Playwright preset を pin、ローカル override 禁止 |
| browser binary cache miss で CI 遅延 | `actions/cache` で `~/.cache/ms-playwright` を pin |

## 検証方法

```bash
# 各 project の単独実走時間測定
time mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=chromium
time mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=firefox
time mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project='Mobile Chrome'

# CI gate 設定確認
rg "project" .github/workflows/e2e-tests.yml
```

期待: 全 project が PR gate で実行されるか nightly のみかが ADR と一致、月間 Actions 分消費見込みが 2,000 分以下。

## 参照

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` (U-4)
- 09b release-runbook の品質基準と無料枠予算セクション
- `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md`
