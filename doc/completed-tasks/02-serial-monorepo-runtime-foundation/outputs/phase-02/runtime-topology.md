# Runtime Topology — apps/web / apps/api / packages 構成

> 本ファイルは downstream task（03 / 04 / 05b）の参照 ledger として機能する。
> 正本仕様: `architecture-overview-core.md`, `architecture-monorepo.md`

## アプリケーション層（apps/）

### apps/web — Cloudflare Workers（@opennextjs/cloudflare + Next.js 16）

| 項目 | 値 |
| --- | --- |
| ディレクトリ | apps/web/ |
| フレームワーク | Next.js 16.x（16.2.4 以上） |
| Cloudflare adapter | @opennextjs/cloudflare（@cloudflare/next-on-pages は廃止予定のため不採用） |
| Cloudflare ターゲット | Workers runtime（バンドルサイズ 3MB 以内） |
| 認証 | Auth.js 5.x（Google OAuth + Magic Link, AUTH_* 環境変数プレフィックス） |
| 設定ファイル | apps/web/wrangler.toml |
| Worker 名 | ubm-hyogo-web（staging: ubm-hyogo-web-staging） |
| static assets | Cloudflare Pages CDN 経由で配信（Pages Functions: 25MB 上限を fallback として使用可） |

**責務**:
- SSR / RSC によるユーザー向け画面の配信
- Auth.js を使った認証フロー
- apps/api へのデータ取得（fetch / Server Actions）
- D1 への直接アクセスは禁止（CLAUDE.md 不変条件 5 遵守）

**確認済み**: `apps/web/wrangler.toml` は `main = ".open-next/worker.js"` と `[assets] directory = ".open-next/assets"` を持つ OpenNext Workers 形式へ更新済み。`@opennextjs/cloudflare` の build / preview / deploy script は `apps/web/package.json` に定義済み。

### apps/api — Cloudflare Workers（Hono 4.12.x）

| 項目 | 値 |
| --- | --- |
| ディレクトリ | apps/api/ |
| フレームワーク | Hono 4.12.x |
| Cloudflare ターゲット | Workers runtime |
| D1 binding | binding = "DB"（prod: ubm-hyogo-db-prod, staging: ubm-hyogo-db-staging） |
| 設定ファイル | apps/api/wrangler.toml |
| Worker 名 | ubm-hyogo-api（staging: ubm-hyogo-api-staging） |
| entry point | apps/api/src/index.ts |

**責務**:
- REST API の提供（Hono ルートハンドラー）
- D1 binding による唯一のデータベースアクセス窓口
- Google Forms API 連携（連携実装は packages/integrations/ に委譲）
- Hono middleware による認証・バリデーション

---

## パッケージ層（packages/）

### packages/shared — 共有パッケージ

| サブパス | 依存許可 | 責務 |
| --- | --- | --- |
| packages/shared/core/ | なし（外部依存ゼロ） | 共通エンティティ・インターフェース |
| packages/shared/src/types/ | なし（外部依存ゼロ） | 型定義・Zodスキーマ |
| packages/shared/src/services/ | types/ のみ | ドメインロジック |
| packages/shared/infrastructure/ | core/, types/ | DB・AI・外部サービス共通処理 |
| packages/shared/ui/ | core/ のみ | UIコンポーネント（Atomic Design） |

### packages/integrations/{service}/ — 外部サービス連携パッケージ群

| 項目 | 値 |
| --- | --- |
| 依存許可 | packages/shared/core/ のみ |
| integrations 間 | 相互依存禁止 |
| 責務 | 外部 API 連携（Google Forms, Google Sheets 等）の再利用可能パッケージ化 |

---

## ブランチと環境の対応

| ブランチ | 環境 | Cloudflare | entry point |
| --- | --- | --- | --- |
| feature/* | local | wrangler dev | localhost |
| dev | staging | Workers staging | ubm-hyogo-web-staging / ubm-hyogo-api-staging |
| main | production | Workers production | ubm-hyogo-web / ubm-hyogo-api |

---

## 依存関係フロー（上位→下位）

```
apps/web ─────────────────────────────────────────────────────────────┐
apps/api ──────────────────────────────────────────────────────────────┤
         │                                                              │
         ▼                                                              ▼
packages/integrations/{service}/    packages/shared/infrastructure/
         │                                        │
         ▼                                        ▼
packages/shared/core/              packages/shared/src/types/
         │                                        │
         └─────────────── ゼロ依存 ───────────────┘
```

**逆方向の依存は禁止。packages/shared/core/ と packages/shared/src/types/ は外部依存ゼロを維持。**

---

## 参照ファイル

| 種別 | パス |
| --- | --- |
| 正本（アーキテクチャ） | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md |
| 正本（dependency rule） | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md |
| 正本（技術スタック） | .claude/skills/aiworkflow-requirements/references/technology-core.md |
| version ledger | outputs/phase-02/version-policy.md |
| bootstrap runbook | outputs/phase-05/foundation-bootstrap-runbook.md |
| dependency rules | outputs/phase-08/dependency-boundary-rules.md |
