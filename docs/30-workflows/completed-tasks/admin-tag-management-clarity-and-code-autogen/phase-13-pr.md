# Phase 13: PR作成

[実装区分: 実装仕様書]

> SSOT: `docs/30-workflows/completed-tasks/admin-tag-management-clarity-and-code-autogen/shared-context.md`
> 本フェーズは **user の明示承認後のみ実施**。本タスクは `implemented_local_evidence_captured`（apps/web 実装・local evidence 取得済み）であり、commit・push・PR 作成・staging deploy・authenticated screenshot 取得はすべて user の明示承認後に行う。Claude Code は本セクションを案として提示するに留め、無断で commit / push / PR 作成を行わない。

---

## 目的

タグ管理 2 画面（タグ定義 / タグ割当）の直感性改善（コード自動生成・説明 UI と相互リンク・命名統一・文言平易化）を `dev` ブランチへ統合する PR の作成手順と本文骨子を定義する。PR base = `dev`。

---

## 実行タスク

- 作業ブランチ `feat/admin-tag-management-clarity-and-code-autogen` で実装を完了する（user 承認後）。
- `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期する。
- 作業ブランチに戻り `git merge dev`（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
- 品質検証 4 コマンド（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）を実行する。
- `git add -A && git commit`（下記 commit message 案）。
- `git push -u origin feat/admin-tag-management-clarity-and-code-autogen`。
- `gh pr create --base dev`（本文に implementation-guide.md の主要見出しと Phase 11 screenshot 参照を反映）。

---

## 参照資料

- SSOT: `shared-context.md` §1（ユーザー報告）/ §5（対象ファイル）/ §8（AC）
- `outputs/phase-12/implementation-guide.md`（PR 本文の主要見出し）
- `outputs/phase-11/screenshot-plan.json`（PR 本文の screenshot 参照・staging visual user-gated）

---

## 成果物

- commit（下記 message 案）
- PR（base `dev`・下記 title / 本文骨子）

### commit message 案

```
feat(web): タグ定義コード自動生成 + タグ管理2画面の説明UI/相互リンク + 命名統一「タグ割当」

- C1: TagDefinitionCreateForm の表示名→コード自動補完（generateTagCode・手動上書き可）
  純関数 tagCodeAutogen.ts（kana ローマ字化 + fallback・throw しない）
- C2: サイドバー label 「タグキュー」→「タグ割当」（shell-config.ts・href 不変）
- C3: TagManagementGuide（variant: definition / assignment）+ tagManagementGlossary SSOT
  両 page.tsx 冒頭にガイド + 相互リンクを挿入し 2 画面の責務関係を可視化
- C4: 技術文言（"tag master API" 等）を非エンジニア向け平易文へ（用語集準拠）
- C5: tagCodeAutogen / tagManagementGlossary / TagManagementGuide / TagDefinitionCreateForm 回帰 spec

apps/api / D1 / Google Form 非接触（git diff origin/dev...HEAD -- apps/api 空）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

### PR title 案（base dev）

```
feat(web): タグ定義コード自動生成 + タグ管理説明UI/相互リンク + 命名統一「タグ割当」
```

### PR 本文骨子

- 概要（SSOT §1 ユーザー報告 R-1〜R-4 + §2 真の論点）
- Lane C1〜C5 の変更ファイル一覧（`implementation-guide.md` 準拠）
- AC-1〜AC-12 のチェック結果
- スクリーンショット参照（`tag-definition-code-autogen.png` / `tag-assignment-guide-and-rename.png`・staging visual user-gated）
- 不変条件（apps/api 非接触 / OKLch token / 責務境界維持 / DOM contract 維持）

---

## 統合テスト連携

（Phase 13 では任意。Phase 11 の focused test / screenshot 計画を参照。）

---

## 完了条件

- [ ] user の明示承認後にのみ commit / push / PR 作成を実施する。
- [ ] `git fetch origin dev` → ローカル `dev` 同期 → 作業ブランチへ `git merge dev` を実施する。
- [ ] 品質検証 4 コマンドが PASS する。
- [ ] PR base = `dev` で作成し、本文に implementation-guide.md 主要見出しと screenshot 参照を反映する。
- [ ] `git status --porcelain` が空、`git diff dev...HEAD --name-only` が PR 一覧として取得できる。
