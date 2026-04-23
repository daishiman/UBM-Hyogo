# Phase 1 出力: baseline-inventory.md
# 正本仕様とユーザー要求の棚卸し

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 1 / 13 (要件定義) |
| 作成日 | 2026-04-23 |
| 状態 | completed |

---

## 1. 現状仕様インベントリ

aiworkflow-requirements スキルおよび参照ドキュメントで定義されている正本仕様を以下に整理する。

### 1-1. アーキテクチャ構成

| 層 | コンポーネント | 技術スタック | 備考 |
| --- | --- | --- | --- |
| Web 層 | apps/web | Cloudflare Pages + Next.js App Router | SSR/SSG 両対応, Edge Runtime |
| API 層 | apps/api | Cloudflare Workers + Hono | REST エンドポイント, Edge Runtime |
| DB 層 | Cloudflare D1 | SQLite (WAL mode) | canonical DB, Workers からのみ直接アクセス |
| 入力源 | Google Sheets | Google Sheets API v4 | 外部入力源, non-canonical (D1 に同期) |
| ホスティング | Cloudflare | Pages / Workers / D1 | 全て無料枠で運用 |

### 1-2. モノレポ構成

| ディレクトリ | 役割 | 依存方向 |
| --- | --- | --- |
| packages/core | ビジネスロジック純粋関数 | 依存ゼロ (最上流) |
| packages/types | 共有型定義 | core のみ参照可 |
| packages/services | サービス層 | core / types を参照 |
| packages/infrastructure | DB・外部API アダプタ | services を実装 |
| packages/integrations | Sheets / 外部連携 | infrastructure を利用 |
| apps/web | Next.js フロントエンド | services / types を参照 |
| apps/api | Hono API サーバー | services / infrastructure を参照 |
| パッケージマネージャ | pnpm workspace | workspaces フィールドで管理 |

### 1-3. ブランチ戦略

