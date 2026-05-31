# Phase 13: PR作成

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL** / **workflow_state: implemented_local_evidence_captured**

> ⚠️ **このフェーズは user の明示承認後のみ実施する。** 本 docs サイクルでは commit / push / PR を一切実行しない（未実行）。
> 以下は本サイクルの local implementation / evidence 完了後に PR を作成するための仕様（骨子）である。

## 1. PR base ブランチ

- base = **`dev`**（CLAUDE.md「PR作成の完全自律フロー」既定。`main` への PR は production リリース時の `dev → main` のみ）。
- 作業ブランチは差分主題から `test/` prefix で自律作成（例: `test/auth-view-session-contract-1010`）。`dev` 直上では作成しない。

## 2. PR に含まれる差分

| 区分 | パス | 状態 |
| --- | --- | --- |
| spec 群（本サイクル生成） | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/**`（index.md / artifacts.json / outputs/phase-1〜13） | docs サイクルで作成済 |
| 新規テスト | `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` | 本サイクルで追加済 |
| 親 workflow trace 更新 | `public-header-logged-in-nav-cleanup` の FU-001 consumed trace | 該当時に更新 |

> production コード差分はゼロ（`buildAuthConfig` は既に export 済）。テストファイル 1 件の追加が実コード差分の全て。

## 3. PR タイトル案

```
test(auth-view): session contract integration test (#1010)
```

## 4. PR 本文の骨子

### 背景
`getAuthView()` が解決する `AuthView`（guest / member / admin）は、実 auth module（`apps/web/src/lib/auth.ts` の `buildAuthConfig().callbacks.session`）が生成する `session.user`（`memberId` / `isAdmin`）に依存する。現状この 2 側は独立テストのみで橋渡し契約テストが無く、session augmentation の field 名・型変更が両側テスト緑のまま production を壊しうる（member/admin が公開ヘッダーで guest に倒れる）。Issue #1010（親 workflow `public-header-logged-in-nav-cleanup` の FU-001）由来。

### 変更
- 新規 integration 契約テスト 1 ファイル追加: `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts`。
- 実 `callbacks.session` 出力を `resolveAuthView()` / `getAuthView()` へ連鎖させ、契約 drift をローカル CI で検知。
- production コード変更なし（既存 export 再利用のみ）。

### 検証コマンド
```bash
mise exec -- pnpm exec vitest run apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts apps/web/src/lib/auth.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

### Issue 参照
- Closes / Refs #1010（GitHub OPEN。Issue の state 変更は user 明示承認後のみ）。

### スクリーンショット
- NON_VISUAL タスクのためスクリーンショットなし（専用セクションを作らない）。

## 5. PR 作成手順（user 承認後）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward。
2. 作業ブランチに `dev` をマージ（コンフリクトは CLAUDE.md 既定方針で解消）。
3. 品質検証 4 コマンド（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）+ focused vitest。
4. `git status --porcelain` 空・`git diff dev...HEAD --name-only` で PR 差分一覧確認。
5. `gh pr create --base dev`（PR タイトル・本文は本 Phase の §3 / §4）。

## 6. 実行状態

- **commit: 未実行**
- **push: 未実行**
- **PR 作成: 未実行**
- いずれも user の明示承認後にのみ実施する。

## 完了条件（Phase 13）

- [x] user 明示承認後のみ実施を最上部に明記
- [x] PR base = `dev` を明記
- [x] PR に含まれる差分一覧を記載
- [x] PR タイトル案・本文骨子（背景 / 変更 / 検証コマンド / Issue #1010 参照）を記載
- [x] commit / push / PR が未実行であることを明記
