---
phase: 8
title: DoD — 実 Form 回答相当 fixture で描画確認 / visibility filter green
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. DoD チェックリスト

### 1.1 機能 DoD

- [ ] DoD-01: 実 Google Form 回答相当の fixture（6 section, 公開/会員/管理 混在 visibility）で `/(public)/members/[id]` が描画できる
- [ ] DoD-02: `visibility === "public"` field のみ DOM に出る（`visibility === "member"` / `visibility === "admin"` が描画されない）
- [ ] DoD-03: 全 field が除外された section は `<section>` 自体が出ない
- [ ] DoD-04: unknown `kind` が混入しても画面が壊れず該当 field のみ silent skip される
- [ ] DoD-05: API 404 応答時に Next.js `not-found` 画面が表示される
- [ ] DoD-06: API 500 応答時に `error.tsx` boundary が表示される（throw 経路）

### 1.2 実装 DoD

- [ ] DoD-07: `apps/web/src/lib/adapters/member-detail.ts` が pure function として実装され、I/O・global state を含まない
- [ ] DoD-08: `apps/web/src/components/public/MemberDetail.tsx` が既存 primitive 4 種（ProfileHero / MemberTags / MemberDetailSections / MemberActivity）のみで構成される
- [ ] DoD-09: `apps/web/app/(public)/members/[id]/page.tsx` が Server Component で fetch + adapter + notFound 分岐のみを担当する
- [ ] DoD-10: 既存 API endpoint surface に変更がない（`apps/api/` の git diff が空）
- [ ] DoD-11: 既存 primitive の props 契約に変更がない

### 1.3 品質 DoD

- [ ] DoD-12: Phase 7 G-01〜G-10 が全て green
- [ ] DoD-13: adapter unit spec が 6 ケース全て green かつ branch coverage 100%
- [ ] DoD-14: Playwright spec が chromium 1 case green
- [ ] DoD-15: Playwright visual snapshot が `outputs/phase-11/` に保存される

### 1.4 ドキュメント DoD

- [ ] DoD-16: Phase 11 evidence inventory（`outputs/phase-11/evidence.md`）が completion 済
- [ ] DoD-17: Phase 12 documentation が canonical 9 headings を満たす
- [ ] DoD-18: Phase 13 PR draft が CLAUDE.md「PR作成の完全自律フロー」順序を遵守する

## 2. 非 DoD（本 sub-workflow では達成しない）

| 項目 | 委譲先 |
|------|--------|
| 4 screens visual regression 確定 | serial-07-regression-evidence |
| /login 経由の private fields 表示 | 別 workflow（認証スコープ） |
| 管理画面側からの publishState toggle 反映 | 別 workflow |

## 3. 完了確認手順

```bash
# 全 DoD コマンド一括確認
bash scripts/verify-pr-ready.sh \
  && mise exec -- pnpm typecheck \
  && mise exec -- pnpm lint \
  && mise exec -- pnpm --filter @ubm-hyogo/web test -- adapters \
  && mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-member-detail
```

全 exit 0 で DoD 完了とみなす。

## 4. 参照

- Phase 7 品質ゲート
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md` DoD 表
