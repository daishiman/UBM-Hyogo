# Phase 13: PR 作成

## ブランチ

`feat/issue-277-next-proxy-migration` → base: `dev`

## PR タイトル

```
fix(web): migrate middleware.ts to proxy.ts (Next.js 16 convention) — refs #277
```

## PR 本文テンプレ

```markdown
## Summary

- `apps/web/middleware.ts` を `apps/web/proxy.ts` にリネーム（Next.js 16 deprecation 対応）
- export function 名を `middleware` → `proxy` に変更
- `/admin/:path*` と `/profile/:path*` の gate 振る舞いは完全保持
- `apps/web/__tests__/proxy.spec.ts` を新規追加

## Why

Next.js 16 で `middleware` file convention は deprecated。dev / build 時に `"middleware" file convention is deprecated. Please use "proxy" instead.` warning が出続けるため、公式 codemod (`@next/codemod middleware-to-proxy`) で proxy convention に移行。

## Acceptance Criteria（issue #277）

- [ ] `/admin/:path*` と `/profile/:path*` の gate behavior が proxy convention に移行
- [ ] 未ログイン `/profile` → 307 `/login?redirect=%2Fprofile` redirect
- [ ] admin gate の `gate=admin_required` 挙動を維持
- [ ] proxy 関連 test (`apps/web/__tests__/proxy.spec.ts`) を追加

## Test plan

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm --filter @ubm-hyogo/web test`
- [ ] `pnpm --filter @ubm-hyogo/web build`（deprecation warning が消えることを確認）
- [ ] 手動 smoke: logged-out `/profile` / `/admin`、admin login、非 admin login の 4 シナリオ

## Evidence

`docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11/` 参照（M-1〜M-6 evidence 取得後に記載）

Refs #277
```

## PR 作成コマンド

```bash
gh pr create --base dev --title "fix(web): migrate middleware.ts to proxy.ts (Next.js 16 convention) — refs #277" --body "$(cat <<'EOF'
... (上記本文)
EOF
)"
```

## Post-merge

- issue #277 の close は PR merge 後にユーザー承認を得て実行する。PR 本文は `Refs #277` のみを使い、自動 close keyword は使わない。
- `docs/30-workflows/issue-277-next-proxy-migration/` を `docs/30-workflows/completed-tasks/` に移動（実装サイクル後）

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装と evidence が揃った後、ユーザー承認を得て PR を作成できる状態にする。

## 実行タスク

- PR title / body template を準備する。
- checkboxes は実行後にのみチェックする。
- Issue #277 close は user-gated とする。

## 参照資料

- Phase 10 final review。
- Phase 11 evidence。
- Phase 12 compliance check。

## 成果物

- PR body template。
- user approval 後の PR。

## 完了条件

- PR 作成前にユーザー承認がある。
- PR body は `Refs #277` のみを使う。
