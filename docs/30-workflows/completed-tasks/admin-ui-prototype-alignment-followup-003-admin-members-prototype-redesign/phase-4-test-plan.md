# Phase 4 — テスト計画

[実装区分: 実装仕様書]

## 1. vitest unit / interaction

| # | File | 対象 | 主要ケース | AC |
| --- | --- | --- | --- | --- |
| T-01 | `apps/web/src/lib/admin/member-hue.spec.ts` | `memberHue` | (a) empty string → 0 (deterministic); (b) 同一 id は同一 hue; (c) 8 distinct sample → range 0..7; (d) UTF-8 mixed string deterministic | AC-3 |
| T-02 | `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx` | `<MemberAvatar>` | (a) hue prop が memberId から派生; (b) initial 表示; (c) `size="sm"` で 40px class が付与 | AC-3 |
| T-03 | `apps/web/src/features/admin/components/_members/__tests__/MemberStateChip.spec.tsx` | `<MemberStateChipRow>` | (a) publishState=public → 公開 chip ok tone; (b) publishState=hidden → 非公開 chip neutral; (c) isDeleted → "退会" danger chip 単独表示 | AC-3 |
| T-04 | `apps/web/src/features/admin/components/_members/__tests__/MemberPublishSwitch.spec.tsx` | `<MemberPublishSwitch>` | (a) クリックで `useAdminMutation` の trigger 呼出; (b) 失敗時に switch 元値復帰 + error toast 呼出; (c) isDeleted で disabled | AC-5, AC-11 |
| T-05 | `apps/web/src/features/admin/components/_shared/__tests__/TagPill.spec.tsx` | `<TagPill>` | (a) selected で class 付与; (b) disabled で onClick 呼ばれない; (c) role=button + aria-pressed | AC-11 |
| T-06 | `apps/web/src/features/admin/components/_shared/__tests__/PillNav.spec.tsx` | `<PillNav>` | (a) role=tablist + role=tab; (b) value と aria-selected 同期; (c) onChange で新 value | AC-2, AC-11 |
| T-07 | `apps/web/src/features/admin/components/_members/__tests__/MembersFilters.spec.tsx` | `<MembersFilters>` | (a) search blur で onChange; (b) PillNav 切替で filter onChange; (c) loading 表示 | AC-2 |
| T-08 | `apps/web/src/features/admin/components/_members/__tests__/MembersTable.spec.tsx` | `<MembersTable>` | (a) 行クリックで onOpenRow; (b) checkbox toggle; (c) edit pencil クリックで onOpenRow; (d) empty で EmptyState | AC-3, AC-4 |
| T-09 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.spec.tsx` | `<MemberDrawer>` | (a) open=true で detail fetch; (b) VISIBILITY/TAGS/FORM RESPONSE/DELETED の DOM 存在; (c) close で onClose; (d) 復元ボタンが isDeleted のみ表示 | AC-4, AC-6, AC-7 |
| T-10 | `apps/web/src/features/admin/components/_members/__tests__/MembersClientShell.spec.tsx` | `<MembersClientShell>` | (a) filter 変更で router.replace; (b) drawer 開閉 state; (c) Switch 楽観更新 reflect | AC-2, AC-4 |

## 2. Playwright visual / smoke

| # | File | 内容 | 出力 |
| --- | --- | --- | --- |
| P-01 | `apps/web/tests/playwright/admin-members-visual.spec.ts` | 4 viewport (390×844 / 834×1112 / 1280×800 / 1440×900) × 4 state (loaded / empty / error / drawer-open) | 16 PNG → `outputs/phase-11/screenshots/` |
| P-02 | 既存 `playwright/admin-runtime-smoke.spec.ts` に `/admin/members` 200 assertion 追加 | session cookie 経由 200 + page-head DOM 存在 | log → `outputs/phase-11/runtime-smoke.log` |

env-gated: staging deploy 前段では `process.env.RUN_VISUAL === "1"` のときのみ実行（既存 visual baseline workflow と整合）。

## 3. a11y

`jest-axe` を drawer-open / loaded state で実行（T-09 / T-10 内）。

```ts
const { container } = render(<MemberDrawer open memberId="m-1" onClose={() => {}} />);
expect(await axe(container)).toHaveNoViolations();
```

## 4. 404 復旧確証テスト

| # | File | 内容 |
| --- | --- | --- |
| C-01 | `apps/api/src/routes/admin/__tests__/auth-401-not-404.spec.ts` (新規) | 未認証で `/admin/members` を呼ぶと **401** が返ることを assertion（regression を防ぐ） |

H2 仮説採用時のみ追加。H1 / H3 採用時は env / mount 検証ログを `outputs/phase-11/runtime-smoke.log` に残す。

## 5. カバレッジ

- 変更ブロック単位で `pnpm --filter @ubm-hyogo/web test --coverage --changed=origin/dev`
- 新規 component は分岐 80% 以上を目標（既存 coverage gate 設定値に追従）

## 6. 実行コマンド

```bash
# vitest
mise exec -- pnpm --filter @ubm-hyogo/web test --run

# Playwright (env-gated)
RUN_VISUAL=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-visual --update-snapshots

# api auth regression (H2 採用時)
mise exec -- pnpm --filter @ubm-hyogo/api test --run admin
```
