# Phase 4: テスト戦略: PKCE / state / Cookie / admin allowlist / middleware

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 4 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-03（設計レビュー、PASS 確定） |
| 下流 | phase-05（実装ランブック） |

## 目的

Phase 3 で採用した A 案（素実装の OAuth + PKCE / JWT Cookie session / Secret allowlist / `apps/web/middleware.ts` admin gate）に対する **テスト戦略** を確定する。AC-1〜AC-13 を test ID（unit / contract / E2E / authz / security / lint）と紐付け、Phase 5 ランブックの完了条件と Phase 6 異常系の入力として渡せる粒度に固定する。Cloudflare Workers Edge runtime 上で動作することを test 設計時点で保証する。

## 実行タスク

1. test 階層と責務分担確定（unit / contract / E2E / authz / security / lint / edge runtime 互換）
2. PKCE test matrix（code_verifier / code_challenge / S256）
3. state test matrix（生成・保存・検証・mismatch）
4. Cookie test matrix（属性 / TTL / path / SameSite / Secure local toggle）
5. admin allowlist test matrix（parse / lowercase 正規化 / fail closed）
6. middleware test matrix（`/admin/:path*` の 4 状態）
7. session JWT test matrix（claim 集合 / 改ざん / 期限切れ / signature）
8. Edge runtime 互換テスト方針（Node.js `crypto` 不使用の検証）
9. AC × test ID 対応確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-13 |
| 必須 | outputs/phase-02/api-contract.md | endpoint I/O |
| 必須 | outputs/phase-02/architecture.md | Mermaid フロー |
| 必須 | outputs/phase-02/secrets.md | env / secrets / redirect URI |
| 必須 | outputs/phase-03/main.md | 採用案 A、Q1〜Q7、R1〜R8 |
| 参考 | .claude/skills/aiworkflow-requirements/references/csrf-state-parameter.md | state 設計根拠 |
| 参考 | .claude/skills/aiworkflow-requirements/references/security-principles.md | OAuth + PKCE 原則 |
| 参考 | docs/30-workflows/02-application-implementation/05a-parallel-authjs-google-oauth-provider-and-admin-gate/phase-04.md | test 戦略フォーマット参照 |

## 実行手順

### ステップ 1: verify suite 設計

| layer | 対象 | tool | 担当 task |
| --- | --- | --- | --- |
| unit | `pkce.ts` / `state.ts` / `session.ts` / `allowlist.ts` / `cookies.ts` | vitest | 本タスク |
| contract | `/api/auth/login` / `/api/auth/callback/google` / `/api/auth/logout` の I/O | vitest + miniflare（Workers runtime simulation） | 09 |
| E2E | ブラウザで `/login` → Google OAuth → `/admin` の往復 | Playwright（OAuth は mock provider） | 11 |
| authorization | middleware が未認証 / 非 admin / admin / 改ざんで正しく分岐 | vitest + miniflare | 09 |
| security | JWT 改ざん / state mismatch / PKCE downgrade / `?bypass` 系バックドア無し | vitest + curl 補助 | 11 |
| lint | `apps/web` から D1 直接 import 禁止、`node:crypto` import 禁止 | ESLint rule | 09 |
| edge runtime 互換 | `crypto.subtle` / `crypto.getRandomValues` のみで PKCE / JWT 実装 | vitest（`@cloudflare/vitest-pool-workers`） | 09 |

### ステップ 2: PKCE test matrix

| ID | 入力 | 期待 |
| --- | --- | --- |
| P-01 | `generateCodeVerifier()` 連続 100 回 | 全件 unique、Base64URL 文字、長さ 43 文字以上 |
| P-02 | `deriveCodeChallenge(verifier)` の出力 | RFC 7636 §4.2 に準拠（`BASE64URL(SHA256(verifier))`、padding なし） |
| P-03 | login route が URL に `code_challenge_method=S256` を付ける | クエリ snapshot |
| P-04 | login route が `code_verifier` を Cookie `oauth_verifier` に保存 | `HttpOnly; SameSite=Lax; Path=/api/auth/callback/google; Max-Age=600` |
| P-05 | callback で `code_verifier` Cookie を token 交換に渡す | request body に `code_verifier` 含む |
| P-06 | `code_verifier` Cookie 不在で callback | 400 `oauth_verifier_missing` |
| P-07 | Node.js `crypto` を import した実装に差し替え | edge runtime simulation で test fail（`crypto.subtle` のみ許可） |

### ステップ 3: state test matrix

