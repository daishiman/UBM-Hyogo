# unassigned-task-detection

## current（本サイクルで発生した未タスク）

**current: 0 件**

C1 / C2 の全 AC（AC-1〜AC-13）を本サイクルで実装・検証完了。Phase 10 相当の MINOR 指摘で未タスク化が必要なものは無し。
TDD Red→Green を 6 spec で確認し、typecheck / lint / 対象 spec 全 GREEN。先送りした機能要件は無い（AC-13 充足）。

## baseline（既存の周辺改善余地・スコープ外）

**baseline: 1 件**

- **M-1: JWT user 生成重複の共通化**
  本レビューで `authSessionUserFromClaims` を `require-admin.ts` に追加し、`requireAuth` / `requireAdmin` / `requirePublicAccess` が同じ claims→`AuthSessionUser` 変換を使うよう補正済み。未タスク化しない。

- **M-2: `INTERNAL_AUTH_SECRET` の本番/staging 設定整備**
  内部経路（sitemap / OG）が 200 を維持するには Cloudflare Secrets への `INTERNAL_AUTH_SECRET` 投入が必要。未設定環境では内部経路は 401（fail-closed・session 経路は通る）。実値投入は `bash scripts/cf.sh secret put` 経由でユーザー承認後に実施するインフラ作業のため、コード実装スコープ外の baseline。
  - いつ・どこで: デプロイ前のシークレット整備時に `scripts/cf.sh` で投入。

> M-2 は外部 secret mutation であり、commit/push/PR と同じ user-gated 運用操作。コード・仕様・テストで完了できる漏れは本サイクル内で処理済み。
