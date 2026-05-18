---
phase: 13
title: Commit / PR draft — タイトル・本文・required status check 候補
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

## 1. branch / base

| 項目 | 値 |
|------|-----|
| base branch | `dev`（CLAUDE.md 既定） |
| feature branch | `feat/ui-foundation-serial-07-regression-evidence` |
| 想定 commit 数 | 2-3（spec 追加・baseline コミット・evidence 配置） |

## 2. PR タイトル

```
feat(ui-foundation): serial-07 regression evidence (visual 4 screens + verify-design-tokens + pr-ready)
```

70 文字以内。

## 3. PR 本文（draft）

```markdown
## Summary

UI prototype design system foundation の serial-07 として、serial-00..06 で構築した「プロトタイプ正本反映の仕組み」が後続 PR で regression しないことを機械保証する regression gate を実装する。

- Playwright visual baseline を最小 4 screens（top / members-list / member-detail / admin-dashboard）で取得
- `verify-design-tokens` / `pnpm typecheck` / `pnpm lint` / `pnpm build` / `bash scripts/verify-pr-ready.sh` の 6 gate を green
- evidence を `outputs/phase-11/` に物理配置し、`verify-phase12-compliance` / `gate-metadata:validate` の compliance を満たす

## Scope

- 新規 spec: `apps/web/playwright/tests/visual/{top,members-list,member-detail}.spec.ts`
- 既存活用: `apps/web/playwright/tests/visual/admin-dashboard.spec.ts`
- baseline PNG（CI ubuntu-latest 生成 `-chromium-linux.png`）4 枚をコミット
- `outputs/phase-11/` に 7 ログ + 4 screenshot + 3 metadata = 14 evidence を配置

## Out of scope

- 新規 API endpoint / D1 schema / Google Form 仕様変更（serial-00 不変条件 NFR 継承）
- 新規 primitive 追加 / 既存 primitives の props 変更
- serial-00..06 のコード再変更（regression 発見時は該当 SW へバックポート）
- branch protection の `gh api -X PUT`（ユーザー明示承認待ち）

## Required status check 候補（dev / main）

本 PR の merge 後、user-gated governance change として branch protection に追加する候補:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`
- `verify-phase12-compliance / verify`
- `verify-gate-metadata / verify`
- `verify-indexes-up-to-date / verify`

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm verify:tokens` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `outputs/phase-11/` に 14 evidence が物理存在
- [ ] `artifacts.json` が gate-metadata zod schema を通過

## Screenshots

- `outputs/phase-11/screenshots/top.png`
- `outputs/phase-11/screenshots/members-list.png`
- `outputs/phase-11/screenshots/member-detail.png`
- `outputs/phase-11/screenshots/admin-dashboard.png`

## References

- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/phase-01..12-*.md`
- CLAUDE.md（UI prototype alignment / PR pre-flight / required status check 候補）

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 4. commit 戦略

| commit | 内容 | files |
|--------|------|-------|
| C-01 | spec 追加 | `apps/web/playwright/tests/visual/{top,members-list,member-detail}.spec.ts`（+ admin-dashboard.spec.ts は既存 / 微修正のみ） |
| C-02 | baseline PNG コミット | `apps/web/playwright/tests/visual/*-snapshots/*-chromium-linux.png` × 4 |
| C-03 | evidence 配置 | `outputs/phase-11/**`（log 7 / screenshot 4 / metadata 3） |

> C-02 は CI で生成された baseline を取得してから push する 2 段階フロー。

## 5. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(ui-foundation): serial-07 regression evidence (visual 4 screens + verify-design-tokens + pr-ready)" --body "$(cat <<'EOF'
（§3 の本文）
EOF
)"
```

## 6. PR 作成前 checklist

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` で PR 範囲を確認
- [ ] `outputs/phase-11/` の 14 evidence が物理存在
- [ ] baseline PNG が `-chromium-linux.png` で揃っている（`-darwin.png` のみではない）
- [ ] `apps/api/src/**` の diff が 0 行
- [ ] `apps/web/src/components/ui/**` の diff が 0 行
- [ ] 新規 CI workflow ファイルが追加されていない

## 7. merge 後の後続アクション

| アクション | 担当 | タイミング |
|----------|------|---------|
| branch protection に required status check 6 件を追加 | user 明示承認後 | governance change |
| `playwright-visual-full.yml` の nightly 監視で baseline drift 確認 | 自動 | 継続 |
| serial-00..06 / 本 SW の workflow を `completed-tasks/` に移動 | user 明示承認後 | close-out operation |
