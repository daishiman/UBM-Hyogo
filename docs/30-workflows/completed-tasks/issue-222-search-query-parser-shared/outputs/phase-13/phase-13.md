# Phase 13: PR 作成

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> ステータス: **`pending_user_approval`**。commit / push / PR は user の明示承認後のみ実行する。

## ステータス

| 項目 | 値 |
|------|----|
| Phase 13 status | `pending_user_approval` |
| Gate-C | pending（external_ops: commit / push / PR は user-gated） |
| 本 wave | 実装・検証完了（commit / push / PR は user-gated） |

## ブランチ / base

| 項目 | 値 |
|------|----|
| base ブランチ | `dev`（開発統合ブランチ。`main` への PR は production リリース時のみ） |
| 作業ブランチ | `refactor/issue-222-search-query-parser-shared` |
| 関連 issue | #222（**CLOSED のまま・再オープンしない**） |

## issue #222 の扱い（再オープンしない）

- issue #222 は CLOSED のまま維持する。**再オープンしない**。
- PR 本文で「**issue #222 の現コード最適化解決**」として参照する（parser 全体移設ではなく共通プリミティブ抽出・AC-3 の「400」を silent fallback へ是正、という現コードに最適化した解決である旨を明記）。
- `Closes #222` / `Fixes #222` 等の自動クローズ keyword は使わない（既に CLOSED のため）。参照は本文中の `#222` リンクに留める。

## 実行手順（user 承認後）

1. ローカル実装完了済み（Lane A → Lane B → Lane C のコード投入 + SP-01〜SP-12 + 既存 api/web 回帰 + 3 package typecheck + lint が全 PASS）。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチ `refactor/issue-222-search-query-parser-shared` に `dev` をマージ（conflict は CLAUDE.md の既定方針で解消）。
4. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
5. `git status --porcelain` を空にし、`git diff dev...HEAD --name-only` で PR に含めるファイル一覧を確定。
6. `gh pr create --base dev` で PR 作成。本文に implementation-guide.md（Phase 12）の主要見出しを反映。

## PR 本文に含める要点

- 目的: 公開メンバー検索 query 正規化規約の web/api 二重定義 drift を `packages/shared/src/public-search` への SSOT 化で根絶。
- issue #222 の現コード最適化解決（共通プリミティブ抽出・silent fallback）である旨と `#222` 参照。
- contract 不変（`parsePublicMemberQuery` / `parseSearchParams` / `toApiQuery` の挙動が変更前と完全一致）と既存 2 spec 無変更 pass。
- AC-1〜AC-7 の達成、DoD 8 項目の充足。
- D1 schema / API endpoint / Google Form 変更なし。
- NON_VISUAL のため screenshot なし（`outputs/phase-11/` に画像なし → スクリーンショット専用セクションは作らない）。

## スクリーンショット

`outputs/phase-11/` に画像（png/jpg/jpeg/gif/webp）は存在しない（NON_VISUAL）。PR 本文にスクリーンショット専用セクションは作らない。

## user-gated 境界

- commit、push、PR 作成は user の明示承認後のみ。
- 本ドキュメントは PR 作成の手順計画であり、承認前にいかなる git mutation も実行しない。
