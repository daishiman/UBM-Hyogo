# Phase 13 — PR 作成

> **[実装区分: 実装仕様書]**。
> **本 Phase は user の明示承認後のみ実施する。承認前は何も実行しない。**

---

## 0. 実行条件（user-gated）

本タスクの PR 作成は **user の明示承認後のみ**実施する。承認前は以下を一切実行しない。

- `git add` / `git commit`
- `git push`
- `gh pr create`
- staging / production deploy
- 実 D1 への孤児行調査クエリ実行

> 現状 `status: implemented_local`。実コード（`apps/api`）と focused verification は完了済みであり、PR 作成はユーザー明示承認後の工程。
> GitHub Issue #1119 は **CLOSED 維持**（reopen しない・`keep_closed_no_reopen`）。

---

## 1. PR 作成手順（承認後に実施）

承認を得た後、CLAUDE.md「PR 作成の完全自律フロー」に従い、以下を実施する。

1. 作業ブランチ確認: `docs/issue-1119-member-tags-referential-integrity-guard-spec`（base = `dev`）。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチへ `dev` をマージ（コンフリクトは CLAUDE.md 既定方針で解消）。
4. 品質検証（次の検証コマンドのみ）:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
5. `git status --porcelain` が空になるまで `git add -A` → commit。
6. `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得（漏れなし確認）。
7. PR 本文を `outputs/phase-12/implementation-guide.md` の内容を漏れなく反映して作成。
8. `gh pr create --base dev` で PR を作成する。

```bash
# 承認後にのみ実行
gh pr create --base dev \
  --title "feat(issue-1119): member_tags 参照整合性ガード（孤児行検出 + orphans endpoint）" \
  --body-file <(cat <PR本文>)
```

---

## 2. 機能検証コマンド（実装着地後）

PR 作成前に以下が緑であることを確認する。

```bash
# repository + contract spec（D1 統合）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.contract.spec.ts

# typecheck / lint
pnpm --filter @ubm-hyogo/api typecheck
pnpm lint
```

---

## 3. NON_VISUAL のため

スクリーンショットは不要（UI 変更ゼロ）。PR 本文の証跡は自動テスト結果（上記 vitest）と
`outputs/phase-10/final-review-result.md` / `outputs/phase-11/manual-test-result.md` を参照する。

---

## 完了条件（Phase 13）

- [ ] **（user 承認後）** `dev` 同期・マージ・コンフリクト解消完了
- [ ] **（user 承認後）** `pnpm typecheck` / `pnpm lint` / `verify-pr-ready.sh` 緑
- [ ] **（user 承認後）** 機能検証 vitest 緑
- [ ] **（user 承認後）** `gh pr create --base dev` で PR 作成完了
- [x] 承認前は何も実行しない方針を明記（本ファイル）
- [x] GitHub Issue #1119 は CLOSED 維持（reopen しない）を明記
