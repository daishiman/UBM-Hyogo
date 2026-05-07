[実装区分: 実装仕様書]

# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成（approval-gated） |
| 作成日 | 2026-05-03 |
| 前 Phase | 12 (ドキュメント・未タスク検出・スキルフィードバック) |
| 次 Phase | なし（最終） |
| 状態 | pending |
| user_approval_required | **true** |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #393 (CLOSED) |
| workflow_state（PR 完了時） | `implementation_completed`（strict CI gate 昇格は別 wave） |

## 目的

local check → commit → push → `gh pr create` の最終ゲートを通し、issue #393 に対応する **legacy literal cleanup 実装 PR**（仕様書 + 14 ファイル置換）を作成する。
**ユーザーの明示的な承認なく commit / push / PR 作成を行ってはならない。**

issue #393 は既に **CLOSED** 維持のため、PR body / commit message には `Closes #393` を **使わず** `Refs #393` のみ採用する。

## 三役ゲート（user 承認 / 実 push / PR 作成）

| # | ゲート | 通過条件 | Claude が実行可か |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | `outputs/phase-13/change-summary.md` を提示し、user の **明示文言**（「PR 作成して」等）で承認取得 | 承認取得まで実行禁止 |
| 2 | 実 push ゲート | ゲート 1 PASS 後、family 別 commit → feature ブランチ push | ゲート 1 後にのみ実行 |
| 3 | PR 作成ゲート | ゲート 2 PASS 後、`gh pr create` で PR 発行、PR URL を `outputs/phase-13/pr-info.md` に記録 | ゲート 2 後にのみ実行 |

> 曖昧な合意（「いいよ」程度）では実行しない。`change-summary.md` を提示した上での明示指示を要件とする。

## 必須成果物 6 点

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-13/main.md` | Phase 13 トップ index（三役ゲート結果サマリ） |
| `outputs/phase-13/local-check-result.md` | typecheck / lint / strict lint / vitest focused / link-checklist / secret hygiene grep の PASS ログ |
| `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前にユーザー提示） |
| `outputs/phase-13/pr-template.md` | PR title / body の最終確定版 |
| `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI 結果 |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |

## local-check-result.md（必須記録コマンド）

pre-merge gate として **4 ゲートすべて PASS** を必須とする。

```bash
# 1. install 整合性
mise exec -- pnpm install --force

# 2. typecheck（PASS）
mise exec -- pnpm typecheck

# 3. ESLint lint（PASS、suppression 0 件）
mise exec -- pnpm lint

# 4. stableKey strict lint（violation 0、AC-1 直接証跡）
mise exec -- node scripts/lint-stablekey-literal.mjs --strict

# 5. vitest focused（既存 unit / 統合 test PASS、AC-3）
mise exec -- pnpm vitest run --changed

