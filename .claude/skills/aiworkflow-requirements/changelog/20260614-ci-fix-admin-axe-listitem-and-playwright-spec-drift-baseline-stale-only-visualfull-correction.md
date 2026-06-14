# CI fix — /admin axe listitem + Playwright spec drift（baseline-stale は visual-full のみ・L-DEVSYNC-143-C 訂正）

- 日付: 2026-06-14
- ブランチ: `feat/admin-dashboard-jp-clarity-and-card-ux`（sub-worktree wt-9）
- PR: #1222
- 修正 commit: `469c47c29`
- 新規 lesson: L-DEVSYNC-144 / SP-DEVSYNC-144（L-DEVSYNC-143-C の訂正）

## 背景

L-DEVSYNC-143-C で「`visual-full`+`smoke`+`e2e` 同時 fail かつ dev HEAD で同 workflow success かつブランチ `apps/web/playwright/**` 非 touch なら全て baseline-stale で user-gate 委譲」と切り分けたが、これは誤りだった。artifact を開封すると 3 job の真因はバラバラで、smoke/e2e は即修正可能な実 fail だった。

## 真因（job 種別で分岐）

### smoke (chromium) — axe `listitem` violation（serious・実回帰）
`playwright-smoke-report/results.json` の `error.message`:
- `full-smoke.spec.ts > /admin` で `<li data-testid="status-bar">` の親が `role="list"` でない（axe `listitem` / wcag131）。
- 原因: `StatusDistribution.tsx` がカード化リファクタで `<ul className="..." role="img" aria-label=...>` に `role="img"` を付与し、`<ul>` 暗黙 `role="list"` を上書き。子 `<li>` の親が list role を失った。
- 修正: `<ul>/<li>` → `<div>`。`role="img"` は分布全体を 1 画像として読み上げる設計ゆえ内部 list セマンティクスは不要。`StatusDistribution.spec.tsx`（Vitest）は role/testid/svg をタグ非依存で assert しており 7/7 PASS 維持。

### e2e ×3 — Playwright spec drift 2 件（即修正可）
monocart `index.json` の failed case 2 件:
1. `issue-819-status-distribution.spec.ts:53` が旧 testid `status-distribution-chart` を `toBeVisible` 期待。component はカード化で `status-distribution-list` に改名済（Vitest spec は更新済だが Playwright spec が取り残し）→ 新 testid へ追従。
2. `task15-admin-screenshots.spec.ts:22` が旧文言「未対応のフォーム項目: 5 件」を期待。`dashboardGlossary.ts` / `SchemaAlertCard.tsx` / Vitest は全て「要対応のフォーム項目」に統一済 → 新文言へ追従。
- `e2e-tests-coverage-gate` は e2e 依存 downstream ゆえ e2e 修正で連動回復。

### visual-full ×3 — baseline 陳腐化のみ（user-gate 再生成）
`visual-full-<vp>-diff` artifact の `*-diff.png` slug を全 viewport で確認 → `admin` のみ diff（root 等他 16 ルート一致）。意図的 admin 再設計（日本語化+カード化+横バー化）の baseline staleness。
- 対応: `playwright-visual-baseline-update.yml` を `--ref feat/admin-dashboard-jp-clarity-and-card-ux` で `gh workflow run` 起動（run `27484887787`）。`visual-baseline-approval` environment 承認ゲート（GitHub 側 user-gate）→ 承認後 HEAD から Linux baseline 再生成し source ブランチへ直接 push。撮影元が HEAD のため code/spec 修正（`469c47c29`）push 後に起動した。

## 教訓（L-DEVSYNC-144）

- **A**: 「UI 変更 = CI fail は baseline-stale」は `visual-full`（`toHaveScreenshot` 純 pixel 比較）にのみ成立。`smoke`/`e2e` は axe・`getByTestId`・`getByText`・role を直接 assert するので、同じ UI 変更が「正しい新 UI に古い期待値」で実 fail する。dev HEAD success + playwright spec 非 touch の 2 点ヒューリスティック（143-C）は smoke/e2e に不十分。
- **B**: `gh run view --log` が空のときは `gh run download <runId> --name <artifact>` で Playwright report を取得し実エラーを読む（smoke=results.json／e2e=monocart index.json／visual-full=diff slug）。読まずに baseline-stale と断定しない。
- **C**: 同 wave の testid/文言リネームで **Vitest spec は更新されても Playwright e2e spec が取り残される** drift が定常。リファクタ後は `grep -rn <旧testid> <旧文言> apps/web/playwright` で残存参照を洗う。

## 検証

- StatusDistribution.spec.tsx（Vitest）7/7 PASS（li→div 後も維持）
- `pnpm typecheck` 全 package Done / `pnpm lint` 全 package Done
- commit `469c47c29` pre-commit 5 hook + pre-push 6 hook 全 pass
- visual-full baseline-update workflow 起動（run 27484887787・承認待ち）

## 参照

- L-DEVSYNC-143（訂正対象の 143-C の元・no-op sync 判定 143-A/B は有効維持）
- MEMORY `project_responsive_mobile_tablet_ui_fixes_pr_created`（visual fail = baseline stale の一次記録・smoke/e2e へ非拡大）
- task-specification-creator `dev-sync-merge-conflict-resolution` SP-DEVSYNC-144（task-spec 版）
