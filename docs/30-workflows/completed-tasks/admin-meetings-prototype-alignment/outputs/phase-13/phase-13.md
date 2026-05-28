# Phase 13: PR

- base: `dev`
- branch: `feat/admin-meetings-prototype-alignment`
- title: `feat(admin-meetings): /admin/meetings prototype-aligned redesign`

## 本文テンプレ

```
## Summary
- /admin/meetings list を AdminPageHeader + AdminStat + AdminSectionCard + Drawer 構成へ整流
- /admin/meetings/[id] detail を AdminPageHeader + AdminSectionCard 構成へ整流
- 既存 MeetingPanel.tsx を廃止し features/admin/components/_meetings/ に 4 components + 1 純関数で分割
- API endpoint surface / D1 schema 変更なし

## AC
- Phase 1 AC-A1〜A10 / AC-B1〜B6 すべて green
- typecheck / lint / vitest / build green
- token grep gate green (HEX 直書き 0 件)
- legacy MeetingPanel 参照 0 件

## Test plan
- [ ] pnpm --filter @ubm-hyogo/web test -- _meetings
- [ ] pnpm --filter @ubm-hyogo/web test -- meetings/[id]
- [ ] pnpm typecheck && pnpm lint
- [ ] pnpm --filter @ubm-hyogo/web build
- [ ] staging で list / detail を browser 確認（outputs/phase-11/screenshots/）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Gate

- `verify-design-tokens`
- `verify-test-suffix`
- `typecheck` / `lint`
- vitest（apps/web）
- visual baseline は親 workflow Task E の枠で別途確認

PR 作成は `03.実装.md` プロンプト完了後に実行する（本プロンプトでは作成しない）。
