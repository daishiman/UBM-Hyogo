# Phase 13: PR作成

| 項目 | 値 |
|------|-----|
| Phase | Phase 13 — PR 作成 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `spec_created`（本サイクルで PR を作成しない） |
| base ブランチ | `dev` |
| 作業ブランチ | `feat/public-members-tag-filter-ux` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`outputs/phase-12/implementation-guide.md`](./outputs/phase-12/implementation-guide.md) |


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 13 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 完了条件

- [x] 必須見出しを満たす
- [x] 4条件（矛盾なし・漏れなし・整合性あり・依存関係整合）に反しない
<!-- validator-facing required sections: end -->

## 0. 前提

CONST_002: commit / push / PR 作成は **user 明示承認後のみ実施**。本仕様書段階では `git commit` / `git push` / `gh pr create` を**実行しない**。本サイクルは `implemented_local_runtime_pending`（ローカル実装済み）であり、コード差分・screenshot もまだ存在しない。

## 1. PR 作成手順（本サイクル・user 承認後）

```bash
git fetch origin dev
git checkout feat/public-members-tag-filter-ux
git merge origin/dev   # conflict は CLAUDE.md 既定方針で解消
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
mise exec -- pnpm verify:design-tokens   # AC-6: HEX/任意色 0 件
git add -A
git status --porcelain   # 残差なし確認
git diff dev...HEAD --name-only   # apps/api / packages/shared / D1 / Form 差分 0 確認（AC-8）
```

## 2. PR 本文

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照し、`outputs/phase-12/implementation-guide.md` の内容を反映する。

### title 候補

`feat(web): 公開メンバー一覧のタグ絞り込み UI を横並び化しフィルタ領域を整理`

### body 骨子

```
## Summary
- /members のタグ絞り込み chip を縦積みから横並び（flex-wrap）へ修正し、見にくさを解消
- フィルタ領域（検索 / 区画 / ステータス / 並び替え / タグ）を data-role グルーピングで階層整理
- 選択中タグの aria-checked 強調セレクタ不一致を是正（accent トークンで明示）
- member-grid comfy gap をトークン化し過密感を緩和（3 密度・列定義は維持）

Refs: なし（staging UI/UX 観察起点・Issue 紐付けなし）
workflow: docs/30-workflows/completed-tasks/public-members-tag-filter-ux-refine/

## 変更ファイル（UI 表現層のみ・API/D1/Form 非接触）
- apps/web/src/styles/legacy-public.css（tag-picker-options flex / filter-group / member-grid gap）
- apps/web/src/styles/globals.css（tag-pill 選択強調 aria-checked 併記）
- apps/web/src/components/public/MemberFilters.client.tsx（filter-group ラッパ 1 個）
- apps/web/src/components/public/__tests__/*.spec.tsx（assertion 追随）

## Test plan
- [ ] vitest targeted run pass（TagPicker / MemberFilters / MemberGrid / MemberCard / members page）
- [ ] typecheck / lint pass
- [ ] verify-pr-ready.sh pass
- [ ] verify-design-tokens pass（HEX/任意色 0 件）
- [ ] apps/api / packages/shared / D1 / Form 差分 0
- [ ] Phase 11 screenshots 5 件添付（/members 横並び・グルーピング・grid 余白・モバイル wrap・選択強調）
```

screenshot 参照は `outputs/phase-11/screenshots/*.png` が存在する場合のみ追記する（本サイクルは pending のため未添付）。

## 3. base ブランチ

`--base dev`（production リリースでないため）。`gh pr create --base dev` で作成する。

## 4. user-gated 境界（本サイクルで実行しない）

| Item | Boundary |
|------|----------|
| コード実装（CSS + markup + spec 追随） | implemented_local |
| staging deploy + visual runtime screenshot 取得 | user-gated |
| commit / push / PR 作成 | user-gated |

## 5. 完了条件

- [x] PR 作成手順明示
- [x] title / body 骨子確定（base=dev）
- [x] commit/push/PR は user 明示承認後のみ・staging visual は未実行と明記
