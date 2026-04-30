# Phase 3 代替案比較 (UT-03 Sheets API 認証方式設定)

> base case（案 A）と 3 つの代替案（B / C / D）を比較し、却下理由を明文化する。

## 案 A（採択 base case）: 自前実装 SA + Web Crypto API + TTL 1h キャッシュ

### 概要

`packages/integrations/google/src/sheets/auth.ts` 内で Service Account JSON key を parse し、Web Crypto API（`SubtleCrypto.importKey('pkcs8', RSASSA-PKCS1-v1_5/SHA-256)` + `sign`）で JWT を署名、`token_uri` に grant_type=`jwt-bearer` で fetch して access_token を取得し、in-memory TTL 3500s キャッシュで再利用する。

### 利点

- Cloudflare Workers Edge Runtime にネイティブ対応（Node API 不要）。
- 外部依存ゼロ → 脆弱性対応 / 追従コスト最小。
- Secret は `GOOGLE_SERVICE_ACCOUNT_JSON` 1 値のみ、永続化不要。
- 無料枠（KV / D1 不使用）。
- 自前実装の総量が小さい（推定 <200 行）。

### 欠点

- JWT 仕様（claim フィールド / b64url / RS256）を正しく実装する責任を自タスクで持つ。
- 将来 DPoP / 複数 SA 対応など発展した場合は実装が肥大化しうる。

### 採択判断

**採択**。4 条件 + 4 観点すべて PASS。Phase 2 設計と整合。

---

## 案 B: OAuth 2.0（offline access + refresh_token 永続化）

### 概要

ユーザー操作で初回同意 → `refresh_token` 取得 → Cloudflare KV / D1 に永続化 → access_token 期限ごとに refresh エンドポイントで更新。

### 利点

- ユーザー個別認証が必要な将来要件には適合する。

### 欠点

- 本タスクは無人実行（Cron / scheduled）の Sheets 接続用途であり、ユーザー個別認証は不要。
- `refresh_token` を Cloudflare KV / D1 に保存する設計が必要 → 不変条件 #5（D1 アクセスを `apps/api` に閉じる）に対し、`packages/integrations` から D1 に手が伸びる懸念があり整合性 MINOR。
- `refresh_token` は Google 側で 6 ヶ月無使用で失効、再同意 UI 構築の運用負担。
- KV / D1 storage 消費（無料枠 MINOR）。
- 同意 UI 構築までの開発リードタイム（価値性 MINOR）。
- 実現性 MAJOR（refresh_token 永続化と再同意 UI が MVP スコープ外）。

### 却下理由

サーバー間通信用途で OAuth 2.0 を選ぶ合理性が無い。Service Account の方が運用 / 整合 / 実現の全側面で優位。**実現性 MAJOR により block**。

---

## 案 C: `google-auth-library`（Node.js 公式ライブラリ）

### 概要

`npm install google-auth-library` を導入し、`new JWT({ email, key, scopes })` の `getAccessToken()` を呼ぶ標準的な実装。

### 利点

- Google 公式メンテナンスで仕様追従が自動。
- ドキュメント / コミュニティ豊富。

### 欠点

- ライブラリ内部で Node 標準 `crypto` モジュール（`createSign`）と `fs` 等の Node API を使用しており、Cloudflare Workers Edge Runtime（V8 isolate）では動作しない（実行時に `fs is not defined` 等で失敗）。
- `nodejs_compat` フラグで一部 Node API を polyfill する選択肢はあるが、`google-auth-library` 全体の互換は保証されておらず、依存ツリーが大きく Workers のサイズ制限（1MB / 10MB）を圧迫する懸念。
- 不要な依存（HTTP transport / metadata server lookup）を取り込む。

### 却下理由

**Edge Runtime 互換 MAJOR / 実現性 MAJOR**。Workers 環境で動作しない / 動作させるための polyfill コストが自前実装のコストを上回る。

---

## 案 D: Workers 互換 JWT ライブラリ（`@tsndr/cloudflare-worker-jwt` / `jose`）

### 概要

Web Crypto API ベースの軽量 JWT ライブラリを導入し、JWT 署名のみ委譲。token 交換 fetch とキャッシュは自前実装。

### 利点

- JWT エンコード / 署名のバグリスクをライブラリに委譲。
- `jose` は WebCrypto と Node 双方をサポートし保守体制が安定。
- Edge Runtime 互換（4 観点 PASS）。

### 欠点

- 案 A の自前実装規模が小さく、ライブラリ導入の差分メリットが薄い（JWT 署名は <50 行）。
- `@tsndr/cloudflare-worker-jwt` は単一メンテナ依存リスク。
- `jose` は機能が多く必要部分のみ tree-shake が効くか要検証。
- token 交換ロジックは結局自前で書く必要があり、ライブラリで吸収できる範囲が限定的。

### 却下理由

**現時点では却下、将来候補として保持**。Phase 12 unassigned-task-detection.md に open question #4 として登録。自前実装が肥大化（複数 SA / DPoP / aud 切り替え等）した場合に再評価する。

---

## 比較マトリクス（再掲、main.md と同期）

| 観点 | 案 A (base) | 案 B (OAuth 2.0) | 案 C (google-auth-library) | 案 D (Workers JWT lib) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | MINOR | PASS | PASS |
| 実現性 | PASS | MAJOR | MAJOR | PASS |
| 整合性 | PASS | MINOR | PASS | PASS |
| 運用性 | PASS | MINOR | MAJOR | PASS |
| Edge Runtime 互換 | PASS | PASS | MAJOR | PASS |
| Secret hygiene | PASS | MINOR | PASS | PASS |
| 無料枠 | PASS | MINOR | PASS | PASS |
| 不変条件 #5 | PASS | MINOR | PASS | PASS |
| 採否 | 採択 | 却下 | 却下 | 却下（将来候補） |

## 結論

案 A を採択。案 B / C は MAJOR により block、案 D は base case と同等 PASS だが現時点で導入する差分メリットが薄いため将来候補として保持。Phase 4（テスト戦略）への GO を承認。
