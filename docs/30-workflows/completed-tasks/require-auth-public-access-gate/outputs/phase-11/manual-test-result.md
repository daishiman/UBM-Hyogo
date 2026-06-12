# Phase 11 手動テスト結果（VISUAL）

| 項目 | 値 |
|------|-----|
| taskId | require-auth-public-access-gate |
| mode | VISUAL |
| status | **local_visual_evidence_captured_staging_authenticated_pending** |
| 証跡の主ソース | ローカル未認証 screenshot 1 枚 + 自動テスト（Phase 4/6 の TC） |
| 実機操作 | 未認証 screenshot はローカル取得済み。staging 環境・認証済み screenshot は **user-gated** |

## 手動テスト手順（実装サイクルで実施）

1. **未認証で各ルートへアクセス**: ログアウト状態で `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` を開き、本来コンテンツが表示されず「ログインが必要です」案内画面（`login-required-notice`）が出ることを確認（AC-1）。
2. **CTA 遷移**: 案内画面の「ログインする」ボタン（`login-required-notice-cta`）をクリックし、`/login?redirect=<元の pathname>` へ遷移することを確認（AC-2）。
3. **ログイン後**: ログイン後に各ルートで本来コンテンツが従来どおり表示されることを確認（AC-4）。
4. **API 直叩き 401**: `curl -i <api>/public/members`（無認証）が 401 を返すことを確認（AC-6）。会員 session cookie / `X-Internal-Auth` 付きでは 200 を確認。
5. **サーバー間 200 維持**: `sitemap.xml` 生成と OG 画像（`/members/:id` の OG）が 200 で従来どおり生成されることを確認（AC-7）。
6. **`/login` 対象外**: 未認証で `/login` が従来どおり表示されることを確認（AC-3）。

## ローカル決定的 evidence（実装サイクルで実行済み・2026-06-10）

実コード実装後、以下を実機 staging を介さずローカルで実行し全 PASS を確認した（決定的 evidence）。

| コマンド | 結果 |
|---------|------|
| `vitest run … LoginRequiredNotice.spec.tsx sitemap.spec.ts (public)/layout.spec.tsx fetch/public.spec.ts`（web 対象 spec 隔離） | PASS（4 files / 41 tests） |
| `pnpm --filter @ubm-hyogo/api test … require-public-access.authz.spec.ts index.contract.spec.ts` | PASS（対象 spec GREEN・無関係 D1 hook timeout は高負荷 flake） |
| `pnpm --filter @ubm-hyogo/og test … member-source.spec.ts` | PASS（6 files / 23 tests） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS（tsc エラー 0） |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/og typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS（HEX 直書き 0） |
| `pnpm --filter @ubm-hyogo/api lint` | PASS |
| `pnpm --filter @ubm-hyogo/og lint` | PASS |
| `grep -nE '#[0-9a-fA-F]{3,6}\|bg-\[#' LoginRequiredNotice.tsx` | 0 件（OKLch 遵守） |

未認証→notice / 認証済み→shell+children / `getSession()` throw fail-closed / 未認証時 RSC 非 fetch の描画分岐は `(public)/layout.spec.tsx` で機械的に検証済み。

## screenshot

| canonical 名 | 状態 | 取得タイミング |
|-------------|------|---------------|
| `screenshots/members-unauth-login-required-local.png` | captured | 2026-06-10 local `pnpm dev:web` / `http://localhost:3001/members` |
| `public-members-authenticated.png` | pending | 実装サイクル後 staging（user-gated） |

> staging screenshot を pending とする理由: 実コード・ローカル決定的 evidence・未認証 visual evidence は取得済みだが、staging deploy・認証済み runtime screenshot は user-gated のため（CONST_002 / CONST_006）。
