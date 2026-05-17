[実装区分: 実装仕様書]

# Phase 13: コミット・PR 作成

## メタ情報

| 項目 | 値 |
|------|----|
| タスク ID | i02-admin-error-type-unify |
| Phase | 13 / 13 |
| 区分 | NON_VISUAL / code-change |
| **status** | **blocked_pending_user_approval** |
| base branch | `dev`（CLAUDE.md PR 既定ブランチ） |
| 作業ブランチ案 | `fix/i02-admin-error-type-unify` |

> **重要**: 本 Phase はユーザーの明示的な承認後にのみ実行する。
> 承認前に `git commit` / `git push` / `gh pr create` を実行してはならない。
> 承認待ち中は `blocked_pending_user_approval` 状態を維持する。

## 目的

Phase 1–12 で完成した「`useAdminMutation` の error class を `AuthRequiredError` / `FetchAuthedError` に統一する」変更を、
1 つの自己完結したコミットにまとめ、`dev` ブランチへの PR として提出する。

## 実行タスク（承認後のみ）

1. ローカル `dev` を `origin/dev` に fast-forward 同期
2. 作業ブランチを切る／既存作業ブランチに `dev` をマージ
3. `mise exec -- pnpm install --force && pnpm typecheck && pnpm lint` を順次実行
4. Phase 11 evidence と Phase 12 ドキュメントを含めて commit
5. `gh pr create --base dev` で PR 作成
6. PR URL を報告

## 参照資料

- CLAUDE.md「PR作成の完全自律フロー」
- ソース発注書: `parallel-i02-admin-error-type-unify/spec.md`
- Phase 11 evidence: `outputs/phase-11/evidence/`
- Phase 12 docs: `outputs/phase-12/`
- 関連 issue: **Refs #** 番号は UI prototype alignment / MVP recovery の親 issue を参照（発注書側で確認のうえ補完。未確定なら PR 本文の `Refs #` 行は ユーザー承認時に確定）

## 実行手順（承認後）

```bash
# 0) 承認確認後のみ実行
cd <repo-root>

# 1) dev 同期
git fetch origin dev
git switch dev && git pull --ff-only origin dev

# 2) 作業ブランチ
git switch -c fix/i02-admin-error-type-unify  # 既存ブランチがあればその名前を使用
git merge dev --no-edit                       # conflict は CLAUDE.md の既定方針で解消

# 3) 検証
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4) コミット（推奨 1 コミット構成）
git add apps/web/src/features/admin/hooks/useAdminMutation.ts \
        apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
        apps/web/src/features/admin/hooks/index.ts \
        docs/30-workflows/i02-admin-error-type-unify/

git commit -m "$(cat <<'EOF'
fix(web/admin): unify useAdminMutation error classes with AuthRequiredError/FetchAuthedError (i02)

apps/web/src/features/admin/hooks/useAdminMutation.ts: replace AdminMutationHttpError
with AuthRequiredError (401) and FetchAuthedError (non-2xx) from @/lib/fetch/authed,
so that the p-10 401-redirect logic catches admin mutation failures and triggers
/login?redirect=... navigation. Delete the local AdminMutationHttpError class and its
re-export. Update useAdminMutation.spec.ts assertions to the new error classes.

No runtime behavior change other than the 401 redirect path becoming reachable
from admin mutations. Public API surface (AdminMutationResult) is unchanged.

Refs #<parent-issue>
EOF
)"

# 5) push & PR
git push -u origin fix/i02-admin-error-type-unify
gh pr create --base dev --title "fix(web/admin): unify useAdminMutation error classes (i02)" \
  --body-file docs/30-workflows/i02-admin-error-type-unify/outputs/phase-13-pr-body.md
```

## PR 本文骨子（phase-13-pr-body.md として配置）

```markdown
## Summary
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` の error class を
  `AuthRequiredError` / `FetchAuthedError`（`@/lib/fetch/authed`）へ統一
