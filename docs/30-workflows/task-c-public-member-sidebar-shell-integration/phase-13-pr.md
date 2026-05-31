# Phase 13: PR 作成

## ステータス

`pending_user_approval` — PR 作成は **user の明示承認後のみ** 実行する（Gate-C）。
本サイクルでは PR 本文の構成案と実行手順を確定するに留める。

## 前提（実行の順序制約）

PR 作成は以下が完了した後に限る:

1. 依存 Task A/B/E（`apps/web/src/components/shell/`）が実装済み。
2. Task C 実装（layout 移動 / header 削除 / shell 配線）が GREEN。
3. local の focused vitest / typecheck / lint が green（Gate-B 通過）。Phase 11 pixel screenshot は Gate-C runtime evidence として、取得できた場合のみ PR 本文へ添付する。

## base ブランチ

- **base: `dev`**（開発統合ブランチ。CLAUDE.md 既定）。
- production リリース時のみ `dev → main`。Task C 単体 PR では `--base dev`。

## 作業ブランチ

- 主題: 公開 / 会員 layout の SidebarShell 統合 → `feat/` プレフィックス。
- 例: `feat/public-member-sidebar-shell-integration`。

## 含めるファイル一覧の取得方法

```bash
git fetch origin dev
# ローカル dev を origin/dev へ FF 同期 → 作業ブランチへ merge → conflict 解消
git status --porcelain                 # 未コミット変更を確認（空であること）
git diff dev...HEAD --name-only        # PR に含まれるファイル一覧（漏れなし確認）
```

## 品質検証（PR 作成前 / CLAUDE.md 準拠の 4 コマンド）

```bash
pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

加えて Task C 固有の gate:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run "apps/web/app/(public)" "apps/web/app/(member)"
git grep -n "PublicHeader\|MemberHeader" -- apps/web   # AC-C2: doc/archive 除き 0 ヒット
```

## PR 本文の構成案（`.claude/commands/ai/diff-to-pr.md` 準拠）

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、`outputs/phase-12/implementation-guide.md` の
主要見出しを漏れなく反映する。`outputs/phase-11/screenshots/` に画像がある場合のみスクリーンショット節を作る。

```
## 概要
公開 6 route + 会員 /profile の shell を共通 SidebarShell へ統合（header → sidebar 一本化）。

## 背景 / 目的
page ごとに header を直 mount していた状態を layout 集約し、遷移時の flash を構造で排除。

## 変更内容
- (public)/layout.tsx / (member)/layout.tsx を async 化し SidebarShellServer を mount
- /、/privacy、/terms、/login を (public) group へ URL 不変で git mv 集約
- PublicHeader.tsx / MemberHeader.tsx（+ spec）を git delete
- (member)/profile/page.tsx の MemberHeader 直 mount 2 箇所を除去
- PublicFooter は shell children 末尾に保持

## AC 達成状況
AC-C1..AC-C10（implementation-guide.md の AC マッピング参照）

## 検証
typecheck / lint / focused vitest green、grep gate 0 ヒット

## スクリーンショット
（outputs/phase-11/screenshots/ に画像がある場合のみ。public/member sidebar の guest/member/admin × collapsed/mobile）

## 影響範囲 / 不変条件
API / D1 / Google Form schema / auth middleware 不変（AC-C8）。URL 不変（AC-C7）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## PR 作成コマンド（user 承認後のみ）

```bash
gh pr create --base dev --title "feat(web): 公開/会員 layout を SidebarShell へ統合" --body-file <(...)
```

## 最終レポート（PR 作成後）

PR URL / 採用ブランチ / 実行した自動修復 / 解消したコンフリクト / 残課題の有無を 1 回だけ報告する。

## 実行ゲート

| Gate | 条件 |
| --- | --- |
| Gate-B | 実装 GREEN + local vitest + typecheck + lint |
| Gate-C | commit / push / PR + CI visual baseline 更新（user-gated。本 Phase 13 の実行に必須） |
