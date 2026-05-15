# Phase 13: PR 作成

## 実行条件

**ユーザーの明示的な承認後のみ実施する。**

承認文言例: 「PR 作成」「PR 出して」「diff-to-pr」など。

---

## 1. PR base ブランチ

| 種別 | base |
|------|------|
| 通常 | `dev` |
| production リリース時のみ | `main`（`dev → main`）|

本タスク（task-23）は `dev` を base とする。

---

## 2. PR タイトル案

```
docs(task-23): add VERIFICATION-STATUS matrix for ui-prototype-alignment (22×4=88 cells)
```

## 3. PR 本文骨子

```markdown
## Summary
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md` を新規追加
- 22 タスク × 4 検証条件 = 88 セルの matrix で完了状況を可視化
- task-19/20/21/22 の脱漏と task-03/04/07 の「未確認」状態を解消

## Test plan
- [ ] matrix の 88 セルが PASS / WARN / FAIL / N/A のいずれかで埋まっている
- [ ] WARN / FAIL の備考が 100% 付与されている
- [ ] GFM table が GitHub web preview で崩れない
- [ ] task-27 から本 matrix を参照可能

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 4. 事前チェック

- [ ] `git status --porcelain` 空
- [ ] `git diff dev...HEAD --name-only` で生成ファイル一覧確認
- [ ] `pnpm typecheck` / `pnpm lint` 緑（docs-only でも実行）

---

## 5. 作成コマンド

```bash
gh pr create --base dev --title "<title>" --body "<body from heredoc>"
```

---

## 6. 成果物

- `outputs/phase-13/pr-url.md`（PR URL 記録）
