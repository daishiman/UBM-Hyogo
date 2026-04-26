# AC トレーサビリティマトリクス

## 受入条件 × 実装・テスト対応表

| AC | 内容 | 実装 | テスト | ドキュメント | 判定 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Service Account vs OAuth 2.0 比較評価表が存在する | — | — | `outputs/phase-02/auth-comparison-table.md` | ✅ PASS |
| AC-2 | `GOOGLE_SERVICE_ACCOUNT_JSON` が Cloudflare Secrets に配置済みの手順 | — | — | `outputs/phase-05/setup-runbook.md` | ✅ PASS |
| AC-3 | `sheets-auth.ts` 実装済み（JWT 署名・トークン取得・TTL キャッシュ） | `packages/integrations/src/sheets-auth.ts` | AUTH-01〜AUTH-05 (10 tests PASS) | `outputs/phase-05/sheets-auth-spec.md` | ✅ PASS |
| AC-4 | 環境別動作確認手順が documented | — | — | `outputs/phase-05/setup-runbook.md`（section 5） | ✅ PASS |
| AC-5 | `.dev.vars` が `.gitignore` に記載されている | `.gitignore` に `.dev.vars` / `**/.dev.vars` 追加 | Phase 4 事前確認チェックリスト | `outputs/phase-05/local-dev-guide.md` | ✅ PASS |
| AC-6 | スプレッドシートへの SA 共有手順が runbook に記載 | — | — | `outputs/phase-05/setup-runbook.md`（section 3） | ✅ PASS |
| AC-7 | ローカル開発フロー（`.dev.vars`）が文書化されている | — | — | `outputs/phase-05/local-dev-guide.md` | ✅ PASS |

## テスト網羅性確認

| Test ID | AC カバレッジ | 実装パス |
| --- | --- | --- |
| AUTH-01 | AC-3（JWT 署名の PEM import） | `importPrivateKey()` |
| AUTH-02 | AC-3（JWT claim 検証） | `createSignedJWT()` |
| AUTH-03 | AC-3（トークン取得） | `getAccessToken()` → fetch |
| AUTH-04 | AC-3（TTL キャッシュ） | `getAccessToken()` → cache |
| AUTH-05 | AC-3（KV fallback） | `getAccessToken()` → in-memory |
| AUTH-06 | AC-3・AC-5（secret redaction） | `SheetsAuthError` |

## 総合判定

**全 AC PASS** — 実装・ドキュメントが全受入条件を満たしている
