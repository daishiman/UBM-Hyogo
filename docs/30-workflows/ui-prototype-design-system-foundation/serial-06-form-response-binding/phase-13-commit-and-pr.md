---
phase: 13
title: Commit / PR draft
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

CLAUDE.md「PR作成の完全自律フロー」を厳格に遵守する。base ブランチは **`dev`** 固定（`main` への直 PR は禁止）。

## 1. ブランチ戦略

- 作業ブランチ: `feat/serial-06-form-response-binding`
- base: `dev`
- target: `dev` への PR
- 採用ブランチ命名は CLAUDE.md「既定ブランチは dev」「PR作成の完全自律フロー」§実行順序 §1 と整合

ワークツリー: `.worktrees/task-20260523-123853-wt-10`（CLAUDE.md「ワークツリー作成」遵守 / メインディレクトリで claude を起動しない）

## 2. Commit 分割

| # | scope | subject |
|---|-------|---------|
| C-01 | feat | adapter `member-detail.ts` 新規 (visibility filter + unknown kind silent skip) |
| C-02 | test | adapter unit spec (8 cases, branch coverage 100%) |
| C-03 | chore | fixture `samplePublicMemberProfile` 追加 |
| C-04 | feat | `MemberDetail` primitive 新規 (既存 4 primitive で composition) |
| C-05 | feat | `(public)/members/[id]/page.tsx` fetch + adapter + notFound 配線 |
| C-06 | test | Playwright visual spec + visibility filter assertion |
| C-07 | docs | Phase 11 evidence + Phase 12 compliance check 更新 |

solo 開発のため細かい分割は必須ではないが、revert 容易性のため **最低でも C-01〜C-05 と C-06 以降は分けることが望ましい**。

> CLAUDE.md「PR作成の完全自律フロー」§実行順序: 分割が不可能な場合は単一 commit で push しても可。

## 3. PR title

```
feat(serial-06): Form response → MemberDetail 描画の adapter + page 配線
```

70 文字以内（CLAUDE.md「Creating pull requests」遵守）。

## 4. PR body draft

```markdown
## Summary

- `apps/web/src/lib/adapters/member-detail.ts` を新規追加し、`PublicMemberProfileZ` の API response を `MemberDetail` primitive 用 props に正規化する pure adapter を実装
- `apps/web/app/(public)/members/[id]/page.tsx` を Server Component 化し、`GET /public/members/:id` → schema parse → adapter → primitive の配線を完了
- `apps/web/src/components/public/MemberDetail.tsx` を新規追加し、既存 4 primitive（ProfileHero / MemberTags / MemberDetailSections / MemberActivity）の composition layer として配置
- visibility filter（`public` のみ通す）/ unknown kind silent skip を UI 側で二重防御
- fixture `samplePublicMemberProfile` を追加し、adapter unit spec（8 ケース）と Playwright spec（visibility filter assertion 含む）で網羅

## 不変条件遵守

- 既存 API endpoint surface 変更なし（`git diff dev...HEAD -- apps/api/` 空）
- D1 binding 直接アクセスなし
- 既存 primitive props 変更なし
- 新規 primitive 追加なし
- `process.env.*` 直接参照無し（`getEnv()` 経由）
- HEX 直書き 0 件
- 新規 test は `*.spec.{ts,tsx}` のみ

## Test plan

- [x] `mise exec -- pnpm typecheck`
- [x] `mise exec -- pnpm lint`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-member-detail --project=chromium`
- [x] `bash scripts/verify-pr-ready.sh`

## Evidence

- Playwright snapshot: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11/screenshots/public-member-detail.png`
- adapter spec output: `outputs/phase-11/adapter-spec.txt`
- Playwright result: `outputs/phase-11/playwright-result.txt`
- typecheck / lint / verify-pr-ready: `outputs/phase-11/{typecheck,lint,verify-pr-ready}.txt`

## 関連 sub-workflow

- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/`
- 依存: `serial-05-page-routes-blueprint-binding`（page skeleton / AppShell / boundary）
- 後続: `serial-07-regression-evidence`（4 screens visual baseline 確定）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

スクリーンショット（E-01）が存在しない場合は **`## Evidence` セクションのうち snapshot 行を削除する**（CLAUDE.md PR 作成前チェック §スクリーンショットがない場合）。

## 5. PR 作成コマンド

```bash
gh pr create --base dev \
  --title "feat(serial-06): Form response → MemberDetail 描画の adapter + page 配線" \
  --body "$(cat <<'EOF'
# (PR body 本文を §4 から貼る)
EOF
)"
```

## 6. 実行順序（CLAUDE.md「PR作成の完全自律フロー」§実行順序 完全遵守）

1. 現在ブランチと変更状況を確認。未作成なら `feat/serial-06-form-response-binding` を自律作成
2. `git fetch origin dev` を実行し、ローカル `dev` を `origin/dev` に fast-forward
3. 作業ブランチに戻り `git merge dev`
4. コンフリクト発生時は CLAUDE.md §コンフリクト解消の既定方針 に従い自律解消 → `git add` + `git commit`
   - 必要に応じて `mise exec -- pnpm sync:resolve`（skill / 30-workflows ログ union 解消）
5. 品質検証 4 コマンド実行:
   - `mise exec -- pnpm install --force`
   - `mise exec -- pnpm typecheck`
   - `mise exec -- pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
6. 失敗時は最大 3 回まで自動修復（Phase 7 §3）。修復差分は新規 commit で記録
7. `git status --porcelain` 空確認 → 残変更は `git add -A` + commit
8. `git diff dev...HEAD --name-only` で PR 対象ファイル列挙（漏れ無し確認）
9. Phase 11 evidence ファイル一覧と PR 本文の画像参照を整合確認
10. `gh pr create --base dev` で PR 作成
11. PR URL / 採用ブランチ / 自動修復履歴 / コンフリクト履歴 / 残課題を 1 回だけ報告

## 7. PR pre-flight 失敗時のフロー

`bash scripts/verify-pr-ready.sh` が fail した場合は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を順に確認:

1. `gate-metadata:validate`（`artifacts.json` zod schema）
2. `verify:phase12-compliance`（canonical 9 headings / Phase 11 evidence 表 / workflow root scan）
3. `indexes:rebuild` drift
4. CI 連動の `verify-indexes-up-to-date` / `verify-test-suffix`

## 8. PR 作成前チェック（CLAUDE.md 必須）

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が取得できる
- [ ] `phase-05-implementation-guide.md` の主要見出しと内容が PR 本文に反映されている
- [ ] `outputs/phase-11/` 配下の `png` / `jpg` 等画像数と PR 本文の画像参照が整合
- [ ] スクリーンショットがない場合は PR 本文にスクリーンショット専用セクションを残さない
- [ ] `apps/api/` に差分がない（`git diff dev...HEAD -- apps/api/` 空）

## 9. 最終レポート（CLAUDE.md 必須）

PR 作成完了後、以下を 1 回だけ報告する:

- PR URL
- 採用ブランチ（`feat/serial-06-form-response-binding`）
- 実行した自動修復（あれば）
- 解消したコンフリクト（あれば）
- 残課題の有無

## 10. 参照

- CLAUDE.md「PR作成の完全自律フロー」「ブランチ戦略」「ワークツリー作成」「sync-merge コンフリクト解消の3層予防」
- `.claude/commands/ai/diff-to-pr.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- Phase 5 実装ガイド / Phase 11 evidence / Phase 12 compliance check
