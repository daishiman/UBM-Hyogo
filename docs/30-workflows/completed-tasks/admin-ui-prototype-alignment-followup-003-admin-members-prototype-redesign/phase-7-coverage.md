# Phase 7 — カバレッジ確認

[実装区分: 実装仕様書]

## 1. コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage --changed=origin/dev
mise exec -- pnpm --filter @ubm-hyogo/api test --run --coverage --changed=origin/dev  # Lane A H2 採用時
```

## 2. しきい値

リポジトリ既定の coverage gate（`vitest.config.ts` / `codecov.yml`）に従う。本仕様で個別に下げない。

## 3. 期待値

| File | branch% 目安 |
| --- | --- |
| `lib/admin/member-hue.ts` | 100% (純関数) |
| `_members/MemberAvatar.tsx` | 90%+ |
| `_members/MemberStateChip.tsx` | 90%+ |
| `_members/MemberPublishSwitch.tsx` | 80%+ (mutation 失敗分岐) |
| `_members/MemberDrawer.tsx` | 75%+ (detail fetch 分岐多い) |
| `_members/MembersTable.tsx` | 80%+ |
| `_members/MembersFilters.tsx` | 80%+ |
| `_shared/TagPill.tsx` | 90%+ |
| `_shared/PillNav.tsx` | 90%+ |

## 4. ログ保管

`outputs/phase-11/coverage-changed.txt` に `pnpm test ... --reporter=text` の出力を保存。
