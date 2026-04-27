# Phase 3: 設計レビュー: ライブラリ選定 / session storage / ホワイトリスト管理

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 3 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-02（設計） |
| 下流 | phase-04（テスト戦略） |

## 目的

Phase 2 の設計（素実装の OAuth + PKCE / JWT Cookie session / Secret ホワイトリスト / `apps/web/middleware.ts` admin gate）に対して、5 件の代替案を比較検討し、PASS / MINOR / MAJOR で判定する。**Phase 4 へ進めるかの可否判定** を本 Phase で確定する。

## 実行タスク

1. 代替案 5 件の整理（成果物: `outputs/phase-03/main.md`）
2. PASS / MINOR / MAJOR / BLOCKER 判定（成果物: 各案に判定）
3. 採用案の理由 ADR 化と未解決事項の Phase 引継ぎ
4. リスク表の作成（OAuth 特有のリスク + 採用案の残存リスク）
5. Phase 1 AC 13 件との整合確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-13 |
| 必須 | outputs/phase-02/architecture.md | 採用案の構造 |
| 必須 | outputs/phase-02/api-contract.md | endpoint I/O |
| 必須 | outputs/phase-02/admin-gate-flow.md | admin gate 責務分離 |
| 参考 | docs/30-workflows/unassigned-task/UT-11-google-oauth-admin-login-flow.md | 元仕様の苦戦箇所（PKCE / state / redirect URI / session / allowlist / env） |
| 参考 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | OAuth client 共有 |
| 参考 | CLAUDE.md | 不変条件 #5 / #6 |

## 実行手順

### ステップ 1: 代替案の整理

| 案 | 概要 | 判定 | 理由 |
| --- | --- | --- | --- |
| A: 採用案（素実装 OAuth+PKCE / JWT Cookie / Secret allowlist / edge middleware） | Phase 2 で確定した設計どおり | **PASS** | 不変条件 #5 / #6 を満たし、Cloudflare Workers Edge runtime 互換。MVP の最小構成 |
| B: Auth.js v5 採用 | NextAuth/Auth.js v5 + GoogleProvider に置換 | MINOR | Edge runtime 互換性の追加検証コスト、JWT 構造の自由度が下がる。後続で通常ユーザー向け認証が増えた段階で再評価する候補。MVP では over-engineering |
| C: session を Cloudflare KV に保存 | 失効管理可能な server-side session | MINOR | KV binding 追加・運用コスト発生。MVP の管理者人数（数名）では JWT Cookie で十分。失効要件が顕在化したら採用検討 |
| D: ホワイトリストを D1 テーブル化 | `admin_users` に CRUD して動的管理 | **MAJOR** | 不変条件 #5 違反（apps/web から D1 直接アクセス）になり、回避するなら apps/api 経由 endpoint が必要で本タスクスコープを超える。元仕様にも「初期実装では Secret のカンマ区切り文字列が最もシンプル」と明記。本タスクでは不採用 |
| E: middleware を使わず各 admin page で `getSession()` する HOC | ページ単位 gate | MAJOR | ページ追加のたびに gate 忘れリスク。AC-7（`/admin/*` 配下は未認証時に redirect）の保証が弱まる |
| F: PKCE を省略し Authorization Code Flow のみ | confidential client 扱いで client_secret 利用 | **BLOCKER** | 元仕様の AC-2（PKCE 必須）に直接違反。security-principles 不一致 |

### ステップ 2: 判定集計

| 判定 | 件数 | 該当案 |
| --- | --- | --- |
| PASS | 1 | A（採用） |
| MINOR | 2 | B, C |
| MAJOR | 2 | D, E |
| BLOCKER | 1 | F |

### ステップ 3: 採用理由（ADR）

A 案を採用。理由:
- **不変条件 #5 充足**: 本タスクは D1 を一切使わず、ホワイトリストは Secret から読む。session も JWT Cookie で完結
- **不変条件 #6 充足**: GAS prototype の認証実装を流用せず、Cloudflare Workers Edge 互換の Web Crypto API（`crypto.subtle` / `crypto.getRandomValues`）で PKCE / JWT 検証を実装
- **MVP 最小構成**: 管理者人数が少ない MVP 段階で、ライブラリ依存を最小化し、検証可能性（テスト容易性）を最大化
- **Cloudflare Workers Edge runtime 互換**: Node.js `crypto` 不使用、Next.js Middleware は Edge で動作
- **元仕様整合**: UT-11 の「苦戦箇所・知見」で示された PKCE / state Cookie / redirect URI / allowlist 戦略にすべて適合

