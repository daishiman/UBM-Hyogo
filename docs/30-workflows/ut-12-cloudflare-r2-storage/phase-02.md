# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-27 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only） |

## 目的

Phase 1 で確定した AC・スコープ・4条件評価を入力として、R2 バケットアーキテクチャ・wrangler.toml バインディング・API Token スコープ判断・CORS ポリシー・無料枠モニタリング方針を設計する。設計成果物は Phase 3 のレビュー対象、Phase 5 のセットアップ実行根拠となる。

## 実行タスク

- R2 バケットアーキテクチャを設計する（production / staging 分離）
- wrangler.toml バインディング設計（環境別セクション差分）を行う
- API Token スコープ判断（既存 Token 拡張 vs 専用 Token 新規作成）を行う
- CORS ポリシー JSON を設計する（AllowedOrigins / Methods / Headers）
- パブリック / プライベートアクセス選択基準を設計する
- 無料枠モニタリング方針を設計し UT-17 連携ポイントを明示する
- カスタムドメイン (UT-16) との将来連携設計を記載する
- 既存コンポーネント再利用可否を判定する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/phase-01.md | Phase 1 の AC・スコープ・4条件評価 |
| 必須 | docs/30-workflows/ut-12-cloudflare-r2-storage/index.md | タスク概要・依存関係 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers バインディング / wrangler 設定例 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/token-scope-matrix.md | API Token スコープ正本 |
| 必須 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | 命名トポロジー |
| 参考 | https://developers.cloudflare.com/r2/buckets/cors/ | R2 CORS 公式仕様 |
| 参考 | https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ | Workers R2 API |

## 実行手順

### ステップ 1: R2 バケットアーキテクチャ設計

- production / staging 2 バケットを設計（命名は 01b トポロジーに整合）
- バケット単位の責務（メンバー添付ファイル / 一時アップロード / 画像配信）を定義
- バケット内 prefix 設計（`uploads/` / `members/` / `tmp/` 等）の方針を整理
- Mermaid 図でバケット構成・Workers 経由のアクセスフローを図示

### ステップ 2: wrangler.toml バインディング差分設計

- `apps/api/wrangler.toml` の `[env.production]` / `[env.staging]` セクションに `[[r2_buckets]]` を追記する差分を設計
- バインディング名（例: `R2_BUCKET`）を確定（apps/web からは利用しない方針を明記）
- staging / production 別バケット名を別差分として明記
- wrangler.toml diff サンプルを `outputs/phase-02/wrangler-toml-diff.md` に格納する想定で設計

### ステップ 3: API Token スコープ判断

- 案A: 既存 API Token に R2:Edit スコープを追加
- 案B: R2 専用 Token を新規作成（既存 Token を Workers/D1 用と分離）
- 最小権限原則・rotation 容易性・障害影響範囲の観点から比較
- 採用案を確定し token-scope-decision.md として記録する設計

### ステップ 4: CORS ポリシー設計

- AllowedOrigins: localhost 開発 / staging / production の 3 値を環境別に列挙
- AllowedMethods: PUT / POST / GET / HEAD（Presigned URL 直アップロード前提）
- AllowedHeaders: Content-Type / Content-Length / Authorization / x-amz-* など
- ExposeHeaders / MaxAgeSeconds の方針
- UT-16 (カスタムドメイン) 完了後の AllowedOrigins 再設定ルールを明文化

### ステップ 5: アクセス方針・モニタリング・将来連携

- パブリック / プライベートアクセス選択基準（公開画像 = パブリック、添付ファイル = プライベート + Presigned URL）
- 無料枠監視: Class A / Class B / Storage の 3 メトリクスについて閾値と通知経路を整理
- UT-17 (Cloudflare Analytics alerts) との連携ポイントを Phase 5 / Phase 12 にハンドオフ
- UT-16 完了後の R2.dev カスタムドメイン適用見据えた設計（CORS / Public Bucket 切替）

