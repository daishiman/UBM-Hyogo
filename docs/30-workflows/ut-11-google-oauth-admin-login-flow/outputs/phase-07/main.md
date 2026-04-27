# Phase 7 outputs — AC マトリクス サマリ

## 概要

ut-11-google-oauth-admin-login-flow の AC-1〜AC-13（元仕様の完了条件 13 項目）を、Phase 4 のテスト ID（U-XX / C-XX / E-XX）、Phase 5 のランブック手順（R-XX）、Phase 6 の failure case（F-XX）と一対多で紐付け、未トレース 0 件・重複 0 件を達成する。本サマリは `phase-07.md` の実行手順に対する成果物としての position づけ。詳細マトリクスは `outputs/phase-07/ac-matrix.md`（本 Phase で同時に生成）に固定する。

## サマリ表（13 件）

| AC | キー | trace 状態 | 主担当 |
| --- | --- | --- | --- |
| AC-1 | login → 302 | covered | unit + contract + E2E |
| AC-2 | PKCE S256 + verifier cookie | covered | unit + contract |
| AC-3 | state mismatch → 400 | covered | unit + contract |
| AC-4 | allowlist 外 → `/login?error=not_in_allowlist` | covered at spec/UI evidence level | helper unit + local screenshot; route integration test follow-up |
| AC-5 | 認可成功 → session + 302 | covered | contract + E2E |
| AC-6 | session Cookie 属性 | covered | unit + contract |
| AC-7 | `/admin/*` middleware gate | covered at implementation level | middleware exists; route integration test follow-up |
| AC-8 | logout → cookie 失効 | covered | unit + contract + E2E |
| AC-9 | wrangler pages dev 手順 | covered | E2E（local） |
| AC-10 | `.dev.vars` gitignore | covered | gitleaks + lint |
| AC-11 | redirect URI 3 環境登録 | covered | smoke (Phase 11) |
| AC-12 | secret 配置 | covered | smoke + secret list |
| AC-13 | 新規管理者追加 runbook | covered | doc review (Phase 12) |

## 重複・責務分離の整理

- AC-2 と AC-3 は混同しやすいが、PKCE は token 改ざん防止、state は CSRF 対策で役割が違うため別 AC として独立保持
- AC-4 と AC-5 は authorize の deny / allow を分離した（認証成功 ≠ 認可成功の原則）
- AC-5 と AC-7 は callback の発行と middleware の継続 gate を分離（二段防御）

## UT-03 との secret 共有整合

`SESSION_SECRET` と `ADMIN_EMAIL_ALLOWLIST` は本タスク専用の新規 secret で、UT-03（Service Account 認証）とは衝突しない。`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` のみ 01c で配置済の OAuth client を共有し、UT-03 側は別系統（Service Account）で `GOOGLE_SHEETS_SA_*` 想定の secret 群を利用する想定。

## 不変条件マッピング

- 不変条件 #5（apps/web から D1 直接禁止）: AC-4 / AC-5 / AC-7 はホワイトリスト Secret + JWT Cookie で完結し、D1 を一切使わない
- 不変条件 #6（GAS prototype 不昇格）: AC-2 は Web Crypto API での PKCE 実装で、GAS の認証ロジックを継承しない

## 次 Phase 引継ぎ

- DRY 化対象: pkce / state / session / cookies / allowlist の 5 ファイルを `apps/web/src/lib/{oauth,auth}/` に集約
- 命名統一候補: `SessionJwt` / `gateReason` / `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` / `AUTH_REDIRECT_URI`
- 未トレース AC: 0 件（仕様トレース）。実 route/middleware 結合テストは `UT-11-ROUTE-TEST-01` で追跡