# 6. evidence secret hygiene 再 grep
grep -iE '(token|cookie|authorization|bearer|set-cookie)' \
  docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/*.txt \
  || echo 'PASS (0 hit)'

# 7. artifacts.json parity
jq '.metadata.workflow_state' \
  docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/artifacts.json
# 期待: "implementation_completed"

# 8. Phase 12 7 ファイル実体確認
ls -1 docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-12/ | wc -l
# 期待: 7

# 9. Phase 11 evidence 5 件実体確認
ls -1 docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/ | wc -l
# 期待: 5（または任意 evidence 含む 6）

# 10. suppression 追加 0 件
git diff main...HEAD -- 'apps/**' 'packages/**' | grep -c 'eslint-disable' || echo '0'
# 期待: 0
```

すべて PASS を `outputs/phase-13/local-check-result.md` に記録。

## change-summary.md（user 提示用）

```markdown
## 変更サマリー（issue #393 - stableKey literal legacy cleanup）

### スコープ
- 14 ファイル / 148 件の stableKey literal を正本 supply module 経由参照に置換
- 仕様書 `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/` 一式

### 変更 14 ファイル（family 別グルーピング）

| family | 対象ファイル |
| --- | --- |
| A (sync) | `apps/api/src/jobs/mappers/sheets-to-members.ts`<br>`apps/api/src/jobs/sync-sheets-to-d1.ts` |
| B (repository) | `apps/api/src/repository/_shared/builder.ts`<br>`apps/api/src/repository/publicMembers.ts` |
| C (admin routes) | `apps/api/src/routes/admin/members.ts`<br>`apps/api/src/routes/admin/requests.ts` |
| D (public) | `apps/api/src/use-cases/public/list-public-members.ts`<br>`apps/api/src/view-models/public/public-member-list-view.ts`<br>`apps/api/src/view-models/public/public-member-profile-view.ts` |
| E (web profile) | `apps/web/app/profile/_components/RequestActionPanel.tsx`<br>`apps/web/app/profile/_components/StatusSummary.tsx` |
| F (web public) | `apps/web/src/components/public/MemberCard.tsx`<br>`apps/web/src/components/public/ProfileHero.tsx` |
| G (shared) | `packages/shared/src/utils/consent.ts` |

### Before / After violation 数

| 指標 | Before | After |
| --- | --- | --- |
| `lint-stablekey-literal.mjs --strict` violation | 148 | **0** |
| stableKeyCount | 31 | 31（不変） |
| suppression（eslint-disable）追加 | 0 | 0 |

### AC-1〜AC-7 トレース

| AC | 内容 | evidence |
| --- | --- | --- |
| AC-1 | 14 ファイル strict violation 0 | E2 lint-strict-after.txt |
| AC-2 | stableKeyCount=31 維持 | E5 stable-key-count.txt |
| AC-3 | 既存 unit/統合 test PASS | E4 vitest-focused.txt |
| AC-4 | typecheck PASS | E3 typecheck.txt |
| AC-5 | lint PASS（ESLint + strict） | E2 + local-check-result.md |
| AC-6 | suppression 0 件 | local-check-result.md（git diff grep 0） |
| AC-7 | 親 03a AC-7 strict CI gate 昇格可能 state | E2 + Phase 10 AC-7 更新 diff 計画 |

### 後続 wave 引き継ぎ
- 親 03a workflow `outputs/phase-12/implementation-guide.md` AC-7 表記更新
- `.github/workflows/*.yml` で `--strict` を blocking 化
- runtime dynamic literal guard 検討
```

## コミット粒度（family 別 commit + 仕様書 commit）

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | spec phases 1-7 | `phase-01.md`〜`phase-07.md` + `outputs/phase-01〜07/` + `index.md` + `artifacts.json` 初版 |
| 2 | spec phases 8-13 | `phase-08.md`〜`phase-13.md` + `outputs/phase-08〜10/` |
| 3 | impl family G (shared) | `packages/shared/src/utils/consent.ts` |
| 4 | impl family A (sync) | `apps/api/src/jobs/mappers/sheets-to-members.ts`, `sync-sheets-to-d1.ts` |
| 5 | impl family B (repository) | `apps/api/src/repository/_shared/builder.ts`, `publicMembers.ts` |
| 6 | impl family C (admin routes) | `apps/api/src/routes/admin/members.ts`, `requests.ts` |
| 7 | impl family D (public) | `apps/api/src/use-cases/public/list-public-members.ts`, `view-models/public/*.ts` ×2 |
| 8 | impl family E (web profile) | `apps/web/app/profile/_components/*.tsx` ×2 |
| 9 | impl family F (web public) | `apps/web/src/components/public/*.tsx` ×2 |
| 10 | evidence + Phase 11 | `outputs/phase-11/*` + `outputs/phase-11/evidence/*` |
| 11 | docs Phase 12（7 ファイル + AC-7 diff 計画） | `outputs/phase-12/*.md` 7 件 |
| 12 | Phase 13 / artifacts 最終確定 | `outputs/phase-13/*.md` + `artifacts.json` 最終 status |

> family 別 commit は revert 単位 = commit 単位を保つ（Phase 10 rollback 戦略参照）。

## PR template

```
title: feat(issue-393): stableKey literal legacy cleanup (14 files / 148 → 0 violations)

body:
## Summary
- Issue #393（CLOSED 維持）対応: 14 ファイル / 148 件の stableKey literal を正本 supply module 経由参照に置換
- 親 03a workflow AC-7 を「strict CI gate 昇格可能 state」に更新可能化
- 正本 supply module:
  - `packages/shared/src/zod/field.ts`
  - `packages/integrations/google/src/forms/mapper.ts`
- taskType: implementation / visualEvidence: **NON_VISUAL**

## 変更 14 ファイル（family 別）
| family | files |
| --- | --- |
| A (sync) | apps/api/src/jobs/mappers/sheets-to-members.ts, apps/api/src/jobs/sync-sheets-to-d1.ts |
| B (repository) | apps/api/src/repository/_shared/builder.ts, apps/api/src/repository/publicMembers.ts |
| C (admin routes) | apps/api/src/routes/admin/members.ts, apps/api/src/routes/admin/requests.ts |
| D (public) | apps/api/src/use-cases/public/list-public-members.ts, view-models/public/public-member-list-view.ts, view-models/public/public-member-profile-view.ts |
| E (web profile) | apps/web/app/profile/_components/RequestActionPanel.tsx, StatusSummary.tsx |
| F (web public) | apps/web/src/components/public/MemberCard.tsx, ProfileHero.tsx |
| G (shared) | packages/shared/src/utils/consent.ts |

## Before / After
| 指標 | Before | After |
| --- | --- | --- |
| `lint-stablekey-literal.mjs --strict` | 148 violations | **0** |
| stableKeyCount | 31 | 31 |
| suppression 追加 | — | 0 |

## AC トレース
- [ ] AC-1 14 ファイル strict violation 0
- [ ] AC-2 stableKeyCount=31 維持
- [ ] AC-3 既存 unit/統合 test PASS
- [ ] AC-4 typecheck PASS
- [ ] AC-5 lint PASS（ESLint + strict）
- [ ] AC-6 suppression 0 件
- [ ] AC-7 親 03a workflow AC-7 strict CI gate 昇格可能 state

## Test plan（pre-merge gate 4 件全 PASS）
- [ ] mise exec -- pnpm typecheck PASS
- [ ] mise exec -- pnpm lint PASS（suppression 0）
- [ ] mise exec -- node scripts/lint-stablekey-literal.mjs --strict PASS（violation 0）
- [ ] mise exec -- pnpm vitest run --changed PASS

## Refs
Refs #393

## Notes
- `Closes #393` は **使用しない**（issue は既に CLOSED）
- 後続 wave: strict CI gate 昇格 PR（`.github/workflows/*.yml` で blocking 化）
- 親 03a workflow `outputs/phase-12/implementation-guide.md` AC-7 表記更新は本 PR と同 wave or 直後 wave で実施予約
```

注意:

- `Closes #393`（自動 close）は **使わない**。issue は既に closed のため `Refs #393` を採用。
- 本 PR merge 後、root `workflow_state` は `implementation_completed` を維持。strict CI gate 昇格 wave の Phase 12 で `completed` 昇格。

## rollback

- family 別 commit 構成のため `git revert <commit>` で family 単位の安全な巻き戻しが可能（Phase 10 rollback 戦略参照）
- 仕様書 commit と実装 commit が分離されているため、実装のみ revert / 仕様書のみ残すことも可能
- 致命的な障害時は `git revert -m 1 <merge_commit>` で PR 全体を巻き戻し

## 後続 wave 引き継ぎ

| 項目 | 後続 wave 担当 |
| --- | --- |
| 親 03a workflow `outputs/phase-12/implementation-guide.md` AC-7 表記更新 | strict CI gate 昇格 wave or 本 PR 内（Phase 12 で判断） |
| `.github/workflows/*.yml` で `--strict` を blocking 化 | strict CI gate 昇格 wave |
| runtime dynamic literal guard | 別タスク（unassigned-task-detection で起票） |
| `workflow_state` を `completed` 昇格 | strict CI gate 昇格 wave Phase 12 |

## 実行タスク

- [ ] user 承認待ち（change-summary.md 提示）
- [ ] local check 10 step 実行 → `local-check-result.md` 記録
- [ ] change-summary.md 作成（14 ファイル一覧 / Before-After / AC トレース表含む）
- [ ] pr-template.md 確定
- [ ] **user 承認後** push + `gh pr create`
- [ ] PR URL を `outputs/phase-13/pr-info.md` に記録
- [ ] CI 結果を `outputs/phase-13/pr-info.md` に記録

## 完了条件

- [ ] 三役ゲートすべて PASS
- [ ] PR URL 取得済み
- [ ] artifacts.json の phase 13 を completed
- [ ] root `workflow_state` を `implementation_completed` 維持（completed には strict gate wave で昇格）
- [ ] pre-merge gate 4 ゲート全 PASS（typecheck / lint / strict-lint / vitest focused）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 13 を completed
- [ ] PR URL を `outputs/phase-13/pr-info.md` に記録
- [ ] `Refs #393` を採用、`Closes #393` を使用していないことを確認

## 終了

本タスク完了をもって、14 ファイル・148 件の stableKey literal cleanup が完了し、親 03a workflow AC-7 を strict CI gate 昇格可能 state に更新できる準備が整う。
strict CI gate 昇格は別 wave。Issue #393 は CLOSED 維持のまま、PR merge 後に `gh issue comment` で実装 PR リンクを追記する運用とする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | Phase 13 approval gate |
| 必須 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 close-out evidence |
| 必須 | `outputs/phase-11/manual-smoke-log.md` | family 別 typecheck PASS 履歴 |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-13/main.md` | Phase 13 index |
| `outputs/phase-13/local-check-result.md` | local checks 10 step |
| `outputs/phase-13/change-summary.md` | user-facing change summary |
| `outputs/phase-13/pr-template.md` | PR title / body 最終確定版 |
| `outputs/phase-13/pr-info.md` | PR URL / CI |
| `outputs/phase-13/pr-creation-result.md` | PR creation log |
