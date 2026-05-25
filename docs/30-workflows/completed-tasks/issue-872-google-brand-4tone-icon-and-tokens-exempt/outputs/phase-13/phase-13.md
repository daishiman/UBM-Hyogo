**[実装区分: 実装仕様書 / 状態: spec_created]**

# Phase 13: PR 作成・ドキュメント更新仕様

issue #872 [FU-LOGIN-001] 実装完了後の PR 作成手順を固定する。CLAUDE.md「PR 作成の完全自律フロー」と整合。**user 明示承認後のみ実行**。

## 1. 前提

- base ブランチ: **`dev`** (CLAUDE.md 既定)
- 作業ブランチ: `feat/issue-872-google-brand-4tone-icon` (実装 + 仕様書統合 PR の場合)
  - 仕様書のみを別 PR にする場合: `docs/issue-872-google-brand-4tone-icon-spec`
- 全 Phase 4-11 の DoD クリア (typecheck / lint / build / verify-design-tokens / vitest / playwright visual すべて exit 0)
- `git status` クリーン (commit 済み)
- Phase 11 evidence 9 件 + screenshot 2 件 tracked-commit 済み
- issue #872 は **CLOSED 維持**。本 PR では `Refs #872` (Closes ではない)

## 2. PR 作成前検証 (CLAUDE.md PR 自律フロー §実行順序)

```bash
git fetch origin dev
git checkout dev
git merge --ff-only origin/dev || git pull --ff-only origin dev
git checkout feat/issue-872-google-brand-4tone-icon
git merge dev   # コンフリクト発生時は dev 側採用 + 必要差分再適用 (CLAUDE.md 既定方針)

mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で push 可。`verify-pr-ready.sh` fail 時は skill `references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い解消。

## 3. 正本仕様反映の確認

- `docs/00-getting-started-manual/specs/09b-design-tokens.md` に `## Brand-asset exempt` 章が追加済
- `scripts/verify-design-tokens.ts` の `DEFAULTS.brandIconExemptPaths` 実装と spec 章の path-glob が一致
- 親 workflow `login-page-prototype-alignment` の `outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-001 行が `consumed (issue-872)` に更新済
- `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` の `status: consumed` + `canonical_workflow` 更新済

## 4. PR 本文テンプレート (`.claude/commands/ai/diff-to-pr.md` 準拠)

```markdown
## Summary

- Google ログインボタンのアイコンを 1-tone `currentColor` から **公式 4-tone "G"** に置換 (Google brand guideline 準拠)
- `verify-design-tokens` に `brandIconExemptPaths` を導入し、`apps/web/src/components/ui/brand-icons/*.svg` のみ HEX 直書きを許容 (OKLch token 不変条件は他全領域で維持)
- 親 follow-up FU-LOGIN-001 (`docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md`) を consumed として更新

Refs #872

## 背景

親 workflow `login-page-prototype-alignment` の Phase 11 evidence 取得時、Google ブランド整合の最終形 (4-tone) を独立スコープ FU-LOGIN-001 に切り出し、MVP は 1-tone `currentColor` で許容した。本 PR は FU-LOGIN-001 の consumed 実装。

## 変更ファイル (11 件)

新規 (2):
- `apps/web/src/components/ui/brand-icons/google.svg`
- `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx`

編集 (9):
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx`
- `apps/web/src/components/ui/icons.ts`
- `apps/web/src/components/ui/Icon.tsx`
- `scripts/verify-design-tokens.ts`
- `scripts/verify-design-tokens.spec.ts`
- `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- `apps/web/playwright/tests/visual/login.spec.ts-snapshots/login-visual-chromium-linux.png`
- `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` (consumed 表記)
- `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` (status: consumed)

仕様書:
- `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/**` (Phase 1-13 + evidence)

## AC

- [ ] AC-1: `brand-icons/google.svg` + `GoogleBrandIcon.tsx` 存在
- [ ] AC-2: `/login` で 4-tone "G" 表示 (screenshot)
- [ ] AC-3: `pnpm tsx scripts/verify-design-tokens.ts` exit 0
- [ ] AC-4: `pnpm vitest run scripts/verify-design-tokens.spec.ts` PASS
- [ ] AC-5: `IconName` union から `"google"` 削除 + `case "google"` 削除
- [ ] AC-6: `09b-design-tokens.md` brand-asset exempt 章追加
- [ ] AC-7: 親 FU-LOGIN-001 / unassigned-task spec が consumed 表記
- [ ] AC-8: typecheck / lint / build PASS
- [ ] AC-9: login visual baseline 更新後 Playwright visual PASS

## 検証手順

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm tsx scripts/verify-design-tokens.ts
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/login.spec.ts --project=desktop-chromium
bash scripts/verify-pr-ready.sh
```

## Screenshots

- `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/outputs/phase-11/screenshots/login-google-button-4tone.png` (desktop 1440×900)
- `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/outputs/phase-11/screenshots/login-google-button-4tone-mobile.png` (mobile 375×812)

## Follow-ups

- FU-872-001: 他 OAuth provider (GitHub / X / Apple) brand-icon 追加
- FU-872-002 / FU-LOGIN-002: UBM brand-mark を公式ロゴ画像アセット化
- FU-872-003 / FU-LOGIN-003: staging visual smoke gate
```

## 5. PR 作成コマンド

```bash
gh pr create --base dev \
  --title "feat(login): introduce official 4-tone GoogleBrandIcon + verify-design-tokens brandIconExemptPaths (Refs #872)" \
  --body "$(cat <<'EOF'
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
- merge 後、FU-872-001..003 を `docs/30-workflows/unassigned-task/` 配下に YAML frontmatter 付きで切り出すか、GitHub Issue として open する。
- issue #872 は CLOSED のまま (本 PR で再 OPEN しない)。

## 7. リリース後検証 (staging)

merge → dev → staging deploy 後:

- `https://ubm-hyogo-web-staging.daishimanju.workers.dev/login` を開き、4-tone "G" が表示されることを目視確認
- DevTools で SVG path 4 本の `fill` が公式 HEX (`#4285F4` / `#34A853` / `#FBBC05` / `#EA4335`) であることを確認
- Lighthouse a11y は親 workflow 値 (95+) を維持

production 反映は `dev → main` リリースサイクルで実施 (solo dev / CI gate のみ保護)。

## 8. DoD

- [ ] §2 PR 作成前検証コマンドすべて exit 0
- [ ] §3 正本 spec 反映確認すべて済
- [ ] §4 PR 本文が全項目埋まっている
- [ ] PR URL が user に共有される
- [ ] §6 indexes / LOGS 更新が commit 済み
- [ ] §7 staging 確認が done (user-gated)
- [ ] issue #872 が CLOSED 維持 (再 OPEN なし)

## 次 Phase への引き継ぎ

merge + staging 確認後、workflow_state を `implementation_completed` に更新し、本 workflow を `docs/30-workflows/completed-tasks/` 配下に移動するかは user 判断。