| ID | 入力 | 期待 |
| --- | --- | --- |
| ST-01 | `generateState()` の出力 | 16 byte 乱数 → Base64URL、unique 性 |
| ST-02 | login route が state を URL と Cookie 両方に書く | URL の `state` query == Cookie `oauth_state` |
| ST-03 | callback で state 一致 | next（403 にならない） |
| ST-04 | callback で state mismatch（query と Cookie 不一致） | **400** `oauth_state_mismatch` |
| ST-05 | state Cookie 不在 | **400** `oauth_state_missing` |
| ST-06 | state 検証成功後、両 temp Cookie を即時失効 | Set-Cookie `Max-Age=0` 2 件 |
| ST-07 | state Cookie が他 origin から送られる | `SameSite=Lax` + `Path=/api/auth/callback/google` で送信されない（snapshot） |

### ステップ 4: Cookie test matrix

| ID | Cookie | 期待属性 |
| --- | --- | --- |
| CK-01 | `oauth_state` | `HttpOnly; Secure; SameSite=Lax; Path=/api/auth/callback/google; Max-Age=600` |
| CK-02 | `oauth_verifier` | 同上 |
| CK-03 | `session`（発行時） | `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400` |
| CK-04 | `session`（logout 時） | `Max-Age=0; Path=/` |
| CK-05 | local 開発（`NODE_ENV=development`） | `Secure` 属性が抜ける（`cookies.ts` の env 判定） |
| CK-06 | production | `Secure` 必須（snapshot で確認） |
| CK-07 | session Cookie に profile / picture / responseId が含まれない | JWT decode 後の snapshot |

### ステップ 5: admin allowlist test matrix

| ID | 入力 `ADMIN_EMAIL_ALLOWLIST` | email | 期待 |
| --- | --- | --- | --- |
| AL-01 | `"alice@x.com,bob@x.com"` | `alice@x.com` | true |
| AL-02 | `"alice@x.com, bob@x.com "` | `bob@x.com` | true（trim 正規化） |
| AL-03 | `"Alice@X.com"` | `alice@x.com` | true（lowercase 正規化） |
| AL-04 | `"alice@x.com"` | `eve@x.com` | false → 403 |
| AL-05 | `""`（空文字 / 0 件） | 任意の email | **false（fail closed、全員 403）** |
| AL-06 | undefined / 未配置 | 任意 | **false（fail closed）** |
| AL-07 | `"alice@x.com,alice@x.com"` | `alice@x.com` | true（重複排除しても影響なし） |
| AL-08 | `email_verified !== true` の Google response | allowlist 一致でも 403 |

### ステップ 6: middleware test matrix（`/admin/:path*`）

| ID | 入力 | 期待 |
| --- | --- | --- |
| MW-01 | session Cookie 無し | 302 → `/login` |
| MW-02 | session Cookie あり、JWT verify 成功、`isAdmin=true` | `NextResponse.next()` |
| MW-03 | session Cookie あり、JWT verify 失敗（signature 不一致） | 302 → `/login` |
| MW-04 | session Cookie あり、JWT 期限切れ | 302 → `/login` |
| MW-05 | session Cookie あり、`isAdmin !== true` | 302 → `/login?gate=admin_required` |
| MW-06 | `/admin/sub/path` への深い階層 access | matcher が拾う |
| MW-07 | `/login` への access（matcher 外） | middleware は何もしない |
| MW-08 | `?bypass=true` 付きで `/admin/dashboard` | bypass 無視、通常の gate 動作 |

### ステップ 7: session JWT test matrix

| ID | 入力 | 期待 |
| --- | --- | --- |
| J-01 | `signSessionJwt({email,isAdmin:true,iat,exp})` → `verifySessionJwt(token, secret)` | claim 復元成功 |
| J-02 | secret を別値で verify | fail（signature mismatch） |
| J-03 | exp < now | fail（expired） |
| J-04 | payload を手で書き換え（base64 編集） | signature mismatch で fail |
| J-05 | algorithm header を `none` に書き換え | reject（HS256 固定） |
| J-06 | claim に profile / picture / responseId が含まれる | snapshot test fail（最小集合違反） |
| J-07 | `SESSION_SECRET` が 32 byte 未満 | 起動時 / test で警告（lint or runtime check） |

### ステップ 8: Edge runtime 互換テスト方針

| 観点 | 内容 |
| --- | --- |
| 実行環境 | `@cloudflare/vitest-pool-workers` を採用し、unit / contract test を Workers 互換 runtime で走らせる |
| 禁止 import | `node:crypto`, `crypto`（Node.js 版）, `Buffer`, `fs` 等を ESLint rule で禁止（test ID Z-01） |
| 利用 API | `crypto.subtle.digest('SHA-256', ...)`, `crypto.getRandomValues(...)`, `TextEncoder` / `TextDecoder` のみ |
| Next.js Middleware | Edge runtime 強制（`export const runtime = 'edge'` を不要にする App Router の middleware は既定で edge） |
| 検証手順 | `pnpm vitest run --pool=workers` を Phase 9 の CI で必須実行 |

