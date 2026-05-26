# Phase 13: commit / PR / release

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 13
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 13 (PR作成) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-13-pr.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。
> **本ステップは user-gated**。Claude Code は自律 commit / push / PR を行わない。

## 1. ブランチ戦略

- base: `dev`
- branch 名（推奨）: `feat/issue-912-idempotent-attendance-remove-retry`

## 2. commit 構成（推奨単一 commit）

```
feat(issue-912): admin attendance remove を冪等 DELETE + retry/idempotencyKey opt-in に切替

- apps/web/src/lib/admin/api.ts: removeAttendance を DELETE /meetings/:s/attendance/:m へ
- apps/web/src/components/admin/MeetingPanel.tsx: attendanceMutation を add/remove 2本に分割。
  remove 側を素の fetch 経路 + retry:{maxAttempts:3} + idempotencyKey 関数で opt-in。
- apps/web/src/lib/admin/__tests__/api.spec.ts / apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx: helper DELETE と remove retry/idempotency coverage。
- useAdminMutation.ts 本体・apps/api 側 endpoint は無変更。
Refs #912 / #842
```

## 3. PR 本文（雛形）

```
## Summary

issue-842 で整備済みの useAdminMutation reliability policy（retry / idempotencyKey / overload 型ガード）を、
admin の出席解除経路（既に冪等な DELETE /meetings/:sessionId/attendance/:memberId）で初の運用 caller として opt-in 有効化する。

## 変更点

- helper `removeAttendance` を DELETE 直叩きへ切替
- `MeetingPanel.tsx` の `attendanceMutation` を `addAttendanceMutation` / `removeAttendanceMutation` の 2 本に分割
- `removeAttendanceMutation` は `mutationFn` を使わず素の fetch 経路で動作し、`retry: { maxAttempts: 3 }` + `idempotencyKey: () => crypto.randomUUID()` を opt-in
- 既存 `MeetingPanel.component.spec.tsx` 拡張で retry / Idempotency-Key / 4xx 非 retry / 404 race / 既存挙動回帰を verify

## Test plan

- [x] `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` 全 PASS
- [ ] `pnpm typecheck` / `pnpm lint` green
- [ ] `bash scripts/verify-pr-ready.sh` green

## Refs

- Closes #912 が不可（CLOSED のため）→ Refs #912
- Refs #842（親 reliability policy）
```

## 4. release / runtime 検証

- merge 後 staging deploy で DevTools Network 経由で:
  - DELETE 経路への切替確認
  - `Idempotency-Key: <uuid>` header 確認
  - 一過性 5xx 再現（API 側意図的 503 注入）で retry 確認

## 5. user 承認待ち

| アクション | 承認要否 |
|---|---|
| `git add` / `git commit` | user-gated |
| `git push` | user-gated |
| `gh pr create --base dev` | user-gated |
| staging deploy | user-gated |
| production deploy | user-gated |
