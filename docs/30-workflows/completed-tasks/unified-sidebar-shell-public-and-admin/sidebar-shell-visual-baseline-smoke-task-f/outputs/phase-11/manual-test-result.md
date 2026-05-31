# Phase 11 — 手動テスト / Evidence

> 実行日: 2026-05-29 / ローカル（macOS, Next dev `--webpack`, port 3100, mock API 8787）

## 1. smoke 実 run（AC-1）

`playwright test --project=sidebar-shell-smoke`（warm dev server + auth fixture + mockApi）

```
Running 6 tests using 1 worker
  ✓ 1 viewer sees public-only sidebar at /                              (55.2s)
  ✓ 2 member sees 3 user actions at /profile                           (29.7s)
  ✓ 3 admin sees 13 nav items and admin dashboard action at /admin     (44.2s)
  ✓ 4 mobile hides sidebar and opens drawer on hamburger                (8.7s)
  ✓ 5 collapse toggle collapses sidebar and persists to localStorage    (5.9s)
  ✓ 6 drawer auto-closes after navigating via a drawer link             (6.0s)
  6 passed (3.0m)
```

> 補足: 初回 run では dev モードの cold-compile（`/profile`・`/admin`・`/members` 初回コンパイルが
> 60s 既定 timeout を超過）で S2/S3/S6 が timeout した。これは product 不具合ではなく dev コンパイル遅延。
> ルート warm 後 `--timeout=180000` で再 run し 6/6 green。あわせて S6 を堅牢化するため drawer 内
> nav リンク click で drawer を即時クローズする実装（`SidebarNavItem` onClick → `setDrawerOpen(false)`）を追加した。

## 2. visual baseline 機構（AC-2 / AC-3）

`playwright test --project=sidebar-shell-visual-desktop --update-snapshots`

```
  ✓ 1 viewer home desktop visual   (V1 home-1280)
  ✓ 2 member profile desktop visual (V2 profile-1280)
  ✓ 3 admin desktop visual          (V3 admin-1280)
  - 4..7 skipped（test.skip で tablet/mobile を除外）
  3 passed
```

- `test.skip(testInfo.project.name !== ...)` により desktop project は V1〜V3 のみ実行（設計どおり）。
- tablet/mobile project は `--list` で V4/V5・V6/V7 を認識（合計 7 screenshot / 3 viewport project）。
- **不変条件 #1**: 撮影された `*-darwin.png` は commit しない（CI Linux runner の `-linux.png` が正本）。
  ローカル撮影 3 枚は本 dir の `screenshots/` に *-darwin-local-evidence.png として参照用にのみ保存し、
  snapshot dir の darwin baseline は削除済み（リポジトリに macOS baseline を残さない）。

## 3. スクリーンショット（参照用 / Apple UI/UX 観点レビュー）

`outputs/phase-11/screenshots/`:

| ファイル | role | 確認事項 |
| --- | --- | --- |
| `home-1280-...-local-evidence.png` | viewer | PUBLIC グループのみ（3 item）、左下にログイン導線、MEMBERS/ADMIN なし |
| `profile-1280-...-local-evidence.png` | member | PUBLIC + MEMBERS、左下ユーザーメニュー（会員） |
| `admin-1280-...-local-evidence.png` | admin | 3 グループ 13 item、スキーマに warn badge「3」、ダッシュボード active、左下「管理者」メニュー |

UI/UX 所見: グルーピング（PUBLIC/MEMBERS/ADMIN）と active 強調、collapse トグル、左下ロール対応アバター、
schema warn badge が一貫したリズム・OKLch トークンで描画され、3 層で同一シェルが維持されている。

## 4. AC 対応状況

| AC | 状態 | 根拠 |
| --- | --- | --- |
| AC-1 smoke S1〜S6 green | ✅ | §1（6/6 passed） |
| AC-2 visual V1〜V7 baseline 生成 | ✅ 機構実証 / baseline 正本は CI Linux | §2（desktop V1-V3 実撮影、tablet/mobile は project 認識済） |
| AC-3 3 viewport project × role 別 auth fixture | ✅ | playwright.config の 3 project + auth fixture（anonymous/member/admin） |
| AC-4 共通操作を `_helpers.ts` に集約 | ✅ | `waitShellReady`/`freezeAnimations`/`openDrawer`/`toggleCollapse` |
| AC-5 CI（smoke step + visual matrix） | ✅ | `.github/workflows/playwright-smoke.yml` |
| AC-6 regression detect | ⏳ CI（Linux baseline 確定後の dry-run で確認） | `maxDiffPixelRatio: 0.02` |
| AC-7 required status check 候補列挙 | ✅ | phase-13-pr.md（実 PUT は user-gated） |
| AC-8 既存 auth fixture のみ使用 | ✅ | 新規 storageState/mint なし |
