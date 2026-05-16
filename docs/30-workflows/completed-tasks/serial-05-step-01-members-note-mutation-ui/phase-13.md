# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR・振り返り |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 12 (正本同期) |
| 次 Phase | なし（完了） |
| 状態 | pending |
| PR base | `dev` |
| PR branch | `feat/serial-05-step-01-members-note-mutation-ui` |

---

## 目的

Phase 1-12 の全成果物（コード + 設計書 + skill 同期 + screenshot + handoff memo）を 1 PR に集約し、`dev` ブランチへのマージ準備を完了させる。

> **承認ゲート**: commit / push / PR 作成はユーザーの明示承認後のみ実行する。Phase 13 本文は operator runbook であり、この仕様書を作成・改善するだけのサイクルでは実行しない。

---

## PR 構成

### タイトル

```
feat(admin-mutation-ui): add useAdminMutation hook and NoteForm for member notes
```

### Body（CLAUDE.md PR フロー準拠）

```markdown
## Summary

- `useAdminMutation` hook を `apps/web/src/features/admin/hooks/` に新規追加。step-02..08 が共有する admin mutation 共通基盤。
- `NoteForm` component と MemberDrawer notes section を追加し、member note の作成 / 編集を UI から実行可能に。
- API は `apps/api/src/routes/admin/member-notes.ts` 既存実装をそのまま利用（変更なし）。

## Test plan

- [ ] `pnpm --filter @ubm-hyogo/web test -- useAdminMutation.spec.ts` green
- [ ] `pnpm --filter @ubm-hyogo/web test -- NoteForm.spec.tsx` green
- [ ] `pnpm --filter @ubm-hyogo/web test -- MemberDrawer.notes.integration.spec.tsx` green
- [ ] `pnpm typecheck` / `pnpm lint` green
- [ ] `bash scripts/coverage-guard.sh` exit 0 (>=80% 4 指標)
- [ ] design token 違反 0（`pnpm verify:tokens`）
- [ ] 手動動作確認（add / edit / cancel / toast / refresh）

## Screenshots

- SS-01..SS-06（`outputs/phase-11/` 配下 6 枚）

## Refs

- Workflow: docs/30-workflows/serial-05-step-01-members-note-mutation-ui/
- Origin spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-01-members-note/spec.md
```

## PR 作成手順（ユーザー承認後のみ）

```bash
git fetch origin dev
git switch -c feat/serial-05-step-01-members-note-mutation-ui
git merge origin/dev
# コンフリクト解消（CLAUDE.md「PR作成の完全自律フロー」のコンフリクト解消方針に従う）
git add -A
git commit -m "..." # Phase 5 commit 粒度に従う
git push -u origin feat/serial-05-step-01-members-note-mutation-ui
gh pr create --base dev --title "feat(admin-mutation-ui): add useAdminMutation hook and NoteForm for member notes" --body "$(cat <<'EOF'
（上記 Body を貼り付け）
EOF
)"
```

## 完了条件

- [ ] PR が `dev` を base に作成済
- [ ] CI 全 gate green（typecheck / lint / test / coverage / tokens / playwright-smoke / visual smoke）
- [ ] PR body の AC chunklist 全 check
- [ ] PR URL を `outputs/phase-13/pr-url.md` に記録

## 振り返り（lessons learned）

`outputs/phase-13/retrospective.md` に以下を記録:

| 観点 | 内容 |
| --- | --- |
| 設計判断の妥当性 | `useAdminMutation` の汎用度 / `router.refresh` 採用の妥当性 |
| 手戻り箇所 | Phase 3 / 7 / 9 で発見した問題と原因 |
| step-02..08 への教訓 | hook surface 命名 / error shape parse の固定方法 |
| skill 改善提案 | task-specification-creator skill 改善案（あれば） |

## タスク100%実行確認【必須】

- [ ] PR 作成
- [ ] CI green
- [ ] 振り返り 1 件 commit
- [ ] index.md の状態を `completed` に更新
- [ ] user approval marker を `outputs/phase-13/user-approval.md` に記録

## 次Phase

なし（タスク完了）。step-02..08 担当が本 PR merge 後に `useAdminMutation` を import して同パターンを展開する。
