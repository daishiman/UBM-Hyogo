---
phase: 8
title: DoD — 実 Form 回答相当 fixture で描画確認 / visibility filter green
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. DoD チェックリスト

### 1.1 機能 DoD

- [ ] DoD-01: 実 Google Form 回答相当の fixture（6 section, public/member/admin 混在 visibility）で `/(public)/members/[id]` が描画できる
- [ ] DoD-02: `visibility === "public"` field のみ DOM に出る（`visibility === "member"` / `visibility === "admin"` が描画されない）
- [ ] DoD-03: 全 field が除外された section（fixture では `consent` section）は `<section data-section="consent">` 自体が DOM に出ない
- [ ] DoD-04: unknown `kind` が混入しても画面が壊れず該当 field のみ silent skip される
- [ ] DoD-05: API 404 応答時に Next.js `not-found` 画面が表示される
- [ ] DoD-06: API 5xx 応答時に `(public)/error.tsx` boundary が表示される（throw 経路）

### 1.2 実装 DoD

- [ ] DoD-07: `apps/web/src/lib/adapters/member-detail.ts` が pure function として実装され、I/O・global state・logger 呼び出しを含まない
- [ ] DoD-08: `apps/web/src/components/public/MemberDetail.tsx` が既存 primitive 4 種（ProfileHero / MemberTags / MemberDetailSections / MemberActivity）のみで構成される
- [ ] DoD-09: `apps/web/app/(public)/members/[id]/page.tsx` が Server Component で fetch + schema parse + adapter + notFound 分岐のみを担当する
- [ ] DoD-10: 既存 API endpoint surface に変更がない（`git diff dev...HEAD -- apps/api/` が空）
- [ ] DoD-11: 既存 primitive の props 契約に変更がない
- [ ] DoD-12: `process.env.*` 直接参照が新規導入されていない（task-02 不変条件）
- [ ] DoD-13: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が `apps/web` 内に新規追加されていない

### 1.3 品質 DoD

- [ ] DoD-14: Phase 7 G-01〜G-12 が全て green
- [ ] DoD-15: adapter unit spec が 8 ケース全て green かつ branch coverage 100%
- [ ] DoD-16: Playwright spec が chromium 1 case green
- [ ] DoD-17: Playwright visual snapshot が `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/` に保存される

### 1.4 ドキュメント DoD

- [ ] DoD-18: Phase 11 evidence inventory（`outputs/phase-11/evidence.md` または当該 phase ファイル）の E-01〜E-07 全件が実ファイルとして存在する
- [ ] DoD-19: Phase 12 compliance check が canonical 9 headings を満たし `pnpm verify:phase12-compliance` が green
- [ ] DoD-20: Phase 13 PR draft が CLAUDE.md「PR作成の完全自律フロー」順序を遵守する

## 2. 非 DoD（本 sub-workflow では達成しない）

| 項目 | 委譲先 |
|------|--------|
| 4 screens visual regression baseline 確定 | `serial-07-regression-evidence` |
| `/login` 経由の private fields 表示 | 認証スコープ別 workflow |
| 管理画面側からの `publishState` toggle 反映確認 | 別 workflow（admin scope） |
| 実 D1 seed を使った E2E 確認 | `serial-07-regression-evidence` |

## 3. 完了確認手順

```bash
# 全 DoD コマンド一括確認
mise exec -- pnpm typecheck \
  && mise exec -- pnpm lint \
  && mise exec -- pnpm --filter @ubm-hyogo/web test -- \
       src/lib/adapters/__tests__/member-detail.spec.ts \
  && mise exec -- pnpm --filter @ubm-hyogo/web exec \
       playwright test public-member-detail --project=chromium \
  && bash scripts/verify-pr-ready.sh
```

全 exit 0 で DoD 完了とみなす。Phase 11 evidence は別途 `outputs/phase-11/` 配下を `ls` で確認。

## 4. DoD 失敗時のロールバック

- adapter / primitive / page.tsx 変更は全て `apps/web` 内の追加・編集のみ
- 不具合発覚時は当該 PR を `gh pr close` + revert で serial-05 完了状態に戻る
- fixture は test 専用のため production runtime に影響しない（revert 不要だが整合のため revert する）

## 5. 参照

- Phase 7 品質ゲート
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md` DoD 表
- CLAUDE.md「不変条件」「UI prototype alignment / MVP recovery」
