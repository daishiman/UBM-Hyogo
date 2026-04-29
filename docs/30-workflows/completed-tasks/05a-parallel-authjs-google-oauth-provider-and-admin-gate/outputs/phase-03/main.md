# Phase 3 — 設計レビュー: provider 構成 / admin gate / session storage 戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 3 / 13 |
| 状態 | completed |
| 上流 | phase-02（設計） |
| 下流 | phase-04（テスト戦略） |

## 1. 代替案 5 件と判定

| 案 | 概要 | 判定 | 理由（要約） |
| --- | --- | --- | --- |
| **A** | JWT session + middleware + requireAdmin の二段防御（採用設計） | **PASS** | 不変条件 #5 / #10 / #11 すべて満たす。Cloudflare Edge runtime 互換。Auth.js v5 公式パターン |
| B | Auth.js database session（D1 `sessions` テーブル追加） | MINOR | 不変条件 #10 への影響大。MVP では over-engineering。row 数が device 数 × user 数で増 |
| C | middleware 不採用、各 admin page で `getServerSession` (HOC) gate | MINOR | UI bypass の漏れリスク。新規 page 追加時 gate 忘れ事故。SSR で admin 構造が露出するリスク |
| D | API only gate（apps/web は素通し、apps/api でのみ 403） | MAJOR | 非 admin に admin UI 構造が露出。不変条件 #11 違反 |
| E | session callback で apps/web から D1 直接アクセス（session-resolve endpoint なし） | MAJOR | 不変条件 #5 違反。`getCloudflareContext` 経由の D1 binding 直接利用は禁止 |

## 2. PASS / MINOR / MAJOR 集計

| 判定 | 件数 | 該当案 |
| --- | --- | --- |
| PASS | 1 | A（採用） |
| MINOR | 2 | B, C |
| MAJOR | 2 | D, E |

## 3. 採用案 A の ADR

### コンテキスト

UBM 兵庫支部会メンバーサイトは Cloudflare Workers (apps/web `@opennextjs/cloudflare` + apps/api Hono) で構成され、無料枠運用と D1 アクセス境界を厳守する制約がある。Auth.js v5 で Google OAuth を組み込み、`/admin/*` を `admin_users` ベースで保護する必要がある。

### 決定

**A 案を採用**: JWT session strategy + `apps/web/middleware.ts` + `apps/api/requireAdmin` の二段防御。session callback の D1 lookup は `apps/api GET /auth/session-resolve` 経由（INTERNAL_AUTH_SECRET で内部認証）。

### 結果（Consequences）

- **正の効果**:
  - 不変条件 #5（apps/web→D1 直接禁止）を session-resolve endpoint 経由で satisfy
  - 不変条件 #10（無料枠）を JWT で satisfy（`sessions` テーブル追加無し）
  - 不変条件 #11（admin gate）を二段防御で satisfy（UI 構造露出防止 + API 最終防衛）
  - 05b（Magic Link）と session-resolve endpoint を共有 → 同一 email で同一 memberId が provider 不変で担保（AC-9）
  - Auth.js v5 公式パターンに沿うため、`@opennextjs/cloudflare` の動作実績が活用できる
- **負の効果**:
  - JWT revoke が困難（24h TTL での expiry 待ちのみ）。logout は cookie 削除で対応するが session-resolve の最新状態と乖離可能
  - admin 権限を剥奪しても 24h は admin として動作しうる → 短期 TTL で許容範囲、緊急時は AUTH_SECRET rotate で全 session 無効化
  - middleware.ts に AUTH_SECRET を渡す必要があり、edge runtime での secrets 取得が前提
- **trade-off**:
  - revoke 即時性 vs D1 row 増 → 後者を優先（不変条件 #10）

### 不採用理由

| 案 | 不採用理由 |
| --- | --- |
| B | `sessions` テーブル追加は不変条件 #10 への直接影響。50 人規模 MVP で device × user 数の row 増は許容しがたい。Auth.js v5 が JWT strategy を Cloudflare で推奨している点も考慮 |
| C | `getServerSession` 呼び忘れリスク。新規 admin page 追加のたびに gate 配置を強制する仕組みが無い。SSR 段階で admin 構造が HTML として配信される可能性 |
| D | UI gate 不在で `/admin/*` の HTML が誰でも取得可能。admin 機能の存在自体が漏洩。不変条件 #11 の精神に反する |
| E | `apps/web` から `getCloudflareContext().env.DB` を直接呼ぶのは不変条件 #5 違反。CLAUDE.md 「重要な不変条件 5」で明示禁止 |

