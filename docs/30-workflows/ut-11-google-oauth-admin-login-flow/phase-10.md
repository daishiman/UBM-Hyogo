# Phase 10: 最終レビュー: GO / NO-GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 10 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-09（品質保証） |
| 下流 | phase-11（手動 smoke） |

## 目的

Phase 1〜9 の成果を集約し、本タスク（管理者向け Google OAuth + PKCE ログインフロー仕様策定）が Phase 11（手動 smoke）に進められる状態にあるかを GO / NO-GO で判定する。AC-1〜AC-13 の全件 trace、上流タスク（01c bootstrap、02-serial monorepo foundation、UT-03 secret 名重複確認）の AC 状態、blocker の severity 評価、CLAUDE.md 不変条件 #5 / #6 への適合を最終確認する。

## 実行タスク

1. 上流タスク AC の最新状態確認
2. 自タスク AC-1〜AC-13 の status 集計
3. blocker / minor issue の列挙と severity 判定
4. UT-03（Sheets API Service Account）との secret 名衝突再確認
5. 不変条件 #5 / #6 の適合再確認
6. GO / NO-GO 判定の明文化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | AC-1〜AC-13 trace |
| 必須 | outputs/phase-09/main.md | 品質保証結果（lint / typecheck / secret hygiene） |
| 必須 | outputs/phase-08/main.md | DRY 化（PKCE / state / JWT / Cookie helper） |
| 必須 | outputs/phase-06/main.md | 異常系（state mismatch / token error / allowlist deny） |
| 必須 | outputs/phase-05/runbook.md | 実装ランブック |
| 必須 | outputs/phase-02/api-contract.md | endpoint signature |
| 必須 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/outputs/phase-12/implementation-guide.md | 上流 AC（OAuth client 配置済 secret） |
| 必須 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | UT-03 secret 名衝突確認 |
| 必須 | CLAUDE.md | 不変条件 #5 / #6、シークレット管理方針 |

## 実行手順

### ステップ 1: 上流 AC 確認

| 上流 task | 必要 AC | status | blocker? |
| --- | --- | --- | --- |
| 01c bootstrap | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が Cloudflare Secrets に配置済 | completed | OK |
| 02-serial monorepo foundation | `apps/web`（Next.js via @opennextjs/cloudflare）/ `apps/api`（Hono）構成確定 | completed | OK |
| 04-serial cicd secrets sync（任意） | staging / production への自動同期 | pending（任意上流） | 進行可（手動 wrangler secret put で代替可） |
| UT-03（連携） | Service Account 認証 secret 名（`GOOGLE_SHEETS_*`）と本タスク（`SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST`）が衝突しない | implementation close-outで確認済 | OK |

### ステップ 2: 自タスク AC 集計

| AC | 内容 | status | 根拠（Phase / 成果物） |
| --- | --- | --- | --- |
| AC-1 | `/api/auth/login` が Google OAuth 認証画面へ redirect | OK | Phase 2 api-contract / Phase 5 runbook |
| AC-2 | PKCE S256 が有効、`code_verifier` が HttpOnly Cookie 一時保存 | OK | Phase 2 module 設計 / Phase 8 pkce.ts DRY 化 |
| AC-3 | callback で state 検証、不一致時 400 | OK | Phase 6 異常系 / Phase 2 api-contract |
| AC-4 | ホワイトリスト外メールで 403 | OK | Phase 6 / Phase 2 allowlist 仕様 |
| AC-5 | ホワイトリスト内メールで session Cookie 発行 + `/admin` redirect | OK | Phase 2 callback 仕様 |
| AC-6 | session Cookie が `HttpOnly; Secure; SameSite=Lax` | OK | Phase 2 cookies.ts 集約 |
| AC-7 | `/admin/*` 未認証時に `/login` redirect | OK | Phase 2 middleware.ts |
| AC-8 | `/api/auth/logout` で Cookie 失効 + `/login` 戻り | OK | Phase 2 logout route |
| AC-9 | `wrangler pages dev` でローカル全フロー動作確認手順あり | OK | Phase 5 runbook |
| AC-10 | `.dev.vars` が `.gitignore` 含み | OK | Phase 9 secret hygiene |
| AC-11 | redirect URI 3 環境分が Google Cloud Console 登録 | OK | Phase 2 secrets.md / Phase 5 runbook |
| AC-12 | `ADMIN_EMAIL_ALLOWLIST` / `SESSION_SECRET` が staging / production の Cloudflare Secrets に配置 | OK | Phase 5 runbook（手動 wrangler secret put 手順） |
| AC-13 | 新規管理者追加 runbook（allowlist 更新 → Secrets 更新 → 再デプロイ）あり | OK | Phase 5 runbook |

### ステップ 3: blocker 一覧

| ID | 内容 | severity | 対応 |
| --- | --- | --- | --- |
| B-01 | session 失効後（24h exp）の手動再ログイン UX が未確定 | minor | 仕様として固定（exp 切れたら `/login` へ自動 redirect、refresh token は MVP 範囲外） |
| B-02 | OAuth 同意画面の Google verification 申請（外部公開時） | minor | MVP は testing user で運用、prod release 前に Phase 12 unassigned-task-detection に申し送り |
| B-03 | ホワイトリスト 0 件時の fail closed（全員 403） | informational | Phase 2 で仕様化済み（運用ミスでも secure-by-default） |
| B-04 | プレビューデプロイ URL を OAuth に使わない方針の徹底 | minor | Phase 2 redirect URI 表 + Phase 5 runbook で staging 固定 URL 限定を再周知 |

