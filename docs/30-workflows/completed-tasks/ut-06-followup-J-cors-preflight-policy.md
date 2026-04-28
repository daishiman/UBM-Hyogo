# UT-06 Follow-up J: API CORS preflight policy 実装・仕様化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-J |
| タスク名 | apps/api に CORS middleware / preflight handler を実装 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 作成日 | 2026-04-27 |
| 種別 | implementation |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-J / 実行前ブロッカー B-4 |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

Web-to-API smoke で OPTIONS preflight を確認できるよう、Hono に CORS middleware を実装し、許可 origin を環境別に定義する。Phase 11 S-06 PASS の前提。

## スコープ

### 含む

- `hono/cors` middleware の導入
- 環境別許可 origin リスト（staging / production）の定義
- OPTIONS リクエストへの 適切な CORS header 付与
- 不許可 origin に対する拒否（403 または missing header）
- API contract / security spec への反映
- Phase 11 S-06 smoke の実行確認

### 含まない

- 認証フローの変更
- WAF rate limiting の設定（UT-15 別タスク）
- カスタムドメイン設定（UT-16 別タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-16 カスタムドメイン設定 | 本番 origin 確定の前提（並走可） |
| 関連 | UT-06-FU-F smoke スクリプト | S-06 検証の連携 |
| 関連 | security specs | CSP / Referrer-Policy との整合 |

## 苦戦箇所・知見

**1. 許可 origin の正本管理**
staging / production / preview それぞれの web origin を環境変数か const で正本管理する必要がある。`apps/web/wrangler.toml` の URL と drift しないよう、CLAUDE.md または共有 config に集約する。

**2. credentials: include 方針**
Cookie / Authorization ヘッダを跨ぐかどうかで `Access-Control-Allow-Credentials` の要否が変わる。MVP では include 不要だが、将来の Auth.js セッション統合で必要になるため拡張余地を残す。

**3. preflight キャッシュ**
`Access-Control-Max-Age` を適切に設定しないと preflight が頻発し latency 増。10 分〜1 時間が一般的。

**4. Hono CORS middleware の order**
`app.use('*', cors(...))` の登録順が間違っていると一部 endpoint が CORS 適用されない。`app.use` を最上位で宣言する。

**5. 不許可 origin の挙動**
ブラウザ側でブロックされる仕様だが、サーバー側では 200 で CORS header なしを返すのが標準。403 で拒否すると一部クライアントで誤動作する。

## 受入条件

- [ ] `hono/cors` middleware が導入されている
- [ ] 環境別許可 origin リストが定義され、共有 config に集約済み
- [ ] OPTIONS preflight に適切な `Access-Control-Allow-*` header が返る
- [ ] 不許可 origin がブラウザレベルでブロックされる挙動が docs に記載
- [ ] Phase 11 S-06 が PASS
- [ ] security spec に CORS policy が記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-J |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/implementation-guide.md | B-4 |
| 必須 | apps/api/src/index.ts | 編集対象 |
| 参考 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md | 関連セキュリティ |
