# Phase 09 — 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 名称 | 品質保証 |
| タスク | UT-03 Sheets API 認証方式設定 |
| 状態 | pending |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| GitHub Issue | #5 |

---

## 目的

Sheets API 認証基盤について、以下の4観点から品質を担保する。

1. **セキュリティ**: シークレット管理・Web Crypto API 使用・JWT 設計の安全性
2. **無料枠適合**: Cloudflare Workers 無料枠内での認証処理コスト確認
3. **Edge Runtime 制約適合**: Node.js built-ins 不使用の確認
4. **運用衛生**: シークレットの git 非混入・ローカル設定の安全性

---

## 実行タスク

### 9-1. Free-Tier コスト確認

#### Cloudflare Workers 無料枠制限

| 指標 | 無料枠上限 | 認証処理の消費 |
| --- | --- | --- |
| リクエスト数 | 10万リクエスト/日 | 認証自体はリクエスト数をカウントしない（fetch() は内部） |
| CPU 時間 | 10ms / リクエスト（バースト可） | JWT 署名（RS256）は ~1-5ms 程度（要計測）|
| サブリクエスト数 | 50回 / リクエスト | トークンキャッシュヒット時: 0回、miss時: 1回 |
| メモリ | 128MB / Worker | 認証モジュールは数KBのみ使用 |

#### 評価基準

- [ ] RS256 JWT 署名の CPU 時間が 10ms 制限を超えないことを確認する
  - 確認方法: `wrangler dev` 起動中に `curl` でリクエストを送り、ログの CPU time を確認する
  - 許容基準: `getSheetsAccessToken()` の処理時間が 5ms 以下であること
- [ ] トークンキャッシュが正常に機能している場合、サブリクエスト消費が 0 になることを確認する

> **補足**: 無料枠内での認証処理は、TTL キャッシュが正常に機能する限りコストは最小限。
> キャッシュが機能しない場合（isolate 再起動時）でも、1回の `fetch()` で済むため無料枠超過リスクは低い。

---

### 9-2. Secret Hygiene（シークレット衛生）確認

#### 2-1. git 非混入確認

```bash
# リポジトリ全体で GOOGLE_SERVICE_ACCOUNT_JSON の値が混入していないか確認する
git log --all --full-history -p -- "*.json" "*.env" "*.vars" | grep -i "google_service_account" | grep -v "GOOGLE_SERVICE_ACCOUNT_JSON=" | head -20

# .gitignore に .dev.vars が含まれているか確認する
grep -rn "\.dev\.vars" .gitignore apps/api/.gitignore 2>/dev/null

# git status で .dev.vars が追跡されていないか確認する
git status --porcelain | grep ".dev.vars"
# 出力がなければOK（追跡されていない）
```

#### 2-2. Cloudflare Secrets の安全性確認

| 確認項目 | 確認方法 | 期待する結果 |
| --- | --- | --- |
| シークレット登録済み | `wrangler secret list --env staging` | `GOOGLE_SERVICE_ACCOUNT_JSON` が一覧に表示される |
| シークレット値の非表示 | `wrangler secret list` | 値（JSON内容）は表示されない（名前のみ表示）|
| 平文 .env ファイルなし | `git ls-files \| grep -E "\.env"` | `.env`、`.dev.vars` 等が追跡対象でないこと |

#### 2-3. JSON key の保管確認

| 保管場所 | 状況 | 対処 |
| --- | --- | --- |
| 1Password | JSON key を保管していること | 担当者が保管確認をサインオフ |
| ローカルファイル | `.dev.vars` のみ（git 非追跡） | `.gitignore` で除外済み |
| リポジトリ | **含まれていないこと** | `git log` で確認済み |
| CI/CD | GitHub Secrets に登録（必要な場合） | シークレット名のみ確認 |

---

### 9-3. Edge Runtime 制約確認（Node.js API 不使用）

Cloudflare Workers は Node.js ランタイムではなく V8 isolate 上で動作する。
以下の Node.js 固有 API が `packages/integrations/src/sheets-auth.ts` に使用されていないことを確認する。

#### 使用禁止 API リスト

| API | 代替手段 |
| --- | --- |
| `require('crypto')` / `import crypto from 'crypto'` | グローバルの `crypto.subtle`（Web Crypto API）を使用 |
| `Buffer.from()` | `Uint8Array` または `TextEncoder` を使用 |
| `process.env.*` | Cloudflare Workers の `env.*` バインディングを使用 |
| `fs.*`（ファイルシステム） | 使用不可・使用しない |
| `child_process.*` | 使用不可・使用しない |
| `node:*` プレフィックス import | Workers では互換性フラグが必要なため使用しない |

#### 確認コマンド

```bash
# Node.js 固有 import が存在しないか確認する
grep -rn "require('crypto')\|from 'crypto'\|from 'node:\|Buffer\.from\|process\.env" \
  packages/integrations/src/sheets-auth.ts

# 出力がなければ OK
```

#### `tsconfig.json` の確認

