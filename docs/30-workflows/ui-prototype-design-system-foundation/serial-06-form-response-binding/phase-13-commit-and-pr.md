---
phase: 13
title: Commit / PR draft
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

## 1. ブランチ戦略

- 作業ブランチ: `feat/serial-06-form-response-binding`
- base: `dev`
- target: `dev` への PR（CLAUDE.md「既定ブランチは dev」「PR作成の完全自律フロー」遵守）

## 2. Commit 分割

| # | scope | subject |
|---|-------|---------|
| C-01 | feat | adapter member-detail.ts 新規 (visibility filter + unknown kind silent skip) |
| C-02 | test | adapter unit spec (6 cases, branch coverage 100%) |
| C-03 | feat | MemberDetail primitive 新規 (既存 primitive 4 種で composition) |
| C-04 | feat | (public)/members/[id]/page.tsx fetch + adapter + notFound 配線 |
| C-05 | test | Playwright visual spec + visibility filter assertion |
| C-06 | chore | fixture samplePublicMemberProfile 追加 |
| C-07 | docs | Phase 11 evidence + Phase 12 documentation 更新 |

solo 開発のため細かい分割は必須ではないが、revert 容易性のため最低でも C-01〜C-04 と C-05 以降は分けることが望ましい。

## 3. PR title

```
feat(serial-06): Form response → MemberDetail 描画の adapter + page 配線
```

## 4. PR body draft

```markdown
## Summary

- `apps/web/src/lib/adapters/member-detail.ts` を新規追加し、`PublicMemberProfileZ` の API response を `MemberDetail` primitive 用 props に正規化する pure adapter を実装
- `apps/web/app/(public)/members/[id]/page.tsx` を Server Component 化し、`GET /public/members/:id` → adapter → primitive の配線を完了
- `apps/web/src/components/public/MemberDetail.tsx` を新規追加し、既存 4 primitive（ProfileHero / MemberTags / MemberDetailSections / MemberActivity）の composition layer として配置
- visibility filter（`public` のみ通す）/ unknown kind silent skip を UI 側で二重防御

## 不変条件遵守

- 既存 API endpoint surface 変更なし（`apps/api/` git diff 空）
- D1 binding 直接アクセスなし
- 既存 primitive props 変更なし
- 新規 primitive 追加なし

## Test plan

- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- adapters/__tests__/member-detail`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-member-detail`
- [ ] `bash scripts/verify-pr-ready.sh`

## Evidence

- Playwright snapshot: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/public-member-detail.png`
- adapter spec output: `outputs/phase-11/adapter-spec.txt`
- Playwright result: `outputs/phase-11/playwright-result.txt`

## 関連 sub-workflow

- 依存: `serial-05-page-routes-blueprint-binding`（page skeleton）
- 後続: `serial-07-regression-evidence`（4 screens visual baseline 確定）
```

## 5. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(serial-06): Form response → MemberDetail 描画の adapter + page 配線" \
  --body "$(cat <<'EOF'
# (PR body 本文を ここに貼る)
EOF
)"
```

CLAUDE.md「PR作成の完全自律フロー」§実行順序 を遵守する:

1. `git fetch origin dev` → ローカル `dev` を fast-forward
2. 作業ブランチに戻り `git merge dev`（コンフリクト時は CLAUDE.md §コンフリクト解消の既定方針）
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`
4. `git status --porcelain` 空確認
5. `git diff dev...HEAD --name-only` で PR 対象ファイル列挙
6. `gh pr create --base dev`

## 6. PR pre-flight 失敗時のフロー

`bash scripts/verify-pr-ready.sh` が fail した場合は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を順に確認:

1. `gate-metadata:validate`（artifacts.json zod schema）
2. `verify:phase12-compliance`（canonical 9 headings / Phase 11 evidence 表 / workflow root scan）
3. `indexes:rebuild` drift

## 7. PR 作成前チェック（CLAUDE.md 必須）

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が取得できる
- [ ] `implementation-guide.md`（本 sub-workflow `phase-05-implementation-guide.md`）の主要見出しと内容が PR 本文に反映されている
- [ ] `outputs/phase-11/` 配下の画像数と PR 本文の画像参照が整合
- [ ] スクリーンショットがない場合は PR 本文にスクリーンショット専用セクションを残さない

## 8. 最終レポート（CLAUDE.md 必須）

PR 作成完了後、以下を 1 回だけ報告する:

- PR URL
- 採用ブランチ（`feat/serial-06-form-response-binding`）
- 実行した自動修復（あれば）
- 解消したコンフリクト（あれば）
- 残課題の有無

## 9. 参照

- CLAUDE.md「PR作成の完全自律フロー」「ブランチ戦略」
- `.claude/commands/ai/diff-to-pr.md`
- Phase 5 / Phase 11 / Phase 12
