# Phase 11: 手動テスト — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-10-final-review.md](phase-10-final-review.md) / 次 Phase: [phase-12-documentation.md](phase-12-documentation.md)

---

## NON_VISUAL 宣言

| 項目 | 内容 |
|------|------|
| タスク種別 | API backend middleware |
| 非視覚的理由 | JSON API への HTTP ヘッダ追加のみ。ブラウザ UI・画面レイアウト・コンポーネントの変更は一切ない |
| スクリーンショット作成 | **不要かつ禁止**（`outputs/phase-11/screenshots/` は作成しない） |
| 代替証跡（主ソース） | `apps/api/src/middleware/__tests__/security-headers.spec.ts` の vitest 実行結果（`securityHeaders` 7 件 + `parseAllowedOrigins` 2 件 + `corsFromEnv` 6 件 = **15 件**） |
| 代替証跡（補助） | staging 環境への `curl -I` / `curl -X OPTIONS` コマンド出力 |

スクリーンショットを省略する理由: HTTP レスポンスヘッダはブラウザのピクセル表示に現れない。
`curl -I` の出力テキストと vitest の PASS/FAIL が唯一の直接証拠である。

---

## 11-1. vitest 証跡（主ソース）

実装完了後、以下のコマンドを実行し結果を `outputs/phase-11/evidence/security-headers-vitest.log` に保存する。

```bash
mise exec -- pnpm exec vitest run \
  apps/api/src/middleware/__tests__/security-headers.spec.ts \
  2>&1 | tee docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/outputs/phase-11/evidence/security-headers-vitest.log
```

> パスは単一フルパスで渡す。`apps/api src/...` のように空白で分けると
> 第 1 引数が test name filter として解釈され `No test files found` で失敗する。

期待する出力（抜粋）:

```
 ✓ apps/api/src/middleware/__tests__/security-headers.spec.ts (15 tests)
   ✓ securityHeaders
     ✓ adds nosniff, referrer policy, and default HSTS to every route
     ✓ uses custom HSTS max-age
     ✓ adds no-store for protected path prefixes when Cache-Control is absent
     ✓ matches exact protected prefixes and does not match partial public prefixes
     ✓ does not overwrite an existing Cache-Control header
     ✓ supports custom no-store prefixes
     ✓ exports the canonical constants used by tests and implementation
   ✓ parseAllowedOrigins
     ✓ parses comma-separated origins, trims whitespace, and drops empty entries
     ✓ returns an empty allowlist for undefined or empty input
   ✓ corsFromEnv
     ✓ echoes Access-Control-Allow-Origin for an allowlisted origin
     ✓ does not emit CORS allow headers for non-allowlisted origins
     ✓ denies by default when ALLOWED_ORIGINS is missing
     ✓ returns preflight CORS headers for an allowlisted origin
     ✓ returns preflight without CORS allow headers for denied origins
     ✓ uses exact origin matching only

Test Files  1 passed (1)
Tests       15 passed (15)
```

---

## 11-2. curl 検証手順（補助証跡）

staging 環境（`<api-staging-origin>` = Cloudflare Workers staging URL）に対して実施する。
staging デプロイは **Phase 13（user 承認後）** の後に実行するため、
本 Phase での curl 検証は「デプロイ完了後に証跡として追記する」扱いとする。

### 手順 A: 基本セキュリティヘッダの確認

```bash
curl -I https://<api-staging-origin>/health
```

期待レスポンスに含まれるべきヘッダ:

```
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
```

判定: 上記 3 ヘッダがすべて含まれていれば PASS。

### 手順 B: 認証必要 route の Cache-Control 確認

```bash
curl -I -H "Authorization: Bearer <valid-token>" \
  https://<api-staging-origin>/me
```

期待レスポンスに含まれるべきヘッダ:

```
Cache-Control: no-store
```

判定: `Cache-Control: no-store` が含まれていれば PASS。

### 手順 C: allowlist 外 Origin の preflight 拒否確認

```bash
curl -I \
  -H "Origin: https://evil.example" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://<api-staging-origin>/public/members
```

期待: レスポンスに `Access-Control-Allow-Origin` ヘッダが**含まれない**。

判定: `Access-Control-Allow-Origin` が出力に現れなければ PASS。

### 手順 D: allowlist 内 Origin の CORS 許可確認

```bash
# ALLOWED_ORIGINS に設定した staging origin で確認
curl -I \
  -H "Origin: https://<allowed-staging-web-origin>" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://<api-staging-origin>/public/members
```

期待: `Access-Control-Allow-Origin: https://<allowed-staging-web-origin>` がレスポンスに含まれる。

判定: 上記ヘッダが含まれていれば PASS。

### 手順 E: public route の Cache-Control 保持確認（回帰）

```bash
curl -I https://<api-staging-origin>/public/stats
```

期待: `Cache-Control: public, max-age=60` が保持されていること（`no-store` に変わっていないこと）。

判定: `Cache-Control: public, max-age=60` がレスポンスに含まれていれば PASS。

---

## 11-3. 証跡ファイル一覧

| ファイル | 内容 | 必須/任意 |
|---------|------|----------|
| `outputs/phase-11/evidence/security-headers-vitest.log` | 15 tests の vitest 実行ログ（tee 保存） | **必須** |
| `outputs/phase-11/curl-health.txt` | `curl -I /health` の出力（手順 A） | 任意（staging デプロイ後に追記） |
| `outputs/phase-11/curl-me.txt` | `curl -I /me` の出力（手順 B） | 任意（staging デプロイ後に追記） |
| `outputs/phase-11/curl-preflight-deny.txt` | evil.example preflight 拒否の出力（手順 C） | 任意（staging デプロイ後に追記） |
| `outputs/phase-11/curl-preflight-allow.txt` | allowlist origin の CORS 許可の出力（手順 D） | 任意（staging デプロイ後に追記） |
| `outputs/phase-11/curl-stats-cc.txt` | public/stats の Cache-Control 保持の出力（手順 E） | 任意（staging デプロイ後に追記） |

> `outputs/phase-11/screenshots/` は**作成しない**（NON_VISUAL 宣言）。

---

## 11-4. DoD（Definition of Done）

- [ ] `outputs/phase-11/evidence/security-headers-vitest.log` が存在し、15 tests passed と記録されている
- [ ] `securityHeaders` / `parseAllowedOrigins` / `corsFromEnv` 全 describe block の `it()` が全件 PASS でログに残る
- [ ] curl 検証（手順 A〜E）は staging デプロイ後に実施し、結果を outputs/phase-11/ に追記する（Phase 13 後の作業）
- [ ] `outputs/phase-11/screenshots/` は存在しない（作成禁止）
- [ ] Gate-B の `evidence_path` として本ファイルが `artifacts.json` に登録されている
