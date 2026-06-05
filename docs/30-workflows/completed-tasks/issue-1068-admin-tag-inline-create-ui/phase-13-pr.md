# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `spec_created`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

実装完了後、**user の明示承認後にのみ** PR を作成する。本仕様書フェーズ（spec 作成）では実行しない。

## 前提（PR 前チェック）

- Phase 1-12 完了。web unit / typecheck / lint が全 GREEN。
- `git diff --stat apps/api` が 0 件（API surface 不変）。
- `git status --porcelain` 空（全変更コミット済み）。
- base ブランチは `dev`（CLAUDE.md PR フロー）。
- branch: `feat/issue-1068-admin-tag-inline-create-ui`。
- Issue #1068 は **CLOSED のまま維持**（reopen しない。PR 本文で参照のみ）。

## PR 本文要素

- 背景: #1068（CLOSED）の admin member drawer tag inline-create 導線を最新コードへ最適化して実装。
- 変更点:
  - 新規 `apps/web/src/features/admin/components/_members/MemberTagInlineCreate.tsx`
  - 編集 `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`
  - 編集 `apps/web/src/features/admin/api/members.ts`
  - 新規 unit spec `.../__tests__/MemberDrawer.tagInlineCreate.spec.tsx`
  - 新規 visual spec `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts`
  - **apps/api 変更なし**（`git diff --stat apps/api` 0 件を本文に明記）
- AC 充足表（AC-1〜AC-6）。
- テスト結果サマリー（web unit 件数 + 型 / lint gate）。
  - **視覚証跡（VISUAL）**: `outputs/phase-11/` の screenshot を参照する。
  - `member-tag-inline-create-form-desktop.png`
  - `member-tag-inline-create-form-mobile.png`
  - screenshot が user-gated 保留の場合は「保留」と明記し、存在しない section は作らない。
- 関連: `Refs #1068`（CLOSED 維持のため `Closes` ではなく `Refs` を使用）。

## 実行コマンド（user 承認後）

```bash
git add -A
git commit -m "feat(admin): #1068 member drawer tag inline-create UI"
git push -u origin feat/issue-1068-admin-tag-inline-create-ui
gh pr create --base dev \
  --title "feat(admin): #1068 member drawer tag inline-create UI" \
  --body-file <body>
```

## 制約

- **commit / push / PR / screenshot 実機取得は user の明示承認後のみ**（CLAUDE.md / CONST_002）。
- 本仕様書フェーズ（spec 作成）では実行しない。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- PR URL（user 承認後）

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- user 承認後に PR 作成完了
- PR 本文に AC 充足表・テスト結果・Phase 11 screenshot 参照（VISUAL）が反映
- base `dev` / `Refs #1068`（CLOSED 維持）/ apps/api 差分 0 を本文に明記