### ステップ 6: 既存コンポーネント再利用可否

- [FB-SDK-07-1] のフィードバックを参照し、R2 SDK ラッパー / Presigned URL 発行ヘルパーの既存実装可否を確認
- 既存実装が無いことを再確認し、本タスクは「設定のみ」「実装は別タスク」境界を維持

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 本 Phase の全成果物を設計レビューの入力に渡す |
| Phase 4 | wrangler.toml diff・CORS JSON を verify suite の対象として登録 |
| Phase 5 | バケット作成手順・wrangler 反映手順・CORS 適用手順の根拠 |
| Phase 6 | CORS 異常系（不許可 origin / method）の検証根拠 |
| Phase 11 | smoke test シナリオの設計根拠（PUT / GET / DELETE） |

## 多角的チェック観点（AIが判断）

- 価値性: 設計が将来のファイルアップロード実装で再設計を強いない粒度か
- 実現性: 無料枠を超えない構成（Class B 対策 / 公開画像のキャッシュ前提）になっているか
- 整合性: 01b 命名トポロジー・04 secret 経路・UT-16 / UT-16 のフックポイントと矛盾しないか
- 運用性: Token rotation / CORS 再設定 / バケット rollback の運用手順が設計に含まれるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | R2 バケットアーキテクチャ設計 | 2 | pending | production / staging 分離 |
| 2 | wrangler.toml diff 設計 | 2 | pending | apps/api 限定（apps/web は対象外） |
| 3 | API Token スコープ判断 | 2 | pending | 既存拡張 vs 専用 Token |
| 4 | CORS ポリシー設計 | 2 | pending | AllowedOrigins 環境別 |
| 5 | アクセス方針（公開 / 非公開）設計 | 2 | pending | UT-17 連携前提 |
| 6 | 無料枠モニタリング方針設計 | 2 | pending | UT-17 連携 |
| 7 | 既存コンポーネント再利用可否確認 | 2 | pending | [FB-SDK-07-1] 参照 |
| 8 | Mermaid 図 / 差分サンプル整備 | 2 | pending | レビュー入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/r2-architecture-design.md | R2 バケット構成・バインディング設計（Mermaid 含む） |
| ドキュメント | outputs/phase-02/cors-policy-design.md | CORS ポリシー JSON 設計と環境別 AllowedOrigins |
| ドキュメント | outputs/phase-02/token-scope-decision.md | 既存拡張 vs 専用 Token の比較と採用判断 |
| ドキュメント | outputs/phase-02/wrangler-toml-diff.md | wrangler.toml への追記差分サンプル |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

> 上記成果物の実体ファイルは Phase 2 実行時に作成する。本 phase 仕様書では作成しない。

## 完了条件

- R2 バケットアーキテクチャ設計が完成（Mermaid 図含む）
- wrangler.toml diff サンプルが production / staging 両環境分作成済み
- API Token スコープ判断が記録され採用案が明示されている
- CORS ポリシー JSON が環境別 AllowedOrigins を含めて設計済み
- パブリック / プライベート選択基準が設計済み
- 無料枠モニタリング方針が UT-17 連携ポイントを含めて記載済み
- UT-17 連携の将来設計が記載済み
- 既存コンポーネント再利用可否の判定が完了

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（CORS 不許可 origin / Token 失効 / 無料枠超過）の設計考慮を確認
- 機密情報（Account ID / Token 値）が成果物に直書きされていないこと
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: アーキテクチャ図 / wrangler.toml diff / Token 判断 / CORS JSON / モニタリング方針を Phase 3 へ
- ブロック条件: 4 つの成果物のいずれかが未作成 / 機密情報直書きが残っている場合は次 Phase に進まない

## 設計トピック詳細

### R2 バケット構成（参考設計）

