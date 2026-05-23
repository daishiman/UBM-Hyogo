# apps/api Workers レスポンスヘッダ hardening - タスク指示書

## メタ情報

```yaml
issue_number: 870
```


## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | awshh-followup-004-apps-api-security-headers      |
| タスク名     | apps/api Workers レスポンスヘッダ hardening       |
| 分類         | セキュリティ強化                                  |
| 対象機能     | apps/api Hono レスポンスのセキュリティヘッダ整備  |
| 優先度       | 中                                                |
| 見積もり規模 | 小規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | apps-web-security-headers-hardening Phase 12      |
| 発見日       | 2026-05-23                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

今 cycle (`apps-web-security-headers-hardening`) は `apps/web` 単独スコープで CSP / Permissions-Policy / Referrer-Policy / X-Content-Type-Options / X-Frame-Options を導入した。一方、`apps/api` (Hono on Cloudflare Workers) は `apps/web` から独立した surface として運用されており、API レスポンス側のセキュリティヘッダは未整備のままである。

`apps/api` は D1 アクセスを唯一許可された経路であり (CLAUDE.md 不変条件 #5)、ブラウザ / fetch クライアントの双方から呼び出される。API レスポンスに対する最低限の hardening を行わないと、`apps/web` 側だけ強化しても全体の attack surface が縮まらない。

### 1.2 問題点・課題

- `apps/api` のレスポンスに `X-Content-Type-Options: nosniff` が無く、MIME sniffing による誤解釈リスクが残る
- `Strict-Transport-Security` が API レスポンスから返却されておらず、Cloudflare 側で有効でもプロトコル境界の保証が二重化されていない
- `Referrer-Policy` 未設定で、エラーレスポンス経由で referrer が漏れ得る
- `Cache-Control` が route ごとに散在しており、認証必要 endpoint で `no-store` が抜けるリスク
- CORS allowlist が staging / production env で明示的に分離されていない可能性

### 1.3 放置した場合の影響

- `apps/web` だけ hardening されても API 側の攻撃面が残り、全体としての security posture が中途半端になる
- 監査・脆弱性スキャナ (e.g. Mozilla Observatory 相当) で apps/api の URL に対して低スコアが残り続ける
- 将来 third-party from 利用が増えた際に CORS の境界曖昧さが事故の原因になる

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api` (Hono on Cloudflare Workers) の全 route に対し、API 用途に最適化したセキュリティヘッダを Hono middleware として一元適用する。

### 2.2 最終ゴール

- `apps/api/src/middleware/security-headers.ts` が新規追加され、全 route に `hono.use` で適用されている
- `X-Content-Type-Options: nosniff` / `Strict-Transport-Security` / `Referrer-Policy: no-referrer` が全 API レスポンスに付与されている
- 認証必要 endpoint で `Cache-Control: no-store` が確実に付与されている
- CORS allowlist が staging / production env で wrangler.toml 経由で分離されている
- vitest unit でヘッダ付与が保証されている

### 2.3 スコープ

#### 含むもの

- `apps/api/src/middleware/security-headers.ts` 新規実装
- `apps/api/src/index.ts` (または equivalent entry) での `hono.use` 適用
- CORS allowlist の env 別分離 (`apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]`)
- middleware の vitest unit テスト
- 認証必要 endpoint の `Cache-Control: no-store` 付与

#### 含まないもの

- CSP の API 側適用 (JSON レスポンス中心のため不要)
- D1 schema 変更
- 既存 endpoint の I/O shape 変更
- `apps/web` 側のヘッダ調整 (今 cycle で完了済み)
- `packages/` への共有 helper 切り出し (将来 wave で再検討)

### 2.4 成果物

- `apps/api/src/middleware/security-headers.ts`
- `apps/api/src/index.ts` の差分
- `apps/api/wrangler.toml` の CORS allowlist 差分
- middleware の vitest unit テスト
- 適用後のレスポンスヘッダ snapshot

---

## 3. どのように実行するか（How）

### 3.1 前提条件

なし（独立タスク）。`apps/web` 側の今 cycle 完了を待つ必要はないが、参考実装パターンとして `apps/web/src/lib/security-headers.ts` を参照できる。

### 3.2 依存タスク

なし

### 3.3 必要な知識

- Hono middleware (`c.header()` / `hono.use`) の仕様
- Cloudflare Workers 側で既に付与されるヘッダとの重複回避
- CLAUDE.md 不変条件 #5 (D1 直接アクセスは apps/api に閉じる)
- `apps/web/src/lib/security-headers.ts` の実装パターン

### 3.4 推奨アプローチ

`apps/web/src/lib/security-headers.ts` の構造を参考にしつつ、API 用途では CSP を外し、`X-Content-Type-Options` / `HSTS` / `Referrer-Policy` / `Cache-Control` / `CORS` を中心に組む。CORS allowlist は wrangler.toml の env vars (`ALLOWED_ORIGINS` 等) から `apps/api/src/lib/env.ts` 経由で読み込み、middleware に注入する。

---

## 4. 実行手順

### Phase構成

1. 既存ヘッダ状況の棚卸し
2. middleware 設計
3. 実装と適用
4. テストと検証

### Phase 1: 既存ヘッダ状況の棚卸し

#### 目的

`apps/api` の現行レスポンスに付与されているヘッダを把握し、不足分を特定する。

#### 手順

1. `apps/api/src/index.ts` および各 route の `c.header()` 呼び出しを `rg` で列挙
2. Cloudflare Workers 側で自動付与されるヘッダを確認 (curl で staging 実エンドポイント)
3. 不足ヘッダ / 重複ヘッダを分類

#### 成果物

ヘッダ棚卸し表

#### 完了条件

現状ヘッダと目標ヘッダの差分が確定している

### Phase 2: middleware 設計

#### 目的

`security-headers.ts` middleware の I/O と適用範囲を決める。

#### 手順

1. ヘッダ値定数の選定 (`Referrer-Policy: no-referrer` / `Strict-Transport-Security: max-age=31536000; includeSubDomains` 等)
2. CORS allowlist 読み込み元 (env vars) の決定
3. 認証必要 endpoint への `Cache-Control: no-store` 付与方針 (middleware 一律 vs route ごと判定)
4. `apps/web` の helper との重複回避方針

#### 成果物

middleware 設計メモ

#### 完了条件

ヘッダ一覧と注入元 env の対応が確定している

### Phase 3: 実装と適用

#### 目的

middleware を実装し、Hono entry point から全 route に適用する。

#### 手順

1. `apps/api/src/middleware/security-headers.ts` を新規作成
2. `apps/api/src/index.ts` で `hono.use('*', securityHeaders())` を追加
3. `apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `ALLOWED_ORIGINS` を追加
4. `apps/api/src/lib/env.ts` に env schema 追加

