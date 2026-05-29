<!-- workflow: members-list-ux-clarity / task: C / phase: 13 / canonical: outputs/phase-13/main.md -->

[実装区分: 実装仕様書]

# Phase 13 — commit / push / PR (Task C: page-integration-and-visual-baseline)

> Branch: `feat/members-list-ux-clarity`
> PR base: **`dev`** (CLAUDE.md PR フロー既定)
> PR scope: Task A + Task B + Task C **合流 PR**
> 状態: `spec_created`

## 1. PR 構成方針

本ワークフローは 3 タスク (A/B/C) に分割されているが、いずれも同一 branch `feat/members-list-ux-clarity` 上で開発される。CONST_007 (1 サイクル完了) に従い、3 タスクの実装を **単一 PR** で `dev` に統合する。

PR タイトル案: `feat(members-list): UX clarity (density sublabel / live-filter affordance / result-count live region)`

## 2. PR 作成前チェック (CLAUDE.md "PR作成前チェック")

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` で 3 タスク全変更が含まれる
- [ ] Task A / Task B / Task C の `../../outputs/phase-12/main.md` 内容が PR 本文に反映される
- [ ] `outputs/phase-11/screenshots/` の画像数と PR 本文の画像参照が整合
- [ ] スクリーンショットがない場合は PR 本文にスクリーンショット節を残さない

## 3. 検証コマンド (PR 作成前)

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

`scripts/verify-pr-ready.sh` で以下が一括検証される:
- `gate-metadata:validate` (artifacts.json zod schema)
- `verify:phase12-compliance` (canonical 9 headings / Phase 11 evidence 表 / workflow root scan)
- `indexes:rebuild` drift 検査

## 4. PR 本文骨子

```
## Summary
- Task A: DensityToggle に sublabel と HelpHint を追加し、各モードの用途伝達を強化
- Task B: MemberFilters に live-filter microcopy と aria-live live region (`<output data-role="result-count">`) を追加、SelectedTagsBar を SelectedFiltersBar に一般化
- Task C: page.tsx に件数 prop (`totalCount` / `displayedCount`) を配線、Playwright visual baseline 24 snapshot 追加

## Scope
- /members route (Server Component + client components)
- 既存 API surface / D1 schema / Google Form / design tokens / primitives は不変

## Test plan
- [ ] mise exec -- pnpm typecheck GREEN
- [ ] mise exec -- pnpm lint GREEN
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web vitest run components/public app/(public)/members
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity --project=visual-chromium
- [ ] mise exec -- pnpm verify-design-tokens GREEN
- [ ] Linux baseline (Gate-C user-gated) で 24 PNG 撮影

## Screenshots
(outputs/phase-11/screenshots/ にある 12 ファイルを relative path で参照)
```

## 5. baseline PNG 取り扱い (both-or-none preflight)

- `members-ux-clarity.spec.ts` の追加と baseline PNG (24 枚) は **同一 push / 同一 PR** で完結
- spec のみ commit / baseline 未撮影状態の中間 commit を避ける
- baseline 撮影は **Linux runner** (Gate-C で user-gated) で実施

## 6. commit 分割案

| commit | scope |
| ------ | ----- |
| 1 | feat(public/members): DensityToggle sublabel + HelpHint (Task A) |
| 2 | feat(public/members): MemberFilters live-filter affordance + SelectedFiltersBar (Task B) |
| 3 | feat(public/members): page.tsx 件数 prop + members-ux-clarity visual baseline spec (Task C) |
| 4 | test(public/members): visual baseline PNG (Linux baseline・Gate-C) |

> commit メッセージは末尾に `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` を付与（CLAUDE.md 既定）。

## 7. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(members-list): UX clarity (density sublabel / live-filter affordance / result-count live region)" --body "$(cat <<'EOF'
... (上記 § 4 本文)
EOF
)"
```

## 8. PR 作成後

`outputs/phase-13/pr-creation-result.md` に PR URL / ブランチ / 自動修復履歴 / コンフリクト解消 / 残課題を記録。
