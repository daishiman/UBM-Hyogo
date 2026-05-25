# Phase 13: commit / PR / リリース

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 13 / 13 |
| status | blocked_pending_user_approval |
| base ブランチ | dev |

## ゲート

本 Phase は **ユーザー承認後にのみ** 実行する。Claude Code 単独で commit / push / PR 作成を行わない。

## PR タイトル案

```
feat(issue-879): safeServerFetch helper を member/public 層 server component へ横展開
```

## PR 本文ドラフト

```markdown
## 概要

issue #879（CLOSED）で deferred 宣言されていた admin → member/public への per-section degrade 横展開を実施。
`apps/web/src/lib/server-fetch/safe-fetch.ts` を共通 SSOT として新設し、admin 既存 helper を re-export 層に縮小。
`/profile` / `/(public)/members` / `/(public)/members/[id]` の 3 server component を `SafeResult<T>` ベースに置換し、
1 endpoint 失敗で page 全停止する非対称を解消した。

## 採用方針

- Option B（共通 lib への昇格＋admin re-export 維持）
- auth gate（`AuthRequiredError`）/ notFound 経路（`FetchPublicNotFoundError`）は `rethrowOn` allowlist で保護

## 変更ファイル

- 新規: `apps/web/src/lib/server-fetch/safe-fetch.ts`
- 新規: `apps/web/src/components/{public,member}/SectionError.tsx`
- 改変: `apps/web/src/lib/admin/safe-server-fetch.ts`（共通 lib への re-export 層に縮小）
- 改変: `apps/web/app/profile/page.tsx`
- 改変: `apps/web/app/(public)/members/page.tsx`
- 改変: `apps/web/app/(public)/members/[id]/page.tsx`
- spec: 上記対応 spec を追加・更新

## 受入条件（AC）

- AC-1〜AC-8 すべて達成（spec §4 参照）

## 検証ログ

- `pnpm typecheck`: green
- `pnpm lint`: green
- `pnpm --dir apps/web exec vitest run [対象]`: green
- admin 既存 spec: 無修正で green（regression なし）

## 関連

- issue: #879（CLOSED 維持・本 PR でクローズステータスは変更しない）
- canonical workflow: `docs/30-workflows/issue-879-safe-server-fetch-member-public-horizontal-expansion/`
- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
```

## 実行手順（ユーザー承認後）

1. `bash scripts/verify-pr-ready.sh` を実行し pre-flight gate を通過
2. `git add` で変更ファイルを stage
3. `git commit` を作成
4. `git push -u origin <feat-branch>` で push
5. `gh pr create --base dev --title "..." --body "..."`
6. PR URL をユーザーへ報告

## ロールバック手順

- `git revert <merge-commit>` で 1 コミット revert
- 共通 helper / SectionError の追加は backward compatible（admin 既存 import 不変）なため、page.tsx の revert だけで degraded 動作に戻せる

## 成果物

- 本ファイル
- PR 作成時に PR URL を artifacts.json に記録

## 完了条件

- ユーザー承認のもと PR が作成され、URL が記録されている
- CI required check が全 green
