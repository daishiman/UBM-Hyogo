# Phase 13: PR — issue-801 admin error focus transfer

## ブランチ

`feat/issue-801-admin-error-focus`

## base ブランチ

`dev`（CLAUDE.md: PR base 既定 = dev）

## PR タイトル候補

```
feat(issue-801): admin segment error.tsx h1 auto-focus + a11y hardening 横展開
```

## PR 本文テンプレート

```markdown
## Summary
- root error.tsx (issue-769) の a11y hardening を `(admin)/admin/error.tsx` に横展開
- `/admin` page と nested child routes (members / tags / meetings / schema / requests / identity-conflicts / audit) の segment-level error boundary。`(admin)/layout.tsx` 由来の layout error は対象外
- 追加: `useRef` + `tabIndex={-1}` + `useEffect(logger.error → focus({preventScroll:true}))` + `aria-live="assertive"` + digest 表示 + isDev stack 抑制 + OKLch トークン
- 新規 test: `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx`（13 tests）
- 親 spec `parallel-i06-root-error-focus/spec.md` section 4.3 の admin segment 適用達成

## Changes
- `apps/web/app/(admin)/admin/error.tsx` rewrite
- `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` new
- `docs/30-workflows/issue-801-admin-error-focus-transfer/**` 仕様書一式

## Out of scope
- admin auth gate のロジック変更（specs/13-mvp-auth.md 不変）
- 管理 API のエラー型変更
- `useAutoFocusOnMount(ref)` 共通 hook 抽出（issue-769-followup-001 で別途）
- root / login / profile error.tsx の追加修正

## Test plan
- [x] `pnpm -F "@ubm-hyogo/web" typecheck`
- [x] `pnpm -F "@ubm-hyogo/web" lint`
- [x] `pnpm -F "@ubm-hyogo/web" test -- --run 'apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx'`
- [ ] Runtime visual smoke: admin route で error 発火 → h1 focus / aria-live announce / screenshot 確認（user-gated）

## Evidence
- 設計: `docs/30-workflows/issue-801-admin-error-focus-transfer/phase-2-design.md`
- AC trace: `phase-1-requirements.md` AC-1〜AC-16
- Phase 11 local evidence: `outputs/phase-11/evidence/`
- Phase 12 strict 7: `outputs/phase-12/`

## 親 workflow trace
- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` section 4.3
- 親 workflow trace: `issue-801-admin-error-focus-transfer` を admin route segment 適用の current child workflow として `improvements/integration-fixes/index.md` と aiworkflow-requirements に登録済み

## Issue
- Closes #801
```

## PR 作成手順（後続実行者向け）

```bash
# 0. ローカル品質ゲート
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run admin/__tests__/error.component
bash scripts/verify-pr-ready.sh

# 1. dev 同期
git fetch origin dev
git checkout dev && git merge --ff-only origin/dev
git checkout feat/issue-801-admin-error-focus
git merge dev   # コンフリクトあれば CLAUDE.md PR フローの方針で解消

# 2. push
git push -u origin feat/issue-801-admin-error-focus

# 3. PR 作成（ユーザー明示承認後）
gh pr create --base dev --title "..." --body "..."
```

## evidence

`outputs/phase-13/` に PR URL / merge commit hash を記録予定。

## DoD

- PR が `dev` を base に作成される
- 本文に AC trace / test plan / evidence link / `Closes #801` を含む
- typecheck / lint / vitest / verify-pr-ready がすべて PASS した状態で push
- 本仕様書プロンプト内では **PR 作成・push は実行しない**（ユーザー明示承認まで）
