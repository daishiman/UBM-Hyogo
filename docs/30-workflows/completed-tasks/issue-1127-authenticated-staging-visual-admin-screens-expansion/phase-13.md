# Phase 13: PR 作成（user-gated）

Status: `blocked_pending_user_approval`

> PR 作成は **user 明示承認後のみ**実行する（CONST_002）。
> commit / push / PR / staging 実 capture / git 操作は本 wave では一切行わない。

## 13.1 PR 方針（CLAUDE.md PR フロー準拠）

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（既定。`main` への PR は production リリース時のみ） |
| 作業ブランチ | `docs/issue-1127-authenticated-staging-visual-admin-screens-expansion-spec` |
| GitHub issue | #1127 は **CLOSED 維持**（refs #1127・close しない / reopen しない） |
| commit 対象 | 本 workflow root + aiworkflow-requirements 同期 + 新規 Playwright spec 5 本 |
| PR 本文 | `outputs/phase-12/implementation-guide.md` の主要見出しを反映。視覚証跡は baseline 取得後に画像参照を追加 |

## 13.2 PR 本文に含める項目

- **変更概要**: 認証付き staging visual baseline を admin 画面 5 種へ横展開（新規 Playwright spec 5 本）。
  - `admin-audit-authenticated.spec.ts`（`/admin/audit`）
  - `admin-requests-authenticated.spec.ts`（`/admin/requests`）
  - `admin-identity-conflicts-authenticated.spec.ts`（`/admin/identity-conflicts`）
  - `admin-schema-authenticated.spec.ts`（`/admin/schema`）
  - `admin-meetings-authenticated.spec.ts`（`/admin/meetings`）
- **横展開対象 5 画面**: audit / requests / identity-conflicts / schema / meetings（各 read-only 初期表示の visual baseline）。
- **read-only 境界**: 各 spec は goto → heading 待機 → screenshot のみ。mutation 要素（承認/却下・merge・Bulk Resolve/Rollback・出席操作）を非クリック。dialog/modal/toast の count 0 ガード assertion で副作用未発火を証跡化。
- **既存基盤再利用**: `staging-visual-authenticated` project / admin storageState mint / CI workflow は不変。spec を testDir 配下に置くだけで自動認識。`playwright.config.ts` 編集不要。
- **境界の確認**: プロダクトコード（`apps/web/src` / `apps/api`）・D1・CI は不変。spec ファイルのみ新規。
- **視覚証跡**: `outputs/phase-11/` の canonical screenshot 5 名（baseline 取得後に画像参照を追加）。

## 13.3 user 承認後の実行順序

1. 認証付き staging Playwright run（`--update-snapshots`）で baseline 5 枚生成 → `outputs/phase-11/<screenshot名>` へ evidence 二重 capture。
2. `mise exec -- pnpm install --force` / `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `bash scripts/verify-pr-ready.sh` を実行。
3. `git fetch origin dev` → ローカル dev を ff 同期 → 作業ブランチへ merge → conflict があれば既定方針で解消。
4. `git add -A` → commit（末尾に Co-Authored-By 行）。
5. `gh pr create --base dev`。PR 本文に implementation-guide 主要見出し + 取得済み baseline screenshot 参照を含める。

## 13.4 runtime / 副作用境界

- 認証付き staging への baseline 取得は read-only（mutation なし）。
- staging D1 / Google Form / apps ソース（spec ファイル以外）への変更ゼロ。
- commit / push / PR / staging deploy / staging 実 capture はすべて user-gated（CONST_002）。

## 13.5 Phase 13 完了条件

- [x] PR 方針（base=dev / branch / issue CLOSED 維持）を確定
- [x] PR 本文に含める項目（変更 5 spec / 横展開 5 画面 / read-only 境界 / 既存基盤再利用）を確定
- [x] user 承認後の実行順序と副作用境界を明記
- [ ] （user 承認後）baseline 取得 → 品質検証 → commit → `gh pr create --base dev` を実行