#### 成果物

middleware 実装と適用差分

#### 完了条件

全 route で目標ヘッダが付与され、CORS allowlist が env 別に分離されている

### Phase 4: テストと検証

#### 目的

middleware が全 route で正しく動作することを保証する。

#### 手順

1. middleware の vitest unit テスト追加 (ヘッダ存在・値確認)
2. CORS allowlist の env 別 snapshot テスト
3. 認証必要 endpoint の `Cache-Control: no-store` 付与確認
4. staging deploy 後の curl 検証

#### 成果物

テスト追加差分と検証ログ

#### 完了条件

全テスト緑かつ staging で curl 検証が通る

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/api/src/middleware/security-headers.ts` が新規追加されている
- [ ] 全 API route に `X-Content-Type-Options: nosniff` が付与されている
- [ ] 全 API route に `Strict-Transport-Security` が付与されている
- [ ] 全 API route に `Referrer-Policy: no-referrer` が付与されている
- [ ] 認証必要 endpoint に `Cache-Control: no-store` が付与されている
- [ ] CORS allowlist が staging / production env で分離されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `apps/api` 関連 vitest 緑

### ドキュメント要件

- [ ] middleware の責務が `apps/api/src/middleware/` README または該当仕様に記載されている
- [ ] CORS allowlist の env 別運用が wrangler.toml コメントまたは仕様に記載されている

---

## 6. 検証方法

### テストケース

- 任意の API endpoint で `X-Content-Type-Options: nosniff` が返却される
- 任意の API endpoint で `Strict-Transport-Security` が返却される
- 認証必要 endpoint で `Cache-Control: no-store` が返却される
- allowlist 外 origin からの preflight が `403` または CORS 拒否となる
- allowlist 内 origin からの preflight が `204` で通過する

### 検証手順

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
mise exec -- pnpm --filter @repo/api test
curl -I https://api-staging.example.com/health
curl -I -H "Origin: https://evil.example.com" -X OPTIONS https://api-staging.example.com/members
```

