# Phase 13: PR 作成

> Phase: 13 / 13
> 名称: PR 作成
> ステータス: `blocked`（ユーザー明示承認後にのみ実行）

---

## 13.1 PR 設定

| 項目 | 値 |
|------|----|
| base | `dev`（既定。production リリース時のみ `main`） |
| head | `feat/parallel-07-auth-and-shared`（または個別 slug） |
| title 案 | `feat(parallel-07): auth/shared routes に Card layout + focus 管理 + OKLch skeleton を導入` |

PR 作成は **ユーザー明示指示** があった場合のみ実行する（CLAUDE.md「PR 作成の完全自律フロー」に従う）。

---

## 13.2 PR 本文構成

```
## Summary

- `/login/error.tsx` を Card layout に統一、focus 管理を追加
- `/login/loading.tsx` を新規作成（OKLch skeleton + role=status）
- root `error.tsx` に focus 管理追加
- `/profile/loading.tsx` を root loading と統一した skeleton に
- `/loading.tsx` / `/not-found.tsx` は OKLch / ブランディング検証のみ

## 変更ファイル

- `apps/web/app/login/error.tsx` 編集
- `apps/web/app/login/loading.tsx` 新規
- `apps/web/app/error.tsx` 編集
- `apps/web/app/profile/loading.tsx` 編集
- `apps/web/app/loading.tsx` 検証（差分有無を本 PR に明記）
- `apps/web/app/not-found.tsx` 検証（変更なし）
- 4 unit spec + 1 e2e spec 追加

## 不変条件

- OKLch token のみ（HEX 直書き 0、`verify-design-tokens` pass）
- 既存 API endpoint surface のみ、D1 直接アクセスなし
- `.spec.tsx` 必須（`verify-test-suffix` pass）
- prefers-reduced-motion 尊重（`motion-safe:` prefix）

## 視覚証跡

`docs/30-workflows/task-parallel-07-auth-and-shared/outputs/phase-11/` に 4 画面 × light/dark = 8 PNG。

## Test plan

- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test` 全 spec pass、カバレッジ 80%+
- [ ] `pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/auth-and-shared.spec.ts` pass
- [ ] `verify-design-tokens` CI pass
- [ ] `verify-test-suffix` CI pass
- [ ] jest-axe violations 0
- [ ] VoiceOver で error / loading が正しくアナウンスされる
- [ ] dark テーマで focus outline が視認可能

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 13.3 commit 戦略

| commit | 内容 |
|--------|------|
| `feat(parallel-07): add login/loading.tsx with OKLch skeleton` | F2 単独 |
| `feat(parallel-07): refactor login/error.tsx to Card layout with focus management` | F1 |
| `feat(parallel-07): add focus management to root error boundary` | F3 |
| `feat(parallel-07): unify profile/loading.tsx skeleton with root loading` | F5 |
| `test(parallel-07): add unit + e2e specs for auth/shared routes` | spec 群 |
| `docs(parallel-07): task workflow Phase 1-13 specs + Phase 11/12 outputs` | docs 一式 |

`--no-verify` は使用しない。lefthook gate / Cloudflare CLI ラッパー方針に従う。

---

## 13.4 approval gate

- **Gate-D**: ユーザー明示承認後にのみ `git push` と `gh pr create` を実行する
- branch 戦略: `feature/* → dev → main` の `feature/* → dev` 区間
- solo dev のため reviewer 必須数は 0、CI required status checks のみで保護

---

## 13.5 PR 作成前チェック（CLAUDE.md フロー準拠）

1. `git fetch origin dev` → ローカル `dev` を fast-forward
2. 作業ブランチで `dev` を merge、コンフリクトは CLAUDE.md 既定方針で解消
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `pnpm test` / targeted Playwright を順に実行し、Phase 9 の実測結果と drift がないことを確認
4. `git status --porcelain` 空、`git diff dev...HEAD --name-only` で含めるファイルを確認
5. PR 本文に `outputs/phase-12/implementation-guide.md` の Part1/Part2 主要見出しを反映
6. `outputs/phase-11/*.png` 8 枚の存在確認、PR 本文にスクリーンショット参照を含める

---

## 13.6 完了判定

- PR URL が返ってきている
- base = `dev`、head = 作業ブランチ
- CI required status checks 通過
- ユーザーに最終レポート（PR URL / 採用ブランチ / 自動修復 / コンフリクト解消 / 残課題）を 1 回だけ返す
