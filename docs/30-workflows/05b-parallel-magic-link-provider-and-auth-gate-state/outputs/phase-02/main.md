# Phase 2: 設計 — サマリ

## 0. 位置付け

Phase 1 の AC-1 〜 AC-10 を、状態機械（`architecture.md`）と API 契約（`api-contract.md`）に展開する。`apps/web` (Next.js on Workers) と `apps/api` (Hono on Workers) の境界、Auth.js Credentials Provider 相当 bridge と D1 `magic_tokens` の関係、5 状態の判定経路を一意に決める。05b では EmailProvider は使わない。

## 1. 主要決定事項

| 項目 | 決定 | 根拠 |
| --- | --- | --- |
| API 構成 | `POST /auth/magic-link` + `GET /auth/gate-state` の 2 endpoint 分離 | 状態判定（GET）と発行（POST）を責務分離。UI の preflight に有利 |
| token 発行責務 | `apps/api` のみ。`apps/web` は同 origin proxy のみ | 不変条件 #5 |
| token 形式・TTL | hex 64 文字（32 byte）/ TTL 900 秒（15 分） | 既存 repository/magicTokens.ts と整合、spec 13-mvp-auth |
| session 戦略 | Auth.js JWT strategy | Workers ステートレス、無料枠 |
| Auth.js bridge | 05b は EmailProvider 不使用。後続 06b の Credentials Provider 相当 callback が apps/api の `POST /auth/magic-link/verify` を呼ぶ | EmailProvider は D1 直接書き込み前提になりやすく、不変条件 #5 と衝突するため |
| gate-state public 公開 | 公開だがレートリミット必須 | UX 最適化 + 列挙攻撃緩和 |
| 判定優先順位 | unregistered → deleted → rules_declined → ok（→ sent） | spec 06-member-auth との整合、削除 user の誤誘導防止 |
| `/no-access` route | 作らない（fs check + ESLint で禁止） | AC-7、不変条件 #9 |

## 2. モジュール配置

```
apps/web/
├── app/api/auth/
│   ├── api/auth/magic-link/route.ts        # apps/api への同 origin proxy（D1 触らない）
│   ├── api/auth/gate-state/route.ts        # gate-state proxy
│   └── api/auth/magic-link/verify/route.ts # verify proxy
├── lib/auth/
│   └── config.ts                     # 後続 06b の Auth.js callback 設計 placeholder

apps/api/
├── src/routes/auth/
│   ├── index.ts                      # POST /auth/magic-link, GET /auth/gate-state, POST /auth/magic-link/verify, POST /auth/resolve-session
│   └── schemas.ts                    # strict zod schemas
├── src/use-cases/auth/
│   ├── resolve-gate-state.ts         # 純関数: email -> AuthGateState（input/sent 除く）
│   ├── issue-magic-link.ts           # gate 判定 + token 発行 + mail enqueue
│   └── verify-magic-link.ts          # callback 経由の token 検証（consume）
├── src/services/mail/
│   └── magic-link-mailer.ts          # MAIL_PROVIDER_KEY を使い verification mail を送信
└── src/repository/
    └── magicTokens.ts                # 既存（02c 実装済み）

packages/shared/src/types/
├── common.ts                          # AuthGateStateValue（既存）
└── auth.ts                            # SessionUser, GateStateResponse, MagicLinkRequest など（新規 or 拡張）
```

## 3. dependency matrix（再掲）

| 種別 | 対象 | 引き渡し物 | 状態 |
| --- | --- | --- | --- |
| 上流 | 02c | `magicTokens.{issue,verify,consume}` | 実装済み |
| 上流 | 03b | `member_status.rules_consent` / `is_deleted` | sync 済み |
| 上流 | 04b | `MeSessionResponse` 型・session resolver | 実装済み |
| 上流 | 04c | `admin_users.email` lookup | 実装済み |
| 並列 | 05a | Google OAuth provider 設定 / `session.callback` | 並走、`session-callback.ts` を共有 |

## 4. 完了条件チェック

- [x] Mermaid 状態機械が 5 状態 + 遷移条件を網羅（architecture.md）
- [x] API 契約が AC-1〜AC-10 と一対一対応（api-contract.md）
- [x] env / secrets が placeholder のみで実値なし
- [x] dependency matrix が上流 4 / 並列 1 を定義
- [x] 不変条件 #5 / #9 / #10 への対応を明記

## 5. 次 Phase への引継ぎ（Phase 3 alternative 検討用論点）

- A: `gate-state` を public + `magic-link` POST 分離（採用候補）
- B: POST 一本化（state を必ず response に含む）
- C: `/no-access` 画面復活（不変条件 #9 違反）
- D: Auth.js 標準 EmailProvider のみ（不採用。D1 境界と事前判定に不利）
- E: 自前 magic_tokens + 自前 verify + 後続 Credentials bridge（採用）
