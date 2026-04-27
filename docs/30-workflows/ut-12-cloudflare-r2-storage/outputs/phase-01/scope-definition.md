# Phase 1 成果物: スコープ定義 (scope-definition.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 1 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. スコープ境界の方針

UT-12 は spec_created の docs-only タスクであるため、スコープは「将来のファイルアップロード実装タスクが Phase 5 runbook を再生して環境を構築できる仕様の整備」に限定する。実バケット・実 Token・実 origin 値はすべて将来タスクで生成し、本タスクの成果物には記載しない。

## 2. 含む（IN-SCOPE）

| # | 項目 | 担当 Phase |
| --- | --- | --- |
| IN-1 | R2 バケット 2 個（production / staging）の命名と作成 runbook | Phase 2, Phase 5 |
| IN-2 | `apps/api/wrangler.toml` への `[[r2_buckets]]` 追記差分（バインディング名 `R2_BUCKET`） | Phase 2, Phase 5, Phase 8 |
| IN-3 | API Token 採用案（案D: 専用 Token 新規作成）と GitHub Secrets 名 | Phase 2, Phase 5 |
| IN-4 | CORS ポリシー JSON 設計（環境別 AllowedOrigins / 共通 Methods・Headers） | Phase 2, Phase 5, Phase 8 |
| IN-5 | パブリック/プライベート選択基準（採用案F: プライベート + Presigned URL） | Phase 2, Phase 5 |
| IN-6 | 無料枠モニタリング方針（80% 閾値・UT-17 連携経路） | Phase 2, Phase 5 |
| IN-7 | binding-name-registry.md による下流公開 | Phase 5 |
| IN-8 | 異常系テスト計画 (FC-01〜FC-06) と mitigation | Phase 6 |
| IN-9 | DRY 化サンプル（Before/After） | Phase 8 |
| IN-10 | 品質保証 / 最終レビュー / 手動 smoke test 手順 | Phase 9-11 |
| IN-11 | implementation-guide / system-spec 同期 | Phase 12 |
| IN-12 | PR 作成準備（Phase 13） | Phase 13 |

## 3. 含まない（OUT-OF-SCOPE）

| # | 項目 | 委譲先 |
| --- | --- | --- |
| OUT-1 | ファイルアップロード API 実装 (`apps/api/src/routes/uploads/...`) | future-file-upload-implementation |
| OUT-2 | Presigned URL 発行ロジック (`@aws-sdk/s3-request-presigner` 等) | future-file-upload-implementation |
| OUT-3 | フロントエンド アップロード UI (`apps/web/...`) | future-file-upload-implementation |
| OUT-4 | CDN / Cache Rules / Transform Rules | 別タスク（必要時起票） |
| OUT-5 | 画像リサイズ・WebP 変換 | アプリケーション層タスク |
| OUT-6 | カスタムドメイン適用 (R2 Public Bucket Domain) | UT-16 |
| OUT-7 | 監視アラート通知実装 (Slack / メール) | UT-16 |
| OUT-8 | 実 Cloudflare Account ID / 実 API Token 値 / 実本番ドメインの記録 | 1Password / Cloudflare Secrets / GitHub Secrets |
| OUT-9 | 実バケット作成・実 CORS 適用・実 smoke test 実行 | future-file-upload-implementation Phase 5 再生 |
| OUT-10 | GAS prototype 由来のファイル管理ロジック移植 | 不採用（CLAUDE.md 不変条件 6） |

## 4. 不変条件との対応

| 不変条件 | 本タスクでの維持方法 |
| --- | --- |
| 不変条件 5: D1/R2 直接アクセスは `apps/api` のみ | `apps/web/wrangler.toml` には R2 バインディングを追加しない。Phase 2 / 5 / 8 全てで明文化 |
| 不変条件 6: GAS prototype を本番仕様に昇格させない | GAS prototype のファイル添付ロジックを参照しない |
| シークレット直書き禁止 | Account ID / Token 値 / 実 origin は全成果物でプレースホルダ化 |

## 5. 下流タスクへのハンドオフ

| 下流タスク | 受け取る成果物 | 利用目的 |
| --- | --- | --- |
| future-file-upload-implementation | Phase 5 runbook / binding-name-registry.md / dry-applied-diff.md | 実環境構築・実装着手 |
| UT-16 (custom-domain) | cors-policy-design.md / r2-architecture-design.md（アクセス方針） | AllowedOrigins 再設定 / Public Bucket 切替検討 |
| UT-17 (Cloudflare Analytics alerts) | r2-architecture-design.md（モニタリング章） | 閾値・通知経路の実装 |

## 6. スコープ外との境界線テスト

以下のいずれかを行った場合はスコープ逸脱と判定し Phase 3 でブロックする。

- `apps/api/src/` 配下の TypeScript ファイルを編集する
- `apps/api/wrangler.toml` を実ファイル編集する（差分は docs に留める）
- 実 Cloudflare Dashboard でバケット / Token を作成する
- 実 origin 値を成果物に記録する
- GAS prototype のファイル管理ロジックを参照する

## 7. 完了条件

- [x] IN-SCOPE / OUT-OF-SCOPE が明確に分離されている
- [x] 各項目が担当 Phase または委譲先タスクに紐付けられている
- [x] 不変条件 5 / 6 / シークレット直書き禁止が維持されている
- [x] 下流タスクへのハンドオフ経路が明示されている
