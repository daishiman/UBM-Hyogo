# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

実装完了後、**user の明示承認後にのみ** PR を作成する。

## 前提（PR 前チェック）

- Phase 1-12 完了。全テスト green / typecheck / lint green。
- `git status --porcelain` 空（全変更コミット済み）。
- base ブランチは `dev`（CLAUDE.md PR フロー）。
- Issue #982 は **CLOSED のまま維持**（再オープンしない。PR 本文で「#982 を実装で解消」と参照のみ）。

## PR 本文要素

- 背景: #982（CLOSED）の初期未実装事項を最新コードへ最適化して実装。
- 変更点: tag write API 3 本 / repository / audit / MemberDrawer 編集化 / invariant #13 再定義。
- Issue 最適化差分の表（`tag_assignments`→`member_tags` 等）。
- テスト結果サマリー（API/repo/web/型 gate 件数）。
- 視覚証跡: `outputs/phase-11/` に screenshot があれば参照。なければ section を作らない。
- 関連: Closes/Refs #982（CLOSED 維持のため `Refs #982` を使用）。

## 実行コマンド（user 承認後）

```bash
git add -A
git commit -m "feat(admin): #982 member drawer tag pill 編集 + tag write endpoint"
git push -u origin docs/issue-982-drawer-tag-pill-editing-task-spec  # or feat/ ブランチ
gh pr create --base dev --title "feat(admin): #982 member tag pill 編集 persistence + tag write endpoint" --body-file <body>
```

## 制約

- **commit / push / PR は user の明示承認後のみ**（CLAUDE.md / CONST_002）。
- 本仕様書フェーズ（spec 作成）では実行しない。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- PR URL（user 承認後）

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- user 承認後に PR 作成完了
- PR 本文に Issue 最適化差分とテスト結果が反映
