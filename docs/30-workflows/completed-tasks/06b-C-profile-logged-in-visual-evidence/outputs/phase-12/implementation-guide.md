# Implementation Guide: 06b-C profile logged-in visual evidence

## Part 1: 中学生レベルの説明

ログイン済みの状態を `storageState` というファイルに保存して、その状態を使って `/profile` を開きます。毎回手でログインしなくても、画面のスクリーンショットと「編集フォームがないこと」の中身チェックを同じ手順で再実行できるようにしました。

## Part 2: Technical Summary

This cycle changed the task from a documentation-only skeleton into an executable evidence-capture workflow. The app behavior itself is unchanged.

Touched files:

| Path | Change |
| --- | --- |
| `.gitignore` | Ignores local logged-in Playwright storageState JSON. |
| `apps/web/playwright.config.ts` | Adds a `staging` project that can target `PLAYWRIGHT_STAGING_BASE_URL`. |
| `apps/web/playwright/.auth/.gitkeep` | Keeps the local auth-state directory without committing secrets. |
| `apps/web/playwright/tests/profile-readonly.spec.ts` | Adds M-08 screenshot, M-09 no-form, and M-10 edit-query assertions for desktop/mobile. |
| `scripts/capture-profile-evidence.sh` | Wraps Playwright execution and writes evidence to this workflow's Phase 11 directory. |
| `docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/{screenshots,dom}/.gitkeep` | Preserves evidence output directories. |

Commands:

```bash
bash -n scripts/capture-profile-evidence.sh
pnpm --filter @ubm-hyogo/web exec playwright test --list playwright/tests/profile-readonly.spec.ts
scripts/capture-profile-evidence.sh \
  --base-url https://staging.example \
  --storage-state apps/web/playwright/.auth/state.json
```

Evidence paths:

| Marker | Output |
| --- | --- |
| M-08 | `outputs/phase-11/screenshots/M-08-{desktop,mobile}-{date}.png` |
| M-09 | `outputs/phase-11/dom/M-09-no-form-{desktop,mobile}.json` |
| M-10 | `outputs/phase-11/dom/M-10-edit-query-ignored-{desktop,mobile}.json` and `outputs/phase-11/screenshots/M-10-{desktop,mobile}-{date}.png` |

Runtime status: `PENDING_RUNTIME_EVIDENCE`. A real logged-in storageState is required and must not be committed.