### ステップ 4: 未解決事項

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | session JWT TTL を 24h で良いか（運用上の操作中断耐性） | 24h（refresh は本タスク外） | - |
| Q2 | `prompt=select_account` を常に付けるか | 付ける（複数 Google アカウント運用への配慮） | 5 |
| Q3 | callback で id_token の JWS 検証を自前で行うか userinfo endpoint を信頼するか | userinfo endpoint で `email_verified` 確認に統一（実装コスト最小） | 5 |
| Q4 | ホワイトリスト 0 件のときの挙動（fail open / fail closed） | **fail closed**（全員 403） | 2 で確定済み |
| Q5 | ローカル開発時の `Secure` Cookie 属性をどう外すか | `cookies.ts` で環境判定し、ローカルのみ Secure off | 5 |
| Q6 | `wrangler pages dev` のデフォルトポートと redirect URI 整合 | 3000 固定、Google Console に `http://localhost:3000/...` 登録 | 5 |
| Q7 | UT-03 が新たに secret を追加した場合の名前衝突 | UT-03 側 spec で `GOOGLE_SHEETS_SA_*` 系を使う想定、本タスクの `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` と衝突なし | 12 |

### ステップ 5: リスク表

| # | リスク | 影響 | 確率 | 緩和策 | 残存リスク |
| --- | --- | --- | --- | --- | --- |
| R1 | redirect URI mismatch（環境ごとの URI 登録漏れ） | ログイン不可 | 中 | runbook に 3 環境分のチェックリスト、Phase 11 smoke で全環境確認 | 低 |
| R2 | `SESSION_SECRET` の弱い値で JWT 署名 | 認証突破 | 低 | wrangler secret put の手順で 32byte 乱数生成コマンドを runbook 明記 | 低 |
| R3 | ホワイトリスト Secret 更新と再デプロイの取りこぼし | 新規管理者がログイン不可 | 中 | runbook に「Secret 更新 → Workers 再デプロイ → smoke」の 3 段固定 | 低 |
| R4 | state Cookie の SameSite 競合（クロスサイト OAuth callback） | callback 失敗 | 中 | `SameSite=Lax` + `Path=/api/auth/callback/google` を spec で固定、Phase 6 異常系で回帰 | 低 |
| R5 | Node.js `crypto` を誤って import → Edge runtime で実行時失敗 | デプロイ後にエラー | 中 | Phase 9 の lint で `node:crypto` import 禁止ルールを設定 | 低 |
| R6 | ホワイトリスト 0 件状態で全員拒否 | 管理者全員ロックアウト | 低 | runbook で「Secret 配置時に 1 件以上必須」をチェック | 低 |
| R7 | session Cookie 漏洩（XSS） | 認証突破 | 低 | `HttpOnly` 必須、CSP は別タスクで強化 | 低 |
| R8 | UT-03 と secret 名衝突 | デプロイ時上書き | 低 | Phase 12 で名前空間レビュー（`SESSION_*`, `ADMIN_*` を本タスク専用に確保） | 低 |

### ステップ 6: Phase 1 AC との整合確認

| AC | 採用案 A での実現 |
| --- | --- |
| AC-1 | `/api/auth/login` route handler で 302 redirect |
| AC-2 | `pkce.ts` が code_verifier 生成 → SHA256 challenge、URL に `code_challenge_method=S256` 付与、Cookie 一時保存 |
| AC-3 | callback で state Cookie 比較、不一致時 400 |
| AC-4 | callback で `isAdminEmail()` false → 403 |
| AC-5 | callback で session Cookie 設定 → `/admin` 302 |
| AC-6 | `cookies.ts` で `HttpOnly; Secure; SameSite=Lax` 固定 |
| AC-7 | `apps/web/middleware.ts` matcher `/admin/:path*` |
| AC-8 | `/api/auth/logout` が `Max-Age=0` で Cookie 失効 |
| AC-9 | runbook に `wrangler pages dev` + `.dev.vars` 手順 |
| AC-10 | `.gitignore` に `.dev.vars` を含める手順を runbook 化、Phase 9 で確認 |
| AC-11 | runbook に redirect URI 3 環境分のチェックリスト |
| AC-12 | Phase 5 で `wrangler secret put SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` を staging / production に実施手順 |
| AC-13 | Phase 12 implementation-guide に新規管理者追加手順を必須セクション化 |

