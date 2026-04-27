# Phase 5 成果物: バインディング名レジストリ (binding-name-registry.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 / Cloudflare R2 ストレージ設定 |
| Phase | 5 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 用途 | **下流タスク向けの正本レジストリ**（future-file-upload-implementation / UT-16 / UT-16 から参照） |

## 1. 本書の位置づけ

UT-12 で確定した R2 関連識別子（バケット名・バインディング名・Token・CORS・アクセス方針）を**下流タスクが参照する単一の正本**として固定する。下流タスクはここに記載された値以外を使用しないこと。

## 2. バケット名（環境別）

| 環境 | バケット名 | 用途 |
| --- | --- | --- |
| staging | `ubm-hyogo-r2-staging` | dev/preview 検証 |
| production | `ubm-hyogo-r2-prod` | 本番 |

## 3. Workers バインディング

| バインディング名 | 設置先 | 設置禁止 | 全環境共通 |
| --- | --- | --- | --- |
| `R2_BUCKET` | `apps/api/wrangler.toml` の `[env.staging]` / `[env.production]` | `apps/web/wrangler.toml`（不変条件 5） | YES |

ランタイム参照（apps/api 内 / TypeScript Bindings 型定義例）:

```ts
type Env = {
  R2_BUCKET: R2Bucket;
  // 既存 D1 / KV 等
};
```

## 4. アクセス可能アプリ

- `apps/api`（Cloudflare Workers + Hono）: 唯一の R2 アクセス経路
- `apps/web`（Cloudflare Workers + Next.js）: **R2 直接アクセス禁止** / API 経由のみ

> 不変条件 5: D1/R2 直接アクセスは `apps/api` に閉じる。

## 5. CORS AllowedOrigins（環境別）

| 環境 | 暫定値（プレースホルダ） | UT-16 完了後の確定値 |
| --- | --- | --- |
| local 開発 | `http://localhost:3000` | 変更なし |
| staging | `<staging-origin>` | `https://staging.<custom-domain>` |
| production | `<production-origin>` | `https://<custom-domain>` |

> 実値は本書に記録しない。Phase 12 implementation-guide の「UT-16 完了後の CORS 再設定」手順を参照。

CORS JSON フル仕様: `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-02/cors-policy-design.md`

## 6. API Token

| 項目 | 値 |
| --- | --- |
| Token 名（Cloudflare） | `ubm-hyogo-r2-token` |
| 権限 | Account > Workers R2 Storage: Edit のみ |
| GitHub Secrets キー名 | `CLOUDFLARE_R2_TOKEN` |
| Cloudflare Secrets 登録 | 不要（バインディング経由でアクセスのため） |
| Rotation 周期 | 90 日 |

> Token 値は GitHub Secrets / 1Password Environments のみで管理。本書には**絶対に記載しない**。

## 7. アクセス方針

- デフォルト: **プライベート**（採用案F: プライベート + Presigned URL）
- 公開: 当面なし。UT-16 完了後に `public/` prefix のみ Public Bucket Domain で検討
- Presigned URL 発行: `apps/api` 経由のみ

## 8. バケット内 prefix 規約

| prefix | 用途 | 公開可否 |
| --- | --- | --- |
| `members/{member-id}/` | 会員添付ファイル | プライベート |
| `uploads/tmp/` | 一時アップロード | プライベート（24h Lifecycle 将来予定） |
| `public/` | 公開資産（UT-16 完了後） | 将来公開 |
| `events/{event-id}/` | イベント関連 | プライベート |

## 9. 無料枠閾値（モニタリング）

| メトリクス | 上限 | 80% 閾値 |
| --- | --- | --- |
| Storage | 10 GB | 8 GB |
| Class A 操作 | 1,000 万 / 月 | 800 万 / 月 |
| Class B 操作 | 1 億 / 月 | 8,000 万 / 月 |

通知経路は UT-17 着手後に Slack / Email Webhook を実装。

## 10. 下流タスクの参照経路

| 下流タスク | 参照キー |
| --- | --- |
| future-file-upload-implementation | バケット名 / `R2_BUCKET` / GitHub Secrets キー / prefix 規約 / Presigned URL 方針 |
| UT-16 (custom-domain) | CORS AllowedOrigins / Public Bucket Domain 検討箇所 |
| UT-17 (Cloudflare Analytics alerts) | 無料枠閾値（80%）/ メトリクス一覧 |

## 11. 値の変更ルール

本書の値を変更する場合:

1. UT-12 の Phase 12 system-spec-update-summary.md に変更履歴を追記
2. 該当 Phase 仕様書（特に Phase 2, 5）を更新
3. 関連下流タスクへ通知（GitHub Issue で言及）

## 12. AC との対応

- AC-7: バケット名・バインディング名の下流向け公開 → **本書で完全充足**

## 13. 完了条件チェック

- [x] バケット名 / バインディング名 / Token / CORS / アクセス方針 / prefix / 閾値 が一覧化
- [x] apps/web 非対象が明記（不変条件 5）
- [x] 機密情報の直書きなし（Token 値・実 origin はプレースホルダ）
- [x] 下流タスクの参照経路が明示
- [x] 値変更時のルールが記載
