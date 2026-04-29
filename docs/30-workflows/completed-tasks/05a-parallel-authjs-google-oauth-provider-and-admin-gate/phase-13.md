# Phase 13 — PR 作成: feature/05a-google-oauth-and-admin-gate → dev

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 13 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-12（ドキュメント更新） |
| 下流 | なし |

## ユーザー承認確認文（冒頭必須）

- この Phase は **ユーザーの明示承認がある場合のみ** 実行する。承認なしに `gh pr create` を実行してはならない。

## 目的

Phase 1〜12 の成果を `feature/05a-google-oauth-and-admin-gate` ブランチにまとめ、`dev` 向けの PR を作成する。本タスクは implementationのため、apps/web, apps/api, packages/shared と workflow docs が変更対象。

## 実行タスク

1. local-check-result.md を生成（typecheck / lint / docs / link check）
2. change-summary.md を生成
3. PR template を生成
4. ユーザー承認後に `gh pr create`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/implementation-guide.md | PR 本文 |
| 必須 | outputs/phase-12/documentation-changelog.md | changelog |
| 必須 | outputs/phase-10/main.md | GO 判定 |
| 必須 | CLAUDE.md | branch 戦略 |

## 実行手順

### ステップ 1: local-check-result.md

| 種別 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| docs lint | `pnpm docs:lint` | error 0 | TBD |
| link check | `pnpm docs:linkcheck` | broken 0 | TBD |
| markdown structure | template 準拠 | OK | TBD |
| artifacts.json | json valid + 13 phase | OK | TBD |
| spec cross-reference | 04b/04c/02a/02c の index.md パスが有効 | OK | TBD |
| 05b 共有 ADR | session-resolve contract が双方に記載 | OK | TBD |

### ステップ 2: change-summary.md

| 区分 | 内容 |
| --- | --- |
| 種別 | implementation |
| 影響範囲 | apps/web, apps/api, packages/shared, docs/30-workflows/05a-* |
| 後続影響 | 06a/b/c の login / admin 結線、08a の contract test、infra 04 secrets リスト追加（INTERNAL_AUTH_SECRET） |
| 並列影響 | 05b との session-resolve contract 締結 |
| residual risk | B-01 (admin 剥奪 24h タイムラグ), B-03 (Google OAuth verification は MVP 後) |

### ステップ 3: PR template

```
title: feat(auth): add Auth.js Google OAuth provider and admin gate

summary:
- Auth.js v5 GoogleProvider と共有 HS256 JWT session strategy を実装
- session-resolve endpoint で memberId / isAdmin を解決（apps/api 経由、不変条件 #5）
- admin gate を middleware (edge) + requireAdmin (API) の二段防御で実装（不変条件 #11）
- session JWT に profile / responses / notes を含めない（不変条件 #4/#11）
- 05b と session-resolve endpoint を共有（同一 memberId 解決）
- AC-1〜AC-10 を Phase 7 で trace、Phase 9 で無料枠 OK 判定
- B-01 (admin 剥奪 24h タイムラグ) を既知制約として記録

related specs:
- doc/00-getting-started-manual/specs/02-auth.md
- doc/00-getting-started-manual/specs/06-member-auth.md
- doc/00-getting-started-manual/specs/11-admin-management.md
- doc/00-getting-started-manual/specs/13-mvp-auth.md

shared with 05b:
- GET /auth/session-resolve endpoint
- SessionUser shape, gateReason values

invariants touched: #2, #3, #5, #7, #9, #10, #11

closes: (本タスク GitHub Issue があれば記載)
```

### ステップ 4: PR 作成（承認後のみ）

```bash
gh pr create \
  --base dev \
  --head feature/05a-google-oauth-and-admin-gate \
  --title "feat(auth): add Auth.js Google OAuth provider and admin gate" \
  --body "$(cat outputs/phase-13/pr-body.md)"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 05b Phase 13 | 並列マージ可能（互いに別ファイル） |
| 06a/b/c | merge 後に画面実装で参照 |
| 08a | merge 後に contract test 実装 |
| 09a | dev → staging deploy で smoke |
| infra 04 | INTERNAL_AUTH_SECRET を secrets リストに追加 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | apps/web は D1 に直接触らず `/auth/session-resolve` を経由 | #5 |
| #9 (`/no-access` 不在) | 差分内に `/no-access` 言及がないこと | #9 |
| #11 (admin gate) | apps/web middleware と apps/api requireAdmin の二段防御を確認 | #11 |
| secret hygiene | PR 本文に key 値が含まれない | - |
| branch | `feature/*` → `dev`（CLAUDE.md branch 戦略） | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local-check-result | 13 | pending | 6 種 |
| 2 | change-summary | 13 | pending | 5 区分 |
| 3 | PR template | 13 | pending | title / body |
| 4 | PR 作成 | 13 | pending | **承認後のみ** |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | Phase 13 サマリ |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリ |
| ドキュメント | outputs/phase-13/pr-body.md | PR 本文 |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] ユーザー承認あり
- [ ] local-check-result.md がある
- [ ] change-summary.md がある
- [ ] PR が `dev` ブランチに作成済み
- [ ] Phase 12 close-out 済み
- [ ] 05b の Phase 13 と整合（互いに blocking しない）

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- 4 ファイル配置
- 全完了条件にチェック
- 不変条件 #5, #9, #11 への対応が記載
- artifacts.json の phase 13 を completed に更新

## 次 Phase

- 次: なし（本タスク完了）
- 引き継ぎ事項: PR URL を 06b/06c の implementation-guide に追記
- ブロック条件: ユーザー承認なし → 実行しない

## approval gate

- [ ] ユーザーから明示承認を得た（チャット内 "approve" 等の文言）
- [ ] CLAUDE.md branch 戦略に従い `dev` を base とした
- [ ] PR title / body に secret 値（client_id 含む）が含まれていない
- [ ] CI（docs lint / link check）が green
- [ ] 05b と並列マージで衝突しないことを確認

## close-out チェックリスト

- 承認あり
- local-check-result.md がある
- change-summary.md がある
- Phase 12 close-out 済み
- artifacts.json の全 phase が completed
- 05b と session-resolve contract が双方の implementation-guide に明記