| ブランチ | 環境 | push 権限 | PRレビュー | 備考 |
| --- | --- | --- | --- | --- |
| feature/* | ローカル開発のみ | 直接 push 禁止 | 不要 | dev への PR のみ許可 |
| dev | staging (Cloudflare staging) | PR 経由のみ | 1名 | 機能統合・動作確認 |
| main | production (Cloudflare production) | PR 経由のみ | 2名 | force push 禁止 |

### 1-4. シークレット管理

| シークレット種別 | 管理場所 | 代表的なキー名 | 理由 |
| --- | --- | --- | --- |
| ランタイムシークレット | Cloudflare Secrets | OPENAI_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL | Workers/Pages が直接利用 |
| CI/CDシークレット | GitHub Secrets | CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID | デプロイ認証専用 |
| 非機密設定値 | GitHub Variables | ドメイン名, プロジェクト名, Pages URL | 平文でも安全な値 |
| ローカル秘密情報の正本 | 1Password Environments | 全シークレットのローカルコピー | 平文 `.env` を正本にしない / repo 内 `.env*` は template / generated artifact であり canonical ではない |

### 1-5. ローカル環境ガード

Workspace-local `.env*`, `.env.local`, `.env.example`, and other dotfiles are operational artifacts only.
もし workspace 内の dotfiles がこの文書と衝突しても、1Password Environments と phase docs / skill refs を優先する。

---

## 2. ユーザー要求インベントリ

2026-04-23 のユーザー要求を以下に整理する。

| # | 要求 | 詳細 | 優先度 |
| --- | --- | --- | --- |
| R-01 | Google Sheets を入力源として使用 | Sheets からデータを取り込み D1 に保存する想定。Sheets 自体は canonical DB としない | 必須 |
| R-02 | 無料枠で運用 | Cloudflare Pages / Workers / D1 の無料枠, Google Sheets 無料を維持する | 必須 |
| R-03 | インフラ先行 | 実装コードより先にアーキテクチャ基準線を固定する。後続実装フェーズへの迷いをゼロにする | 必須 |

---

## 3. ギャップ分析

正本仕様とユーザー要求の間の矛盾・不明点を以下に整理する。

| # | 項目 | 現状 | 判定 | 対応方針 |
| --- | --- | --- | --- | --- |
| G-01 | Sheets → D1 同期タイミング | 手動/バッチ/Webhook のいずれか未定 | 要明確化 (MINOR) | 本タスクでは「D1 が canonical, Sheets は入力源」という方向性のみ固定。同期方式の詳細は 03-serial-data-source-and-storage-contract で決定 |
| G-02 | Sheets API 認証方式 | Service Account / OAuth のいずれか未定 | 要明確化 (MINOR) | 本タスクではスコープ外。03-serial-data-source-and-storage-contract で決定 |
| G-03 | D1 WAL mode の本番設定 | wrangler.toml での設定方法が未確認 | 軽微 (MINOR) | 02-serial-monorepo-runtime-foundation の wrangler.toml 設定で対応 |
| G-04 | 無料枠の上限定義 | Workers 100k req/day, D1 5GB/500k reads 等が正本に記載あり | 整合 (PASS) | 正本仕様と一致。追加確認不要 |
| G-05 | 通知基盤 | ユーザー要求に含まれていない | 整合 (PASS) | 本タスクスコープ外として明示済み |

**ギャップ総評**: 矛盾なし。G-01 / G-02 / G-03 は MINOR 扱いで下流タスクに委譲可能。本タスクのブロッカーとなるギャップはない。

---

## 4. Downstream 影響

### 4-1. Wave 1 全タスクへの影響

| 影響先タスク | 参照する成果物 | 影響内容 |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | outputs/phase-02/canonical-baseline.md | apps/web / apps/api の責務境界, pnpm workspace 構成を参照して実装スキャフォールドを作成 |
| 03-serial-data-source-and-storage-contract | outputs/phase-02/canonical-baseline.md, outputs/phase-02/decision-log.md | Sheets input / D1 canonical の判断根拠を参照してスキーマ設計・同期方式を決定 |
| Wave 1 全体 | outputs/phase-02/canonical-baseline.md | ブランチ/環境対応表, シークレット配置マトリクスをそれぞれの CI/CD 設定に反映 |

### 4-2. 参照パス一覧

| 参照先タスク | 参照ファイルパス |
| --- | --- |
| 全 Wave 1 タスク | doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md |
| data contract タスク | doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/decision-log.md |

---

## 5. 4条件初期評価

| 条件 | 評価問い | 初期判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか明確か | TBD → PASS 見込み | 開発者の「どこに何を置くか」の迷いをゼロにする。全 Wave 1 タスクの設計判断コストを削減 |
| 実現性 | 無料運用の初回スコープで成立するか | TBD → PASS 見込み | ドキュメントのみで成立。外部サービスへの依存なし。無料枠制約との矛盾なし |
| 整合性 | branch / env / runtime / data / secret が矛盾しないか | TBD → PASS 見込み | ギャップ分析で矛盾なしを確認。MINOR 3件は下流委譲で解決可能 |
| 運用性 | rollback / handoff / same-wave sync が破綻しないか | TBD → PASS 見込み | ドキュメントのみのため rollback コストはゼロ。handoff は canonical path で明示 |

**Phase 2 での確定判定に向けた観察点**:
- G-01 (Sheets 同期タイミング) が下流委譲として適切に分離されているか
- canonical-baseline.md が下流タスクから一意に参照できる形式になっているか

---

## 完了確認

- [x] 現状仕様インベントリ作成済み
- [x] ユーザー要求インベントリ作成済み
- [x] ギャップ分析完了 (矛盾なし, MINOR 3件を下流委譲)
- [x] downstream 影響の参照パス具体化済み
- [x] 4条件初期評価記載済み
- [x] Phase 2 への引き継ぎ事項明記済み

## Phase 2 への引き継ぎ

| 項目 | 内容 |
| --- | --- |
| 引き継ぎ事項 | ギャップ G-01/G-02/G-03 を MINOR として記録し、下流タスクへの委譲を decision-log.md に明記すること |
| blockers | なし |
| open questions | Sheets → D1 の同期方式の詳細 (03 タスクで決定) |