## 4. 未解決事項（次 Phase へ引継ぎ）

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | `/auth/session-resolve` の保護方式 | INTERNAL_AUTH_SECRET (Worker-to-Worker header) | 4（test）/ 5（runbook） |
| Q2 | JWT TTL 24h vs 7d | 24h（spec で固定。refresh は 06b 別タスク） | 確定 |
| Q3 | Hosted domain (`hd`) 制限 ON/OFF | OFF（個人 Gmail 会員もあり） | 確定 |
| Q4 | session callback で profile 本文 fetch するか | NO（不変条件 #4/#11） | 確定（Phase 2） |
| Q5 | admin gate 拒否時の redirect 先 | `/login?gate=admin_required`（fail closed） | 5 / 6 |
| Q6 | 既存 `admin-gate.ts` (Bearer SYNC_ADMIN_TOKEN) の rename タイミング | Phase 5 ランブックで `requireSyncAdmin` にリネーム + sync 系 endpoint のみに適用 | 5 |
| Q7 | `findIdentityWithStatusByEmail` を 02a に追加するか、05a 内で SQL を書くか | 05a 内で auth.ts に集約 SQL を書く（02a へのフィードバックは ADR で残す） | 5 |
| Q8 | `packages/shared/src/auth.ts` の存在確認 / 新規作成 | Phase 5 で確認、無ければ新規作成 | 5 |

## 5. Phase 1 AC との整合確認