```json
// packages/integrations/tsconfig.json で以下が設定されていること
{
  "compilerOptions": {
    "lib": ["ES2022"],           // Node.js 固有の型定義を含まない
    "types": ["@cloudflare/workers-types"]  // Workers 型定義を使用
  }
}
```

---

### 9-4. Web Crypto API セキュリティレビュー

#### RS256 署名の実装確認

| 確認項目 | 期待する実装 | リスク |
| --- | --- | --- |
| アルゴリズム | `RSASSA-PKCS1-v1_5` + `SHA-256`（RS256） | HS256（対称鍵）を使用してはいけない |
| キーのエクスポート不可 | `extractable: false` を設定 | true にすると秘密鍵が外部に取り出せる |
| キーの使用目的制限 | `keyUsages: ['sign']` のみ | 不要な権限を付与しない |
| PEM → DER 変換 | ヘッダー/フッターと改行を除去し `atob()` で変換 | 変換ミスは `importKey` エラーの原因 |

#### 確認コード例

```typescript
// 以下の実装が sheets-auth.ts に含まれていることを確認する
const privateKey = await crypto.subtle.importKey(
  'pkcs8',
  pemToDer(sa.private_key),
  { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  false,          // extractable: false（秘密鍵のエクスポート禁止）
  ['sign']        // sign のみ許可
);
```

---

### 9-5. JWT 有効期限（1時間）の妥当性確認

| 観点 | 評価 |
| --- | --- |
| Google OAuth2 仕様 | アクセストークンの最大有効期間は 3600秒（1時間）。これが上限 |
| TTL キャッシュとの整合 | `expiresAt = now + 3600` は仕様通り。有効期限1分前（60秒前）に refresh |
| 無料枠への影響 | 1時間に最大1回のトークン取得 fetch。無料枠への影響は無視できるレベル |
| セキュリティ | トークン漏洩時のリスクウィンドウが最大1時間。Service Account 方式では許容範囲 |
| 判定 | **PASS** — 1時間 TTL は Google OAuth2 仕様に準拠し、無料枠・セキュリティの両面で妥当 |

---

### 9-6. 品質チェックリスト（サマリー）

以下のリストを `outputs/phase-09/quality-checklist.md` に記録する。

| カテゴリ | チェック項目 | 状態 |
| --- | --- | --- |
| Free-Tier | CPU 時間 < 5ms（JWT 署名） | pending |
| Free-Tier | キャッシュヒット時のサブリクエスト = 0 | pending |
| Secret Hygiene | `.dev.vars` が `.gitignore` に登録済み | pending |
| Secret Hygiene | `git log` で JSON key が混入していない | pending |
| Secret Hygiene | Cloudflare Secrets に `GOOGLE_SERVICE_ACCOUNT_JSON` 登録済み | pending |
| Secret Hygiene | JSON key が 1Password 等に保管済み | pending |
| Edge Runtime | `require('crypto')` 等の Node.js API 不使用 | pending |
| Edge Runtime | `Buffer.from()` 不使用、`TextEncoder` で代替 | pending |
| Edge Runtime | `process.env` 不使用、`env.*` バインディングで代替 | pending |
| Web Crypto | `extractable: false` で秘密鍵のエクスポート禁止 | pending |
| Web Crypto | `keyUsages: ['sign']` のみ設定 | pending |
| Web Crypto | RS256（RSASSA-PKCS1-v1_5 + SHA-256）を使用 | pending |
| JWT | 有効期限 3600秒（1時間）= Google OAuth2 仕様の上限値 | pending |
| JWT | refresh は有効期限60秒前に実行 | pending |

---

## 参照資料

| 種別 | パス / URL | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-05.md | 実装仕様（確認対象）|
| 必須 | CLAUDE.md | シークレット管理ルール |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Web Crypto API 仕様 |
| 参考 | https://tools.ietf.org/html/rfc7519 | JWT 仕様（RFC 7519）|
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account#jwt-auth | Google OAuth2 SA + JWT |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers 無料枠制限 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-checklist.md | 品質確認チェックリスト（全項目 PASS 確認）|

---

## 完了条件

- [ ] Free-Tier コスト確認（CPU 時間・サブリクエスト）が実施され、結果が記録されている
- [ ] Secret Hygiene 確認（`git log`・`.gitignore`・Cloudflare Secrets 登録）が全項目 PASS
- [ ] Edge Runtime 制約確認（Node.js API 不使用）が全項目 PASS
- [ ] Web Crypto API のセキュリティレビュー（`extractable: false`・`keyUsages`・RS256）が全項目 PASS
- [ ] JWT 有効期限（1時間）の妥当性が確認されている
- [ ] `outputs/phase-09/quality-checklist.md` に全チェック項目の結果が記録されている

---

## 次 Phase

Phase 10 — 最終レビュー（4条件: 価値性 / 実現性 / 整合性 / 運用性の総合評価）に進む。

品質保証が完了したら、タスク全体の完成度を最終評価し、
Phase 11（手動 smoke test）へ引き継ぐ。
