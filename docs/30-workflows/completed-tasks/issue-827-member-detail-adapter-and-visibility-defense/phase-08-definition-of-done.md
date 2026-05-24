# Phase 8: Definition of Done

## DoD チェックリスト

- [ ] `apps/web/src/lib/adapters/member-detail.ts` が存在し `buildMemberDetailViewModel` を export している
- [ ] `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` が TC-A-01〜06 全て green
- [ ] `MemberDetailSections.tsx` の `kind !== "url"` filter が撤去されている
- [ ] `app/(public)/members/[id]/page.tsx` が `buildMemberDetailViewModel` を呼出し、その結果を `MemberDetailSections` / `MemberLinks` / `MemberActivity` に渡している
- [ ] `MemberDetailSections.component.spec.tsx` の TC-U-03 が削除または adapter 移管に整合更新されている
- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `bash scripts/verify-pr-ready.sh` は `verify:phase12-compliance` / `gate-metadata:validate` 成功。`indexes:rebuild drift` は regenerated index diff の commit 待ちとして Phase 13 user gate に接続
- [ ] visual snapshot baseline (`full-visual-members-detail-*-chromium-*-linux.png`) が変更されていない（再生成不要）
- [ ] issue #827 受け入れ基準のうち「adapter pure function」「visibility filter 二重防御」「unknown field silent skip」がコード上で確認できる

## 受け入れ基準と対応

| issue #827 受け入れ基準 | 対応 |
|------------------------|------|
| adapter は pure function (unit test green) | S1 + S2 |
| 6 セクション全描画 | 既存 (task-12) で達成済、本タスクで挙動不変 |
| visibility filter 二重防御 | S1 で adapter 内に実装 |
| unknown field silent skip | S1 で `DISPLAYABLE_KINDS` allowlist 適用 |
| `notFound()` 発火条件 | 既存 (page.tsx) で達成済、本タスクで不変 |
| typecheck / lint / build green | Phase 7 ゲートで保証 |
| Playwright visual snapshot baseline | 既存 baseline 維持（render 結果不変） |
