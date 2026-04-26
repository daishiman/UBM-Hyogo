# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 名称 | 設定 DRY 化 |
| タスク | UT-03 Sheets API 認証方式設定 |
| 状態 | completed |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| GitHub Issue | #5 |

---

## 目的

認証モジュールの重複排除と再利用性向上を計画する。
各 Cloudflare Workers（`apps/api` 等）が個別に認証処理を実装するのではなく、
`packages/integrations/src/sheets-auth.ts` を共通モジュールとして利用することで、
メンテナンスコストの低減と一貫した認証動作を実現する。

---

## 実行タスク

### 8-1. Before/After 比較分析

#### Before（DRY 化前）

各 Worker が個別に認証処理を保持している状態。

```
apps/
  api/
    src/
      routes/
        sync.ts      ← JWT生成ロジックを直書き
        members.ts   ← 同じJWT生成ロジックが重複
        debug.ts     ← 同じJWT生成ロジックが3箇所目
```

問題点:
- JWT 生成・トークン取得の実装が複数箇所に存在する
- トークンの TTL キャッシュがルートファイル単位になり、キャッシュ効率が悪い
- 認証ロジックの変更時に全箇所を修正する必要がある
- テストが書きにくい（各ファイルに認証ロジックが混在）

#### After（DRY 化後）

```
packages/
  integrations/
    src/
      sheets-auth.ts   ← 唯一の認証モジュール（Single Source of Truth）
      index.ts         ← re-export
    package.json

apps/
  api/
    src/
      routes/
        sync.ts      ← import { getAccessToken } from '@ubm-hyogo/integrations'
        members.ts   ← 同上
        debug.ts     ← 同上
```

利点:
- 認証ロジックの変更が `sheets-auth.ts` 1ファイルの修正で完結する
- モジュールスコープのキャッシュが全ルート間で共有される（TTL キャッシュの効率向上）
- ユニットテストを `packages/integrations` に集約できる
- `apps/web` や将来追加される Worker でも同一モジュールを利用できる

---

### 8-2. 型定義・インターフェースの集約計画

以下の型・インターフェースを `packages/integrations/src/sheets-auth.ts`（または `types.ts`）に集約する。

```typescript
// packages/integrations/src/types.ts（または sheets-auth.ts 内に定義）

/**
 * Cloudflare Workers の env バインディングのうち、
 * Sheets 認証に必要な最小限の型定義
 */
export interface SheetsAuthEnv {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
}

/**
 * Service Account JSON key の構造
 */
export interface ServiceAccountKey {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;         // PEM 形式の RSA 秘密鍵
  client_email: string;        // service account のメールアドレス
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * トークンキャッシュのエントリ
 */
export interface TokenCacheEntry {
  token: string;
  expiresAt: number;           // Unix timestamp（秒）
}

/**
 * getAccessToken の返り値
 */
export type AccessToken = string;
```

---

### 8-3. 公開 API 設計（`packages/integrations/src/index.ts`）

```typescript
// packages/integrations/src/index.ts

export { getAccessToken } from './sheets-auth';
export type { SheetsAuthEnv, ServiceAccountKey, TokenCacheEntry, AccessToken } from './types';
```

呼び出し側での使用例:
```typescript
// apps/api/src/routes/sync.ts
import { getAccessToken, type SheetsAuthEnv } from '@ubm-hyogo/integrations';

export async function handleSync(env: SheetsAuthEnv) {
  const token = await getAccessToken(env);
  // token を使って Sheets API v4 を呼び出す
}
```

---

### 8-4. `packages/integrations/package.json` 設計方針

| 項目 | 値 |
| --- | --- |
| name | `@ubm-hyogo/integrations` |
| main | `dist/index.js` または `src/index.ts`（tsconfig paths で解決）|
| types | `dist/index.d.ts` |
| ランタイム | Edge Runtime 対応（Node.js built-ins 不使用）|
| 依存パッケージ | なし（Web Crypto API はグローバルで利用可能）|

---

### 8-5. DRY 化リファクタリング計画（段階的移行）

| ステップ | 内容 | 完了目安 |
| --- | --- | --- |
| Step 1 | `packages/integrations/src/sheets-auth.ts` に実装を集約 | Phase 5 完了後 |
| Step 2 | `apps/api` の既存認証コードを `@ubm-hyogo/integrations` に差し替え | Phase 8 |
| Step 3 | 既存認証コードの削除と不要 import の除去 | Phase 8 |
| Step 4 | `pnpm typecheck` と `pnpm lint` でエラーがないことを確認 | Phase 9 / 10 |

---

### 8-6. キャッシュ戦略の DRY 化

**問題**: モジュールスコープのキャッシュは Cloudflare Workers の V8 isolate ごとに独立する。
つまり、リクエストが異なる isolate に振り分けられると、キャッシュが共有されない。

**対策**: TTL キャッシュはモジュールスコープで保持し「ベストエフォート」のキャッシュとして機能させる。
完全なキャッシュ共有が必要な場合は KV または Cache API を使用することを検討するが、
無料枠制約内では TTL キャッシュで十分とする（トークン取得は1回数十msで許容範囲）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/ut-03-sheets-api-auth/phase-05.md | sheets-auth.ts 実装仕様 |
| 必須 | CLAUDE.md | D1 への直接アクセス禁止ルール（同様の設計原則） |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Web Crypto API |
| 参考 | https://pnpm.io/workspaces | pnpm workspace 設定 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/dry-refactor-plan.md | DRY 化リファクタリング計画書 |

---


## 統合テスト連携（Phase 1〜11は必須）

- 対象コマンド: `pnpm --filter @ubm-hyogo/integrations test:run`
- 連携対象: `packages/integrations/src/sheets-auth.ts` と Sheets API 認証境界
- 記録先: `outputs/phase-08/` 配下の Phase 成果物
- 依存確認: Phase 4 以降で `pnpm install` と `pnpm --filter @repo/shared build` の必要性を再確認する

## 完了条件

- [ ] Before/After の比較分析が `outputs/phase-08/dry-refactor-plan.md` に記録されている
- [ ] `packages/integrations` の公開 API 設計（型定義・エクスポート）が定義されている
- [ ] `@ubm-hyogo/integrations` として `apps/api` から利用するインターフェースが決定されている
- [ ] TTL キャッシュの Cloudflare isolate 分離に関する考察が文書化されている
- [ ] DRY 化の段階的移行計画（Step 1〜4）が記録されている

---


## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-08 を completed に更新

## 次 Phase

Phase 09 — 品質保証（セキュリティ・無料枠・シークレット衛生の確認）に進む。

DRY 化の設計が固まったら、セキュリティ観点での最終チェックを行い、
本番環境での運用可能性を保証する。