### ステップ 4: UT-03 secret 名衝突確認

| secret 名 | 用途 | UT-11 | UT-03 | 衝突 |
| --- | --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client（共有） | 利用 | 利用 | 共有設計、衝突無し |
| `GOOGLE_CLIENT_SECRET` | OAuth client（共有） | 利用 | 利用 | 共有設計、衝突無し |
| `SESSION_SECRET` | session JWT 署名 | 利用 | 不使用 | 無し |
| `ADMIN_EMAIL_ALLOWLIST` | 管理者ホワイトリスト | 利用 | 不使用 | 無し |
| `GOOGLE_SHEETS_*`（仮） | Service Account 認証 | 不使用 | 利用 | 無し |
| `AUTH_REDIRECT_URI` | OAuth redirect URI（環境別） | 利用 | 不使用 | 無し |

### ステップ 5: 不変条件 #5 / #6 適合再確認

| # | 内容 | 適合状況 |
| --- | --- | --- |
| #5 | apps/web から D1 直接禁止 | 本タスクは D1 を一切使わず、ホワイトリストは Secret から読む。session も JWT Cookie で完結。OK |
| #6 | GAS prototype を本番仕様に昇格させない | GAS の OAuth 実装を流用せず、Web Crypto API（`crypto.subtle.digest` / `crypto.getRandomValues`）で PKCE / JWT を実装。OK |

### ステップ 6: GO / NO-GO 判定

- 上流 AC: 必須 2 件（01c, 02-serial）すべて OK、任意 1 件（04-serial）は implementation close-outに影響しない
- 自タスク AC: 13/13 spec trace complete（implementation close-out）
- blocker: B-01〜B-04 すべて minor / informational、対応方針あり
- UT-03 との secret 衝突: 無し
- 不変条件 #5 / #6: 全適合

**判定: GO（条件付き）**
- B-02 の Google verification 申請を Phase 12 unassigned-task-detection に明記
- B-04 の「プレビューデプロイ URL を OAuth redirect URI に登録しない」方針を Phase 12 implementation-guide に明示

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | 手動 smoke の入力（GO 判定 + blocker 引継ぎ） |
| Phase 12 | implementation-guide / unassigned-task-detection に B-02 / B-04 を反映 |
| UT-03 Phase 10 | 同一 OAuth client の利用整合（双方向確認） |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | PKCE S256 / state CSRF / JWT HS256 / Cookie 属性すべて Phase 2 で確定 | - |
| 権限境界 | 認証成功 ≠ 認可成功、ホワイトリスト 0 件で fail closed | - |
| 不変条件 #5 | D1 不使用、ホワイトリストは Secret 読み取りのみ | #5 |
| 不変条件 #6 | Web Crypto API のみ、Node.js `crypto` 不使用 | #6 |
| 無料枠 | session JWT Cookie で完結、D1 row 増やさない | - |
| 観測性 | callback の主要分岐に構造化ログ（state mismatch / allowlist deny / token issued） | - |
| 運用性 | redirect URI 3 環境登録、`.dev.vars` `.gitignore` 確認、新規管理者追加 runbook 完備 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 確認 | 10 | pending | 01c / 02-serial / UT-03 |
| 2 | 自タスク AC 集計 | 10 | pending | AC-1〜AC-13 |
| 3 | blocker 列挙 | 10 | pending | B-01〜B-04 |
| 4 | UT-03 secret 名衝突確認 | 10 | pending | 6 件 |
| 5 | 不変条件 #5 / #6 適合確認 | 10 | pending | 2 件 |
| 6 | GO / NO-GO 判定 | 10 | pending | 条件付き GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | GO / NO-GO 判定 + blocker + 上流 AC 確認 |
| メタ | artifacts.json | phase 10 status |

## 完了条件

- [ ] 上流 AC が確認済み（01c / 02-serial / UT-03）
- [ ] 自タスク AC-1〜AC-13 が集計済み
- [ ] blocker が severity 付きで列挙
- [ ] UT-03 との secret 名衝突が無いことを再確認
- [ ] 不変条件 #5 / #6 適合確認済み
- [ ] GO / NO-GO 判定が明記

## タスク 100% 実行確認

- 全 6 サブタスクが completed
- outputs/phase-10/main.md 配置
- 全完了条件にチェック
- 次 Phase へ blocker B-02 / B-04 を引継ぎ

## 次 Phase

- 次: 11（手動 smoke / VISUAL）
- 引き継ぎ事項: B-02（OAuth verification 申し送り）と B-04（プレビュー URL を redirect URI に使わない）を Phase 12 へ伝達。Phase 11 では `/login` ボタン表示・Google 同意画面・成功/失敗 redirect をスクショで記録
- ブロック条件: NO-GO 判定の場合は進まない（必要に応じ Phase 5 / Phase 6 へ戻る）

## GO / NO-GO 判定

**判定**: GO（条件付き）

| 条件 | 内容 |
| --- | --- |
| 必達 | Phase 11 の手動 smoke で AC-1 / AC-3 / AC-4 / AC-5 / AC-7 / AC-8 のフローを VISUAL evidence として残す |
| 推奨 | B-02（Google verification）を Phase 12 unassigned-task-detection に追加 |
| 推奨 | B-04（プレビュー URL 方針）を Phase 12 implementation-guide で再周知 |
