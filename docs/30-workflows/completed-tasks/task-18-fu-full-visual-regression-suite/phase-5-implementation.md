[実装区分: 実装仕様書]

# Phase 5: 実装

## 目的

Phase 2 設計に従い、playwright config / fixture / spec / workflow / package.json scripts を実装し、51 baseline を生成する。

---

## 入力

- `outputs/phase-2/design.md`
- `outputs/phase-4/test-plan.md`

---

## 1. 変更対象ファイル一覧（最終）

| パス | 種別 | commit 単位 |
|------|------|------------|
| `apps/web/playwright/fixtures/viewports.ts` | 新規 | commit-1 |
| `apps/web/playwright/fixtures/visual-routes.ts` | 新規 | commit-1 |
| `apps/web/playwright.config.ts` | 編集 | commit-2 |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 新規 | commit-2 |
| `apps/web/package.json` | 編集（scripts） | commit-2 |
| `.github/workflows/playwright-visual-full.yml` | 新規 | commit-3 |
| `.github/workflows/playwright-visual-baseline-update.yml` | 新規 | commit-3 |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | 新規（51 件） | commit-4（baseline update workflow PR） |

---

## 2. 実装手順

### Step 1: fixtures 追加（commit-1）

1. `apps/web/playwright/fixtures/viewports.ts` を新規作成（Phase 2 §2 のコード）。
2. `apps/web/playwright/fixtures/visual-routes.ts` を新規作成（Phase 2 §3 のコード）。
3. `mise exec -- pnpm typecheck` で `_ASSERT_17` の型チェックが通ることを確認。
4. commit: `feat(visual): add viewport / routes fixtures for full visual suite`

### Step 2: playwright.config + spec + scripts（commit-2）

1. `apps/web/playwright.config.ts` の `projects` 配列末尾に Phase 2 §1 の 3 entry を追加。
   - import 行に `import { VIEWPORTS } from './playwright/fixtures/viewports'` を追加。
   - 既存 `visual-chromium` project は **削除・変更禁止**。
   - 3 entry は既存 auth fixture helper を使うため、存在しない `setup-auth-*` project dependencies は追加しない。
2. `apps/web/playwright/tests/visual-full/full-visual.spec.ts` を Phase 2 §4 のコードで新規作成。
3. `apps/web/package.json` の `scripts` に Phase 2 §7 の 2 script を追加。
4. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` で PASS 確認。
5. commit: `feat(visual): add visual-full-chromium projects and full-visual spec`

### Step 3: workflows（commit-3）

1. `.github/workflows/playwright-visual-full.yml` を Phase 2 §5 の yaml で新規作成。
2. `.github/workflows/playwright-visual-baseline-update.yml` を Phase 2 §6 の yaml で新規作成。
3. GitHub repo settings で Environment `visual-baseline-approval` を作成し、required reviewers に owner を 1 名設定（**ユーザー手動操作**。Phase 13 PR 承認時に依頼）。
4. commit: `ci(visual): add nightly + path-filter + baseline-update workflows`

### Step 4: baseline 初回生成（commit-4 — workflow 経由）

1. Phase 13 PR が merge された後、`gh workflow run playwright-visual-baseline-update.yml -f reason='initial baseline generation for task-18-fu'` を実行。
2. approval gate 通過後、workflow が `--update-snapshots` で 51 png を生成し、`chore/visual-baseline-update-<run_id>` ブランチに PR を作成。
3. その PR を merge することで `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` に 51 baseline が tracked になる。
4. その後の nightly run で diff 0 を確認。

> 補足: baseline はローカル生成不可（OS フォント差）のため、Phase 13 PR の初期は spec / config / workflow のみコミットし、baseline は別 PR でリポジトリへ取り込む。

---

## 3. 実行コマンド集

```bash
# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# ローカル動作確認（macOS だが diff は確認用、commit はしない）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web test:visual-full -- --update-snapshots
mise exec -- pnpm --filter @ubm-hyogo/web test:visual-full   # diff 0 確認

# baseline update workflow（リモート）
gh workflow run playwright-visual-baseline-update.yml -f reason='initial baseline generation'
gh run watch
```

---

## 4. ロールバック手順

| 影響範囲 | ロールバック |
|----------|--------------|
| playwright.config.ts | git revert で 3 project entry を削除 |
| spec / fixture | git revert で `playwright/tests/visual-full/` と `playwright/fixtures/visual-routes.ts` `viewports.ts` を削除 |
| workflows | `.github/workflows/playwright-visual-*.yml` 2 件を削除 |
| baseline | `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` 配下を削除 |

---

## 5. DoD

1. commit-1〜3 が dev へ PR 経由でマージ可能な状態
2. `mise exec -- pnpm typecheck` / `pnpm lint` PASS
3. baseline update workflow が手動 trigger で動作確認可能（approval gate 設定済み）
4. ローカル macOS で `test:visual-full -- --update-snapshots` 実行時に 51 ファイルが生成される（commit 対象外、確認のみ）

---

## 6. 成果物

- `outputs/phase-5/implementation-notes.md`
