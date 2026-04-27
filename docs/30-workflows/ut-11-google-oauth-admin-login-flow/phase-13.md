# Phase 13: PR 作成: feat/ut-11-google-oauth-admin-login-flow → main

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 13 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-12（ドキュメント更新） |
| 下流 | なし（本タスク完了） |
| user_approval_required | true |

## ユーザー承認確認文（冒頭必須）

- この Phase は **ユーザーの明示承認がある場合のみ** 実行する。承認なしに `gh pr create` / `git push` / `git commit` を実行してはならない。
- 本タスク仕様書（Phase 13）は **PR 本体作成は行わず、PR 作成手順・本文・branch 命名・ローカル check 内容を文書化するのみ** で完了とする。実際の PR 作成はユーザー指示後に別途実行する。

## 目的

Phase 1〜12 の成果（`apps/web` runtime 実装 + 仕様 close-out）を `feat/ut-11-google-oauth-admin-login-flow` ブランチにまとめ、`main` 向けの PR を作成するための **手順 / 本文テンプレ / ローカル check 結果** を Phase 13 成果物として残す。本タスクは `apps/web` の runtime 実装と `docs/30-workflows/ut-11-google-oauth-admin-login-flow/` の close-out 更新を含む。

## 実行タスク

1. local-check-result.md を生成（docs lint / link check / artifacts.json validity / cross-reference）
2. change-summary.md を生成
3. PR template（title / body）を生成
4. **ユーザー承認後に** `gh pr create`（本仕様書では実行しない）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/implementation-guide.md | PR 本文（実装ガイド抜粋） |
| 必須 | outputs/phase-12/documentation-changelog.md | PR 本文（変更履歴） |
| 必須 | outputs/phase-12/unassigned-task-detection.md | PR 本文（既知制約 / 申し送り） |
| 必須 | outputs/phase-10/main.md | GO 判定 + B-02 / B-04 |
| 必須 | outputs/phase-11/main.md | smoke evidence summary |
| 必須 | outputs/phase-07/ac-matrix.md | AC-1〜AC-13 trace |
| 必須 | CLAUDE.md | branch 戦略（feature/* → dev → main） |

## 実行手順

### ステップ 1: local-check-result.md

| 種別 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| docs lint | `pnpm docs:lint`（プロジェクトに存在する場合） | error 0 | not-run（コマンド未確認） |
| link check | `pnpm docs:linkcheck`（または手動 check） | broken 0 | manual pending |
| markdown structure | template 準拠（章立て・必須セクション） | OK | spec trace complete |
| artifacts.json | json valid + declared outputs exist | OK | spec trace complete |
| spec cross-reference | 01c / 02-serial / UT-03 へのパスが有効 | OK | spec trace complete |
| AC trace | AC-1〜AC-13 が phase-07 の matrix に全件登場 | OK | spec trace complete |
| secret hygiene | PR 差分内に `GOOGLE_CLIENT_*` / `SESSION_SECRET` の値が含まれない | OK | manual pending |

### ステップ 2: change-summary.md

| 区分 | 内容 |
| --- | --- |
| 種別 | implementation |
| 影響範囲 | docs/30-workflows/ut-11-google-oauth-admin-login-flow/（13 phase 仕様書 + outputs/） |
| コード差分 | なし（docs only） |
| 後続影響 | 管理画面機能タスク群が「ログイン済み管理者前提」で着手可能。UT-03 と OAuth client を共有 |
| 並列影響 | UT-03（Sheets API Service Account）と secret 名衝突なしを確認済 |
| 残存リスク | B-02（Google verification 申請 MVP 後）, B-04（プレビュー URL を redirect URI に登録しない方針の徹底） |

### ステップ 3: PR template

```
title: docs(ut-11): 管理者向け Google OAuth + PKCE ログインフロー仕様策定

summary:
- Authorization Code Flow + PKCE (S256) の素実装方針を確定（Auth.js 等のライブラリ非導入）
- /api/auth/login / /api/auth/callback/google / /api/auth/logout の 3 endpoint と middleware 仕様
- session JWT Cookie（HS256 / SESSION_SECRET / 24h exp / HttpOnly Secure SameSite=Lax）
- ADMIN_EMAIL_ALLOWLIST（カンマ区切り Cloudflare Secret）でホワイトリスト照合、fail closed
- /admin/* admin gate を apps/web/middleware.ts に集約（D1 不使用、不変条件 #5 遵守）
- Web Crypto API のみで PKCE / JWT 実装（不変条件 #6 遵守、Node.js crypto 不使用）
- redirect URI は local / staging / production の 3 環境分のみ Google Cloud Console に登録
- AC-1〜AC-13 を Phase 7 で trace、Phase 11 で VISUAL smoke evidence

related specs:
- .claude/skills/aiworkflow-requirements/references/security-principles.md
- .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

shared with UT-03:
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET（同一 OAuth client、Service Account とは別系統）

invariants touched: #5, #6

known constraints:
- B-01: session 期限 24h、refresh 機構は MVP 範囲外
- B-02: Google OAuth 同意画面 verification 申請は MVP 後（testing user で運用）
- B-04: プレビューデプロイ URL は OAuth redirect URI に登録しない（staging 固定 URL に集約）

closes: (本タスクの GitHub Issue があれば記載)
```

### ステップ 4: branch 命名と PR 作成コマンド（承認後のみ実行）

CLAUDE.md branch 戦略（`feature/*` → `dev` → `main`）に従う。本タスクはワークツリー名が `feat/wt-9` だが、PR 用にユーザー命名規則 `feat/ut-11-google-oauth-admin-login-flow` を推奨する。

```bash
# 承認後のみ実行（本仕様書では実行しない）
git checkout -b feat/ut-11-google-oauth-admin-login-flow
git add docs/30-workflows/ut-11-google-oauth-admin-login-flow/
git commit -m "docs(ut-11): 管理者向け Google OAuth + PKCE ログインフロー仕様策定"
git push -u origin feat/ut-11-google-oauth-admin-login-flow

gh pr create \
  --base main \
  --head feat/ut-11-google-oauth-admin-login-flow \
  --title "docs(ut-11): 管理者向け Google OAuth + PKCE ログインフロー仕様策定" \
  --body "$(cat docs/30-workflows/ut-11-google-oauth-admin-login-flow/outputs/phase-13/pr-body.md)"
```

> 注意: `dev` ブランチが既に存在し、本プロジェクトで運用中の場合は `--base dev` を選ぶこと。CLAUDE.md branch 戦略を必ず最終確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 管理画面機能タスク | merge 後に implementation-guide を参照して画面実装着手 |
| UT-03 Phase 13 | OAuth client 共有方針を双方の PR で相互参照 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | 差分が docs only。コード差分 0 を確認 | #5 |
| #6 (GAS prototype 不採用) | 差分内に GAS 由来コード片無し | #6 |
| secret hygiene | PR 本文 / 差分に `client_id` 値 / `SESSION_SECRET` 値が含まれない | - |
| branch 戦略 | CLAUDE.md `feature/*` → `dev` → `main` を遵守 | - |
| AC trace 完全性 | AC-1〜AC-13 がすべて Phase 7 / Phase 11 evidence で裏付け済 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local-check-result.md 作成 | 13 | completed | 7 種 |
| 2 | change-summary.md 作成 | 13 | completed | 6 区分 |
| 3 | PR template（title / body）作成 | 13 | completed | pr-body.md として保存 |
| 4 | PR 作成 | 13 | pending | **承認後のみ、本仕様書では実行しない** |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 サマリ |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリ |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文（HEREDOC ソース） |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] ユーザー承認あり（PR 実作成時）
- [ ] local-check-result.md がある
- [ ] change-summary.md がある
- [ ] pr-body.md がある
- [ ] Phase 12 close-out 済み（6 成果物揃い）
- [ ] artifacts.json の全 phase が completed
- [ ] PR が `main`（または `dev`）ブランチに作成済み（**承認後のみ**）

## タスク 100% 実行確認

- 全 4 サブタスクのうち 1〜3 が completed（4 はユーザー承認後）
- 4 ファイル配置（main / local-check / change-summary / pr-body）
- 全完了条件にチェック（PR 作成は承認次第）
- 不変条件 #5 / #6 への対応が PR 本文に記載
- artifacts.json の phase 13 を completed に更新（PR URL 取得後）

## 次 Phase

- 次: なし（本タスク完了）
- 引き継ぎ事項: PR URL を 管理画面機能タスク / UT-03 の implementation-guide に追記
- ブロック条件: ユーザー承認なし → PR 実作成は実行しない（仕様書のみで完了）

## approval gate

- [ ] ユーザーから明示承認を得た（チャット内 "approve" 等の文言）
- [ ] CLAUDE.md branch 戦略に従い `main`（または運用中の `dev`）を base とした
- [ ] PR title / body に secret 値（`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET` / allowlist email）が含まれていない
- [ ] CI（docs lint / link check）が green（プロジェクトに lint パイプラインがある場合）
- [ ] UT-03 と並列マージで衝突しないことを確認

## close-out チェックリスト

- 承認あり（PR 実作成時のみ）
- local-check-result.md がある
- change-summary.md がある
- pr-body.md がある
- Phase 12 close-out 済み
- artifacts.json の全 phase が completed
- UT-03 と OAuth client 共有方針が双方の implementation-guide に明記