- ローカル独自 class `AdminMutationHttpError` を完全削除（再 export も削除）
- `useAdminMutation.spec.ts` の expected error class を新 class に更新
- これにより p-10 の 401 → `/login?redirect=...` redirect logic が admin mutation
  でも自動発火する

## Background
parallel-08 / parallel-10 は 401/403 error path の共有を前提に設計されていたが、
実コードでは `apps/web/src/lib/fetch/authed.ts` の `AuthRequiredError` /
`FetchAuthedError` と、`useAdminMutation` 内部の `AdminMutationHttpError` が
並立しており、redirect logic が admin mutation 経由の 401 を拾えていなかった。
本 PR で error class を単一系統に統合し、UX 上の認証切れ自動 redirect を
admin 全画面に波及させる。

## Scope (in / out)
- in: hook 実装の error class 置換、spec assertion 更新、`hooks/index.ts` の export 整理
- out: `authed.ts` の class signature 変更、新 redirect logic 追加、API endpoint 側変更

## Test plan
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation` PASS
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed` PASS（regression なし）
- [ ] `rg "AdminMutationHttpError" apps/web/src` が 0 hit（完全削除確認）
- [x] admin mutation 401 で `/login?redirect=...` redirect が観測されることを
      int smoke で確認（責務: p-10）

## Risk
- `AdminMutationHttpError` を import している外部箇所があると build break。
  事前 grep で `useAdminMutation.ts` / spec / `hooks/index.ts` の 3 箇所のみと確認済み。

Refs #<parent-issue>
```

## ユーザー承認ゲート【必須】

以下を **明示的に** ユーザーから受領するまで、commit / push / PR 作成を実行しない。

- [ ] 「Phase 13 を実行してよい」旨のユーザーからの明示承認
- [ ] `Refs #` に入れる親 issue 番号の確定（UI prototype alignment / MVP recovery の親 issue）
- [ ] 作業ブランチ名 `fix/i02-admin-error-type-unify` の許諾（別名指定があれば従う）

承認受領後に状態を `blocked_pending_user_approval` → `ready_to_push` → `pr_opened` と遷移させる。

## 統合テスト連携

- p-10 が未完了でも本 PR は merge 可能（throw 切替は破壊なし）
- p-10 merge 後、redirect 連携の int smoke を p-10 側で追加

## 多角的チェック観点（AIが判断）

| 観点 | 判定方法 |
|------|---------|
| ガバナンス | base=`dev`、線形履歴維持、`--no-verify` 不使用 |
| 完全性 | `git diff dev...HEAD --name-only` が想定 3 ファイル + Phase 11/12 docs |
| 安全性 | `AdminMutationHttpError` 残参照 0 hit を PR 作成前に確認 |
| 影響範囲 | API surface / D1 schema / public route いずれも変更なし |

## サブタスク管理

- [ ] ユーザー承認受領
- [ ] dev 同期
- [ ] typecheck / lint PASS
- [ ] commit 作成
- [ ] push
- [ ] PR 作成
- [ ] PR URL 報告

## 成果物

```
outputs/phase-13.md（本ファイル）
outputs/phase-13-pr-body.md（PR 本文・承認後配置）
PR URL（gh pr create 結果）
```

## 完了条件

- ユーザー承認後に commit / push / PR が完了
- PR base が `dev`
- PR 本文に Summary / Background / Scope / Test plan / Risk / `Refs #` を含む
- `AdminMutationHttpError` 残参照 0 hit

## タスク100%実行確認【必須】

- [ ] status を `blocked_pending_user_approval` で開始したことを明記
- [ ] base branch=`dev` を明記
- [ ] PR 本文骨子に Summary / Background / Test plan / Risk / `Refs #` を含む
- [ ] 承認ゲートが明文化されている
- [ ] `--no-verify` / force push を使わない方針を明記

## 次Phase

なし（タスク完了）。PR merge 後は `dev` → staging 反映を通常フローで確認。
