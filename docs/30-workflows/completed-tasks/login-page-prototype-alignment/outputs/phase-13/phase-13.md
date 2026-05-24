# Phase 13: PR 作成・ドキュメント更新仕様

**[実装区分: 実装仕様書]**

実装完了後の PR 作成手順を固定する。CLAUDE.md「PR 作成の完全自律フロー」と整合。

## 1. 前提

- base ブランチ: **`dev`** (CLAUDE.md 既定)
- 作業ブランチ: `feat/login-page-prototype-alignment` (推奨)
- 全 Phase 4-11 の DoD クリア
- `git status` クリーン (commit 済み)
- Phase 11 evidence 10 件 tracked-commit 済み

## 2. PR 作成前検証 (CLAUDE.md PR 自律フロー §実行順序)

```bash
git fetch origin dev
git checkout dev
git merge --ff-only origin/dev || git pull --ff-only origin dev
git checkout feat/login-page-prototype-alignment
git merge dev   # コンフリクト発生時は dev 側採用 + 必要差分再適用 (CLAUDE.md 既定方針)

mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で push 可。`verify-pr-ready.sh` が fail した場合は skill `references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い解消。

## 3. 正本仕様 (`docs/00-getting-started-manual/specs/13-mvp-auth.md`) 更新

実装と同一 PR 内で適用:

- /login UI 構造の Magic Link primary + OR + Google ghost を正式化
- 文言一覧 (Phase 4 §5) を spec 側に転記
- AC-1..AC-12 を Acceptance Criteria 節に追記
- brand-mark / 2 段タイトルの導入を明記

## 4. PR 本文テンプレート (`.claude/commands/ai/diff-to-pr.md` 準拠)

```markdown
## Summary

- `/login` ページの UI/UX を `docs/00-getting-started-manual/claude-design-prototype/` の LoginPage 仕様に整合
- Magic Link を primary、Google OAuth を ghost、間に OR divider を配置（ボタン順序入替）
- brand-mark "兵" + jp/en 2 段タイトル + 文言更新（Phase 4 §5 表）
- OKLch tokens 経由（HEX 0 件）/ 既存 API endpoint surface 維持 / Auth.js 経路不変

## 変更スコープ

新規 (5): `auth.css`, `LoginShell.tsx`, `OrDivider.tsx`, 機能 E2E spec, visual regression spec
編集 (8): `globals.css`, `icons.ts`, `Icon.tsx`, `LoginCard.tsx`, `LoginPanel.client.tsx`, `MagicLinkForm.client.tsx`, `GoogleOAuthButton.client.tsx`, `LoginStatus.tsx`, `page.tsx`, `specs/13-mvp-auth.md`
仕様書: `docs/30-workflows/login-page-prototype-alignment/**` (Phase 1-13 + evidence)

## Screenshots

実装サイクル後、`docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/screenshots/` の 5 PNG を本文中に参照:

- `login-input.png` (desktop 1440x900)
- `login-input-mobile.png` (375x812)
- `login-sent.png`
- `login-error.png`
- `login-unregistered.png`

## Test plan

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm --filter @ubm-hyogo/web test` exit 0
- [ ] `pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [x] `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts --project=desktop-chromium` exit 0 (local)
- [ ] visual regression baseline diff = 0
- [ ] dev server で `/login` 全 state (input / sent / error / unregistered / deleted / rules_declined) 目視確認
- [ ] Lighthouse a11y 95+

## Follow-ups

- FU-LOGIN-001: Google brand 正規 4-tone icon の導入
- FU-LOGIN-002: brand-mark を UBM 公式ロゴアセット化
- FU-LOGIN-003: `--ubm-radius-22` token 追加
- FU-LOGIN-004: staging visual smoke 統合
- FU-LOGIN-005: i18n
```

## 5. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(login): align /login UI with prototype (Magic Link primary + OR + Google ghost)" --body "$(cat <<'EOF'
…上記テンプレート…
EOF
)"
```

## 6. PR 後の追加対応

- `aiworkflow-requirements` indexes 再生成:
  ```bash
  mise exec -- pnpm indexes:rebuild
  ```
  drift 発生時はそのまま PR に commit 追加。
- `docs/30-workflows/LOGS.md` に本ワークフロー root の 1 行を追加。
- merge 後、Phase 13 の §7 follow-up issue 5 件を `unassigned-task` として `docs/30-workflows/unassigned-task/` 配下に YAML frontmatter 付きで切り出すか、GitHub Issue として open する。

## 7. リリース後検証 (staging)

merge → dev → staging deploy 後:

- `https://ubm-hyogo-web-staging.daishimanju.workers.dev/login` を開き、Phase 6 §2 のチェックリストを再実行
- `?state=sent&email=test@example.com` で sent state も確認
- Lighthouse mobile を再計測し 95+ を維持

production 反映は `dev → main` リリースサイクルで実施 (solo dev / CI gate のみ保護)。

## 8. DoD

- [ ] §2 PR 作成前検証コマンドすべて exit 0
- [ ] §3 正本 spec 更新 commit を含む
- [ ] §4 PR 本文が全項目埋まっている
- [ ] PR URL が user に共有される
- [ ] §6 indexes / LOGS 更新が commit 済み
- [ ] §7 staging 確認が done (user-gated)
