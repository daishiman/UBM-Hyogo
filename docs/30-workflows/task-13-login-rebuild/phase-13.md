# Phase 13: PR Preparation Gate — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 13 / 13 |
| wave | w5-par |
| mode | user-gated |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented-local |

## 目的

`.claude/commands/ai/diff-to-pr.md` 仕様に従う PR 本文・検証コマンド・スクリーンショット参照を準備する。branch 作成、commit、push、`gh pr create` はこの Phase の仕様書作成時点では実行しない。ユーザーが明示的に PR 作成を指示した後だけ実行する。

## 実行タスク

1. PR 作成前 checklist を `outputs/phase-13/pr-readiness-checklist.md` にまとめる。
2. Phase 12 `implementation-guide.md` を PR Summary / Implementation guide に転記できる形に整える。
3. Phase 11 screenshot 7 件の expected path を PR body skeleton に列挙する。
4. Test plan に `@ubm-hyogo/web` の現行 package command を記載する。
5. PR 実行コマンドは user approval 後の runbook として記録し、未承認状態では実行しない。

## User Approval Gate

| 操作 | 現時点の扱い |
| --- | --- |
| branch 作成 | 実行禁止。ユーザー明示指示後のみ |
| commit | 実行禁止。ユーザー明示指示後のみ |
| push | 実行禁止。ユーザー明示指示後のみ |
| `gh pr create` | 実行禁止。ユーザー明示指示後のみ |
| staging smoke | user approval 後の runtime cycle で実行 |

## PR 本文 skeleton

```markdown
## Summary
- /login をカード型 5 core states + rules_declined derived state にリビルド
- OKLch tokens 適用（HEX 直書き 0）
- Auth.js + Magic Link API surface 不変

## Implementation guide
（outputs/phase-12/implementation-guide.md の本文を転記）

## Screenshots
- input: outputs/phase-11/login-input.png
- sent: outputs/phase-11/login-sent.png
- unregistered: outputs/phase-11/login-unregistered.png
- deleted: outputs/phase-11/login-deleted.png
- error: outputs/phase-11/login-error.png
- rules_declined: outputs/phase-11/login-rules-declined.png
- gate=admin_required: outputs/phase-11/login-gate-admin.png

## Test plan
- [ ] pnpm typecheck
- [ ] pnpm lint
- [ ] pnpm --filter @ubm-hyogo/web test -- login
- [ ] PLAYWRIGHT_EVIDENCE_TASK=task-13-login-rebuild pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts --project=desktop-chromium
- [ ] pnpm --filter @ubm-hyogo/web verify-design-tokens
```

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`
- CLAUDE.md「PR作成の完全自律フロー」
- 出典タスク §14（受け入れチェックリスト）
- Phase 12 `outputs/phase-12/implementation-guide.md`

## 依存 Phase 成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 5: 実装差分
- Phase 6: 単体テスト
- Phase 7: 統合テスト
- Phase 8: a11y
- Phase 9: E2E smoke
- Phase 10: token / lint gate
- Phase 11: visual evidence
- Phase 12: documentation / skill sync

## PR 作成前チェック

- [ ] `git status --porcelain` が期待した変更だけを示す
- [ ] `git diff dev...HEAD --name-only` が出典 §3 + 本 task package + aiworkflow sync に収まる
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映
- [ ] `outputs/phase-11/` の png 7 件と PR 本文の参照が整合
- [ ] PR base = `dev`（production リリース時のみ `main`）
- [ ] ユーザーから PR 作成の明示指示がある

## 多角的チェック観点

- diff scope 規律: 出典 §「diff scope 規律」と整合
- typecheck / lint / verify-design-tokens / Playwright / Vitest がすべて green の状態でのみ PR 実行
- `--no-verify` を付けない
- CLOSED Issue を参照する場合は `Refs #<issue>` のみ使う

## サブタスク管理

- [x] PR readiness checklist を作成
- [ ] PR body skeleton を作成
- [ ] Test plan command が現行 package name と一致
- [ ] user approval gate を確認

## 成果物

- `outputs/phase-13/pr-readiness-checklist.md`
- PR body skeleton（user approval 後に使用）

## 完了条件

- [ ] PR 作成に必要な情報が揃っている
- [ ] branch / commit / push / PR は未実行
- [ ] Phase 12 strict evidence と矛盾しない

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] user approval gate が明記されている

## 次の引き渡し

ユーザーが PR 作成を明示指示した後、Phase 5〜12 の実装・検証 evidence を再確認し、PR 作成へ進む。