| 項目 | production | staging |
| --- | --- | --- |
| バケット名 | `ubm-hyogo-r2-prod` | `ubm-hyogo-r2-staging` |
| Workers バインディング名 | `R2_BUCKET` | `R2_BUCKET`（環境別バケット名でルーティング） |
| アクセス方針 | プライベート基本 + 必要時公開 prefix | プライベート全体（検証用） |
| カスタムドメイン (UT-16) | 完了後に検討 | 未対応 |

### wrangler.toml 差分（設計サンプル想定）

- `apps/api/wrangler.toml` の `[env.production]` / `[env.staging]` セクションに `[[r2_buckets]]` を追加
- `binding`・`bucket_name` を環境別に指定
- `apps/web/wrangler.toml` には追加しない（不変条件 5: D1/R2 直接アクセスは apps/api に閉じる）

### API Token スコープ判断比較表

| 観点 | 案A: 既存 Token に R2:Edit 追加 | 案B: 専用 R2 Token 新規作成 |
| --- | --- | --- |
| 設定コスト | 低（既存 Token 編集のみ） | 中（GitHub Secrets 追加・rotation 設計） |
| 最小権限 | 弱（権限肥大） | 強（用途分離） |
| 障害影響範囲 | 大（1 Token 失効で全停止） | 小（用途別停止） |
| Rotation | 全用途同時 | 用途別ローテーション可 |
| 採用候補 | - | 推奨（最小権限原則） |

### CORS ポリシー設計（環境別 AllowedOrigins）

| 環境 | AllowedOrigins（例） | 備考 |
| --- | --- | --- |
| local 開発 | `http://localhost:3000` | 開発時のみ staging バケットへ許可 |
| staging | `https://staging.<domain>` | UT-16 確定後に正式値へ更新 |
| production | `https://<production-domain>` | UT-16 完了後に AllowedOrigins 再設定 |

### 無料枠モニタリング方針

| メトリクス | 閾値（例） | 通知経路 (UT-16) |
| --- | --- | --- |
| Storage | 8GB / 10GB の 80% | UT-17 のアラート経路 |
| Class A ops | 800万 / 1,000万 / 月 | UT-17 のアラート経路 |
| Class B ops | 8,000万 / 1億 / 月 | UT-17 のアラート経路 |

### dependency matrix

| タスク | 種別 | 依存内容 | Phase |
| --- | --- | --- | --- |
| 01b-parallel-cloudflare-base-bootstrap | 上流 | Account ID / 命名トポロジー / Token 母体 | 本 Phase 開始前に必要 |
| 04-serial-cicd-secrets-and-environment-sync | 上流 | Secrets / Variables 経路 | Phase 5 着手前に必要 |
| future-file-upload-implementation | 下流 | 本 Phase の設計を実装の前提とする | 本 Phase 完了後 |
| UT-16 (custom-domain) | 関連 | CORS AllowedOrigins 再設定 | UT-16 完了後 |
| UT-17 (Cloudflare Analytics alerts) | 関連 | 無料枠閾値の通知経路 | 並行検討 |

## レビューポイント / リスク

- 機密値（Account ID / 実 Token）を成果物に直書きしないこと（参照経路のみ記載）
- apps/web に R2 バインディングを追加しない設計境界の維持（不変条件 5）
- CORS 設計が UT-16 完了後に再設定必須となる旨を Phase 12 の implementation-guide にも反映する申し送り
- Class B ops の急増リスク（画像配信用途）に対し、キャッシュ前提が UT-16 と整合するか

## 次フェーズへの引き渡し

- Phase 3 への入力: 4 つの設計成果物 + Mermaid 図 + dependency matrix + 比較表
- Phase 3 で確認すべき判定ポイント: 4条件評価 (価値性 / 実現性 / 整合性 / 運用性) と MINOR/MAJOR/BLOCKER 区分
- 未解決の open question は `outputs/phase-02/r2-architecture-design.md` の最下部に明記
