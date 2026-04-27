# Phase 3 成果物: 設計レビュー (design-review.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 3 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. レビュー対象

| # | ファイル | レビュー観点 |
| --- | --- | --- |
| 1 | `outputs/phase-02/r2-architecture-design.md` | AC-1 / AC-2 / AC-6 / AC-8 |
| 2 | `outputs/phase-02/wrangler-toml-diff.md` | AC-2 / 不変条件 5 |
| 3 | `outputs/phase-02/token-scope-decision.md` | AC-3 / 最小権限原則 |
| 4 | `outputs/phase-02/cors-policy-design.md` | AC-5 / UT-17 連携 |

## 2. 4条件評価

| # | 観点 | 設計対象 | 判定 | 理由 |
| --- | --- | --- | --- | --- |
| 1 | 価値性 | r2-architecture-design.md | PASS | 将来のファイルアップロード実装が再設計不要で着手可能。Mermaid 図と prefix 設計が具体的 |
| 2 | 価値性 | cors-policy-design.md | PASS | Presigned URL 経由の直接アップロードに必要な AllowedMethods / Headers が AWS S3 互換 SDK で動作する範囲を網羅 |
| 3 | 実現性 | wrangler-toml-diff.md | PASS | wrangler 3.x の `[[env.<env>.r2_buckets]]` 構文が R2 をネイティブサポート |
| 4 | 実現性 | token-scope-decision.md | PASS | Cloudflare Dashboard で `Workers R2 Storage: Edit` スコープ単独 Token 作成が可能 |
| 5 | 整合性 | r2-architecture-design.md | PASS | バケット名 `ubm-hyogo-r2-{prod,staging}` が 01b 命名トポロジーに完全一致 |
| 6 | 整合性 | wrangler-toml-diff.md | PASS | apps/web 非設置（不変条件 5）が明示。バインディング名 `R2_BUCKET` 統一 |
| 7 | 整合性 | cors-policy-design.md | MINOR | UT-16 完了前の暫定 origin がプレースホルダ表現。完了後の再設定経路は明示済 → MINOR で許容、Phase 12 申し送り |
| 8 | 運用性 | token-scope-decision.md | PASS | rotation 90 日 / rollback 手順が記載 / 用途別 Token 分離 |
| 9 | 運用性 | r2-architecture-design.md（モニタリング章） | MINOR | UT-17 未着手のため通知経路は将来宿題。代替（月次手動確認）は記載済 → MINOR で許容、Phase 12 申し送り |

**判定凡例:** PASS / MINOR / MAJOR / BLOCKER

## 3. 代替案の検討と採否

| 代替案 | 内容 | メリット | デメリット | 採否 |
| --- | --- | --- | --- | --- |
| A: 環境別 2 バケット | `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` | 環境影響を完全分離・01b と整合 | 管理対象 2 個 | **採用** |
| B: 1 バケット + prefix 分離 | `ubm-hyogo-r2` 配下 `prod/` `staging/` | 管理 1 個 | 環境間影響リスク・CORS 複雑化 | 不採用 |
| C: Token 既存拡張 | 既存 Token に R2:Edit 追加 | 設定コスト最小 | 最小権限違反・rotation 影響大 | 不採用 |
| D: Token 専用作成 | R2 専用 Token 新規 | 最小権限・rotation 容易 | GitHub Secrets 追加 | **採用** |
| E: Public Bucket 全公開 | 全公開 | URL 直配信容易 | プライベート資産漏洩リスク | 不採用 |
| F: プライベート + Presigned URL | プライベートデフォルト | セキュリティ担保 | URL 発行ロジック必要（実装は別タスク） | **採用** |
| G: Cloudflare Analytics 直視のみ | UT-16 不使用 | 設定不要 | 自動通知なし | 暫定採用（UT-17 着手まで） |

## 4. AC 対応表

| AC | Phase 2 設計成果物 | 充足見込み |
| --- | --- | --- |
| AC-1 | r2-architecture-design.md / wrangler-toml-diff.md | PASS |
| AC-2 | wrangler-toml-diff.md | PASS |
| AC-3 | token-scope-decision.md | PASS |
| AC-4 | （Phase 11 担当 / Phase 5 runbook で手順定義） | 見込み PASS（Phase 11 で確定） |
| AC-5 | cors-policy-design.md | MINOR（UT-16 完了後の origin 差し替え必要） |
| AC-6 | r2-architecture-design.md（モニタリング章） | MINOR（UT-17 着手まで手動運用） |
| AC-7 | （Phase 5 binding-name-registry.md で生成） | 見込み PASS |
| AC-8 | r2-architecture-design.md（アクセス方針章） | PASS |

## 5. 機密情報の直書きチェック

- 全 4 ファイルを `Cloudflare Account ID` / 実 Token / 実本番ドメインで grep 想定
- `<staging-origin>` / `<production-origin>` / `<env-specific-origin>` プレースホルダのみ使用
- 結果: 全ファイル PASS

## 6. レビュー総括

- BLOCKER: 0 件
- MAJOR: 0 件
- MINOR: 2 件（AC-5 暫定 origin / AC-6 UT-17 未着手）
- PASS: 7 件

MINOR 2 件は以下の Phase 12 implementation-guide への申し送りで許容する:
- M-1: AllowedOrigins 暫定値 → UT-16 完了後に差し替え手順を記載
- M-2: UT-17 未着手 → 月次手動確認手順を記載

## 7. Phase 4 進行可否

詳細は `review-decision.md` 参照。

判定: **GO（条件付き）**: MINOR 2 件を Phase 12 申し送りリストに登録した上で Phase 4 へ進む。

## 8. 完了条件チェック

- [x] Phase 2 設計成果物 4 点のレビュー完了
- [x] 代替案の検討記録（A〜G）
- [x] 4条件すべてに判定付与（PASS/MINOR/MAJOR/BLOCKER）
- [x] AC-1〜AC-8 と Phase 2 設計の対応表作成
- [x] Phase 4 進行可否文書化
- [x] MAJOR / BLOCKER なし