| AC | 採用案 A での実現 | カバレッジ |
| --- | --- | --- |
| AC-1: session.user.memberId が member_identities.member_id と一致 | session-resolve が memberId を返し、jwt callback で token.memberId に格納 | ✅ |
| AC-2: 未登録 user は session 不発行 → /login?gate=unregistered | signIn callback が `false` 相当の URL string を返す（Auth.js v5 の return URL 機能） | ✅ |
| AC-3: admin_users 登録 user は session.user.isAdmin === true | session-resolve が isAdmin=true を返し、jwt callback に格納 | ✅ |
| AC-4: 未許可 user の /admin/* page → 403 / /login redirect | middleware.ts が 302 `/login?gate=admin_required` を返す | ✅ |
| AC-5: /admin/* API → 401/403 | requireAdmin が cookie/Bearer 両対応で 401/403 | ✅ |
| AC-6: 平文 secrets がリポジトリに無い | secrets.md で wrangler secret put / 1Password op:// 参照のみ | ✅ |
| AC-7: secrets が wrangler / GitHub / 1Password に配置 | secrets.md 表が spec 08-free-database に準拠 | ✅ |
| AC-8: JWT 改ざん検出 → 401 | Auth.js v5 標準の HS256 verify。requireAuth の `verifyJwt` も signature 失敗で null を返し 401 | ✅ |
| AC-9: 同一 email で OAuth/Magic Link が同一 memberId | session-resolve の出力が provider 不変、05b 設計と契約共有 | ✅ |
| AC-10: middleware が edge runtime で動く | `getToken()` は edge 互換。D1 access 無し、Web Crypto のみ | ✅ |

10/10 充足。

## 6. 不変条件 #2/#3/#5/#7/#9/#10/#11 トレース

| # | 採用案 A での扱い | 検証手段 |
| --- | --- | --- |
| #2 | session-resolve で `rules_consent !== "consented"` → gateReason="rules_declined" | Phase 4 contract test |
| #3 | OAuth profile email を `member_identities.response_email` に対して lookup（system field） | session-resolve の SQL |
| #5 | apps/web から D1 直接禁止 → session-resolve endpoint 経由のみ。middleware は JWT verify のみで D1 触らない | Phase 4 で apps/web 内に D1 import が無いことを test |
| #7 | JWT に memberId のみ、responseId は載せない | 型定義 (`SessionJwtClaims`) で強制、Phase 4 contract test |
| #9 | `/no-access` 不使用、`/login?gate=...` 経由のみ | middleware と signIn callback の redirect 先 |
| #10 | JWT strategy で `sessions` テーブル追加無し | migration 追加無しを Phase 5 で確認 |
| #11 | admin gate 二段防御で UI 構造漏洩防止 + API 最終防衛 | Phase 4 で 4 ケース contract test（無 token / 非 admin / valid admin / JWT 改ざん）|

## 7. 依存タスク（04b/04c/02a/02c/05b）への影響再確認

| 依存先 | 採用案 A の影響 | 対応 |
| --- | --- | --- |
| 04b | `/me/*` を `requireAuth` で保護することを 05a が提供。04b の Phase 13 完了済 endpoint への middleware 差し替えが必要 | Phase 5 ランブックで `app.use("/me/*", requireAuth)` を `apps/api/src/index.ts` に追加 |
| 04c | `/admin/*` を `requireAdmin` で保護することを 05a が提供。既存の `adminGate`（Bearer SYNC_ADMIN_TOKEN）から差し替え | Phase 5 で `app.use("/admin/*", requireAdmin)` に置換、sync 系のみ `requireSyncAdmin` で隔離 |
| 02a | `findIdentityWithStatusByEmail` 相当の SQL（status JOIN）が必要。02a に追加するか 05a 内で書くか | Q7 で「05a 内で書く」と仮決定。02a の repository には別途 PR で追加検討 |
| 02c | `isActiveAdmin(email)` を session-resolve で使用。signature 一致確認 | 既存 `isActiveAdmin(c, email)` をそのまま利用 |
| 05b | session-resolve endpoint と JWT 構造を共有。`gateReason` 列挙の追加（"sent" "input" は載せない） | 05b の Phase 2/3 と双方向レビュー必須（ADR で contract 明文化） |

## 8. 多角的チェック観点（Phase 3 視点）

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | E 案不採用の根拠（D1 直接アクセス）を ADR で明記 | #5 |
| privacy | A/B/C いずれも JWT に profile 本文を載せない設計 | #4, #11 |
| 認可境界 | D 案不採用の根拠（API gate のみは UI 漏洩） | #11 |
| 無料枠 | B 案の D1 row 増を不採用根拠に明示 | #10 |
| Cloudflare 互換 | A 案の middleware.ts が edge で動くこと（Phase 2 で確認済） | - |
| 観測性 | gate 拒否を audit log に hook（07c で実装、本タスクでは hook ポイントを残す） | - |
| revoke 戦略 | JWT 24h TTL での自然失効と AUTH_SECRET rotate による緊急失効を明記 | - |
| 並列タスク整合性 | 05b と session-resolve / JWT 構造を共有することで二重実装回避 | - |

## 9. サブタスク完了確認

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 代替案 5 件列挙 | ✅ |
| 2 | PASS-MINOR-MAJOR 判定 | ✅ |
| 3 | 採用理由 ADR | ✅ |
| 4 | 未解決事項残し（Q1〜Q8） | ✅ |
| 5 | Phase 1 AC との整合確認 | ✅ |

## 10. 完了条件チェック

- [x] 代替案 3 件以上（5 件提示）
- [x] PASS-MINOR-MAJOR が全案に付与
- [x] 採用案 A の理由 ADR が明記
- [x] 未解決事項 Q1〜Q8 が確定 Phase 付きで残る
- [x] Phase 1 AC 10 件すべてに採用案での実現方法が紐付く
- [x] 不変条件 #5/#10/#11 違反案（D, E）が MAJOR と判定
- [x] 次 Phase（4: テスト戦略）への引継ぎ事項が整理

## 11. タスク 100% 実行確認

- [x] 全 5 サブタスクが completed
- [x] outputs/phase-03/main.md が配置
- [x] 全完了条件にチェック
- [x] 不変条件 #5/#10/#11 違反案（D, E）が MAJOR と判定
- [x] 次 Phase へ Q1〜Q8 を引継ぎ

## 12. 次 Phase（Phase 4: テスト戦略）への引継ぎ

| 項目 | 内容 |
| --- | --- |
| 採用設計 | A 案: JWT + middleware + requireAdmin |
| test 入力 | architecture.md / api-contract.md / admin-gate-flow.md |
| 重点 test | (1) session-resolve の 4 状態（unregistered/deleted/rules_declined/OK）、(2) admin gate 4 ケース、(3) JWT 改ざん、(4) 05b との session 共有 |
| ブロック条件 | Q1（INTERNAL_AUTH_SECRET 方式）が確定していない場合は contract test の前提が定まらない → Phase 4 開始時に確定必須 |

## 13. ブロック解除条件

採用案 A は確定。Phase 4 開始 OK。
