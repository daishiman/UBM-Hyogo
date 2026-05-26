# Phase 13: PR作成（blocked / user-gated）

## メタ情報

| 項目     | 値                                                |
| -------- | ------------------------------------------------- |
| Phase    | 13 / 13（PR 作成）                                |
| 依存     | Phase 12                                          |
| ステータス | blocked（user-gated）                            |
| 成果物   | outputs/phase-13/phase-13.md                      |

## 目的

CLAUDE.md および solo dev ポリシーに従い、commit / push / PR 作成は user の明示承認後のみ実行する。
本書は想定 PR 構成と事前確認 checklist を文書化する。

## 実行タスク

- [ ] user 明示承認を受領
- [ ] `pnpm install --force`
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] `git status --porcelain` クリーン化
- [ ] base = `dev` を確認
- [ ] commit 作成（HEREDOC で message 渡し）
- [ ] push（必要なら upstream 設定）
- [ ] `gh pr create --base dev` 実行
- [ ] PR URL を報告

## 想定 PR

- base: `dev`
- title 案: `feat: public header surfaces my-profile nav for authenticated members`
- body 骨子: `outputs/phase-12/implementation-guide.md`

## 想定 commit 構成

単一 commit 推奨:

```
feat(public-header): surface my-profile nav link for authenticated members

- PublicHeader gains currentUser prop and authenticated CTA branch
- SessionAwarePublicHeader wraps getSession() to keep PublicHeader sync
- (public)/layout.tsx and app/page.tsx switch to SessionAwarePublicHeader
- PublicHeader.spec: add 3 cases (anon CTA / auth CTA / aria-current on /profile)
- (public)/layout.spec: vi.mock the async wrapper to a sync stub
- docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment: phase 1-13 spec

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 参照資料

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- CLAUDE.md「PR作成の完全自律フロー」

## 成果物

- `outputs/phase-13/phase-13.md`（本書）

## 完了条件

- [ ] user 承認後に PR URL を報告
- [ ] base = `dev`
- [ ] 全 hook（lefthook）green