### ステップ 9: AC × test ID 対応

| AC | 主担当 test ID | layer |
| --- | --- | --- |
| AC-1 | P-03, contract: login 302 | contract |
| AC-2 | P-01〜P-07 | unit / contract |
| AC-3 | ST-04, ST-05 | contract |
| AC-4 | AL-04, AL-05 | unit / contract |
| AC-5 | CK-03, J-01, contract callback success | contract |
| AC-6 | CK-01〜CK-06 | unit |
| AC-7 | MW-01〜MW-08 | authz |
| AC-8 | CK-04 | contract |
| AC-9 | E2E（runbook の wrangler pages dev 手順） | E2E |
| AC-10 | lint: `.gitignore` に `.dev.vars`、Z-02 | lint |
| AC-11 | runbook checklist + Phase 11 smoke | E2E / manual |
| AC-12 | runbook 完了確認（`wrangler secret list`） | manual |
| AC-13 | runbook ドキュメント test（Phase 12） | docs |

### ステップ 10: lint / 不変条件 test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| Z-01 | `node:crypto` を import 試行 | ESLint で error |
| Z-02 | `apps/web` から D1 binding を直接参照（`env.DB.prepare`） | ESLint で error（不変条件 #5） |
| Z-03 | session JWT に `responseId` を載せる diff | snapshot test fail |
| Z-04 | `Secure` 属性を production で外す diff | snapshot test fail |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test ID を runbook の sanity check と完了条件に組み込む |
| Phase 6 | 異常系（state mismatch / redirect_uri_mismatch / 期限切れ / allowlist 外 / Cookie 無効 / Edge runtime 制限）の入力 |
| Phase 7 | AC × test ID × failure ID の対応表 |
| Phase 9 | lint rule（Z-01, Z-02）の実装と CI 組込み |
| Phase 11 | E2E / 手動 smoke で redirect URI 3 環境を確認（R1） |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | P-07 / J-04 / J-05 / ST-04 で PKCE / JWT / state 改ざんを検出 | - |
| privacy | CK-07 / J-06 で session に profile 本文を載せない | - |
| 認可境界 | MW-01〜MW-08 で gate 漏れ無し、AL-05 / AL-06 で fail closed | - |
| 不変条件 #5 | Z-02 で `apps/web` → D1 直接 import を lint で禁止 | #5 |
| 不変条件 #6 | Z-01 で Node.js `crypto` を禁止し GAS prototype の実装を踏襲しない | #6 |
| Cloudflare 互換 | ステップ 8 の `vitest-pool-workers` で Edge runtime の test を必須化 | - |
| 観測性 | callback の各分岐（state / token / userinfo / allowlist）に構造化ログ呼び出しが残ることを snapshot で確認 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 表 | 4 | pending | 7 layer |
| 2 | PKCE test matrix | 4 | pending | P-01〜P-07 |
| 3 | state test matrix | 4 | pending | ST-01〜ST-07 |
| 4 | Cookie test matrix | 4 | pending | CK-01〜CK-07 |
| 5 | allowlist test matrix | 4 | pending | AL-01〜AL-08 |
| 6 | middleware test matrix | 4 | pending | MW-01〜MW-08 |
| 7 | JWT test matrix | 4 | pending | J-01〜J-07 |
| 8 | Edge runtime 互換方針 | 4 | pending | vitest-pool-workers |
| 9 | AC × test ID 対応 | 4 | pending | AC-1〜AC-13 |
| 10 | lint test | 4 | pending | Z-01〜Z-04 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × test ID × layer × tool |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] AC-1〜AC-13 がいずれかの test ID と紐付き
- [ ] PKCE / state / Cookie / allowlist / middleware / JWT がそれぞれ test 設計済み
- [ ] Edge runtime 互換テスト方針（`vitest-pool-workers` + lint）が記載
- [ ] lint rule で `node:crypto` import 禁止（Z-01）と `apps/web` → D1 直接禁止（Z-02）が記載
- [ ] fail closed 試験（AL-05, AL-06）を含む
- [ ] bypass 試行（MW-08）を含む
- [ ] session JWT の最小 claim snapshot（J-06）を含む

## タスク 100% 実行確認

- [ ] 全 10 サブタスクが completed
- [ ] outputs/phase-04/main.md と test-matrix.md が配置
- [ ] 全 AC が test ID と対応
- [ ] 不変条件 #5 / #6 への lint test が含まれる
- [ ] 次 Phase へ test ID リスト（P / ST / CK / AL / MW / J / Z）を引継ぎ

## 次 Phase

- 次: 5（実装ランブック）
- 引き継ぎ事項: test ID を runbook の完了条件に組み込み、sanity check を test ID 単位で記述
- ブロック条件: AC × test ID 対応に欠落があれば進まない