### ステップ 7: Phase 4 進行可否判定

| 判定軸 | 結果 |
| --- | --- |
| BLOCKER 案を不採用にしたか | YES（F: PKCE 省略を不採用） |
| 採用案 A が AC 13 件すべてに紐付くか | YES（ステップ 6） |
| 不変条件違反案（D）を不採用にしたか | YES |
| 未解決事項に確定 Phase が紐づいているか | YES（Q1〜Q7） |
| リスクに緩和策が紐づいているか | YES（R1〜R8） |

→ **Phase 4 進行可（PASS）**

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | A 案の test 設計（unit: pkce/state/jwt/allowlist、contract: callback 全分岐、E2E: ブラウザログイン） |
| Phase 6 | F 案的「PKCE 無効化」が混入していないことを異常系で回帰、R4 / R5 リグレッション |
| Phase 7 | AC × 採用案 A の整合再確認 |
| Phase 9 | R5（Node.js crypto import 禁止）の lint ルール |
| Phase 11 | R1（redirect URI 3 環境）smoke |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | F 案不採用の根拠（PKCE 省略は AC-2 違反）を ADR で明記 | - |
| privacy | A / B / C すべて JWT に profile 本文を載せない | - |
| 認可境界 | E 案不採用の根拠（HOC は `/admin/*` 全体 gate を保証しない） | - |
| 不変条件 #5 | D 案不採用の根拠（apps/web から D1 直接禁止） | #5 |
| 不変条件 #6 | A 案は GAS prototype を踏襲しない | #6 |
| Cloudflare 互換 | A 案の middleware が Edge runtime で動くこと（Phase 2 で確認） | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 5 件以上の列挙 | 3 | pending | A〜F の 6 件で達成 |
| 2 | PASS / MINOR / MAJOR / BLOCKER 判定 | 3 | pending | 集計表 |
| 3 | 採用理由 ADR | 3 | pending | A 案 |
| 4 | 未解決事項残し | 3 | pending | Q1〜Q7 |
| 5 | リスク表 | 3 | pending | R1〜R8 |
| 6 | Phase 1 AC との整合確認 | 3 | pending | 13 件 |
| 7 | Phase 4 進行可否判定 | 3 | pending | PASS |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案、判定、採用理由、未解決事項、リスク表、Phase 4 進行可否 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 代替案 3 件以上（6 件で達成）
- [ ] 全案に判定（PASS / MINOR / MAJOR / BLOCKER）が付与
- [ ] BLOCKER 案（F: PKCE 省略）を不採用と明記
- [ ] 採用案 A の理由が ADR 形式で明記
- [ ] 未解決事項 Q1〜Q7 が確定 Phase 付きで残る
- [ ] リスク表 R1〜R8 に緩和策と残存リスク評価
- [ ] Phase 1 AC 13 件すべてに採用案での実現方法が紐付く
- [ ] Phase 4 進行可否が PASS

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスクが completed
- [ ] outputs/phase-03/main.md が配置
- [ ] 全完了条件にチェック
- [ ] 不変条件 #5 違反案（D）が MAJOR、AC 違反案（F）が BLOCKER と判定
- [ ] 次 Phase へ Q1〜Q7 / R1〜R8 を引継ぎ

## 次 Phase

- 次: 4（テスト戦略）
- 引き継ぎ事項: 採用案 A の API contract と Mermaid を test 設計の入力に。R4 / R5 を Phase 6 異常系へ、R1 を Phase 11 smoke へ
- ブロック条件: 採用案が確定していない場合は進まない（本 Phase で PASS 確定済）
