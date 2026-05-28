---
spec_classification: implementation_spec
state: spec_created
phase: 4
phase_name: テスト計画
---

# Phase 4 — テスト計画

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

Phase 5 で実装する変更を verify する vitest unit + playwright visual baseline テスト群を確定する。

## 前提と入力

- 既存 vitest config: `apps/web/vitest.config.ts`
- 既存 playwright config: `apps/web/playwright.config.ts`（`staging-visual` project は `apps/web/playwright/tests/visual-staging/*.spec.ts` を testMatch）
- 既存 staging-visual spec: `members-list.spec.ts` / `member-detail.spec.ts` / `public-top.spec.ts` 等
- 新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）

## 作業手順

### vitest unit spec

| # | spec file | 対象 | 主な assertion |
|---|-----------|------|---------------|
| U-1 | `apps/web/src/features/admin/components/_members/MembersTable.spec.tsx` | プロトタイプ準拠の列構成 | avatar 描画 / occupation 表示 / zone+status chip / tags max 2 + `+N` / 公開 switch / edit icon |
| U-2 | `apps/web/src/features/admin/components/_members/MembersFilters.spec.tsx` | pill-nav + 件数バッジ | pill 4 種 (すべて/公開中/非公開/退会済み) / 件数 prop 反映 / search input debounce |
| U-3 | `apps/web/src/features/admin/components/_members/MemberDrawer.spec.tsx` | drawer body + foot | VISIBILITY switch / admin memo textarea / TAGS chip グループ / FORM RESPONSE KVList / DELETED block 条件付き / drawer-foot 3 button |
| U-4 | `apps/web/src/features/admin/adapters/members-view-model.spec.ts` | adapter additive field 派生 | occupation / ubmZone / ubmMembershipType / tags / updatedAt / hue が決定論的に派生 |
| U-5 | `apps/web/src/lib/admin/safe-server-fetch.spec.ts` | baseUrl 解決 | `INTERNAL_API_BASE_URL` 空文字 reject / 末尾 slash normalize / path join 正常系 |
| U-6 | `apps/web/app/api/admin/[...path]/route.spec.ts` | pass-through | `["members"]` を `apps/api` `/admin/members` へ転送 / Authorization header 転送 / 401 を 401 のまま返す（404 マスクなし） |

### playwright visual baseline spec（`staging-visual` project）

| # | spec file | 対象 | 主な assertion |
|---|-----------|------|---------------|
| V-1 | `apps/web/playwright/tests/visual-staging/admin-members-list-aligned.spec.ts` | `/admin/members` 初期表示（filter 無し・1 ページ目） | full-page screenshot vs `admin-members-list-aligned-staging-visual-chromium-linux.png` |
| V-2 | `apps/web/playwright/tests/visual-staging/admin-members-drawer-aligned.spec.ts` | `/admin/members` で 1 行クリック後の drawer 展開 | full-page screenshot vs `admin-members-drawer-aligned-staging-visual-chromium-linux.png` |

両 spec は staging admin auth 取得（`PLAYWRIGHT_ADMIN_*` env）を前提とする。staging seed の member 0 件時は `test.skip` で安全フォールバック。

### gate

| gate | 期待 |
|------|------|
| `verify-design-tokens` | green（HEX / `bg-[#xxx]` / `text-[#xxx]` 不検出） |
| `pnpm typecheck` | green |
| `pnpm lint` | green |
| `bash scripts/verify-pr-ready.sh` | green |

## 成果物

- 本 markdown
- `outputs/phase-4/test-plan.md`

## 完了条件 (DoD)

- U-1..U-6 と V-1..V-2 が確定
- 各 spec の主要 assertion が 3 件以上列挙されている

## 検証コマンド

```bash
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm --filter web test -- --run MembersTable MembersFilters MemberDrawer members-view-model safe-server-fetch
mise exec -- pnpm exec playwright test --project=staging-visual --list
```

## 想定リスク

- staging seed に member が 0 件 → V-1 は `test.skip`、Phase 11 で seed 投入後に再取得

## ロールバック

- 仕様 markdown のみ。spec ファイルは Phase 5 で生成するためここでは不在

## 関連 spec

- `phase-2-design.md`
- `phase-5-implementation.md`