---

## 7. リスクと対策

| リスク                                                        | 影響度 | 発生確率 | 対策                                                                 |
| ------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| Cloudflare Workers 側で既に付与されているヘッダと重複         | 低     | 中       | Phase 1 の棚卸しで重複を特定し、middleware では上書きを避ける        |
| CORS allowlist の env 別分離ミスで production が staging を許可 | 高     | 低       | wrangler.toml の `[env.production.vars]` のみで production origin を定義し、unit テストで env 別 snapshot 検証 |
| `Cache-Control: no-store` が不要な public endpoint にも付与   | 中     | 中       | middleware では default を緩く、認証必要 route で明示的に no-store を付与する設計とする |
| `apps/web` helper と実装が乖離                                | 低     | 中       | 共有 helper 化は将来 packages 整理 wave で実施する方針を明記         |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md`
- `apps/web/src/lib/security-headers.ts` (参考実装パターン)
- `apps/api/src/`
- `apps/api/wrangler.toml`

### 参考資料

- CLAUDE.md 不変条件 #5 (D1 直接アクセスは apps/api に閉じる)
- Hono middleware ドキュメント (`hono.use` / `c.header`)
- Mozilla Web Security Guidelines (Referrer-Policy / HSTS)

---

## 9. 備考

### 苦戦箇所【記入必須】

> apps-web-security-headers-hardening 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `apps/web` で security headers helper を実装した際、同じパターンが `apps/api` にも必要であることが判明したが、今 cycle のスコープに収めると単一責務原則 (CONST_001) を超過する |
| 原因     | `apps/web` (Next.js on Workers) と `apps/api` (Hono on Workers) はランタイム的にも責務的にも分離しており、helper を共有するには `packages/` への切り出し判断が必要だが、それ自体が別アーキテクチャ判断 |
| 対応     | 今 cycle は `apps/web` 単独スコープに閉じ、`apps/api` 側は本 follow-up タスクとして分離。共有 helper 化は将来 packages 整理 wave で再検討する方針を確定                |
| 再発防止 | apps 横断のセキュリティ施策は、初期スコーピング時に「app 単位 × 共有 helper 化判断」を明示し、必要なら follow-up タスクを Phase 12 で切り出すルールを正本化            |

### レビュー指摘の原文（該当する場合）

```
apps-web-security-headers-hardening Phase 12 unassigned-task-detection.md にて apps/api 側の security headers hardening を独立タスクとして識別
```

### 補足事項

`apps/api` は D1 アクセスを唯一許可された境界であり、`apps/web` 側だけ hardening しても全体としての security posture が中途半端になる。本タスクは `apps/web` 側 cycle と独立して実行可能であり、前提条件は無い。共有 helper 化 (`packages/security-headers` 等) は将来 packages 整理 wave で扱い、本タスクのスコープには含めない。
