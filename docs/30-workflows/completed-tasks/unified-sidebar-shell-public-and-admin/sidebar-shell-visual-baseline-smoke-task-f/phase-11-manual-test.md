---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 11
phase_name: 手動テスト / Evidence
created_at: 2026-05-29
---

# Phase 11: 手動テスト / Evidence

[実装区分: 実装仕様書]

> 実装は本ブランチで完了済み（`implemented_local_evidence_captured`）。local 実行 evidence は
> `outputs/phase-11/manual-test-result.md`（smoke 6/6 green + visual V1-V3 撮影）に取得済み。
> 下表 §2 の `pending` は **CI Linux runner での `-linux.png` 正本撮影**と **regression dry-run**
>（いずれも Gate-B user-gated）が未実施であることを指す。

## 1. evidence 配置

```
docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/sidebar-shell-visual-baseline-smoke-task-f/outputs/phase-11/
  ├── desktop/
  │   ├── home-1280.png            (V1 viewer / desktop)
  │   ├── profile-1280.png         (V2 member / desktop)
  │   └── admin-1280.png           (V3 admin / desktop)
  ├── tablet/
  │   ├── home-768.png             (V4 viewer / tablet)
  │   └── admin-768.png            (V5 admin / tablet)
  ├── mobile/
  │   ├── home-375.png             (V6 viewer / mobile)
  │   └── admin-375-drawer.png     (V7 admin / mobile drawer open)
  ├── regression-dry-run.md        (token 改変 → diff 検出 → revert ログ)
  ├── manual-test-result.md        (smoke 6 結果 + gate 検証結果サマリ)
  └── evidence/                    (Playwright report / test-results / diff artifacts)
```

- 各 png は CI 撮影分 `-linux.png` の縮小コピー or シンボリック参照（macOS dev 撮影分は配置しない）
- `sidebar-shell-visual-*` matrix job の reporter / diff artifact は `outputs/phase-11/evidence/` に保存する
- V7 は `openDrawer(adminPage)` 実行後の drawer overlay 表示状態を撮影する

---

## 2. evidence 表（必須）

### 2.1 smoke（S1〜S6）

| # | ケース | ロール / viewport | 期待 | status |
|---|--------|------------------|------|--------|
| S1 | `viewer` で `/` を開く | viewer / desktop | sidebar に PUBLIC group のみ / 左下に「ログイン」リンク / MEMBERS・ADMIN group 不在 | pending |
| S2 | `member` で `/profile` を開く | member / desktop | sidebar に PUBLIC + MEMBERS / user popover に 3 action（プロフィール / 編集申請 / ログアウト） | pending |
| S3 | `admin` で `/admin` を開く | admin / desktop | nav item total 13（PUBLIC3 + MEMBERS1 + ADMIN9）/ popover に 4 action（「管理者ダッシュボード」含む） | pending |
| S4 | 375px で `/` を開く | viewer / mobile 375 | sidebar 非表示（drawer 化）/ hamburger 押下で drawer overlay 表示 | pending |
| S5 | 1024px で collapse toggle 押下 | viewer or member / 1024幅 | sidebar が collapsed（icon のみ）/ localStorage に collapse 状態反映 | pending |
| S6 | route 遷移時 drawer auto-close | viewer / mobile 375 | drawer 内リンク click で drawer auto-close（`shell-drawer` 非表示） | pending |

> 実行後、`pending` → `present`（spec 内 assertion pass）に更新。

### 2.2 visual baseline（V1〜V7）

| # | viewport | role | screenshot arg | baseline path（`-linux.png` 正本） | status |
|---|----------|------|----------------|-----------------------------------|--------|
| V1 | 1280×800 | viewer | `home-1280.png` | apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/home-1280-sidebar-shell-visual-desktop-linux.png | pending |
| V2 | 1280×800 | member | `profile-1280.png` | apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/profile-1280-sidebar-shell-visual-desktop-linux.png | pending |
| V3 | 1280×800 | admin | `admin-1280.png` | apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/admin-1280-sidebar-shell-visual-desktop-linux.png | pending |
| V4 | 768×1024 | viewer | `home-768.png` | apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/home-768-sidebar-shell-visual-tablet-linux.png | pending |
| V5 | 768×1024 | admin | `admin-768.png` | apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/admin-768-sidebar-shell-visual-tablet-linux.png | pending |
| V6 | 375×812 | viewer | `home-375.png` | apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/home-375-sidebar-shell-visual-mobile-linux.png | pending |
| V7 | 375×812 | admin（drawer open） | `admin-375-drawer.png` | apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts-snapshots/admin-375-drawer-sidebar-shell-visual-mobile-linux.png | pending |

> CI Linux runner 撮影後、`pending` → `present` に更新。`outputs/phase-11/<viewport>/` 配下の縮小コピーも同 wave で配置する。

---

## 3. 手動検証手順

1. **CI smoke matrix green 確認**: PR 上で `playwright-smoke / smoke (chromium)`（`sidebar-shell-smoke` を含む）が全 green であることを確認。
2. **visual 3 viewport matrix green 確認**: `playwright-smoke / visual (sidebar-shell desktop / tablet / mobile)` の 3 job が全 green であることを確認。
3. **`-linux.png` 数 = 7 確認**:
   ```bash
   find apps/web/playwright/tests/sidebar-shell -name '*-sidebar-shell-visual-*-linux.png' | wc -l
   # 期待値: 7
   ```
4. **regression dry-run（token 改変 → fail → revert）**:
   - 一時 branch を切り、`apps/web/src/styles/tokens.css` の `--color-surface`（または shell が参照する OKLch token）を改変
   - CI で `visual (sidebar-shell *)` matrix が fail（visual diff detect）することを確認
   - 結果（改変 token / fail した job 名 / diff artifact path）を `outputs/phase-11/regression-dry-run.md` に追記
   - revert（branch 破棄 or revert commit）して baseline を元に戻す
5. **screenshot を outputs に配置**: CI 撮影 `-linux.png` の縮小コピーを `outputs/phase-11/{desktop,tablet,mobile}/` に配置（手動 or `magick convert -resize 50%`）。
6. **gate 結果記録**: `manual-test-result.md` に smoke 6 結果 / visual 7 baseline path / 各 gate 結果（typecheck / lint / verify-pr-ready / gate-metadata / phase12-compliance / indexes idempotency）を記載。

---

## 4. evidence 必須項目

- **smoke 6 結果**: S1〜S6 の各 assertion pass（spec 実行ログ）
- **visual 7 baseline path**: V1〜V7 の `-linux.png` 正本パス（§2.2 の 7 行）が実在
- **gate 結果**:
  - `mise exec -- pnpm typecheck` green
  - `mise exec -- pnpm lint` green
  - `mise exec -- bash scripts/verify-pr-ready.sh` green
  - `mise exec -- pnpm gate-metadata:validate` ERROR:0
  - `mise exec -- pnpm verify:phase12-compliance` pass
  - `mise exec -- pnpm indexes:rebuild` idempotent（md5 一致）
- **regression dry-run ログ**: 改変 token → fail → revert の一連を `regression-dry-run.md` に記録
- **不変条件確認**: macOS 撮影分 `-darwin.png` が staged になっていないこと
