# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| workflow_state | `implemented_local_runtime_pending`（実装済み・commit/PR は user-gated） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| Phase 13 status | `pending_user_approval` |

## 目的

実装完了後、**user の明示承認後にのみ** PR を作成する。
**本 wave（spec 作成）では PR を作成しない。** 本書は実装完了後の PR gate として使用する。

## 前提（PR 前チェック）

- Phase 1-12 完了。全テスト green / typecheck / lint green。
- `git status --porcelain` 空（全変更コミット済み）。
- base ブランチは `dev`（CLAUDE.md PR フロー）。
- Issue #1036 は **CLOSED のまま維持**（再オープンしない。PR 本文で `Refs #1036` 参照のみ）。

## 想定 PR タイトル

```
feat(admin): 複数member tag一括付与/解除 bulk endpoint+UI (Refs #1036)
```

## PR 本文骨子

- **背景**: #1036（CLOSED）の bulk tag assign を最新コードへ最適化して実装。issue-982 followup-003
  として scope-out されていた「bulk tag assign」を 1 サイクルで完結。
- **変更点**:
  - task-A（apps/api）: `POST /admin/members/tags/bulk` + `bulkApplyMemberTagsByAdmin` repository
    helper + `GET /admin/tags`（tag master read）+ member×tag 単位 audit（batchId 相関）+ type-level gate。
  - task-B（apps/web）: `BulkActionBar` への tag picker + assign/unassign 切替 + 部分失敗結果表示
    + `bulkApplyMemberTags` / `fetchTagMaster` API client。
  - task-C（docs）: 不変条件 #13 の第3経路（bulk admin manual write）再定義。
- **Issue 最適化差分の表**: #913（server idempotency store）非依存を DB 自然冪等（複合 PK +
  INSERT OR IGNORE / DELETE meta.changes）で代替した点、audit 相関を correlation_id 列追加でなく
  batchId 埋め込みで実現した点を表で明示。
- **テスト結果サマリー**: API contract / repository / type gate / web component の件数。
- **視覚証跡**: `outputs/phase-11/` に screenshot があれば参照（`bulk-tag-picker-assign-mode.png`,
  `bulk-tag-result-partial-failure.png` 等）。**なければ視覚証跡 section を作らない**。
- **関連**: `Refs #1036`（CLOSED 維持のため Closes ではなく Refs を使用）。

## 実行コマンド（user 承認後）

```bash
git add -A
git commit -m "feat(admin): 複数member tag一括付与/解除 bulk endpoint+UI (Refs #1036)"
git push -u origin <feat/ ブランチ>
gh pr create --base dev \
  --title "feat(admin): 複数member tag一括付与/解除 bulk endpoint+UI (Refs #1036)" \
  --body-file <body>
```

## 制約

- **commit / push / PR は user の明示承認後のみ**（CLAUDE.md / CONST_002）。
- **本仕様書フェーズ（spec 作成）では実行しない。**
- base は `dev`（production リリース時のみ `--base main`）。

## 実行タスク

- 本 Phase の記載内容を実装完了後の PR gate として使用する。

## 成果物

- PR URL（user 承認後）

## 参照資料

- docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/index.md
- .claude/commands/ai/diff-to-pr.md（Phase 13 仕様）
- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/phase-13-pr.md（親先例）

## 完了条件

- user 承認後に PR 作成完了（本 wave では未実施）
- PR 本文に Issue 最適化差分とテスト結果が反映
