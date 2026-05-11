# Phase 13: PR Readiness

> 改訂日: 2026-05-10
> 状態: `blocked_pending_user_approval`

## 1. User gate

commit / push / PR 作成はユーザー明示承認後のみ。本 Phase では PR 本文に入れる境界と checklist を固定する。

## 2. PR summary draft

- task-16 を現行 repo topology に合わせて再構成。
- 正本 route / panel / API helper を `apps/web/app`、`src/components/admin`、`src/lib/admin` に統一。
- Phase 12 strict 7 outputs と aiworkflow-requirements 同期を追加。
- Runtime visual evidence は `PENDING_RUNTIME_EVIDENCE` として user-gated。

## 3. Pre-PR checklist

- [ ] `cmp artifacts.json outputs/artifacts.json` が 0。
- [ ] Phase 12 strict 7 files present。
- [ ] drift keywords appear only in correction notes or anti-pattern lists, never as implementation instructions.
- [ ] focused tests green。
- [ ] user approval received.
