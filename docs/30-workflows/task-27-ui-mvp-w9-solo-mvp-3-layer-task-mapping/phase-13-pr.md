# Phase 13: PR 作成

> Phase: 13 / 13
> 名称: PR 作成
> 状態: **blocked（ユーザー明示承認待ち）**

---

## 前提

Phase 1〜12 がすべて completed であること。

`outputs/phase-12/` 配下に strict 7 成果物が揃い、`MVP-3LAYER-TASK-MAPPING.md` が `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` 直下に配置されていること。

---

## PR 構成

| 項目 | 値 |
|------|-----|
| base branch | `dev` |
| head branch | `feat/task-27-mvp-3-layer-task-mapping`（または現行 worktree branch） |
| タイトル例 | `docs(task-27): add MVP 3-layer × 22-task mapping matrix` |
| 含めるファイル | `docs/30-workflows/task-27-.../**` + `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` + workflow index 更新 + LOGS 更新 |
| 除外確認 | task-01〜22 spec / 実装ファイルの差分 0 件 |

---

## PR 本文テンプレート

```markdown
## Summary
- MVP recovery の戦略目標である「公開 / 会員 / 管理 / 共通」の 4 層と全 22 タスク（task-01〜22）の対応関係を可視化する mapping matrix を追加
- 88 セル double-entry matrix（タスク → 層 / 層 → タスク）+ WARN/FAIL 集約 + 層別 readiness 判定を含む
- task-23 検証結果を 3 層別に集約し、戦略レベルからの逆引き正本を提供

## 不変条件遵守
- read-only mapping（既存実装の書き換えなし）
- 88 セル空欄 0 件
- 双方向一致 100%
- 既存 API endpoint surface / D1 schema 変更なし

## Test plan
- [ ] `MVP-3LAYER-TASK-MAPPING.md` の 88 セル充足を目視確認
- [ ] 双方向一致確認（Matrix A ↔ Matrix B）
- [ ] WARN/FAIL 集約の取りこぼし 0 件確認
- [ ] 既存 task-01〜22 spec / 実装ファイルに diff がないこと（`git diff --stat`）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## ユーザー承認チェック

PR 作成・push は **ユーザーが明示的に許可した場合のみ実行**。本仕様書時点では `blocked` のまま。

---

## 完了条件

- ユーザー承認後、`gh pr create --base dev` で PR 作成
- PR URL を最終レポートに含める
- artifacts.json の Phase 13 status を `completed` に更新
