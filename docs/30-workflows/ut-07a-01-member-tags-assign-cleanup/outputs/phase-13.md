# Phase 13 — commit / PR（ユーザー承認後のみ）

> **重要**: 本 Phase はユーザーの明示的な承認後にのみ実行する。承認前に `git commit` / `git push` / `gh pr create` を実行してはならない。

## ブランチ運用

- 作業ブランチ: `fix/ut-07a-01-member-tags-cleanup`
- base: `dev`（CLAUDE.md PR 既定ブランチ）

## commit 構成（推奨 1 コミット）

```
docs(api): clarify assignTagsToMember is tagQueueResolve-only helper (UT-07A-FU-01)

apps/api/src/repository/memberTags.ts: add file-level note, function JSDoc,
and interface JSDoc to mark assignTagsToMember as a tagQueueResolve workflow
internal helper and forbid direct callers. Adds focused boundary tests;
no runtime behavior change.

Refs #294
```

> Refs #294: issue は CLOSED のまま参照のみ。re-open しない。

## PR 作成手順（承認後）

CLAUDE.md「PR作成の完全自律フロー」に従う。

1. `git fetch origin dev` → ローカル `dev` を fast-forward
2. 作業ブランチに `dev` をマージ（conflict 想定なし）
3. `mise exec -- pnpm install --force && pnpm typecheck && pnpm lint` を順次実行
4. Phase 11 evidence をコミットに含める
5. `gh pr create --base dev` で PR 作成

## PR description テンプレート

```
## Summary
- `apps/api/src/repository/memberTags.ts` の `assignTagsToMember` を tagQueueResolve workflow 専用 helper として JSDoc / コメントで明示
- ファイル冒頭・関数定義・interface 宣言の 3 箇所に `@internal` 付き警告を追加
- `memberTags.readonly.test-d.ts` と `memberTags.repository.spec.ts` で helper export / production caller 境界を固定
- ランタイム挙動・API surface・schema いずれも変更なし

## Background
issue #294（CLOSED）の前提「production caller なし」は最新コードでは誤り（`tagQueueResolve.ts:178` が唯一の正規 caller として生存）。issue の本質的目的「不変条件 #13 を読む後続実装者の誤解防止」に最適化して JSDoc 整備のみを実施。詳細は `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/README.md` を参照。

## Test plan
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- tagQueue` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.readonly` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.repository` PASS
- [ ] `rg "assignTagsToMember" apps/api/src packages/shared/src` の caller topology が Phase 1 と一致

Refs #294
```

## DoD

- ユーザー承認後に commit / push / PR 作成完了
- PR URL が報告される
- issue #294 は CLOSED のまま（re-open しない）
