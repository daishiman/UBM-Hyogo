# トピックマップ

> 生成コマンド: node scripts/generate-index.js

このファイルはreferences/配下の仕様をトピック別に整理したインデックスです。
**新規ファイルはprefixに基づいて自動分類されます。**

---

## 検索方法

### コマンド検索
```bash
node scripts/search-spec.js "<キーワード>"
node scripts/search-spec.js "認証" -C 5
```

### トピック一覧
```bash
node scripts/list-specs.js --topics
```

---

## 概要・品質

**関連キーワード**: 目的, スコープ, 設計原則, 品質, TDD, 用語

### references/glossary.md

| セクション | 行 |
|------------|----|
| システム用語 | L8 |
| アーキテクチャ用語 | L18 |
| パッケージ/ディレクトリ | L29 |
| インターフェース用語 | L40 |
| UI/デザイン用語 | L51 |
| テスト用語 | L65 |
| データベース用語 | L76 |
| 認証・認可用語 | L95 |
| エラーハンドリング用語 | L106 |
| インフラ用語 | L118 |
| AI 用語 | L137 |
| RAG 用語 | L147 |
| 参考資料 (References) | L239 |
| 関連ドキュメント | L293 |

### references/master-design.md

| セクション | 行 |
|------------|----|
| 目次 | L8 |
| クイックリファレンス | L81 |
| ドキュメント管理 | L175 |
| UX言語辞書 | L189 |
| 関連リソース | L224 |

### references/overview.md

| セクション | 行 |
|------------|----|
| システムの目的 | L8 |
| 設計の核心概念 | L35 |
| 対象ユーザー | L68 |
| スコープ定義 | L79 |
| アーキテクチャ原則 | L110 |
| 成功基準 | L142 |
| 関連ドキュメント | L163 |

### references/quality-requirements.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L14 |
| 関連ドキュメント | L19 |
| IPC契約ドリフト自動検出（UT-TASK06-007） | L23 |

---

## アーキテクチャ

**関連キーワード**: モノレポ, レイヤー, Clean Architecture, RAG, Knowledge Graph

### references/architecture-admin-api-client.md

| セクション | 行 |
|------------|----|
| 1. 構成図 | L15 |
| 2. Server-side fetch（`apps/web/src/lib/admin/server-fetch.ts`） | L49 |
| 3. Client-side mutation（`apps/web/src/lib/admin/api.ts`） | L109 |
| 4. BFF proxy（`apps/web/app/api/admin/[...path]/route.ts`） | L176 |
| 5. ステータスコード処理方針 | L233 |
| 6. 環境変数 | L265 |
| 7. 不変条件サマリ（admin API client / proxy） | L278 |
| 8. 関連ドキュメント | L290 |

### references/architecture-auth-security-core.md

| セクション | 行 |
|------------|----|
| セッション自動リフレッシュ（TASK-AUTH-SESSION-REFRESH-001） | L6 |
| OAuth ログインフローの state ownership（TASK-FIX-AUTH-IPC-001） | L73 |
| 認証アーキテクチャ（Supabase + Electron） | L93 |
| セキュリティアーキテクチャ | L260 |
| RAGパイプラインアーキテクチャ | L299 |

### references/architecture-auth-security-details.md

| セクション | 行 |
|------------|----|
| 実装時の苦戦した箇所・知見 | L6 |

### references/architecture-auth-security-history.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L6 |
| 完了タスク | L20 |
| 関連ドキュメント | L142 |

### references/architecture-auth-security.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/architecture-chat-history.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| レイヤー構成 | L17 |
| 依存関係ルール | L32 |
| ディレクトリ構成 | L45 |
| UI Layer | L100 |
| Domain Layer | L160 |
| Application Layer | L245 |
| Infrastructure Layer | L265 |
| エラーハンドリング | L318 |
| ビジネスルール | L339 |
| 品質指標 | L350 |
| 設計原則 | L364 |
| 関連ドキュメント | L385 |
| 完了タスク | L395 |
| 変更履歴 | L427 |

### references/architecture-database.md

| セクション | 行 |
|------------|----|
| データベース設計原則 | L8 |
| workflowsテーブル設計 | L49 |
| ベクトル検索設計（将来拡張） | L99 |

### references/architecture-embedding-pipeline.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 主要コンポーネント | L25 |
| チャンキング戦略 | L37 |
| 埋め込みプロバイダー | L56 |
| 信頼性機能 | L70 |
| パフォーマンス最適化 | L98 |
| 品質メトリクス | L125 |
| 関連ドキュメント | L153 |
| 変更履歴 | L161 |

### references/architecture-file-conversion.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 概要 | L17 |
| 主要コンポーネント | L24 |
| ログ記録サービス（ConversionLogger） | L36 |
| 履歴管理サービス（HistoryService） | L86 |
| Electron統合（history-service-db-integration） | L137 |
| アーキテクチャパターン | L229 |
| 実装済みコンバーター | L239 |
| 品質指標 | L277 |
| 新規コンバーター追加手順 | L286 |
| コンバーター優先度ガイドライン | L296 |
| パフォーマンス要件 | L305 |
| 既知の制限事項 | L315 |
| 技術的負債 | L324 |
| 将来の拡張ポイント | L333 |
| 関連ドキュメント | L354 |

### references/architecture-implementation-patterns-advanced.md

| セクション | 行 |
|------------|----|
| デスクトップ（Electron）実装パターン | L6 |
| パフォーマンス最適化パターン | L121 |
| セキュリティ実装パターン | L159 |

### references/architecture-implementation-patterns-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| フロントエンド実装パターン | L12 |
| バックエンド実装パターン | L368 |
| 続き | L457 |

### references/architecture-implementation-patterns-details.md

| セクション | 行 |
|------------|----|
| デスクトップ（Electron）実装パターン | L6 |

### references/architecture-implementation-patterns-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 変更履歴 | L18 |

### references/architecture-implementation-patterns-reference-agent-view-selector-migration.md

| セクション | 行 |
|------------|----|
| AgentView Enhancement 実装パターン（TASK-UI-03 2026-03-07実装） | L6 |

### references/architecture-implementation-patterns-reference.md

| セクション | 行 |
|------------|----|
| テスト実装パターン | L6 |

### references/architecture-implementation-patterns-shared.md

| セクション | 行 |
|------------|----|
| 共有パッケージ実装パターン | L4 |
| ApprovalGate Enforcement パターン（TASK-IMP-ADVANCED-CONSOLE-SAFETY-GOVERNANCE-001） | L85 |

### references/architecture-implementation-patterns.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L7 |
| 利用順序 | L20 |
| 関連ドキュメント | L25 |

### references/architecture-monorepo.md

| セクション | 行 |
|------------|----|
| モノレポアーキテクチャ | L8 |
| 型エクスポートパターン | L226 |
| 完了タスク | L296 |
| 変更履歴 | L328 |

### references/architecture-overview-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| 設計思想 | L12 |
| レイヤー構成 | L39 |
| デザインパターン | L71 |
| UI/UXアーキテクチャ | L103 |
| セキュリティアーキテクチャ | L146 |
| 状態管理アーキテクチャ | L180 |
| データフローアーキテクチャ | L217 |
| ディレクトリ構造 | L266 |
| データ構造（型システム） | L325 |

### references/architecture-overview-details.md

| セクション | 行 |
|------------|----|
| 機能追加パターン | L6 |
| 技術スタック | L41 |

### references/architecture-overview-history.md

| セクション | 行 |
|------------|----|
| テンプレート | L6 |
| 関連ドキュメント | L26 |
| 変更履歴 | L67 |

### references/architecture-overview.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/architecture-patterns.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L15 |
| パターン概要 | L28 |
| アーキテクチャ層の関係 | L100 |
| Strangler Fig パターン（Facade standalone 関数 → 責務モジュールへの段階集約） | L135 |
| 変更履歴 | L164 |
| 関連ドキュメント | L175 |

### references/architecture-rag.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| current runtime snapshot（2026-03-21） | L13 |
| ドキュメント構成 | L26 |
| アーキテクチャ概要図 | L38 |
| 主要コンポーネント | L76 |
| テスト品質サマリー | L106 |
| known issues | L120 |
| 変更履歴 | L137 |
| 関連ドキュメント | L150 |

---

## インターフェース

**関連キーワード**: インターフェース, 型定義, IConverter, Repository, Logger

### references/interfaces-agent-sdk-executor-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| SkillService 統合（TASK-FIX-7-1） | L13 |
| SkillExecutor 型定義（TASK-3-1-A） | L99 |
| リトライ機構（TASK-SKILL-RETRY-001） | L390 |
| 関連未タスク | L457 |

### references/interfaces-agent-sdk-executor-details.md

| セクション | 行 |
|------------|----|
| PermissionResolver 型定義（TASK-3-2） | L6 |
| SkillExecutor IPC統合（TASK-3-2） | L160 |
| AllowedToolEntryV2 / SafetyGatePort 参照（TASK-SKILL-LIFECYCLE-06） | L249 |
| 型変更記録（UT-06-005） | L280 |

### references/interfaces-agent-sdk-executor-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 関連ドキュメント | L249 |
| 変更履歴 | L263 |

### references/interfaces-agent-sdk-executor.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/interfaces-agent-sdk-history-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| 残課題（未タスク） | L13 |

### references/interfaces-agent-sdk-history-history-doc-links-changelog.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 関連ドキュメント | L100 |
| 変更履歴 | L116 |

### references/interfaces-agent-sdk-history-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |

### references/interfaces-agent-sdk-history.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L7 |
| 利用順序 | L14 |
| ライフサイクルイベントモデル（TASK-SKILL-LIFECYCLE-07） | L19 |
| 関連ドキュメント | L43 |

### references/interfaces-agent-sdk-integration.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| Claude Code CLI統合 | L16 |
| Session Persistence（セッション永続化） | L119 |
| Skill Import Agent System 型定義（TASK-1-1） | L219 |
| 関連ドキュメント | L373 |
| 変更履歴 | L382 |

### references/interfaces-agent-sdk-skill-advanced.md

| セクション | 行 |
|------------|----|
| SkillSlice型定義（TASK-6-1） | L6 |
| Slide Runtime / Modifier Skill Alignment（TASK-IMP-SLIDE-AI-RUNTIME-ALIGNMENT-001） | L98 |
| ChatPanel統合（TASK-7D） | L164 |
| SkillFileManager（TASK-9A-A） | L199 |
| テストアーキテクチャ（TASK-8C-A） | L297 |

### references/interfaces-agent-sdk-skill-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| Skill Dashboard 型定義（AGENT-002） | L13 |

### references/interfaces-agent-sdk-skill-details.md

| セクション | 行 |
|------------|----|
| Skill Dashboard 型定義（AGENT-002） | L6 |
| SkillImportStore（TASK-2B） | L413 |

### references/interfaces-agent-sdk-skill-editor.md

| セクション | 行 |
|------------|----|
| SkillEditor UI 型定義（TASK-9A / completed） | L4 |
| スキルチェーン 型定義（TASK-9D） | L54 |
| スキルスケジュール 型定義（TASK-9G） | L89 |
| スキルフォーク 型定義（TASK-9E） | L114 |
| RuntimeSkillCreatorFacade（UT-SC-03-003） | L162 |

### references/interfaces-agent-sdk-skill-history-contract-fix-changelog.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 変更履歴 | L335 |

### references/interfaces-agent-sdk-skill-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 関連ドキュメント | L254 |

### references/interfaces-agent-sdk-skill-reference-share-debug-analytics.md

| セクション | 行 |
|------------|----|
| スキル共有 型定義（TASK-9F） | L6 |
| スキル公開・配布 契約参照（TASK-SKILL-LIFECYCLE-08 / spec_created） | L72 |
| スキルデバッグ 型定義（TASK-9H） | L91 |
| スキルドキュメント生成 型定義（TASK-9I） | L141 |
| Skill Docs Runtime Integration 型定義（TASK-IMP-SKILL-DOCS-AI-RUNTIME-001） | L205 |
| スキル分析 型定義（TASK-9J） | L291 |
| assertNoSilentFallback ガード（P62 対策） | L340 |

### references/interfaces-agent-sdk-skill-reference.md

| セクション | 行 |
|------------|----|
| SkillCreatorService（TASK-9B-G） | L6 |
| 続き | L439 |

### references/interfaces-agent-sdk-skill.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L7 |
| 利用順序 | L18 |
| TASK-IMP-IPC-LAYER-INTEGRITY-FIX-001 の読み分け | L23 |
| ライフサイクル履歴型定義（TASK-SKILL-LIFECYCLE-07） | L31 |
| 公開・互換性型定義（TASK-SKILL-LIFECYCLE-08） | L56 |
| IPermissionStoreV2 インターフェース（UT-06-002） | L210 |
| buildPhaseResourceRequestsFromManifest 純粋関数（TASK-P0-07） | L226 |
| 関連ドキュメント | L286 |

### references/interfaces-agent-sdk-ui.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| Agent Execution UI 型定義（AGENT-004） | L16 |
| AgentSDKPage（ポストリリーステスト検証UI） | L345 |
| 関連ドキュメント | L408 |
| 完了タスク | L421 |
| 変更履歴 | L480 |

### references/interfaces-agent-sdk.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 仕様書インデックス | L25 |
| アーキテクチャ | L39 |
| 依存関係解決 | L63 |
| Preload API（window.agentAPI） | L88 |
| 型定義 | L161 |
| エラー型 | L207 |
| IPC チャンネル | L237 |
| 設定定数 | L251 |
| React Hook（useAgent） | L263 |
| セッション管理 | L288 |
| 関連ドキュメント | L315 |
| SDK 型安全統合（TASK-9B-I） | L329 |
| 変更履歴 | L387 |

### references/interfaces-api.md

| セクション | 行 |
|------------|----|
| UT-10 グローバルエラーハンドラ | L3 |
| Web クライアント同期契約 | L48 |
| 関連 | L63 |

### references/interfaces-auth-core.md

| セクション | 行 |
|------------|----|
| 認証・プロフィール型定義 | L6 |
| ExecutionCapability 型定義（TASK-IMP-EXECUTION-RESPONSIBILITY-CONTRACT-FOUNDATION-001） | L274 |
| HealthPolicy 統一インターフェース（TASK-IMP-HEALTH-POLICY-UNIFICATION-001） | L360 |
| ワークスペース型定義 | L421 |

### references/interfaces-auth-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 変更履歴 | L179 |

### references/interfaces-auth.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L12 |
| 関連ドキュメント | L17 |

### references/interfaces-chat-history-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| データベーススキーマ | L19 |
| ドメインエンティティ型定義 | L66 |
| Repositoryインターフェース | L113 |
| サービスインターフェース | L146 |
| 認可（Authorization） | L173 |
| ビジネスルール | L222 |
| エクスポート形式 | L244 |
| 品質メトリクス | L291 |
| Renderer Process型定義（UI側） | L301 |
| Preload API（conversationAPI） | L355 |

### references/interfaces-chat-history-details.md

| セクション | 行 |
|------------|----|
| React Hooks | L6 |
| UIコンポーネント構成（Atomic Design） | L51 |
| アクセシビリティ対応 | L82 |

### references/interfaces-chat-history-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 残課題 | L62 |
| 関連ドキュメント | L70 |
| 変更履歴 | L80 |

### references/interfaces-chat-history.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/interfaces-converter-extension.md

| セクション | 行 |
|------------|----|
| BaseConverter 継承による実装 | L14 |
| 実装の最小構成 | L46 |
| カスタムメタデータの追加 | L89 |
| エラーハンドリングのベストプラクティス | L124 |
| テストの実装パターン | L160 |
| 関連ドキュメント | L202 |
| 変更履歴 | L210 |

### references/interfaces-converter-implementations.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| 実装クラス一覧 | L18 |
| HTMLConverter | L32 |
| CSVConverter | L77 |
| JSONConverter | L128 |
| MarkdownConverter | L173 |
| CodeConverter | L221 |
| YAMLConverter | L269 |
| PlainTextConverter（未実装） | L316 |
| 関連ドキュメント | L351 |

### references/interfaces-converter.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 概要 | L17 |
| ドキュメント構成 | L24 |
| IConverter インターフェース | L33 |
| 実装クラス一覧 | L67 |
| IConversionLogger インターフェース | L83 |
| IHistoryService インターフェース | L141 |
| ConversionRepository インターフェース | L192 |
| 関連ドキュメント | L209 |

### references/interfaces-core.md

| セクション | 行 |
|------------|----|
| IRepository インターフェース | L8 |
| Result型 | L70 |
| Logger インターフェース | L105 |
| IAIClient インターフェース | L140 |
| IFileWatcher インターフェース | L173 |
| 変更履歴 | L205 |

### references/interfaces-llm.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L15 |
| アーキテクチャ概要 | L26 |
| 対応LLMプロバイダー | L62 |
| 主要IPCチャンネル | L85 |
| 主要型定義（v2.4.0 追加分） | L97 |
| 品質メトリクス サマリー | L137 |
| 完了タスク | L149 |
| ChatPanel コンポーネント設計（TASK-IMP-CHATPANEL-REAL-AI-CHAT-001） | L217 |
| 変更履歴 | L287 |
| 関連ドキュメント | L303 |

### references/interfaces-rag-chunk-embedding.md

| セクション | 行 |
|------------|----|
| 主要型 | L16 |
| ChunkEntity型 | L25 |
| EmbeddingEntity型 | L47 |
| チャンキング戦略 | L67 |
| 埋め込みプロバイダー | L83 |
| デフォルト設定 | L96 |
| ベクトル演算ユーティリティ | L121 |
| バリデーション | L143 |
| 関連ドキュメント | L151 |

### references/interfaces-rag-community-detection.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 要件 | L25 |
| 設計 | L50 |
| インターフェース定義 | L99 |
| 型定義 | L130 |
| エラー型 | L179 |
| 使用例 | L191 |
| 実装ガイドライン | L256 |
| 関連ドキュメント | L279 |
| 変更履歴 | L291 |

### references/interfaces-rag-community-summarization.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 要件 | L26 |
| 設計 | L51 |
| インターフェース定義 | L106 |
| 型定義 | L131 |
| エラー型 | L178 |
| 使用例 | L198 |
| 実装ガイドライン | L245 |
| 関連ドキュメント | L276 |
| 変更履歴 | L287 |

### references/interfaces-rag-entity-extraction.md

| セクション | 行 |
|------------|----|
| 主要インターフェース | L16 |
| 実装クラス | L49 |
| 型定義（Zodスキーマ） | L100 |
| エンティティタイプ（52種類・10カテゴリ） | L154 |
| エラーハンドリング | L171 |
| パフォーマンス特性 | L201 |
| テスト用ユーティリティ | L230 |
| テスト品質 | L257 |
| 変更履歴 | L267 |
| 関連ドキュメント | L276 |

### references/interfaces-rag-file-selection.md

| セクション | 行 |
|------------|----|
| IPCチャンネル | L14 |
| リクエスト/レスポンス型 | L25 |
| セキュリティ機能 | L54 |
| UIコンポーネント | L65 |
| 実装場所 | L84 |
| 関連ドキュメント | L93 |

### references/interfaces-rag-graphrag-query.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 要件 | L26 |
| 設計 | L51 |
| インターフェース定義 | L106 |
| 型定義 | L129 |
| エラー型 | L182 |
| 使用例 | L195 |
| 実装ガイドライン | L238 |
| 関連ドキュメント | L271 |
| 変更履歴 | L282 |

### references/interfaces-rag-knowledge-graph-store.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 要件 | L25 |
| 設計 | L49 |
| インターフェース定義 | L139 |
| エラー型 | L181 |
| 実装ガイドライン | L192 |
| 実装ステータス | L214 |
| 関連ドキュメント | L293 |
| 変更履歴 | L303 |

### references/interfaces-rag-search.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L19 |
| 検索戦略一覧 | L32 |
| HybridRAGパイプライン | L43 |
| 品質メトリクス サマリー | L71 |
| 変更履歴 | L84 |
| 関連ドキュメント | L100 |

### references/interfaces-rag.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 概要 | L17 |
| ドキュメント構成 | L21 |
| Branded Types | L34 |
| RAGエラー型 | L57 |
| 共通インターフェース | L78 |
| ファイル・変換ドメイン型 | L146 |
| Knowledge Graph型 | L172 |
| 設計原則 | L188 |
| 関連ドキュメント | L411 |

### references/interfaces-shared.md

| セクション | 行 |
|------------|----|
| UT-10 エラーハンドリング標準 | L3 |
| 関連 | L120 |

### references/interfaces-skill-verify-contract.md

| セクション | 行 |
|------------|----|
| 概要 | L5 |
| Layer 命名規則 | L14 |
| Layer 1: 構造検証（Structural Validation） | L45 |
| Layer 2: コンテンツ検証（Content Validation） | L55 |
| Layer 3: 詳細コンテンツ検証（Detailed Content Validation） | L67 |
| Layer 4: 参照整合性・結合検証（Reference Integrity Validation） | L76 |
| verify エンジン責務分離 | L84 |
| Layer 拡張ガイドライン | L100 |

### references/interfaces-system-prompt.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| Repository インターフェース | L17 |
| エンティティ型定義 | L98 |
| IPC チャネル仕様 | L134 |
| エラーコード体系 | L169 |
| バリデーションルール | L186 |
| セキュリティ仕様 | L208 |
| データ永続化 | L227 |
| マイグレーション仕様 | L244 |
| 完了タスク | L266 |
| 関連ドキュメント | L278 |
| 変更履歴 | L288 |

### references/interfaces-workflow.md

| セクション | 行 |
|------------|----|
| IWorkflowExecutor インターフェース | L8 |

---

## API設計

**関連キーワード**: REST, エンドポイント, 認証, レート制限, IPC

### references/api-chat-history.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| Use Cases | L17 |
| DTOs | L254 |
| リポジトリインターフェース | L297 |
| エラーハンドリングパターン | L326 |
| 将来の拡張 | L365 |
| 変更履歴 | L379 |
| 関連ドキュメント | L388 |

### references/api-core.md

| セクション | 行 |
|------------|----|
| API 設計方針 | L8 |
| APIバージョニング | L30 |
| HTTPステータスコード | L40 |
| リクエスト/レスポンス形式 | L73 |
| ページネーション | L99 |
| フィルタリング・ソート | L121 |
| 認証・認可 | L152 |
| レート制限 | L179 |
| CORS設定 | L201 |

### references/api-endpoints.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L15 |
| REST API エンドポイント一覧 | L25 |
| エンドポイント命名規則 | L187 |
| UBM-Hyogo Admin Sync API（03a） | L208 |
| UBM-Hyogo Member Self-Service API（04b） | L253 |
| Desktop IPC API サマリー | L271 |
| 変更履歴 | L302 |
| 関連ドキュメント | L319 |

### references/api-internal-chunk-search.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 検索エンドポイント（将来実装） | L14 |
| 性能目標 | L69 |
| 使用例（データベース層） | L78 |
| 実装ステータス | L104 |
| 変更履歴 | L119 |

### references/api-internal-conversion.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| ConversionService API | L16 |
| HistoryService API | L170 |
| Electron HistoryService API | L340 |

### references/api-internal-embedding.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 主要インターフェース | L19 |
| エラーコード | L165 |
| 性能指標 | L176 |

### references/api-internal-search.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| 主要クラス | L14 |
| SearchService メソッド | L24 |
| エラーコード | L188 |
| 使用パターン | L198 |
| 性能特性 | L261 |
| デフォルト除外パターン | L271 |
| 関連ドキュメント | L284 |
| 変更履歴 | L293 |

### references/api-internal.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| API一覧 | L12 |
| 各APIの概要 | L21 |
| 関連ドキュメント | L49 |

---

## データベース

**関連キーワード**: Turso, SQLite, スキーマ, FTS5, Embedded Replicas

### references/database-admin-repository-boundary.md

| セクション | 行 |
|------------|----|
| 概要 | L7 |
| 対象 repository | L11 |
| 境界 | L21 |
| 下流連携 | L29 |
| 04b member self-service queue | L40 |

### references/database-architecture.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 採用技術と選定理由 | L17 |
| アーキテクチャ概要 | L26 |
| 設計原則 | L45 |
| 環境別接続設定 | L52 |
| ディレクトリ構成 | L78 |
| 基盤モジュール | L108 |
| 使用例 | L153 |
| 関連ドキュメント | L168 |

### references/database-implementation-core.md

| セクション | 行 |
|------------|----|
| 型安全なクエリ実装 | L6 |
| Embedded Replicas とオフライン対応 | L56 |
| マイグレーション管理 | L102 |
| テスト戦略 | L142 |
| UBM-Hyogo D1 Repository 契約（02b） | L172 |
| エラーハンドリング | L212 |
| Conversation DB 初期化パターン | L243 |
| UBM-Hyogo Schema Sync Contract（03a） | L245 |
| ベクトル検索実装（DiskANN） | L355 |

### references/database-implementation-details.md

| セクション | 行 |
|------------|----|
| Knowledge Graphテーブル群（GraphRAG基盤） | L6 |
| パフォーマンス最適化 | L210 |

### references/database-implementation-history.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L6 |

### references/database-implementation.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/database-indexes.md

| セクション | 行 |
|------------|----|
| ワークフロー関連 | L5 |
| チャット関連 | L16 |
| RAG関連 | L27 |
| Knowledge Graph関連 | L38 |
| 関連ドキュメント | L60 |

### references/database-operations.md

| セクション | 行 |
|------------|----|
| Turso 無料枠の活用 | L8 |
| セキュリティベストプラクティス | L41 |
| 運用・メンテナンス | L76 |
| Electron ローカルストレージ | L103 |
| 関連ドキュメント | L166 |

### references/database-schema-07b-schema-alias-assignment.md

| セクション | 行 |
|------------|----|
| 07b Table Responsibilities | L9 |
| Current D1 Delta Absorption | L18 |
| Fixed Runtime Values | L24 |
| Follow-up Boundary | L35 |

### references/database-schema-ddl-template.md

| セクション | 行 |
|------------|----|
| テーブル別セクション分割テンプレ | L5 |
| 制約一覧表テンプレ | L22 |
| 運用メモ | L30 |
| 関連ドキュメント | L36 |

### references/database-schema-index.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L5 |
| 変更履歴 | L14 |

### references/database-schema-indexes.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| ワークフロー関連 | L7 |
| チャット関連 | L18 |
| RAG関連 | L29 |
| Knowledge Graph関連 | L40 |

### references/database-schema.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| テーブル一覧 | L11 |
| UBM 会員 Forms 同期テーブル（03b） | L44 |
| Schema aliases write target（issue-191 / UT-07B） | L59 |
| Sheets→D1 sync enum canonicalization（U-UT01-08 / spec_created） | L74 |
| Legacy Sheets sync transition note（U-UT01-09） | L86 |
| Schema alias assignment workflow（07b） | L98 |
| ワークフロー関連テーブル | L102 |
| ユーザー関連テーブル | L141 |
| システムプロンプト関連テーブル | L175 |
| チャット関連テーブル | L210 |
| RAG関連テーブル | L246 |
| Knowledge Graph関連テーブル | L288 |
| 変換処理関連テーブル | L422 |
| インデックス設計 | L481 |
| 関連ドキュメント / 変更履歴 | L485 |
| DDL 同期テンプレ | L490 |

---

## UI/UX

**関連キーワード**: Design Tokens, コンポーネント, Tailwind, レスポンシブ, Apple HIG

### references/ui-ux-admin-dashboard.md

| セクション | 行 |
|------------|----|
| 1. 全体構成 | L15 |
| 2. AdminSidebar | L50 |
| 3. /admin（Dashboard） | L76 |
| 4. /admin/members | L108 |
| 5. /admin/tags | L201 |
| 6. /admin/schema | L256 |
| 7. /admin/meetings | L310 |
| 8. 共通の Server/Client 契約 | L379 |
| 9. 不変条件サマリ（admin UI） | L397 |

### references/ui-ux-advanced.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント一覧 | L13 |
| トピック別参照 | L22 |
| 関連ドキュメント | L41 |

### references/ui-ux-agent-execution-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| コンポーネント階層 | L12 |
| コンポーネント仕様 | L43 |
| インタラクション設計 | L324 |
| 視覚デザイン | L353 |
| 改善 CTA バナー（TASK-IMP-AGENTVIEW-IMPROVE-ROUTE-001 / 2026-03-20） | L378 |
| Session Dock 設計仕様（TASK-IMP-SESSION-DOCK-ARTIFACT-BRIDGE-001, 2026-03-24 設計確定） | L400 |
| アクセシビリティ（WCAG 2.1 AA） | L472 |

### references/ui-ux-agent-execution-details.md

| セクション | 行 |
|------------|----|
| ChatPanel統合UIフロー（TASK-7D実装済） | L6 |

### references/ui-ux-agent-execution-history.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L6 |
| 完了タスク | L24 |
| 関連ドキュメント | L63 |

### references/ui-ux-agent-execution.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/ui-ux-atoms-patterns-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| 1. コンポーネント設計パターン | L10 |
| 2. デザイントークン連携パターン | L164 |
| 3. 苦戦箇所と解決策 | L212 |
| 4. アクセシビリティ実装知見 | L346 |

### references/ui-ux-atoms-patterns-details.md

| セクション | 行 |
|------------|----|
| 5. 後方互換性パターン | L6 |
| 6. テスト戦略 | L60 |
| 7. Molecules/Organisms実装への推奨事項 | L129 |

### references/ui-ux-atoms-patterns-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 変更履歴 | L15 |

### references/ui-ux-atoms-patterns.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/ui-ux-components-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| ドキュメント構成 | L13 |
| コンポーネント設計概要 | L23 |
| デザイン原則サマリー | L109 |
| コンポーネント階層図 | L131 |
| TASK-UI-04C 実装完了記録 | L180 |
| TASK-UI-08 実装完了記録 | L202 |
| TASK-UI-07 実装完了記録 | L224 |
| TASK-UI-03 実装完了記録 | L245 |
| TASK-UI-02 実装完了記録 | L268 |
| TASK-UI-05B 実装完了記録 | L293 |
| TASK-10A-B 実装完了記録 | L311 |
| TASK-10A-C 実装完了記録 | L331 |
| TASK-10A-D 実装完了記録 | L350 |

### references/ui-ux-components-details.md

| セクション | 行 |
|------------|----|
| 仕様書作成済みタスク（spec_created） | L6 |

### references/ui-ux-components-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| SkillCenterView 関連未タスク | L43 |
| 変更履歴 | L57 |
| 関連ドキュメント | L118 |

### references/ui-ux-components.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |
| Wave 0 UI primitives baseline（2026-04-26） | L22 |

### references/ui-ux-design-principles-core.md

| セクション | 行 |
|------------|----|
| コンポーネント設計原則 | L6 |
| Apple HIG 準拠（Electron向け） | L74 |
| インタラクション設計 | L129 |
| アクセシビリティ（WCAG 2.1 AA準拠） | L260 |

### references/ui-ux-design-principles-details.md

| セクション | 行 |
|------------|----|
| UXデザイン法則 | L6 |
| 認知負荷の軽減 | L131 |
| Tap & Discover 哲学 | L152 |

### references/ui-ux-design-principles-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 変更履歴 | L16 |

### references/ui-ux-design-principles.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/ui-ux-design-system.md

| セクション | 行 |
|------------|----|
| デザインシステム概要 | L8 |
| Spatial Design Tokens（Knowledge Studio） | L34 |
| カラーシステム | L71 |
| タイポグラフィ | L129 |
| スペーシングとレイアウト | L168 |
| Tap & Discover デザイントークン拡張 | L218 |
| 完了タスク | L263 |
| 変更履歴 | L360 |

### references/ui-ux-feature-components-advanced.md

| セクション | 行 |
|------------|----|
| Custom Execution Environment UI コンポーネント（AGENT-006） | L4 |
| workspace-chat-edit-ui コンポーネント（Issue #468, #494） | L71 |
| ChatPanel Real AI Chat Wiring（TASK-IMP-CHATPANEL-REAL-AI-CHAT-001 / spec_created） | L219 |

### references/ui-ux-feature-components-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| Skill Runtime API Key Panel（TASK-RT-04） | L67 |
| LLM Adapter Error Banner（TASK-RT-01） | L123 |
| Community Visualization UI コンポーネント（CONV-08-05） | L162 |
| 続き | L271 |

### references/ui-ux-feature-components-details.md

| セクション | 行 |
|------------|----|
| Workspace Layout Foundation（TASK-UI-04A-WORKSPACE-LAYOUT） | L6 |
| Workspace Chat Panel（TASK-UI-04B-WORKSPACE-CHAT） | L76 |
| Slide Workspace Runtime Alignment（TASK-IMP-SLIDE-AI-RUNTIME-ALIGNMENT-001） | L187 |
| Workspace Preview / Quick Search（TASK-UI-04C-WORKSPACE-PREVIEW） | L258 |
| 続き | L332 |

### references/ui-ux-feature-components-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 関連ドキュメント | L222 |
| 変更履歴 | L261 |

### references/ui-ux-feature-components-reference-organisms-history-surfaces.md

| セクション | 行 |
|------------|----|
| Organisms Foundation（TASK-UI-00-ORGANISMS / completed） | L6 |
| Foundation Reflection Audit（TASK-UI-00-FOUNDATION-REFLECTION-AUDIT / completed） | L62 |
| Notification / History Domain（TASK-UI-01-C / completed） | L93 |
| History Timeline Refresh（TASK-UI-06-HISTORY-SEARCH-VIEW / completed） | L152 |
| 仕様書作成済みタスク（spec_created） | L239 |
| 仕様書作成済みタスク（spec_created） | L269 |

### references/ui-ux-feature-components-reference.md

| セクション | 行 |
|------------|----|
| SkillCenterView UI（TASK-UI-05 / 完了） | L8 |
| Skill Advanced Views UI（TASK-UI-05B / completed） | L225 |
| 続き | L304 |

### references/ui-ux-feature-components-skill-analysis.md

| セクション | 行 |
|------------|----|
| SkillAnalysisView UI（TASK-10A-B / completed） | L4 |
| SkillCreateWizard UI（TASK-10A-C / completed） | L105 |
| Store駆動ライフサイクルUI統合（TASK-10A-F / completed） | L205 |
| Verify / Improve Result Panel UI（TASK-RT-03 / phase-11） | L234 |

### references/ui-ux-feature-components-theme-chat.md

| セクション | 行 |
|------------|----|
| Light Theme Contrast Regression Guard（TASK-IMP-LIGHT-THEME-CONTRAST-REGRESSION-GUARD-001） | L4 |
| ChatPanel 実チャット配線設計（TASK-IMP-CHATPANEL-REAL-AI-CHAT-001） | L54 |
| SkillStreamDisplay コンポーネント（TASK-3-2） | L118 |
| i18n対応（TASK-3-2-B） | L169 |
| 完了タスク | L218 |

### references/ui-ux-feature-components.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L7 |
| 利用順序 | L17 |
| 関連ドキュメント | L22 |

### references/ui-ux-feature-skill-stream.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| コンポーネント階層 | L25 |
| SkillStreamDisplay コンポーネント | L38 |
| useSkillExecution Hook | L71 |
| IPC API（Preload） | L93 |
| UX改善機能（TASK-3-2-A） | L115 |
| タイムスタンプ自動更新機能（TASK-3-2-C） | L198 |
| i18n対応（TASK-3-2-B） | L332 |
| ChatPanel統合 SkillStreamingView（TASK-7D） | L380 |
| 関連ドキュメント | L441 |
| 変更履歴 | L453 |

### references/ui-ux-file-selector.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| コンポーネント構成 | L21 |
| トリガーボタン | L47 |
| モーダルダイアログ | L63 |
| ドロップゾーン | L75 |
| ファイルリスト | L86 |
| フィルター機能 | L98 |
| キーボード操作 | L110 |
| アニメーション | L121 |
| アクセシビリティ対応 | L132 |
| レスポンシブ対応 | L148 |
| WorkspaceFileSelectorモード | L157 |
| フォルダ一括選択機能 | L222 |
| 変更履歴 | L283 |
| 関連ドキュメント | L292 |

### references/ui-ux-forms.md

| セクション | 行 |
|------------|----|
| フォーム設計 | L8 |
| 認証UI設計 | L69 |
| APIキー設定UI設計 | L287 |
| 変更履歴 | L372 |

### references/ui-ux-history-panel.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| ドキュメント構成 | L16 |
| コンポーネント一覧 | L27 |
| カスタムフック一覧 | L38 |
| IPCチャンネル | L49 |
| テスト品質サマリー | L60 |
| 統合ステータス | L74 |
| 変更履歴 | L91 |
| 履歴UIファミリー参照導線（TASK-SKILL-LIFECYCLE-07） | L108 |
| 関連ドキュメント | L132 |

### references/ui-ux-llm-selector.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| UI構成 | L29 |
| 共有インラインセレクター | L40 |
| プロバイダーとモデル一覧 | L57 |
| 状態管理 | L71 |
| UXフロー | L100 |
| スタイルガイドライン | L120 |
| アクセシビリティ | L147 |
| エラーハンドリング | L157 |
| テストカバレッジ | L165 |
| 実行経路との統合 | L190 |
| 関連タスクドキュメント | L201 |
| 関連ドキュメント | L216 |

### references/ui-ux-navigation-chat-patterns.md

| セクション | 行 |
|------------|----|
| ChatViewナビゲーション | L4 |
| ナビゲーションボタン仕様 | L34 |
| ボタンスタイルガイドライン（アイコンのみボタン） | L50 |
| テスト検証済み項目 | L64 |
| アクセシビリティ対応事例 | L79 |
| ナビゲーションパターンのベストプラクティス | L111 |
| 関連ドキュメント | L123 |
| Onboarding overlay / rerun 契約（TASK-UI-09-ONBOARDING-WIZARD） | L132 |

### references/ui-ux-navigation.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 変更履歴 | L13 |
| Global Navigation | L47 |
| 続き | L376 |

### references/ui-ux-panels.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L12 |
| アイコンとイラスト | L21 |
| パネル共通ガイドライン | L58 |
| ChatPanel 実AIチャット配線設計（TASK-IMP-CHATPANEL-REAL-AI-CHAT-001） | L80 |
| ChatPanel統合パターン（TASK-7D） | L124 |
| ChatPanel Review Harness（TASK-IMP-CHATPANEL-REVIEW-HARNESS-ALIGNMENT-001） | L162 |
| 関連ドキュメント | L192 |

### references/ui-ux-portal-patterns.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| Stacking Context問題の理解 | L17 |
| 基本実装パターン | L32 |
| イベントハンドリング | L65 |
| WAI-ARIA Menu Pattern実装 | L85 |
| テスト設計 | L114 |
| パフォーマンス最適化 | L129 |
| ベストプラクティス | L140 |
| 注意事項 | L151 |
| 実装チェックリスト | L167 |
| 参考実装 | L182 |
| 関連ドキュメント | L190 |

### references/ui-ux-search-panel-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| キーボードショートカット | L18 |
| タブバー設計 | L33 |
| ファイル内検索パネル（FileSearchPanel） | L58 |
| ワークスペース検索パネル（WorkspaceSearchPanel） | L96 |
| ファイル名検索パネル（FileNameSearchPanel） | L126 |
| ハイライト表示 | L168 |
| アクセシビリティ対応 | L180 |
| エラー状態 | L194 |
| パフォーマンス考慮事項 | L205 |
| 実装アーキテクチャ | L217 |

### references/ui-ux-search-panel-details.md

| セクション | 行 |
|------------|----|
| 実装詳細（TASK-SEARCH-INTEGRATE-001） | L6 |
| 未タスク（将来の改善候補） | L104 |

### references/ui-ux-search-panel-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 完了タスク | L15 |
| 変更履歴 | L52 |

### references/ui-ux-search-panel.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/ui-ux-settings-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| 設定画面アーキテクチャ | L13 |
| スライド出力ディレクトリ設定 | L34 |
| 設定永続化 | L99 |
| IPC API仕様 | L120 |
| セキュリティ要件 | L146 |
| テスト要件 | L161 |
| ツール許可設定（Permission Settings） | L184 |
| 権限要求履歴パネル（Permission History Panel） | L250 |
| Settings 画面の AuthGuard 非依存アクセス（TASK-FIX-AUTHGUARD-TIMEOUT-SETTINGS-BYPASS-001） | L323 |
| Mainline Access Matrix（TASK-IMP-SETTINGS-SHELL-ACCESS-MATRIX-MAINLINE-001） | L366 |
| AuthKeySection 表示契約（TASK-FIX-APIKEY-CHAT-TOOL-INTEGRATION-001） | L404 |

### references/ui-ux-settings-details.md

| セクション | 行 |
|------------|----|
| ApiKeysSection 異常系表示仕様（2026-03-07追加） | L6 |
| 実装ファイル | L68 |
| バージョン履歴 | L93 |

### references/ui-ux-settings-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |

### references/ui-ux-settings.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/ui-ux-system-prompt.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| UIコンポーネント構成 | L15 |
| パネル展開/折りたたみ仕様 | L27 |
| システムプロンプト入力エリア仕様 | L39 |
| プロンプトテンプレート管理仕様 | L56 |
| 状態管理構造（Zustand） | L91 |
| LLM連携仕様 | L113 |
| データ永続化 | L123 |
| アクセシビリティ対応 | L131 |
| パフォーマンス要件 | L157 |
| E2Eテスト実装 | L166 |
| デザイントークン | L179 |
| セキュリティ考慮事項 | L192 |
| 関連タスクドキュメント | L201 |
| 関連ドキュメント | L214 |

---

## セキュリティ

**関連キーワード**: 認証, 暗号化, CSP, バリデーション, インシデント

### references/security-api-electron.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L17 |
| セキュリティ原則 | L28 |
| テスト品質サマリー | L51 |
| 完了タスク | L65 |
| 完了タスク | L80 |
| 完了タスク（TASK-IMP-ADVANCED-CONSOLE-SAFETY-GOVERNANCE-001） | L91 |
| 変更履歴 | L105 |
| 関連ドキュメント | L123 |

### references/security-api.md

| セクション | 行 |
|------------|----|
| 認証・認可フロー | L10 |
| レート制限 | L29 |
| CORS設定 | L46 |
| 依存関係セキュリティ | L55 |
| 関連ドキュメント | L80 |

### references/security-electron-ipc-examples.md

| セクション | 行 |
|------------|----|
| 実装例: historyAPI | L4 |
| 実装例: notificationAPI（TASK-UI-08） | L56 |
| 実装例: slideSettingsAPI | L89 |
| IPC Layer Integrity Fix（TASK-IMP-IPC-LAYER-INTEGRITY-FIX-001、2026-03-19完了） | L138 |
| ApprovalGate セキュリティ契約（TASK-IMP-ADVANCED-CONSOLE-SAFETY-GOVERNANCE-001） | L153 |
| Skill Creator External API Credential 秘匿化（TASK-SDK-SC-03） | L208 |

### references/security-implementation.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L14 |
| セキュリティ原則 | L24 |
| PKCE / State parameter 実装記録 | L47 |
| 実装時の苦戦した箇所・知見 | L94 |
| Tool Risk Configuration（UT-06-001: 2026-03-16 実装完了） | L139 |
| 関連ドキュメント | L175 |

### references/security-input-validation.md

| セクション | 行 |
|------------|----|
| バリデーション原則 | L10 |
| 入力タイプ別バリデーション | L22 |
| SQLインジェクション対策 | L37 |
| XSS対策 | L54 |
| Zodスキーマによるバリデーション | L70 |
| ファイル変換のセキュリティ | L84 |
| 関連ドキュメント | L132 |

### references/security-operations.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| ログ・監査 | L18 |
| ファイル選択セキュリティ | L57 |
| インシデント対応 | L124 |
| セキュリティチェックリスト | L170 |
| 関連ドキュメント | L216 |

### references/security-principles.md

| セクション | 行 |
|------------|----|
| セキュリティ設計原則 | L8 |
| 認証・認可 | L45 |
| データ保護 | L227 |
| 変更履歴 | L408 |

### references/security-skill-execution-permission.md

| セクション | 行 |
|------------|----|
| Permission Store（権限永続化） | L4 |
| Permission Store V2（UT-06-002） | L88 |
| Permission フォールバック セキュリティ（UT-06-005） | L161 |
| 公開判定セキュリティ（TASK-SKILL-LIFECYCLE-08 / spec_created） | L196 |
| 関連ドキュメント | L239 |
| ToolRiskLevel 参照（TASK-SKILL-LIFECYCLE-06） | L249 |
| 変更履歴 | L262 |

### references/security-skill-execution.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| エクスポート一覧 | L20 |
| DANGEROUS_PATTERNS | L35 |
| ALLOWED_TOOLS_WHITELIST | L92 |
| API リファレンス | L137 |
| 使用例 | L214 |
| Skill Lifecycle 実行境界（TASK-SKILL-LIFECYCLE-03） | L245 |
| テストカバレッジ | L264 |
| 続き | L284 |

### references/security-skill-ipc-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| スキル管理IPCセキュリティ | L12 |
| スキルインポートIPCチャネル（TASK-4-1） | L96 |
| Claude Code CLI連携セキュリティ | L141 |
| Skill Execution Preload API セキュリティ | L202 |
| Permission IPC Handler セキュリティ | L247 |
| SkillAPI Preload実装（TASK-5-1） | L283 |
| TASK-IMP-IPC-LAYER-INTEGRITY-FIX-001 完了記録（2026-03-19） | L361 |

### references/security-skill-ipc-history.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| 残課題 | L120 |
| 関連ドキュメント | L135 |
| 変更履歴 | L147 |

### references/security-skill-ipc.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L12 |
| TASK-IMP-IPC-LAYER-INTEGRITY-FIX-001 の読み分け | L17 |
| 関連ドキュメント | L23 |

---

## 技術スタック

**関連キーワード**: Next.js, Electron, TypeScript, Drizzle, pnpm

### references/technology-backend.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| バックエンド・データベース | L48 |
| AI統合 | L201 |
| 開発ツール | L407 |
| 完了タスク | L448 |
| 関連ドキュメント | L480 |
| 変更履歴 | L490 |

### references/technology-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| コアランタイム | L55 |
| フロントエンド | L116 |
| 変更履歴 | L245 |

### references/technology-devops-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| パッケージ構成詳細 | L67 |
| 依存関係管理戦略 | L190 |
| 無料枠の活用ガイド | L283 |
| CI/CDツール選定 | L315 |
| 学習リソースとコミュニティ | L420 |

### references/technology-devops-details.md

| セクション | 行 |
|------------|----|
| マイグレーション計画 | L6 |
| CI最適化パターン（TASK-OPT-CI-TEST-PARALLEL-001 2026-02-02追加） | L27 |

### references/technology-devops-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 完了タスク | L16 |
| 変更履歴 | L31 |

### references/technology-devops.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |
| IPC契約ドリフト品質ゲート（UT-TASK06-007） | L22 |

### references/technology-frontend.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| UIフレームワーク | L14 |
| スタイリング | L60 |
| 状態管理 | L111 |
| フォーム・バリデーション | L139 |
| エディター・表示 | L169 |
| アイコン・アセット | L187 |
| アニメーション | L203 |
| テスト | L222 |
| ビルド・バンドル | L261 |
| 関連ドキュメント | L282 |
| 変更履歴 | L293 |

---

## Claude Code

**関連キーワード**: Skill, Agent, Command, Progressive Disclosure, Task

### references/claude-code-agents-spec.md

| セクション | 行 |
|------------|----|
| ファイル配置 | L10 |
| YAML Frontmatter 必須フィールド | L19 |
| YAML Frontmatter オプションフィールド | L26 |
| 完全な YAML Frontmatter 記述形式 | L36 |
| description フィールドの詳細記述規則 | L66 |
| 依存スキルの記述規則 | L92 |
| 本文の必須セクション | L130 |
| 行数制約 | L161 |
| 命名規則 | L171 |
| ファイル参照形式 | L183 |
| 関連ドキュメント | L204 |
| 変更履歴 | L211 |

### references/claude-code-agents-workflow.md

| セクション | 行 |
|------------|----|
| ワークフローセクションの記述形式（各Phase共通） | L10 |
| ペルソナ設計 | L47 |
| ツール権限設定 | L62 |
| エージェント間協調 | L75 |
| Skill Lifecycle 向け internal orchestration（TASK-SKILL-LIFECYCLE-03） | L86 |
| ハンドオフプロトコル | L104 |
| agent_list.md 仕様 | L117 |
| エラーハンドリング | L155 |
| 状態管理 | L176 |
| 品質基準 | L200 |
| 関連ドキュメント | L218 |
| 変更履歴 | L226 |

### references/claude-code-agents.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| ドキュメント構成 | L14 |
| Agent 層の役割 | L23 |
| 責務境界 | L34 |
| 関連エージェント | L47 |
| 関連スキル | L55 |
| 関連ドキュメント | L66 |

### references/claude-code-commands.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| Command（コマンド）仕様 | L31 |
| 品質基準 | L288 |
| 命名規則 | L301 |
| ファイル参照形式 | L313 |
| 参照 | L341 |
| 変更履歴 | L359 |

### references/claude-code-overview.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 3層アーキテクチャ | L34 |
| 各層の詳細仕様 | L96 |
| 共通仕様 | L135 |
| 用語定義 | L190 |
| 参照 | L205 |
| クイックリファレンス | L245 |
| 変更履歴 | L282 |
| ドキュメント構成 | L303 |

### references/claude-code-settings-hierarchy.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 1. 階層優先順位 | L23 |
| 2. `defaultMode` ハイブリッド方針 | L47 |
| 3. `--dangerously-skip-permissions` 保留方針 | L72 |
| 4. `permissions.allow` / `permissions.deny` whitelist 設計 | L93 |
| 5. 公式 docs URL | L122 |
| 6. Reference Contracts (TypeScript) | L132 |
| 7. 関連タスク wave（DevEx 衝突防止） | L156 |
| 8. 適用先システム仕様書 | L180 |
| 9. FORCED-GO + TC BLOCKED 経路（W2 / 2026-04-28 追加） | L193 |
| 10. zsh conf.d 経路（D1 / 2026-04-28 追加） | L234 |
| 11. 関連 lessons-learned | L276 |

### references/claude-code-skills-agents.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L6 |
| 目的 | L17 |
| agents/ の位置づけ（誤解防止） | L24 |
| agents/*.md 標準フォーマット（必須テンプレ） | L33 |
| agents/*.md テンプレ（Markdown見出しで構造化） | L50 |
| 関連ドキュメント | L168 |

### references/claude-code-skills-overview.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| コア原則 | L43 |
| プロジェクト登録スキル一覧 | L108 |

### references/claude-code-skills-process.md

| セクション | 行 |
|------------|----|
| スキル作成・更新プロセス | L10 |
| フィードバックループ | L245 |
| 品質基準 | L293 |
| 命名規則 | L339 |
| ファイル参照形式 | L360 |
| skill_list.md 仕様 | L391 |
| 参照（最小限に維持） | L423 |
| 変更履歴 | L431 |
| large skill docs update flow | L439 |

### references/claude-code-skills-resources.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| scripts/ ディレクトリ仕様 | L18 |
| references/ ディレクトリ仕様 | L55 |
| Progressive Disclosure パターン | L85 |
| assets/ ディレクトリ仕様 | L143 |
| ワークフローパターン | L164 |
| 出力パターン | L196 |
| 関連ドキュメント | L248 |

### references/claude-code-skills-structure.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| 概要 | L20 |
| ドキュメント構成 | L26 |
| Skill構造仕様 | L35 |
| SKILL.md 仕様 | L73 |
| 関連ドキュメント | L158 |

---

## ワークフロー

**関連キーワード**: タスク分解, Git Worktree, PR, CI/CD

### references/workflow-05b-a-auth-mail-env-contract-alignment-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Canonical contract | L11 |
| Workflow artifacts | L18 |
| Downstream ownership | L28 |

### references/workflow-ai-chat-llm-integration-fix-artifact-inventory.md

| セクション | 行 |
|------------|----|
| 対象 wave | L3 |
| current canonical set | L15 |
| workflow-local artifacts | L31 |
| follow-up 未タスク | L116 |
| 同一 wave で更新した canonical docs | L129 |
| legacy path / filename compatibility | L140 |
| validation chain | L150 |
| 運用メモ | L173 |

### references/workflow-ai-chat-llm-integration-fix.md

| セクション | 行 |
|------------|----|
| 対象 | L3 |
| 現行実装アンカー | L12 |
| current canonical set | L26 |
| 実装・監査ステータス | L39 |
| artifact inventory / parent docs / legacy | L87 |
| タスク別の最小読書セット | L97 |
| 読む順番 | L139 |
| 検索キーワード | L148 |
| 注意点 | L161 |

### references/workflow-ai-runtime-authmode-unification.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 今回の確定事項（2026-03-13） | L19 |
| Step-03 Task06 再監査追補（2026-03-17） | L29 |
| Step-04 Task09 再監査追補（2026-03-19） | L37 |
| 再監査追補（2026-03-14） | L79 |
| current canonical set（2026-03-14 wave） | L93 |
| artifact inventory（Step-01 + system spec sync） | L109 |
| parent docs と依存関係 | L140 |
| 旧 filename 互換管理 | L153 |
| 設定画面レビューの必須改善対象 | L160 |
| 後続タスクへの伝搬先 | L178 |
| SubAgent 編成（関心ごと分離） | L207 |
| 同種課題の5分解決カード | L219 |
| 最適なファイル形成 | L229 |
| 関連ドキュメント | L241 |
| 変更履歴 | L253 |

### references/workflow-ai-runtime-execution-responsibility-realignment.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| current canonical set | L12 |
| extraction matrix | L25 |
| 実装同期ルール | L40 |
| 実装ステータススナップショット（2026-03-27） | L49 |
| Follow-up Backlog | L65 |

### references/workflow-aiworkflow-requirements-line-budget-reform-artifact-inventory.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 集計 | L23 |
| 更新した canonical control / index files | L35 |
| 更新した既存 reference files | L44 |
| 新規 canonical reference files | L84 |
| completed workflow files | L135 |
| 再生成・監査コマンド | L154 |
| 使い方 | L164 |
| 変更履歴 | L172 |

### references/workflow-aiworkflow-requirements-line-budget-reform.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 仕様書別 SubAgent 編成 | L20 |
| 今回実装した内容（2026-03-12 / 2026-03-13） | L33 |
| 苦戦箇所と再発防止 | L72 |
| 同種課題の 5 分解決カード | L85 |
| 最適なファイル形成 | L97 |
| 検証コマンド | L116 |
| 関連改善タスク | L129 |
| 関連ドキュメント | L140 |
| 変更履歴 | L153 |

### references/workflow-apikey-chat-tool-integration-alignment.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| フェーズ構造 | L17 |
| 今回実装内容（2026-03-11） | L49 |
| 苦戦箇所と再発防止 | L62 |
| 同種課題の5分解決カード | L72 |
| 最適なファイル形成（責務マトリクス） | L82 |
| 検証コマンド（最小セット） | L97 |
| 関連改善タスク | L109 |
| 関連ドキュメント | L117 |
| 変更履歴 | L131 |

### references/workflow-issue-106-admin-member-notes-repository-task-spec-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Acceptance Evidence | L11 |
| Phase 12 Artifacts | L21 |
| Deferred / Blocked | L32 |

### references/workflow-issue-191-schema-aliases-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Metadata | L3 |
| Current Canonical Set | L12 |
| Validation Chain | L26 |
| Notes | L37 |

### references/workflow-light-theme-contrast-regression-guard.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 仕様書別 SubAgent 編成 | L20 |
| 今回実装した内容（2026-03-12） | L33 |
| 苦戦箇所と再発防止 | L56 |
| 同種課題の 5 分解決カード | L68 |
| 最適なファイル形成 | L78 |
| 検証コマンド | L92 |
| 関連改善タスク | L105 |
| 関連ドキュメント | L114 |
| 変更履歴 | L126 |

### references/workflow-light-theme-global-remediation.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| フェーズ構造 | L17 |
| 今回実装内容（2026-03-11） | L49 |
| shared color migration 仕様作成追補（2026-03-12） | L62 |
| 苦戦箇所と再発防止 | L84 |
| 同種課題の5分解決カード | L95 |
| 最適なファイル形成（責務マトリクス） | L105 |
| 検証コマンド（最小セット） | L116 |
| 関連改善タスク | L132 |
| 関連ドキュメント | L142 |
| 変更履歴 | L152 |

### references/workflow-onboarding-wizard-alignment.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 仕様書別 SubAgent 編成 | L20 |
| 今回実装した内容（2026-03-13） | L34 |
| 苦戦箇所と再発防止 | L47 |
| 同種課題の 5 分解決カード | L60 |
| 最適なファイル形成 | L70 |
| 検証コマンド（最小セット） | L86 |
| 関連改善タスク | L102 |
| 関連ドキュメント | L112 |
| 変更履歴 | L126 |

### references/workflow-permission-fallback-abort-skip-retry.md

| セクション | 行 |
|------------|----|
| メタ情報 | L8 |
| current canonical set | L19 |
| artifact inventory | L31 |
| 実装内容（要点） | L46 |
| 苦戦箇所（再利用形式） | L87 |
| 同種課題の5分解決カード | L115 |
| 検出した未タスク（更新: 2026-03-17） | L127 |
| 関連ドキュメント | L137 |
| 変更履歴 | L148 |

### references/workflow-skill-identifier-branded-type-resolution.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| フェーズ構造 | L17 |
| Phase詳細 | L46 |
| 苦戦箇所由来のリスクと先回り対策 | L167 |
| 監視・ログ | L177 |
| 関連ドキュメント | L197 |
| 変更履歴 | L208 |

### references/workflow-skill-ledger-a3-progressive-disclosure-artifact-inventory.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 集計 | L18 |
| 改訂された SKILL.md（task-specification-creator） | L31 |
| 新規 references（task-specification-creator 配下） | L37 |
| workflow 仕様書（root） | L48 |
| workflow outputs | L68 |
| aiworkflow-requirements 反映ファイル（本タスク close-out） | L84 |
| 再生成・監査コマンド | L97 |
| 使い方 | L113 |
| 変更履歴 | L119 |

### references/workflow-skill-lifecycle-created-skill-usage-journey.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 必要仕様の抽出セット | L23 |
| 抽出確認コマンド | L37 |
| Task04 依存契約 | L51 |
| Task07 依存契約（TASK-SKILL-LIFECYCLE-07） | L62 |
| Task08 接続契約（TASK-SKILL-LIFECYCLE-08 / spec_created） | L77 |
| 現行 workflow 仕様書 | L133 |
| 実装内容（TASK-SKILL-LIFECYCLE-05） | L145 |
| 苦戦箇所 | L173 |
| Current Canonical Set | L213 |
| Artifact Inventory | L233 |
| 実装コードアンカー | L255 |
| same-wave 検証手順 | L267 |
| Agent -> SkillAnalysis handoff 実装完了記録（TASK-IMP-AGENTVIEW-IMPROVE-ROUTE-001 / 2026-03-20） | L284 |
| 5分解決カード | L296 |

### references/workflow-skill-lifecycle-evaluation-scoring-gate.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| classification-first 分割判断 | L18 |
| 今回の実装内容（2026-03-14） | L29 |
| 苦戦箇所（再利用形式） | L42 |
| current canonical set（2026-03-14 wave） | L53 |
| artifact inventory（implementation + doc sync） | L69 |
| parent docs と依存関係 | L86 |
| 旧 filename 互換管理 | L99 |
| 仕様書別 SubAgent 分担（関心分離） | L111 |
| 検証コマンド | L123 |
| 同種課題の5分解決カード | L136 |
| 関連ドキュメント | L146 |
| Task04→Task07 評価イベント連携（TASK-SKILL-LIFECYCLE-07） | L159 |
| 変更履歴 | L174 |

### references/workflow-skill-lifecycle-routing-render-view-foundation.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 実装内容（2026-03-17） | L17 |
| Phase 11 証跡（画面） | L29 |
| 苦戦箇所（再利用形式） | L45 |
| artifact inventory | L67 |
| current canonical set（2026-03-17 wave） | L83 |
| 検証コマンド | L100 |
| 同種課題の5分解決カード | L111 |
| TASK-SKILL-LIFECYCLE-02: SkillCenterView CTA ルーティング（2026-03-18） | L123 |
| TASK-IMP-SKILLDETAIL-ACTION-BUTTONS-001: SkillDetailPanel 二次 handoff（2026-03-19） | L155 |
| TASK-IMP-AGENTVIEW-IMPROVE-ROUTE-001: AgentView <-> SkillAnalysis round-trip（2026-03-20） | L180 |
| 変更履歴 | L224 |

### references/workflow-skill-md-codex-validation-fix-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L16 |
| Phase Outputs（current canonical set） | L29 |
| Skill 反映先（current canonical set） | L52 |
| Follow-up 未タスク | L81 |
| Validation Chain | L89 |
| 関連ドキュメント | L102 |

### references/workflow-task-04a-parallel-public-directory-api-endpoints-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L16 |
| Phase Outputs | L26 |
| 主要実装物 | L43 |
| Skill 反映先（current canonical set） | L61 |
| 実装で確定した値 | L70 |
| Follow-up 未タスク（formalize 済み） | L78 |
| Validation Chain | L88 |

### references/workflow-task-04b-followup-001-admin-queue-request-status-metadata-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L17 |
| 不変条件 Trace | L33 |
| Phase Outputs | L41 |
| 主要 Artifact | L59 |
| Skill 反映先（current canonical set） | L98 |
| Validation Chain | L107 |
| 確定値・列定義 | L120 |

### references/workflow-task-05b-parallel-magic-link-provider-and-auth-gate-state-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L19 |
| Phase Outputs（current canonical set） | L31 |
| 主要実装物 | L39 |
| Skill 反映先（current canonical set） | L93 |
| 実装で確定した値 | L103 |
| Follow-up 未タスク（formalize 済み） | L110 |
| Validation Chain | L119 |

### references/workflow-task-06a-followup-001-real-workers-d1-smoke-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L21 |
| Phase Outputs | L32 |
| 主要実装物（spec_created 段階の planned outputs） | L50 |
| Skill 反映先（current canonical set） | L60 |
| 苦戦箇所（lessons reference） | L72 |
| Follow-up 未タスク | L82 |
| Validation Chain | L86 |

### references/workflow-task-07b-parallel-schema-diff-alias-assignment-workflow-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L19 |
| Phase Outputs（current canonical set） | L33 |
| 主要実装物 | L42 |
| Skill 反映先（current canonical set） | L72 |
| 実装で確定した値 | L87 |
| Follow-up 未タスク（formalize 済み） | L97 |
| Validation Chain | L103 |

### references/workflow-task-07c-followup-003-audit-log-browsing-ui-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Current Canonical Set | L16 |
| Phase Outputs | L31 |
| Confirmed Facts | L40 |
| Verification Results | L53 |
| Follow-up / Deferred | L64 |
| Skill Reflection | L72 |
| Legacy / Rename | L84 |

### references/workflow-task-08a-parallel-api-contract-repository-and-authorization-tests-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L20 |
| Phase Outputs（current canonical set） | L31 |
| 主要実装物 | L40 |
| Skill 反映先（current canonical set） | L54 |
| 実装で確定した値 | L69 |
| Follow-up 未タスク（formalize 済み） | L78 |
| Validation Chain | L89 |

### references/workflow-task-09a-parallel-staging-deploy-smoke-and-forms-sync-validation-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Consumed Upstream Evidence | L17 |
| Phase Outputs（current canonical set） | L28 |
| Skill 反映先（current canonical set） | L37 |
| Validation Chain | L50 |

### references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Current Facts | L15 |
| Phase Outputs | L25 |
| Skill 反映先 | L34 |
| Follow-up / Unassigned | L48 |
| Validation Chain | L60 |

### references/workflow-task-09c-serial-production-deploy-and-post-release-verification-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Canonical Roots | L5 |
| Phase Artifacts | L13 |
| Boundary | L25 |
| Formalized Follow-Ups | L29 |
| Verification | L42 |

### references/workflow-task-claude-code-permissions-deny-bypass-verification-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L17 |
| Phase Outputs（current canonical set） | L28 |
| Skill 反映先（current canonical set） | L61 |
| 参照される実装ファイル（spec_created のため変更は伴わない） | L75 |
| Follow-up 未タスク | L83 |
| Validation Chain（spec_created） | L92 |

### references/workflow-task-issue-191-schema-aliases-implementation-001-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Metadata | L3 |
| Current Canonical Set | L12 |
| Open Follow-ups | L25 |

### references/workflow-task-lefthook-multi-worktree-reinstall-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L17 |
| Phase Outputs（Phase 形式不要 / runbook 完了形式） | L26 |
| 主要実装物 | L35 |
| Skill 反映先（current canonical set） | L42 |
| 参照される実装ファイル | L51 |
| Follow-up 未タスク | L59 |
| Validation Chain（runbook completed） | L66 |

### references/workflow-task-rt-06-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Current Canonical Set | L12 |
| Follow-up 未タスク | L25 |
| Validation Chain | L31 |

### references/workflow-task-sync-forms-d1-legacy-umbrella-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Current Facts | L13 |
| Phase Outputs | L21 |
| Skill 反映先 | L33 |
| Follow-up | L44 |
| Validation Chain | L50 |

### references/workflow-task-verify-indexes-up-to-date-ci-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L17 |
| Phase Outputs（current canonical set） | L27 |
| 主要実装物 | L53 |
| Skill 反映先（current canonical set） | L61 |
| Follow-up 未タスク | L73 |
| Validation Chain（implementation_completed_pr_pending） | L80 |

### references/workflow-task-worktree-environment-isolation-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L16 |
| Phase Outputs（current canonical set） | L23 |
| Skill 反映先（current canonical set） | L60 |
| 参照される実装ファイル（spec_created のため変更は伴わない） | L74 |
| Follow-up 未タスク | L81 |
| Validation Chain（spec_created） | L90 |

### references/workflow-ui-ux-visual-baseline-drift.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 仕様書別 SubAgent 編成 | L20 |
| 今回実装した内容 | L32 |
| 苦戦箇所と再発防止 | L53 |
| 同種課題の 5 分解決カード | L63 |
| 最適なファイル形成 | L73 |
| 検証コマンド | L87 |
| 関連改善タスク | L99 |
| 関連ドキュメント | L107 |
| 変更履歴 | L119 |

### references/workflow-ut-06-followup-A-opennext-workers-migration-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Current Canonical Set（仕様・成果物） | L14 |
| Current Canonical Set（実装ファイル） | L42 |
| Skill 同期成果物 | L52 |
| Follow-up 未タスク | L64 |
| Validation Chain | L73 |
| 不変条件 touched | L86 |

### references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| Acceptance Criteria | L19 |
| Phase Outputs | L31 |
| Phase 11 Evidence Files（NON_VISUAL） | L49 |
| Runbook（正本） | L61 |
| Implementation Constants | L68 |
| 自走禁止項目（本タスクで実行しないこと） | L88 |
| Skill Feedback（Phase 12 反映） | L99 |
| 関連リソース | L107 |

### references/workflow-ut-07b-schema-alias-hardening-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Metadata | L3 |
| Workflow Artifacts | L13 |
| Implementation Artifacts | L22 |
| Evidence Summary | L32 |
| Follow-up Disposition | L41 |

### references/workflow-ut-cicd-drift-impl-observability-matrix-sync-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Metadata | L3 |
| Canonical Artifacts | L13 |
| Notes | L28 |

### references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md

| セクション | 行 |
|------------|----|
| Canonical Workflows | L3 |
| Phase 12 Strict Files | L10 |
| Gate Boundary | L22 |
| Same-Wave Sync | L28 |

### references/workflow-ut-gov-004-artifact-inventory.md

| セクション | 行 |
|------------|----|
| 1. Phase 別 outputs（13 phases） | L8 |
| 2. UT-GOV-001 への入力契約（唯一の機械可読正本） | L26 |
| 3. branch protection 運用ルール 4 項目（system-spec-update-summary.md §4） | L35 |
| 4. skill 反映先（aiworkflow-requirements） | L44 |
| 5. 上書き済み既存タスク | L54 |
| 6. リレー先未タスク | L63 |
| 7. 不変条件 | L72 |

### references/workflow-ut08-monitoring-alert-design-artifact-inventory.md

| セクション | 行 |
|------------|----|
| ワークフロー概要 | L5 |
| Phase 別成果物リスト | L16 |
| SSOT クイック参照 | L86 |
| 派生未タスク | L100 |
| 関連リンク | L108 |

### references/workflow-utgov001-second-stage-reapply-artifact-inventory.md

| セクション | 行 |
|------------|----|
| 1. Phase 別 outputs（13 phases） | L9 |
| 2. 入力契約（UT-GOV-004 由来 / 唯一の機械可読正本） | L27 |
| 3. 出力契約（適用後 GET 正本） | L35 |
| 4. 受入条件（AC-1〜AC-14）抜粋 | L43 |
| 5. branch protection 運用ルール（second-stage 固有） | L62 |
| 6. skill 反映先（aiworkflow-requirements / task-specification-creator） | L72 |
| 7. リレー先未タスク（Phase 12 unassigned-task-detection 由来） | L86 |
| 8. 不変条件 touched | L95 |

### references/workflow-workspace-parent-reference-sweep-guard.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 仕様書別 SubAgent 編成 | L19 |
| 今回実装・更新した内容（2026-03-12） | L31 |
| 苦戦箇所と標準ルール | L55 |
| 同種課題の5分解決カード | L67 |
| 最適なファイル形成 | L77 |
| 検証コマンド | L89 |
| 関連ドキュメント | L103 |
| 変更履歴 | L117 |

### references/workflow-workspace-preview-search-resilience-guard.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 仕様書別 SubAgent 編成 | L20 |
| 今回実装・更新した内容（2026-03-13） | L32 |
| 苦戦箇所と標準ルール | L60 |
| 同種課題の 5 分解決カード | L74 |
| 最適なファイル形成 | L84 |
| 検証コマンド | L101 |
| 関連未タスク | L119 |
| 関連ドキュメント | L127 |
| 変更履歴 | L143 |

---

## その他

**関連キーワード**: デプロイ, Cloudflare, 環境変数, Discord, プラグイン

### references/arch-claude-cli.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| Claude Code CLI連携（Desktop Main Process） | L19 |
| Claude CLI Renderer API（Preload API） | L124 |
| 関連ドキュメント | L317 |

### references/arch-execution-capability-contract.md

| セクション | 行 |
|------------|----|
| AccessCapability の shared パッケージ移動（TASK-IMP-EXECUTION-RESPONSIBILITY-CONTRACT-FOUNDATION-001 / Task01） | L7 |
| HealthPolicy 統合（TASK-IMP-HEALTH-POLICY-UNIFICATION-001） | L66 |

### references/arch-feature-addition.md

| セクション | 行 |
|------------|----|
| 新機能追加の手順 | L10 |
| 機能構成のベストプラクティス | L47 |
| この構造の利点 | L67 |
| 関連ドキュメント | L79 |

### references/arch-integration-packages.md

| セクション | 行 |
|------------|----|
| 概要 | L12 |
| ディレクトリ構造 | L23 |
| ツールパッケージ仕様 | L50 |
| ワークフローパッケージ仕様 | L120 |
| パターン例: 外部サービス連携ワークフロー（参考） | L179 |
| ツールパッケージ一覧（計画） | L227 |
| 依存関係ルール | L241 |
| 新規ツールパッケージ追加手順 | L258 |
| 新規ワークフローパッケージ追加手順 | L269 |
| 変更履歴 | L280 |

### references/arch-state-management-advanced.md

| セクション | 行 |
|------------|----|
| P31対策: Store Hooks無限ループ防止パターン | L6 |

### references/arch-state-management-core.md

| セクション | 行 |
|------------|----|
| UI Design Foundation 状態管理方針（TASK-UI-00-DESIGN-FOUNDATION） | L6 |
| Store Slice Baseline（TASK-UI-01-A-STORE-SLICE-BASELINE） | L29 |
| ChatPanel 実AIチャット配線 初期設計（廃止 → 最終設計は後述セクション参照） | L87 |
| Workspace Layout 基盤（TASK-UI-04A-WORKSPACE-LAYOUT） | L97 |
| Workspace Preview / Quick Search（TASK-UI-04C-WORKSPACE-PREVIEW） | L130 |
| Workspace Chat Panel 統合（TASK-UI-04B-WORKSPACE-CHAT） | L160 |
| Notification/HistorySearch 実装同期（TASK-UI-01-C-NOTIFICATION-HISTORY-DOMAIN） | L195 |
| HistorySearch timeline 再設計（TASK-UI-06-HISTORY-SEARCH-VIEW） | L240 |
| ViewType/ナビ導線 実装同期（TASK-UI-01-D-VIEWTYPE-ROUTING-NAV） | L287 |
| 続き | L356 |

### references/arch-state-management-details.md

| セクション | 行 |
|------------|----|
| Zustand Sliceパターン | L6 |

### references/arch-state-management-history.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L6 |
| 関連ドキュメント | L78 |

### references/arch-state-management-reference-permissions-import-lifecycle.md

| セクション | 行 |
|------------|----|
| permissionHistorySlice（権限要求履歴管理） | L6 |
| Skill Advanced Views 状態管理設計（TASK-UI-05B / completed） | L135 |
| Skill Import / SkillCenter 防御状態管理（2026-03-04） | L180 |
| TASK-10A-E-C: Store駆動ライフサイクル統合（2026-03-06） | L229 |
| TASK-10A-F: Store駆動ライフサイクルUI統合（selector migration / renderer direct IPC removal, 2026-03-07） | L267 |
| permissionHistorySlice 拡張仕様（TASK-SKILL-LIFECYCLE-06） | L337 |

### references/arch-state-management-reference-persist-hardening-test-quality.md

| セクション | 行 |
|------------|----|
| LLM Selection Persist Validation（TASK-FIX-LLM-CONFIG-PERSISTENCE） | L6 |
| Persist Iterable Hardening（TASK-FIX-SETTINGS-PERSIST-ITERABLE-HARDENING-001） | L29 |
| TASK-043D: テスト品質ゲート設計（2026-03-08） | L86 |

### references/arch-state-management-reference-selectors.md

| セクション | 行 |
|------------|----|
| Notification/HistorySearch 実装同期（TASK-UI-01-C-NOTIFICATION-HISTORY-DOMAIN） | L7 |
| HistorySearch timeline 再設計（TASK-UI-06-HISTORY-SEARCH-VIEW） | L52 |
| ViewType/ナビ導線 実装同期（TASK-UI-01-D-VIEWTYPE-ROUTING-NAV） | L99 |
| LLMConfigProvider 状態管理変更（TASK-IMP-MAIN-CHAT-SETTINGS-AI-RUNTIME-001） | L163 |
| ChatPanel Real AI Chat 配線 状態管理拡張（TASK-IMP-CHATPANEL-REAL-AI-CHAT-001 / spec_created） | L202 |
| 公開・配布状態管理設計（TASK-SKILL-LIFECYCLE-08 / spec_created） | L298 |

### references/arch-state-management-reference.md

| セクション | 行 |
|------------|----|
| P31対策: Store Hooks無限ループ防止パターン | L6 |
| chatEditSlice（Workspace Chat Edit状態管理） | L94 |
| skillSlice（統合済み - TASK-FIX-6-1-STATE-CENTRALIZATION） | L184 |

### references/arch-state-management-skill-creator.md

| セクション | 行 |
|------------|----|
| LLMConfigProvider 状態管理変更（TASK-IMP-MAIN-CHAT-SETTINGS-AI-RUNTIME-001） | L5 |
| ChatPanel Real AI Chat 配線 状態管理拡張（TASK-IMP-CHATPANEL-REAL-AI-CHAT-001 / spec_created） | L46 |
| 公開・配布状態管理設計（TASK-SKILL-LIFECYCLE-08 / spec_created） | L149 |
| SkillExecutionStatus 拡張状態の配置ルール（UT-LIFECYCLE-EXECUTION-STATUS-TYPE-SPEC-SYNC-001） | L175 |
| Slide Modifier / Manual Fallback 状態管理設計（TASK-IMP-SLIDE-MODIFIER-MANUAL-FALLBACK-ALIGNMENT-001 / spec_created） | L202 |
| LLM Generation State 配置ルール（TASK-SC-06-UI-RUNTIME-CONNECTION / TASK-SC-07 current facts） | L277 |
| Workflow Snapshot State 配置ルール（TASK-SDK-04） | L523 |

### references/arch-state-management.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L7 |
| 利用順序 | L18 |
| lifecycleHistorySlice / feedbackSlice（TASK-SKILL-LIFECYCLE-07） | L23 |
| LLM 選択状態の永続化（TASK-FIX-LLM-CONFIG-PERSISTENCE） | L51 |
| 関連ドキュメント | L81 |

### references/arch-ui-components-advanced.md

| セクション | 行 |
|------------|----|
| SkillManagementPanel アーキテクチャパターン（TASK-10A-A / completed） | L6 |
| SkillManagementPanel ビュー統合アーキテクチャパターン（TASK-10A-D / completed） | L72 |
| SkillManagementPanel Import List アーキテクチャパターン（TASK-043B / completed） | L174 |
| TASK-UI-00-ORGANISMS アーキテクチャ記録 | L209 |
| AgentView Enhancement アーキテクチャパターン（TASK-UI-03 / completed） | L255 |

### references/arch-ui-components-core.md

| セクション | 行 |
|------------|----|
| Monaco Diff Editor統合パターン | L6 |
| SkillCreateWizard LLM / template 併用パターン（TASK-SC-07 current facts） | L210 |
| SkillCreateWizard LLM 連携フロー（TASK-SC-07） | L269 |

### references/arch-ui-components-details.md

| セクション | 行 |
|------------|----|
| SkillSelector コンポーネントパターン | L6 |
| ChatPanel統合パターン（TASK-7D） | L240 |
| SkillCenterView アーキテクチャパターン（TASK-UI-05） | L291 |
| Skill Advanced Views アーキテクチャパターン（TASK-UI-05B / completed） | L344 |

### references/arch-ui-components-history.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L6 |
| 関連ドキュメント | L30 |

### references/arch-ui-components.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L14 |
| 関連ドキュメント | L19 |

### references/csrf-state-parameter.md

| セクション | 行 |
|------------|----|
| メタ情報 | L6 |
| 概要 | L17 |
| API仕様 | L24 |
| 認証フローにおける統合 | L99 |
| セキュリティ設計根拠 | L142 |
| 既知の制約（Implicit Flow由来） | L155 |
| 苦戦箇所と教訓 | L166 |
| テストカバレッジ | L197 |
| 関連ドキュメント | L221 |
| 変更履歴 | L229 |

### references/deployment-branch-strategy.md

| セクション | 行 |
|------------|----|
| ブランチ戦略 | L8 |
| フロー | L25 |
| 環境マッピング | L38 |
| CI/CD トリガー対応表 | L48 |
| GitHub 環境保護ルール（推奨設定） | L60 |
| ブランチ保護ルール（推奨設定） | L83 |
| 変更履歴 | L195 |

### references/deployment-cloudflare-opennext-workers.md

| セクション | 行 |
|------------|----|
| 1. 適用範囲 | L8 |
| 2. 形式判定マトリクス | L14 |
| 3. wrangler.toml 必須項目 | L25 |
| 4. .assetsignore の役割と運用 | L88 |
| 5. ビルド・デプロイ手順 | L108 |
| 6. Worker bundle size ガード | L131 |
| 7. SPA fallback / 404 ハンドリング | L149 |
| 8. preview / staging / production の env 分離 | L158 |
| 9. 旧 Pages プロジェクトの並走方針 | L170 |
| 10. CLI 経路の徹底 | L182 |
| 11. R2 incremental cache（任意採用） | L191 |
| 12. 関連リソース | L199 |
| 13. production route / secret / observability preflight | L217 |
| 変更履歴 | L223 |

### references/deployment-cloudflare-ut06-gate.md

| セクション | 行 |
|------------|----|
| canonical 実行ラッパー | L5 |
| 実行前ゲート | L17 |
| 関連 | L29 |

### references/deployment-cloudflare.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| サービス構成 | L13 |
| 現行 canonical: UT-06 実行前ゲート（2026-04-27） | L25 |
| API Worker Cron（u-04 Sheets → D1 sync） | L51 |
| Cloudflare Workers デプロイ（Next.js / OpenNext） | L76 |
| Cloudflare Workers デプロイ（APIバックエンド） | L163 |
| Cloudflare D1 データベース | L283 |
| Cloudflare KV セッションキャッシュ（UT-13 / SESSION_KV） | L316 |
| GitHub Actions CI/CD | L428 |
| プレビューデプロイメント | L457 |
| カスタムドメイン設定 | L473 |
| 環境分離 | L486 |
| ロールバック戦略 | L496 |
| モニタリング/アラート（UT-08 連携） | L517 |
| 変更履歴 | L534 |

### references/deployment-core.md

| セクション | 行 |
|------------|----|
| デプロイメント戦略概要 | L6 |
| Cloudflare デプロイ戦略 | L54 |
| GitHub Actions CI/CD パイプライン | L101 |
| ロールバック戦略 | L149 |
| 変更履歴 | L195 |

### references/deployment-details.md

| セクション | 行 |
|------------|----|
| UBM-Hyogo API Worker Cron（03a / 03b / 09b） | L6 |
| モニタリングとアラート | L10 |
| デプロイチェックリスト | L73 |
| GitHub Secrets / Variables の要件 | L126 |

### references/deployment-gha.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| ワークフロー構成 | L38 |
| CI ワークフロー要件（PR 時） | L54 |
| キャッシュ戦略 | L90 |
| 並列実行の活用 | L113 |
| CD ワークフロー要件（dev / main マージ時） | L169 |
| Backend ワークフロー要件（dev / main マージ時） | L197 |
| モニタリングとアラート | L219 |
| GitHub Secrets の要件 | L253 |
| UT-27: GitHub Secrets / Variables 配置決定（2026-04-29） | L277 |
| 関連ドキュメント | L297 |
| 変更履歴 | L304 |

### references/deployment-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |

### references/deployment-secrets-management.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 管理場所の判断フロー | L20 |
| Cloudflare Secrets（ランタイム） | L37 |
| GitHub Secrets / Variables（CI/CD 用） | L87 |
| wrangler.toml の環境別設定 | L112 |
| ローカル開発での設定 | L144 |
| Cloudflare CLI ラッパー: `scripts/cf.sh`（UT-06 派生 / 2026-04-27） | L183 |
| セキュリティ原則 | L220 |
| Cloudflare API Token の作成手順 | L231 |
| UT-27: GitHub Secrets / Variables 同期運用（2026-04-29） | L260 |
| 変更履歴 | L303 |

### references/deployment.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L16 |
| 関連ドキュメント | L21 |

### references/development-guidelines-core.md

| セクション | 行 |
|------------|----|
| ロギング戦略 | L6 |
| キャッシング戦略 | L84 |
| データマイグレーション | L123 |
| コードレビューガイドライン | L162 |
| Worktree 入場時の環境分離 | L211 |
| パフォーマンス最適化 | L226 |
| 国際化（i18n） | L350 |
| Git ワークフロー | L380 |

### references/development-guidelines-details.md

| セクション | 行 |
|------------|----|
| 命名規則 | L6 |
| デバッグガイド | L54 |
| リリースプロセス | L108 |
| バックアップ・リカバリ | L137 |
| 環境構築ガイド | L174 |

### references/development-guidelines-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 完了タスク | L19 |
| 変更履歴 | L31 |

### references/development-guidelines.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/directory-structure-core.md

| セクション | 行 |
|------------|----|
| 設計方針 | L6 |
| ルート構造 | L43 |
| packages/shared/ 詳細構造 | L95 |
| apps/web/ 詳細構造（Next.js） | L251 |
| apps/desktop/ 詳細構造（Electron） | L291 |
| local-agent/ 詳細構造 | L397 |
| .github/workflows/ 詳細構造 | L408 |

### references/directory-structure-details.md

| セクション | 行 |
|------------|----|
| ルートの設定ファイル群 | L6 |
| 機能追加の手順 | L25 |
| 構造の選択理由 | L57 |
| 依存関係ルール | L72 |
| pnpm-workspace 設定 | L117 |

### references/directory-structure-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |

### references/directory-structure.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/discord-bot.md

| セクション | 行 |
|------------|----|
| 機能概要 | L8 |
| イベントハンドリング | L30 |
| スラッシュコマンド | L53 |
| メッセージ解析 | L87 |
| レート制限 | L118 |
| 通知システム | L147 |
| 認証・認可 | L180 |
| エラーハンドリング | L211 |
| 設定項目 | L233 |
| デプロイ・運用 | L264 |
| 開発ガイドライン | L292 |
| 関連ドキュメント | L323 |

### references/environment-variables.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L6 |
| 環境変数の分類 | L15 |
| セキュリティベストプラクティス | L101 |
| 環境別設定 | L175 |
| Electron アプリでの環境変数 | L229 |
| トラブルシューティング | L286 |
| チーム開発での運用 | L347 |
| 必須環境変数一覧 | L386 |
| CI/CD環境（GitHub Secrets / Variables）（UT-27 追加 2026-04-29） | L458 |
| 関連ドキュメント | L478 |

### references/error-handling-core.md

| セクション | 行 |
|------------|----|
| エラー分類 | L6 |
| 認可エラー（UnauthorizedError） | L194 |
| 外部ストレージ取得フォールバックパターン（TASK-FIX-4-2） | L259 |
| リトライ戦略 | L303 |
| SkillExecutor リトライ戦略（TASK-SKILL-RETRY-001） | L367 |

### references/error-handling-details.md

| セクション | 行 |
|------------|----|
| TokenRefreshScheduler リトライ戦略（TASK-AUTH-SESSION-REFRESH-001） | L6 |
| SkillExecutor 実行エラーコード（TASK-8A） | L57 |
| OAuthエラーコードマッピング（TASK-FIX-GOOGLE-LOGIN-001） | L96 |
| AuthMode IPC エラー envelope（TASK-FIX-AUTH-MODE-CONTRACT-ALIGNMENT-001） | L138 |
| 認証フォールバックパターン（AUTH-UI-001） | L201 |
| サーキットブレーカー（将来対応） | L243 |
| エラーレスポンス形式 | L271 |
| エラーログ出力 | L302 |
| ユーザー向けエラーメッセージ | L339 |
| エラーハンドリングの実装指針 | L362 |

### references/error-handling-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 変更履歴 | L15 |

### references/error-handling.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/governance-hooks-factory-audit-sink.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| SkillCreatorPermissionPolicy | L24 |
| SkillCreatorHooksFactory | L65 |
| SkillCreatorAuditSink | L113 |
| 使用例 | L162 |
| 設計上の注意事項 | L203 |
| path-scoped canUseTool 判定（TASK-P0-09-U1 実装済み） | L213 |
| 関連仕様書 | L233 |

### references/ipc-4-layer-pattern.md

| セクション | 行 |
|------------|----|
| メタ情報 | L8 |
| 概要 | L19 |
| Layer 1: チャネル定数 | L38 |
| Layer 2: ホワイトリスト | L70 |
| Layer 3: ipcMain ハンドラ | L98 |
| Layer 4: contextBridge API | L161 |
| 4層 チェックリスト（新規チャネル追加時） | L216 |
| P0-06 / P0-08 状態境界ガイドライン | L232 |
| 関連ファイル一覧 | L277 |

### references/ipc-contract-checklist.md

| セクション | 行 |
|------------|----|
| メタ情報 | L9 |
| 変更履歴 | L21 |
| 背景 | L34 |
| チェックリスト | L49 |
| 契約ドリフト検出コマンド | L170 |
| 関連ドキュメント | L200 |
| 適用事例 | L214 |
| Skill Creator IPC ハンドラー scope 分離マトリクス（TASK-UI-02） | L228 |
| 自動検出ツール（UT-TASK06-007） | L254 |

### references/ipc-type-resolution-guide.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| IPC 型不整合の分類 | L18 |
| 診断ワークフロー | L33 |
| 解決パターン | L68 |
| 予防策チェックリスト | L205 |
| 関連ドキュメント | L220 |
| 適用実績 | L231 |
| 変更履歴 | L242 |

### references/legacy-ordinal-family-register.md

| セクション | 行 |
|------------|----|
| 概要 | L13 |
| 使い方 | L21 |
| Current Alias Overrides（個別互換行） | L28 |
| Family Summary | L60 |
| Detailed Register | L81 |
| Section Extract Register (2026-03-17) | L262 |
| 500-Line Split Register (2026-03-16) | L273 |
| Fragment Migration Register (2026-04-28) | L295 |
| Task Root Path Drift Register (2026-04-30 追記) | L322 |

### references/lessons-learned-03a-parallel-forms-schema-sync.md

| セクション | 行 |
|------------|----|
| L-03a-001: Service Account JWT 有効期限監視運用の欠落 | L9 |
| L-03a-002: no-op (AC-4: revisionId 同一時) の検証漏れリスク | L15 |
| L-03a-003: schema_diff_queue.unresolved の半端な責務境界 | L21 |
| L-03a-004: AC-7 stableKey 直書き禁止の事前防止策の欠如 | L27 |
| L-03a-005: Google Forms API quota 枯渇リスク（free tier） | L33 |

### references/lessons-learned-03b-response-sync-2026-04.md

| セクション | 行 |
|------------|----|
| L-03B-001: `sync_jobs.metrics_json.cursor` は Google API の `pageToken` ではない | L9 |
| L-03B-002: 同 `submittedAt` 時の current_response 切替は `responseId` 降順で tie-break | L17 |
| L-03B-003: unknown field の重複 enqueue は partial UNIQUE で no-op 化 | L25 |
| L-03B-004: cron 無料枠は per-sync write 上限で守る | L33 |
| L-03B-005: `responseEmail` は system field、`response_fields` には保存しない | L41 |
| L-03B-006: 二重起動防止は同種 job_type の `running` 行検査で 409 を返す | L49 |
| L-03B-007: 旧 `ruleConsent` 表記の混入は入口で `rulesConsent` へ正規化 | L57 |

### references/lessons-learned-04b-member-self-service.md

| セクション | 行 |
|------------|----|
| L-04B-001: `SessionUserZ.authGateState` enum は「保持」と「ゲート判定」で文脈が違う | L9 |
| L-04B-002: `packages/shared` の exports field にサブパスを網羅する | L17 |
| L-04B-003: 「本文編集禁止」の不変条件根拠は specs に分散しているので 1 箇所に集約参照する | L25 |
| L-04B-004: `admin_member_notes` schema 変更は wave 間 ownership を Phase 1 で宣言する | L33 |
| L-04B-005: Auth.js 未着フェーズの dev session ヘッダは production guard を必ず最初に書く | L41 |
| L-04B-006: pending 判定は「最新行存在」ではなく `request_status` 列ベースに移行する（04b-followup-001） | L49 |

### references/lessons-learned-04c-admin-backoffice-2026-04.md

| セクション | 行 |
|------------|----|
| L-04C-001: tag queue resolve は queue 状態と member_tags への二段書き込みが境界 | L10 |
| L-04C-002: 子リソース（notes / attendance）は path memberId と所有権の両方で 404 / 409 を分離 | L18 |
| L-04C-003: schema alias の状態整合は「diff 未存在」「diff と question mismatch」で別エラーに分ける | L26 |
| L-04C-004: Hono ルートは admin gate を route 単位 mount で構造保証する（9 router 分割） | L34 |
| L-04C-005: zod による入力厳格化は query / date / pagination で必ず分岐する | L42 |
| 関連未タスク・後続 wave 連携 | L50 |
| 参照 | L56 |

### references/lessons-learned-05a-authjs-admin-gate-2026-04.md

| セクション | 行 |
|------------|----|
| L-05A-001: Auth.js v5 cookie session resolver を internal endpoint で繋ぐ設計 | L9 |
| L-05A-002: 二段防御の責務分離と bypass 試行検証 (F-15 / F-16) | L36 |
| L-05A-003: admin 剥奪の即時反映 (B-01) を MVP では「次回ログイン反映」で許容 | L64 |
| L-05A-004: Google OAuth verification (B-03) を testing user 運用で MVP 許容 | L88 |
| L-05A-005: Phase 11 staging smoke の実 OAuth 接続不能で証跡が placeholder | L111 |
| L-05A-006: session JWT 構造を memberId / isAdmin のみに最小化、D1 sessions 不採用と整合 | L140 |
| 関連リソース | L183 |
| Follow-up（unassigned-task） | L195 |

### references/lessons-learned-05b-a-auth-mail-env-contract-alignment-2026-05.md

| セクション | 行 |
|------------|----|
| Scope | L3 |
| Lessons | L9 |
| Downstream boundaries | L43 |

### references/lessons-learned-05b-magic-link-auth-gate-2026-04.md

| セクション | 行 |
|------------|----|
| 対象 | L3 |
| Lessons | L9 |
| Follow-up Boundaries | L19 |

### references/lessons-learned-06a-public-web-2026-04.md

| セクション | 行 |
|------------|----|
| L-06A-001: App Router の route group `(public)` と既存 `app/page.tsx` のルート衝突 | L9 |
| L-06A-002: Next.js 16 で `searchParams` / `params` が Promise 化された | L29 |
| L-06A-003: density 用語の表記揺れと URL 値の正本化 | L51 |
| L-06A-004: zod `catch` だけでは string 加工フォールバックに不足 | L73 |
| L-06A-005: Phase 11 で `wrangler dev` esbuild バージョン不一致により実 Workers + D1 smoke 不能 | L95 |
| 横断教訓 | L116 |

### references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md

| セクション | 行 |
|------------|----|
| 対象 | L3 |
| Lessons | L10 |
| Follow-up Boundaries | L47 |

### references/lessons-learned-06c-admin-ui-2026-04.md

| セクション | 行 |
|------------|----|
| L-06C-001: Phase 11 の実 screenshot は D1 fixture / staging admin 前提のとき後続 wave に委譲する | L10 |
| L-06C-002: ESLint no-restricted-imports 正式導入は別 task 扱い、現状は `scripts/lint-boundaries.mjs` を境界の正本にする | L20 |
| L-06C-003: Server Component（`server-fetch.ts`）と Client Component（`api.ts`）の責務分離を最初に設計する | L30 |
| L-06C-004: tag 直接編集 UI と profile 直編集 UI を「作らない」ことを spec で明示拒否する | L40 |
| L-06C-005: nested resource の 404（不在）と 409（重複・所有関係不整合）を UX feedback で別 toast に分ける | L50 |
| 関連未タスク・後続 wave 連携 | L60 |
| 参照 | L68 |

### references/lessons-learned-07a-tag-queue-resolve-2026-04.md

| セクション | 行 |
|------------|----|
| L-07A-001: spec 語と DB/API 語は alias 表で固定する | L3 |
| L-07A-002: D1 batch 後の changes 判定で race を扱わない | L7 |
| L-07A-003: Phase 12 の follow-up は unassigned-task 実体まで作る | L11 |
| L-07A-004: API-only / NON_VISUAL でも Phase 11 evidence を明示する | L15 |
| L-07A-005: admin client 契約は UI 実装タスクの stale 記述を同 wave で直す | L19 |
| L-07A-006: API / web の body drift は shared schema SSOT へ寄せる | L23 |
| L-07A-007: package script の test 引数は対象ファイル選択を保証しない | L30 |

### references/lessons-learned-07b-schema-alias-assignment-2026-04.md

| セクション | 行 |
|------------|----|
| L-07B-001: 仕様書 DB スキーマと実 D1 schema の差分を実装前に grep で照合する | L10 |
| L-07B-002: dryRun と apply は副作用境界（audit_log / queue 遷移）も含めて完全分離する | L18 |
| L-07B-003: stableKey collision は revision-scoped UNIQUE pre-check + 422 で防御し、DB UNIQUE index は別タスクに切り出す | L26 |
| L-07B-004: back-fill は batch サイズと CPU budget の二重ガードで Workers 30s 制限を逃げる | L34 |
| L-07B-005: alias 候補提案は score 関数を service 層に分離し、Levenshtein + section/index で stateless に保つ | L42 |
| 関連未タスク・後続 wave 連携 | L50 |
| 参照 | L57 |

### references/lessons-learned-07c-attendance-audit-2026-04.md

| セクション | 行 |
|------------|----|
| L-07C-001: duplicate attendance は 409 + existing row を一緒に返す | L10 |
| L-07C-002: audit_log の actor は middleware から service へ明示注入する | L18 |
| L-07C-003: candidates 列挙は LEFT JOIN + 単一 SELECT で複合除外を構造化する | L26 |
| L-07C-004: 異常系の HTTP status を repository の Result 型 reason enum で分岐する | L34 |
| L-07C-005: audit projection は API response projection と独立させる | L42 |
| 関連未タスク・後続 wave 連携 | L50 |
| skill 改善フィードバック（task-specification-creator 反映済み） | L57 |
| 参照 | L62 |

### references/lessons-learned-07c-audit-log-browsing-ui-2026-05.md

| セクション | 行 |
|------------|----|
| メタ情報 | L3 |
| L-07C-AUDIT-001: JST入力とUTC API queryの境界をPhase 9で固定する | L12 |
| L-07C-AUDIT-002: 監査ログ閲覧はraw JSON非公開をAPI契約にする | L18 |
| L-07C-AUDIT-003: cursor paginationはorder keyを明示して再現可能にする | L24 |
| L-07C-AUDIT-004: Phase 11 visual evidenceとstaging admin E2Eを混同しない | L30 |
| L-07C-AUDIT-005: skill feedbackは「ルール不足」と「実行漏れ」を分ける | L36 |

### references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md

| セクション | 行 |
|------------|----|
| L-09A-001: `NOT_EXECUTED` placeholder は PASS 証跡にしない | L9 |
| L-09A-002: staging smoke は delegated evidence の集約 gate として扱う | L17 |
| L-09A-003: root/output `artifacts.json` parity は warning ではなく blocker | L25 |
| L-09A-004: path realignment は top register と drift register の両方に書く | L33 |
| L-09A-005: skill feedback は報告で止めず promotion target を決める | L41 |

### references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md

| セクション | 行 |
|------------|----|
| L-09B-001: cron は top-level と env scope の parity を先に見る | L9 |
| L-09B-002: running guard は runbook SQL と仕様語を二重化しない | L17 |
| L-09B-003: rollback は worker / pages / D1 / cron を分ける | L25 |
| L-09B-004: docs-only / NON_VISUAL は screenshot N/A ではなく代替 evidence を固定する | L33 |
| L-09B-005: skill feedback は candidate task と existing task を分けて route する | L41 |

### references/lessons-learned-claude-code-permissions-apply-2026-04.md

| セクション | 行 |
|------------|----|
| 教訓一覧 | L11 |
| 申し送り（open / baseline 未タスク） | L92 |
| 関連 references | L101 |

### references/lessons-learned-coverage-80-enforcement-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 正本 4 系 | L20 |
| 苦戦箇所 5 件（U-1〜U-5 由来） | L31 |
| NON_VISUAL Phase 12 Part 1 / Part 2 構成の適用知見 | L68 |
| branch protection / contexts 登録の上流前提（5 重明記） | L74 |
| 実行タイミングまとめ | L78 |
| 関連リソース | L87 |

### references/lessons-learned-issue-106-admin-notes-repository-2026-05.md

| セクション | 行 |
|------------|----|
| L-I106-001: Closed issue は reopen せず current owner を再検証する | L3 |
| L-I106-002: admin notes repository は重複 owner を作らない | L9 |
| L-I106-003: `audit_log` と `admin_member_notes` を同一 DTO として扱わない | L15 |
| L-I106-004: 候補コマンドは実 repo scripts から再解決する | L21 |

### references/lessons-learned-issue-191-schema-aliases-2026-04.md

| セクション | 行 |
|------------|----|
| L-I191-001: docs-only closeout still needs canonical spec sync | L3 |
| L-I191-002: endpoint compatibility and write-target change are separate decisions | L7 |
| L-I191-003: detected follow-ups must be materialized | L11 |
| L-I191-004: transient alias lookup errors must not fallback | L15 |
| L-I191-005: promoted follow-ups must update inventory and quick-reference | L19 |
| L-I191-006: alias insert and diff resolve are one D1 batch | L23 |

### references/lessons-learned-lefthook-mwr-runbook-2026-04.md

| セクション | 行 |
|------------|----|
| 教訓一覧 | L8 |
| 申し送り（open / baseline 未タスク） | L57 |

### references/lessons-learned-skill-codex-validation-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L7 |
| 教訓一覧 | L11 |
| 派生未タスク | L43 |
| 関連ドキュメント | L51 |

### references/lessons-learned-skill-ledger-t6-hook-idempotency-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| L-T6-001: hook ガード未追加で `git rm --cached` 直後に hook が再 add する循環 | L12 |
| L-T6-002: `pnpm indexes:rebuild` 部分失敗で破損 JSON 残留 | L20 |
| L-T6-003: 4 worktree smoke の `wait` 戻り値喪失 | L28 |
| L-T6-004: 4 並列 `pnpm indexes:rebuild` の I/O 飽和 | L36 |
| L-T6-005: A-2（#130）未完了状態で T-6 着手すると `LOGS.md` を gitignore 連動で誤って ignore 化する経路 | L44 |
| 関連リンク | L52 |
| 申し送り（open / baseline 未タスク） | L61 |

### references/lessons-learned-sync-merge-hook-skip-2026-04.md

| セクション | 行 |
|------------|----|
| 背景 | L11 |
| 結論 (個人開発運用ポリシー) | L20 |
| 教訓 (Lesson IDs) | L29 |
| 関連 | L37 |

### references/lessons-learned-u-ut01-07-sync-log-naming-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 苦戦箇所 5 件（L-UUT0107-001〜005） | L12 |
| 運用ルール 3 件（reconciliation 系の固定運用） | L49 |
| canonical 確定（参照用） | L57 |
| 後続タスク | L65 |

### references/lessons-learned-u-ut01-08-sync-enum-canonical-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 苦戦箇所 4 件（L-UUT01-08-001〜004） | L12 |
| 後続タスク参照 | L42 |

### references/lessons-learned-u-ut01-09-retry-offset-2026-04.md

| セクション | 行 |
|------------|----|
| L-UUT0109-001: docs-only canonical decision でも正本導線を同 wave で閉じる | L3 |
| L-UUT0109-002: technical GO と user approval を分離する | L7 |
| L-UUT0109-003: offset は invocation budget と invalidation 条件まで書く | L11 |

### references/lessons-learned-ut-02a-tag-assignment-queue-2026-05.md

| セクション | 行 |
|------------|----|
| 概要 | L11 |
| L-UT02A-001: 仕様書命名（複数形）と既存規約（単数形）の差分判断 | L27 |
| L-UT02A-002: idempotency key 設計に `tagCode` を含めない判断 | L33 |
| L-UT02A-003: retry / DLQ 列追加で既存 row に既定値を確実に与える | L39 |
| L-UT02A-004: type-level read-only test (`*.test-d.ts`) を導入してメンバータグ書き込み境界を恒久化 | L45 |
| L-UT02A-005: 既存ファイル拡張 vs 新規ファイル作成の判断 | L51 |
| L-UT02A-006: candidate / confirmed / rejected ↔ queued / resolved / rejected の alias 維持 | L57 |
| L-UT02A-007: NON_VISUAL implementation の Phase 12 で artifacts.json を更新しない判断 | L63 |
| 採用した設計判断（サマリ） | L71 |
| 将来タスクへの推奨事項（formal unassigned tasks） | L86 |
| 関連 lessons-learned | L98 |

### references/lessons-learned-ut-03-sheets-auth-2026-04.md

| セクション | 行 |
|------------|----|
| L-UT03-001: Service Account vs OAuth Client の選定（無料枠 + KV/D1 不要を優先） | L10 |
| L-UT03-002: Cloudflare Workers 上の JWT 生成は Web Crypto API でしか動かない | L21 |
| L-UT03-003: Cloudflare Secret に PEM を貼ると `\n` が文字列エスケープされる罠 | L32 |
| L-UT03-004: シークレット環境別管理は `.dev.vars` + `bash scripts/cf.sh secret put` に一本化 | L43 |
| L-UT03-005: Spreadsheet 共有忘れによる 403 PERMISSION_DENIED の早期検出 | L54 |
| L-UT03-006: TTL 5 分リード refresh + in-flight Promise 共有で isolate 同時起動を吸収 | L65 |
| L-UT03-007: `expiresAt` の単位混在（ms vs sec）でキャッシュ無効化バグ | L76 |
| L-UT03-008: redact ヘルパは認証モジュールに同梱（PEM / private_key / Bearer の 3 パターン） | L87 |
| L-UT03-009: Forms と Sheets の認証契約を統合せず併存させる判断 | L98 |
| L-UT03-010: NON_VISUAL evidence 縮約と smoke の UT-26 委譲 | L109 |
| 後続 wave への引き継ぎ | L122 |
| 関連参照 | L128 |

### references/lessons-learned-ut-06-fu-h-2026-04.md

| セクション | 行 |
|------------|----|
| L-HDBH-001: timing-safe 比較で `===` を使わない（user-controlled secret 比較の鉄則） | L9 |
| L-HDBH-002: 401 / 403 の責務分離（WAF 外側 vs アプリ内側） | L20 |
| L-HDBH-003: 503 fail-closed と Retry-After: 30 の不変条件 | L31 |
| L-HDBH-004: HEALTH_DB_TOKEN rotation を Phase 12 close-out 時点で formalize する | L42 |
| 関連参照 | L55 |

### references/lessons-learned-ut-28-cloudflare-pages-projects-2026-04.md

| セクション | 行 |
|------------|----|
| L-UT28-001: `production_branch` 逆配線で本番が preview 化する事故を防ぐ | L9 |
| L-UT28-002: GitHub Variable には base name のみ保持し、`-staging` suffix は workflow 側で derive する | L20 |
| L-UT28-003: Pages Git Integration を OFF に固定し、deploy initiator を GitHub Actions に一本化する | L31 |
| L-UT28-004: `compatibility_date` と `compatibility_flags` を Pages / Workers で同一値に固定する | L42 |
| L-UT28-005: OpenNext output-form 不整合は UT-28 で patch せず、UT-05 / OpenNext migration task に link する | L53 |
| 関連参照 | L66 |

### references/lessons-learned-ut-cicd-drift-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 教訓 | L7 |

### references/lessons-learned-ut-cicd-drift-impl-observability-matrix-sync-2026-05.md

| セクション | 行 |
|------------|----|
| L-CICD-OBS-001: required status context は confirmed 値を正とする | L3 |
| L-CICD-OBS-002: 対象 workflow と `.github/workflows/` 実体総数を混同しない | L7 |
| L-CICD-OBS-003: Phase 12 canonical 7 files は `main.md` + required outputs 6 files と書く | L11 |
| L-CICD-OBS-004: generator が `phase-01.md` を弱く扱う場合は未タスク化する | L15 |
| L-CICD-OBS-005: skill feedback は Promote / Defer / Reject で閉じる | L19 |

### references/lessons-learned-ut-coverage-2026-05-wave.md

| セクション | 行 |
|------------|----|
| L-UTCOV-001: coverage-summary.json 不在時は coverage-guard が空入力で素通りする | L3 |
| L-UTCOV-002: D1 binding fake は contract 表面（exec/prepare/dump）を最小再現する | L7 |
| L-UTCOV-003: 2-layer coverage gate は precondition gate と upgrade gate を別タスク化する | L11 |
| L-UTCOV-004: serial wave-1 → parallel wave-2 の wave 分割は regression 切り分けを安価にする | L15 |
| L-UTCOV-005: Phase 12 main.md は spec_created / implemented-local / completed の 3 状態を明示する | L19 |
| L-UTCOV-006: lessons-learned は wave 単位で 1 ファイル、task 単位は LOGS に集約する | L23 |

### references/lessons-learned-ut-gov-001-2026-04.md

| セクション | 行 |
|------------|----|
| L-GOV-001: GET 形 / PUT 形の用途分離（payload adapter pattern） | L9 |
| L-GOV-002: UT-GOV-004 完了前提の N 重明記（順序事故防止） | L20 |
| L-GOV-003: spec_created と user_approval_required の二重ゲート | L31 |
| L-GOV-004: NON_VISUAL / 手動 smoke の evidence 充足基準（docs-only 代替 evidence） | L42 |
| 関連参照 | L55 |

### references/lessons-learned-ut-gov-004-branch-protection-context-sync.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| branch protection 運用ルール 4 項目（system-spec-update-summary.md §4 正本） | L12 |
| 苦戦箇所 6 件（index.md §苦戦箇所・知見 由来） | L21 |
| 機械可読正本（UT-GOV-001 への入力契約） | L64 |
| 関連リレー先 | L81 |
| 不変条件 touched | L90 |

### references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 教訓 | L7 |
| 関連リソース | L44 |

### references/lessons-learned-ut07b-schema-alias-hardening-2026-05.md

| セクション | 行 |
|------------|----|
| L-UT07B-H-001: write target replacement を上位前提にする | L3 |
| L-UT07B-H-002: collision は二段防御にする | L7 |
| L-UT07B-H-003: retryable failure は HTTP 202 で表す | L11 |
| L-UT07B-H-004: cursor 風 contract は remaining-scan でも成立する | L15 |
| L-UT07B-H-005: local PASS と staging-deferred を分離する | L19 |

### references/lessons-learned-ut09-direction-reconciliation-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 苦戦箇所 6 件（L-UT09-001〜006） | L12 |
| 運用ルール 2 件（reconciliation 系の固定運用） | L55 |
| 同期完了サマリー（same-wave sync） | L62 |
| 関連 unassigned-task（B-01〜B-10） | L74 |

### references/lessons-learned-ut21-forms-sync-conflict-closeout-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 苦戦箇所 5 件（L-UT21-001〜005） | L12 |
| 運用ルール 2 件（legacy umbrella close-out 系の固定運用） | L49 |
| 同期完了サマリー（same-wave sync） | L56 |
| 関連 unassigned-task（UT21-U02 / U04 / U05） | L75 |
| 派生品質要件の移植先（implementation 引き渡し） | L83 |

### references/lessons-learned-utgov001-second-stage-reapply-2026-04.md

| セクション | 行 |
|------------|----|
| 概要 | L8 |
| 苦戦箇所 8 件（index.md §苦戦箇所・知見 由来） | L12 |
| 同期完了サマリー（same-wave sync） | L86 |
| skill 改善フィードバック（skill-feedback-report.md 由来） | L98 |
| 関連リレー先 / 連鎖発火タスク | L107 |
| 不変条件 touched | L116 |
| 関連参照 | L120 |

### references/lessons-learned-verify-indexes-ci-2026-04.md

| セクション | 行 |
|------------|----|
| 教訓一覧 | L7 |
| 申し送り（open / baseline 未タスク） | L37 |

### references/lessons-learned.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L7 |
| 利用順序 | L73 |
| 関連ドキュメント | L78 |

### references/llm-embedding.md

| セクション | 行 |
|------------|----|
| プロバイダーインターフェース | L13 |
| データ型 | L37 |
| 設定型 | L53 |
| 出力型 | L93 |
| 信頼性設定型 | L105 |
| メトリクス型 | L135 |
| エラー型 | L147 |
| 列挙型 | L178 |
| 品質メトリクス | L206 |
| 関連ドキュメント | L214 |

### references/llm-ipc-types.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| LLM チャット関連型定義（Desktop IPC） | L25 |
| Provider Registry SSoT | L74 |
| Renderer / Main surface 型 | L118 |
| バリデーション関数 | L150 |
| IPC通信 | L169 |
| UIアンカー | L204 |
| 関連ドキュメント | L216 |
| 変更履歴 | L224 |

### references/llm-streaming.md

| セクション | 行 |
|------------|----|
| 概要 | L15 |
| 型定義 | L21 |
| SSEフロー | L58 |
| プロバイダー別SSE解析 | L75 |
| キャンセル機構 | L86 |
| UIコンポーネント | L109 |
| エラーハンドリング | L133 |
| テストカバレッジ | L146 |
| 型安全性の保証 | L158 |
| 関連ドキュメント | L166 |
| 完了タスク記録 | L174 |
| 変更履歴 | L202 |

### references/llm-workspace-chat-edit.md

| セクション | 行 |
|------------|----|
| 概要 | L15 |
| FileService | L21 |
| ContextBuilder | L63 |
| ChatEditService | L103 |
| RuntimeResolver | L153 |
| AnthropicLLMAdapter | L190 |
| TerminalHandoffBuilder | L227 |
| IPCチャンネル | L300 |
| セキュリティ | L320 |
| ディレクトリ構成 | L336 |
| 品質メトリクス | L365 |
| 関連ドキュメント | L376 |
| 完了タスク | L404 |
| 変更履歴 | L464 |

### references/local-agent.md

| セクション | 行 |
|------------|----|
| 機能概要 | L8 |
| 設定項目 | L41 |
| ファイル監視 | L74 |
| クラウド同期 | L116 |
| オフライン対応 | L150 |
| エラーハンドリング | L180 |
| セキュリティ | L211 |
| PM2 プロセス管理 | L242 |
| ヘルスチェック | L278 |
| 開発・デバッグ | L309 |
| 関連ドキュメント | L330 |

### references/logging-migration-guide.md

| セクション | 行 |
|------------|----|
| メタ情報 | L9 |
| 変更履歴 | L21 |
| 目次 | L29 |
| ログレベルマッピング基準 | L40 |
| 移行手順チェックリスト | L63 |
| コードパターン | L91 |
| テストモックテンプレート | L133 |
| 条件ガード削除パターン | L184 |
| 注意事項・ピットフォール | L227 |
| 関連ドキュメント | L268 |

### references/logs-archive-2026-01-agent-sdk-deps-renderer-api.md

| セクション | 行 |
|------------|----|
| 2026-01-14: AGENT-SDK-DEP-FIX pnpm依存解決ルール追加 | L5 |
| 2026-01-17: Claude CLI Renderer API仕様追加 | L50 |
| [実行日時: 2026-01-19T08:09:21.230Z] | L106 |
| [実行日時: 2026-01-21T12:24:53.856Z] | L114 |
| [実行日時: 2026-01-22T03:40:15.617Z] | L122 |
| [実行日時: 2026-01-22T03:41:04.212Z] | L130 |
| [実行日時: 2026-01-22T13:47:58.498Z] | L138 |
| [実行日時: 2026-01-24T11:30:00.000Z] | L146 |
| [実行日時: 2026-01-24T03:43:19.280Z] | L180 |
| [実行日時: 2026-01-25T06:09:41.166Z] | L188 |
| 2026-01-25: Hooks実装（TASK-3-1-B） | L196 |
| 2026-01-25: TASK-3-2 SkillExecutor IPC Handler Integration | L237 |
| 2026-01-26: TASK-4-2 未タスク指示書作成 | L276 |
| 2026-01-26: TASK-4-2 PermissionResolver IPC Handlers | L294 |
| 2026-01-25: TASK-4-1 IPCチャネル定義 | L346 |

### references/logs-archive-2026-01-feature-structure-workspace-chat-edit.md

| セクション | 行 |
|------------|----|
| 2026-01-27: ui-ux-feature-components.md構造最適化 | L5 |
| 2026-01-27: workspace-chat-edit-ui（TASK-WCE-UI-001 / Issue #494） | L28 |
| 2026-01-26: permission-dialog-ui（TASK-3-1-D） | L57 |
| 2026-01-08: chat-multi-llm-switching | L78 |
| 2026-01-10: community-detection-leiden | L120 |
| 2026-01-11: community-summarization | L167 |
| [実行日時: 2026-01-11T22:42:11.689Z] | L202 |
| [実行日時: 2026-01-12T12:53:06.233Z] | L210 |
| [実行日時: 2026-01-12T12:55:54.882Z] | L218 |
| [実行日時: 2026-01-12T12:56:01.636Z] | L226 |
| 2026-01-12: AGENT-005 Claude Agent SDK統合 | L234 |
| [実行日時: 2026-01-13T01:30:00.000Z] | L275 |
| [実行日時: 2026-01-13T01:35:00.000Z] | L295 |
| 2026-01-13: services/graph型エクスポートパターン文書化 | L310 |
| [実行日時: 2026-01-13T08:30:32.142Z] | L351 |

### references/logs-archive-2026-01-skill-selector-todo-scan-template.md

| セクション | 行 |
|------------|----|
| 2026-01-30: TASK-7A SkillSelector コンポーネント実装完了 | L5 |
| 2026-01-29: コードベースTODOスキャン未タスク新規作成（4件） | L30 |
| 2026-01-29: TASK-CI-FIX-001 未タスク指示書テンプレート最適化 | L61 |
| 2026-01-29: fix-backend-lint-next16 未タスク指示書作成（TASK-CI-FIX-001） | L86 |
| 2026-01-29: fix-backend-lint-next16（TASK-CI-FIX-001） | L107 |
| 2026-01-28: skill-stream-i18n（TASK-3-2-B） | L139 |
| 2026-01-28: コピー履歴機能（TASK-3-2-D） | L181 |
| 2026-01-28: 構造最適化（ui-ux-feature-components.md分割） | L219 |
| 2026-01-28: システム仕様更新（TASK-3-2-B Phase 12） | L255 |
| 2026-01-28: 未タスク仕様書作成（TASK-6-1 Phase 12） | L287 |
| 2026-01-27: SkillAPI Preload実装（TASK-5-1） | L318 |
| 2026-01-27: skill-stream-ux-improvements（TASK-3-2-A） | L352 |

### references/logs-archive-2026-01-skill-stream-display-test-env.md

| セクション | 行 |
|------------|----|
| 2026-01-30: TASK-3-2-F SkillStreamDisplay テスト環境改善 | L5 |

### references/logs-archive-2026-01-system-spec-gap-skill-retry.md

| セクション | 行 |
|------------|----|
| 2026-01-31: システム仕様書Gap分析 → 未タスク仕様書2件作成 | L5 |
| 2026-01-31: TASK-SKILL-RETRY-001 SkillExecutor リトライ機構 Phase 1-12 完了 | L24 |
| 2026-01-31: TASK-IMP-permission-tool-icons 仕様詳細追記（v1.3.2） | L54 |
| 2026-01-31: TASK-7D Phase 12追加仕様書更新 | L73 |
| 2026-01-30: TASK-7D Phase 12 完了タスク・インデックス更新 | L94 |
| 2026-01-30: TASK-IMP-permission-tool-icons PermissionDialogツール別アイコン表示 | L115 |
| 2026-01-30: TASK-7D ChatPanel統合のシステム仕様書更新 | L143 |
| 2026-01-31: permissionDescriptionsモジュール仕様追加 | L171 |
| 2026-01-31: task-imp-permission-readable-ui-001 詳細完了記録・スキル改善 | L192 |
| 2026-01-30: task-imp-permission-readable-ui-001 PermissionDialog 人間可読UI改善完了 | L213 |
| 2026-01-30: TASK-3-2-F テスト環境改善知見のシステム仕様書追加 | L251 |
| 2026-01-30: TASK-7C PermissionDialog コンポーネント完了 | L285 |
| 2026-01-30: TASK-7B SkillImportDialog実装完了 | L324 |

### references/logs-archive-2026-01-topic-map-remember-choice.md

| セクション | 行 |
|------------|----|
| 2026-01-26: TASK-4-1 topic-map.md更新（補完） | L5 |
| [実行日時: 2026-01-26T02:09:48.407Z] | L31 |
| 2026-01-26: rememberChoice機能永続化（TASK-3-1-E） | L39 |
| 2026-01-27: SkillStreamDisplay UX改善（TASK-3-2-A） | L93 |
| 2026-01-27: TASK-5-1 SkillAPI Preload実装 | L145 |
| [実行日時: 2026-01-27T08:03:43.494Z] | L188 |
| 2026-01-27: workspace-chat-edit-ui（Issue #494） | L196 |
| 2026-01-28: TASK-3-2-D SkillStreamDisplay コピー履歴機能 | L244 |
| 2026-01-28: SkillSlice実装（TASK-6-1） | L284 |
| 2026-01-28: タイムスタンプ自動更新（TASK-3-2-C） | L318 |
| [実行日時: 2026-01-28T13:42:17.894Z] | L361 |

### references/logs-archive-2026-02-abort-security-loop-guard.md

| セクション | 行 |
|------------|----|
| 2026-02-10: UT-FIX-5-3完了（Preload Agent Abort セキュリティ修正） | L5 |
| [2026-02-10 - P31対策実装とスキル最適化] | L49 |
| 2026-02-10: UT-FIX-STORE-HOOKS-INFINITE-LOOP-001完了（Zustand Store Hooks無限ループ修正） | L75 |
| 2026-02-09: patterns.md構造最適化（skill-creatorテンプレート準拠） | L108 |
| 2026-02-09: TASK-FIX-12-1-IPC-HARDCODE-FIX完了（SkillExecutorのIPCチャネル名定数化） | L136 |
| 2026-02-08: TASK-FIX-16-1-SDK-AUTH-INFRASTRUCTURE完了（Claude Agent SDK用認証キー管理基盤） | L180 |
| 2026-02-08: TASK-FIX-4-2-SKILL-STORE-PERSISTENCE完了（スキル永続化バグ修正） | L220 |
| 2026-02-06: TASK-AUTH-CALLBACK-001 未タスク指示書作成（苦戦箇所からの知見展開） | L282 |
| 2026-02-06: DEBT-SEC-001 仕様書更新（Phase 12ドキュメント・未タスク管理） | L309 |
| 2026-02-06: DEBT-SEC-001完了（OAuth State Parameter検証実装） | L340 |
| 2026-02-06: TASK-FIX-5-1完了（SkillAPI二重定義の統一） | L361 |
| 2026-02-06: TASK-AUTH-SESSION-REFRESH-001完了（セッション自動リフレッシュ実装） | L380 |

### references/logs-archive-2026-02-auth-callback-lifecycle-guard.md

| セクション | 行 |
|------------|----|
| 2026-02-28 - TASK-FIX-AUTH-CALLBACK-SERVER-WORKER-EXIT-001 完了移管反映 | L5 |
| 2026-02-28 - UT-IMP-AUTH-CALLBACK-LIFECYCLE-CONTRACT-GUARD-001 未タスク登録 | L24 |
| 2026-02-28 - TASK-FIX-AUTH-CALLBACK-SERVER-WORKER-EXIT-001 テンプレート最適化追補 | L43 |
| 2026-02-28 - TASK-FIX-AUTH-CALLBACK-SERVER-WORKER-EXIT-001 仕様再同期 | L62 |
| 2026-02-27 - TASK-9H 仕様再監査（Phase 12 最終同期） | L81 |
| 2026-02-28 - TASK-9I completed-tasks 移管（Phase 12完了条件充足） | L83 |
| 2026-02-28 - UT-IMP-PHASE12-EVIDENCE-LINK-GUARD-001 登録・仕様同期 | L109 |
| 2026-02-28 - TASK-9I Phase 12ドキュメント最適化（テンプレート準拠） | L135 |
| 2026-02-28 - TASK-9I Phase 12再確認（最終整合） | L158 |
| 2026-02-28 - TASK-9I 再監査反映（スキルドキュメント生成仕様同期） | L179 |
| 2026-02-28 - TASK-9J 完了移管（Phase 12完了条件に基づく成果物移動） | L201 |
| 2026-02-28 - TASK-9J 未タスク仕様書登録（Phase 12 IPC同期自動検証ガード） | L224 |
| 2026-02-28 - TASK-9J 仕様同期テンプレート最適化（5仕様書SubAgent分担） | L247 |
| 2026-02-28 - TASK-9J Phase 12再確認（苦戦箇所追補 + 未タスク整合確認） | L269 |
| 2026-02-28 - TASK-9J スキル使用統計・分析機能 Phase 12 仕様同期 | L292 |
| 2026-02-27 - TASK-9G 未タスク登録同期追補（Step 1-E 完了化） | L317 |
| 2026-02-27 - UT-IMP-PHASE12-SPEC-VERSION-CONSISTENCY-GUARD-001 未タスク登録 | L337 |
| 2026-02-27 - UT-IMP-QUICK-VALIDATE-EMPTY-FIELD-GUARD-001 Phase 12再監査 | L356 |

### references/logs-archive-2026-02-completed-move-preload-sync.md

| セクション | 行 |
|------------|----|
| 2026-02-25 - Phase 12完了済み成果物の completed-tasks への移管 | L5 |
| 2026-02-25 - UT-IMP-IPC-PRELOAD-SPEC-SYNC-CI-GUARD-001 未タスク登録 | L24 |
| 2026-02-25 - UT-IMP-IPC-PRELOAD-EXTENSION-SPEC-ALIGNMENT-001 完了反映 + 再発防止スキル新設 | L43 |
| 2026-02-25 - UT-SKILL-IPC-PRELOAD-EXTENSION-001 再監査反映 | L64 |
| 2026-02-25 - UT-IMP-AIWORKFLOW-SPEC-REFERENCE-SYNC-001 未タスク登録 | L84 |
| 2026-02-25 - UT-IPC-AUTH-HANDLE-DUPLICATE-001 テンプレート最適化（skill-creator適用） | L108 |
| 2026-02-25 - UT-IPC-AUTH-HANDLE-DUPLICATE-001 再監査補完 | L133 |
| 2026-02-25 - UT-IPC-AUTH-HANDLE-DUPLICATE-001 実装パターン追補 | L152 |
| 2026-02-25 - UT-IPC-AUTH-HANDLE-DUPLICATE-001 Phase 12完了反映 | L171 |
| 2026-02-25 - UT-IPC-CHANNEL-NAMING-AUDIT-001 Phase 12再監査是正 | L191 |
| 2026-02-25 - UT-FIX-SKILL-IPC-RESPONSE-CONSISTENCY-001 派生未タスク2件を登録 | L211 |
| 2026-02-25 - UT-FIX-SKILL-IPC-RESPONSE-CONSISTENCY-001 Phase 12要件再適合（実装内容/苦戦箇所追記） | L234 |
| 2026-02-25 - UT-FIX-SKILL-IPC-RESPONSE-CONSISTENCY-001 Phase 12再監査整合 | L253 |
| 2026-02-24 - 未タスク監査スコープ分離タスク登録 | L273 |
| 2026-02-24 - SKILLフロントマター description 制約準拠化 | L292 |
| 2026-02-24 - UT-IPC-DATA-FLOW-TYPE-GAPS-001 Phase 12再監査是正 | L311 |
| 2026-02-24 - UT-IPC-DATA-FLOW-TYPE-GAPS-001 Phase 1-12全完了 | L331 |
| 2026-02-24 - UT-FIX-SKILL-VALIDATION-CONSISTENCY-001 再監査整合 | L356 |

### references/logs-archive-2026-02-console-migration-patterns.md

| セクション | 行 |
|------------|----|
| 2026-02-14: TASK-FIX-14-1 実装パターンの体系化・スキル最適化 | L5 |
| 2026-02-14: TASK-FIX-14-1 苦戦箇所のシステム仕様書反映 | L27 |
| 2026-02-14: TASK-FIX-14-1 console移行タスクのPhase 12再監査・仕様同期 | L46 |
| 2026-02-13: TASK-FIX-13-1 未タスク仕様書作成（UT-TYPE-DATETIME-DOC-001） | L67 |
| 2026-02-13: TASK-FIX-13-1 教訓追記（再検証セッション分）+ skill-creator patterns.md更新 | L80 |
| 2026-02-13: TASK-FIX-13-1 苦戦箇所の体系化（再発防止） | L93 |
| 2026-02-13: TASK-FIX-13-1 deprecatedプロパティ正式移行の仕様反映 | L114 |
| 2026-02-13: UT-FIX-AGENTVIEW-INFINITE-LOOP-001 苦戦箇所・テスト環境教訓追記 | L134 |
| 2026-02-13: TASK-FIX-11-1-SDK-TEST-ENABLEMENT スキル改善（技術詳細追記） | L154 |
| 2026-02-13: TASK-FIX-11-1-SDK-TEST-ENABLEMENT 教訓反映（追補） | L174 |
| 2026-02-13: TASK-FIX-11-1-SDK-TEST-ENABLEMENT完了 | L194 |
| 2026-02-12: UT-9B-H-003 Phase 12再監査（苦戦箇所記録・未タスク配置整合） | L224 |
| 2026-02-12: 完了タスク移動（UT-FIX-AGENTVIEW-INFINITE-LOOP-001） | L246 |
| 2026-02-12: task-workflow未タスク参照整合の是正 | L259 |
| 2026-02-12: UT-9B-H-003 仕様整合追補（未タスク残置・返却仕様の是正） | L278 |
| 2026-02-12: UT-FIX-AGENTVIEW-INFINITE-LOOP-001完了 | L300 |
| 2026-02-12: UT-9B-H-003 SkillCreator IPCセキュリティ強化完了 | L321 |

### references/logs-archive-2026-02-env-infra-ipc-auth-ui.md

| セクション | 行 |
|------------|----|
| 2026-02-05: ENV-INFRA-001完了（better-sqlite3 Node.jsバージョン不一致修正） | L5 |
| 2026-02-05: TASK-FIX-4-1-IPC-CONSOLIDATION完了（IPCチャンネル統合） | L34 |
| 2026-02-04: AUTH-UI-001完了（認証UIバグ修正） | L59 |
| 2026-02-04: AUTH-UI-004完了（Googleアバター取得修正） | L80 |
| 2026-02-04: TASK-FIX-1-1-TYPE-ALIGNMENT完了（スキル型定義の統一） | L98 |
| 2026-02-04: task-imp-search-ui-001完了（検索・置換機能UI実装） | L129 |
| 2026-02-03: TASK-9C完了（スキル改善・自動修正機能） | L156 |
| 2026-02-03: TASK-9B-G Phase 12完了（苦戦箇所・教訓追記） | L177 |
| 2026-02-03: TASK-9B-G完了（SkillCreatorService実装） | L195 |
| 2026-02-02: TASK-WCE-WORKSPACE-001完了（Chat Edit Workspace管理統合） | L214 |
| 2026-02-02: 両ブランチ統合マージ | L233 |
| 2026-02-02: TASK-OPT-CI-TEST-PARALLEL-001完了（CI/テスト並列実行最適化） | L244 |
| 2026-02-02: task-imp-permission-date-filter完了（権限履歴の期間別フィルタリング） | L264 |
| 2026-02-02: TASK-8C-A完了（IPC統合テスト） | L275 |
| 2026-02-02: TASK-8A完了（スキル管理モジュール単体テスト） | L286 |
| 2026-02-02: TASK-8B完了（コンポーネントテスト） | L297 |
| 2026-02-01: TASK-8C-G完了（quality-e2e-testing.md v1.1.0更新） | L308 |
| 2026-02-01: task-imp-permission-history-001 Permission履歴トラッキングUI 仕様更新 | L320 |

### references/logs-archive-2026-02-permission-history-execution-timestamps.md

| セクション | 行 |
|------------|----|
| 2026-02-01: TASK-IMP-permission-history-001 Permission履歴トラッキングUI | L5 |
| [実行日時: 2026-02-06T02:11:35.490Z] | L94 |
| [実行日時: 2026-02-06T01:43:32.416Z] | L102 |
| [実行日時: 2026-02-06T01:41:25.133Z] | L110 |
| 2026-02-03: TASK-9B-A完了（skill-creator SKILL.md 作成） | L118 |
| 2026-02-03: TASK-9A-A完了（SkillFileManager実装） | L165 |
| 2026-02-04: TASK-FIX-1-1-TYPE-ALIGNMENT完了（スキル型定義統一） | L216 |
| 2026-02-04: AUTH-UI-001完了（認証UI改善） | L266 |
| 2026-02-04: ENV-INFRA-001完了（better-sqlite3バージョン不一致修正） | L308 |
| 2026-02-05: TASK-FIX-GOOGLE-LOGIN-001完了（Googleログイン修正） | L344 |
| 2026-02-09 | L383 |
| 2026-02-19 | L391 |

### references/logs-archive-2026-02-skill-creator-ipc-sdk-integration.md

| セクション | 行 |
|------------|----|
| 2026-02-12: TASK-9B-H-SKILL-CREATOR-IPC完了 | L5 |
| 2026-02-12: Store HooksテストrenderHookパターン移行（UT-STORE-HOOKS-TEST-REFACTOR-001） | L47 |
| 2026-02-12: TASK-9B-I-SDK-FORMAL-INTEGRATION完了（Claude Agent SDK型安全正式統合） | L64 |
| 2026-02-12: UT-STORE-HOOKS-COMPONENT-MIGRATION-001完了 | L91 |
| 2026-02-12: スキル最適化（TASK-FIX-7-1事後） | L112 |
| 2026-02-12: TASK-FIX-7-1スキル改善（スキルクリエーター経由） | L125 |
| 2026-02-11: TASK-FIX-7-1システム仕様書更新（Phase 12） | L138 |
| 2026-02-11: TASK-FIX-7-1-EXECUTE-SKILL-DELEGATION完了 | L159 |
| 2026-02-11: UT-STORE-HOOKS-REFACTOR-001完了（Zustand Store Hooks無限ループ修正） | L192 |
| 2026-02-10: UT-FIX-5-4完了（AgentSDKAPI abort() 型定義不一致修正） | L239 |
| 2026-02-10: TASK-FIX-6-1知見によるシステム仕様書・スキル改善 | L283 |
| 2026-02-10: TASK-FIX-6-1-STATE-CENTRALIZATION完了（スキル状態管理集約） | L326 |
| 2026-02-10: UT-FIX-5-4未タスク仕様書作成 | L361 |

### references/logs-archive-2026-02-skill-import-interface-atoms-rerun.md

| セクション | 行 |
|------------|----|
| 2026-02-20 | L5 |
| 2026-02-21 - UT-FIX-SKILL-IMPORT-INTERFACE-001 完了 | L18 |
| 2026-02-24 - Phase 12 再監査（task-ui-00-atoms / ut-skill-import-channel-conflict-001） | L48 |
| 2026-02-25 - UT-IMP-UNASSIGNED-AUDIT-SCOPE-CONTROL-001 Phase 12再確認 | L78 |
| 2026-02-25 - UT-IMP-UNASSIGNED-AUDIT-SCOPE-CONTROL-001 最終整合（quick_validate.js統一） | L107 |
| 2026-02-25 - UT-IMP-PHASE12-VALIDATION-COMMAND-STANDARDIZATION-001 登録 | L128 |
| 2026-02-25 - Phase 12完了タスクの completed-tasks 移管 | L146 |
| 2026-02-25 - UT-UI-THEME-DYNAMIC-SWITCH-001 Phase 1-12 実行反映 | L164 |
| 2026-02-25 - UT-FIX-SKILL-EXECUTE-INTERFACE-001 Phase 12再確認反映 | L184 |
| 2026-02-27 - TASK-9H 教訓同期追補 | L206 |

### references/logs-archive-2026-02-skill-validation-atoms-audit.md

| セクション | 行 |
|------------|----|
| 2026-02-24 - UT-FIX-SKILL-VALIDATION-CONSISTENCY-001 Phase 12完了記録 | L5 |
| 2026-02-24 - Phase 12再監査（task-ui-00-atoms / UT-SKILL-IMPORT-CHANNEL-CONFLICT-001） | L35 |
| 2026-02-24 - UT-SKILL-IMPORT-CHANNEL-CONFLICT-001 Phase 12完了記録 | L56 |
| 2026-02-24 - UT-FIX-TS-VITEST-TSCONFIG-PATHS-001 再監査是正 | L84 |
| 2026-02-24 - UT-FIX-TS-VITEST-TSCONFIG-PATHS-001 Phase 12追補（苦戦箇所とDevOps更新） | L102 |
| 2026-02-24 - UT-FIX-TS-VITEST-TSCONFIG-PATHS-001 Phase 1-12完了記録 | L120 |
| 2026-02-23 - TASK-UI-00-ATOMS Phase 12完了記録 | L146 |
| 2026-02-23 - TASK-IMP-MODULE-RESOLUTION-CI-GUARD-001 教訓追加 | L173 |
| 2026-02-22 - TASK-IMP-MODULE-RESOLUTION-CI-GUARD-001 教訓追補（Phase 12再確認） | L179 |
| 2026-02-22 - TASK-IMP-MODULE-RESOLUTION-CI-GUARD-001 再監査是正（文書整合） | L198 |
| 2026-02-22 - TASK-IMP-MODULE-RESOLUTION-CI-GUARD-001 Phase 12 Task 2実行 | L216 |
| 2026-02-22 - UT-FIX-SKILL-IMPORT-ID-MISMATCH-001 追加監査（未タスク配置/フォーマット） | L244 |
| 2026-02-22 - UT-FIX-SKILL-IMPORT-ID-MISMATCH-001 Phase 12 Task 2実行 | L267 |
| 2026-02-22 - 仕様準拠再監査（リンク整合 + テスト仕様補強） | L293 |
| 2026-02-22 - TASK-UI-00-TOKENS Phase 1-12完了 | L318 |
| 2026-02-21 - UT-FIX-SKILL-REMOVE-INTERFACE-001 Phase 1-12実行 | L343 |
| 2026-02-21: task-workflow 未タスク参照リンク整合の再修正 | L368 |

### references/logs-archive-2026-02-unassigned-placement-import-interface.md

| セクション | 行 |
|------------|----|
| 2026-02-21: 未実施タスク誤配置の是正 + 実装苦戦箇所追記 | L5 |
| 2026-02-21: UT-FIX-SKILL-IMPORT-INTERFACE-001 Phase 12再監査反映（苦戦箇所追記） | L24 |
| 2026-02-21: UT-FIX-SKILL-IMPORT-INTERFACE-001 Phase 12反映（契約同期 + 完了反映） | L46 |
| 2026-02-21: UT-FIX-SKILL-IMPORT-RETURN-TYPE-001 未タスク検出・登録（3件） | L70 |
| 2026-02-21: UT-FIX-SKILL-IMPORT-RETURN-TYPE-001 スキル改善（実装パターン・苦戦箇所文書化） | L91 |
| 2026-02-21: UT-FIX-SKILL-IMPORT-RETURN-TYPE-001 Phase 12反映 | L112 |
| 2026-02-20: UT-FIX-SKILL-REMOVE-INTERFACE-001 未タスク配置整合 + 教訓追記 | L135 |
| 2026-02-20: TASK-FIX-TS-SHARED-MODULE-RESOLUTION-001 Phase 12反映 | L156 |
| 2026-02-19: TASK-9A-C SkillEditor UI仕様書作成反映 | L204 |
| 2026-02-19: TASK-9A-C Phase 12準拠監査・教訓反映（追補） | L227 |
| 2026-02-19: TASK-9A-B ファイル編集IPCハンドラー追加 | L248 |
| 2026-02-19: TASK-FIX-10-1-VITEST-ERROR-HANDLING 教訓最適化 | L272 |
| 2026-02-19: TASK-FIX-10-1-VITEST-ERROR-HANDLING 完了 | L291 |
| 2026-02-14: UT-FIX-IPC-RESPONSE-UNWRAP-001 実装苦戦箇所・パターン追記 | L304 |
| 2026-02-14: UT-FIX-IPC-RESPONSE-UNWRAP-001 完了反映 + MINOR未タスク化 | L325 |
| 2026-02-14: UT-FIX-IPC-HANDLER-DOUBLE-REG-001 Phase 12再監査追補（苦戦箇所記録） | L346 |
| 2026-02-14: UT-FIX-IPC-HANDLER-DOUBLE-REG-001 参照整合性是正 | L359 |
| 2026-02-14: UT-FIX-IPC-HANDLER-DOUBLE-REG-001 IPC ハンドラ二重登録防止修正 | L372 |

### references/logs-archive-2026-02-validator-task-9f-task-9b.md

| セクション | 行 |
|------------|----|
| 2026-02-27 - UT-IMP-QUICK-VALIDATE-EMPTY-FIELD-GUARD-001 | L5 |
| 2026-02-27 - TASK-9F完了反映（スキル共有・インポート機能） | L27 |
| 2026-02-26 - TASK-9B 再監査（実装内容+苦戦箇所の仕様反映） | L48 |
| 2026-02-26 - TASK-9B SkillCreator 仕様再同期（13チャンネル化） | L73 |
| 2026-02-26 - TASK-9A Phase 12完了移管（workflow + 未タスク） | L94 |
| 2026-02-26 - TASK-9A-C-004 未タスク登録（Phase 12仕様同期ガード） | L114 |
| 2026-02-26 - TASK-9A Phase 12再確認（苦戦箇所反映） | L134 |
| 2026-02-26 - TASK-9A スキルエディター完了同期 | L153 |
| 2026-02-26 - UT-IMP-SKILL-VALIDATION-GATE-ALIGNMENT-001 Phase 12同期 | L173 |
| 2026-02-25 - UT-IMP-THEME-DYNAMIC-SWITCH-ROBUSTNESS-001 未タスク登録 | L192 |
| 2026-02-25 - UT-UI-THEME-DYNAMIC-SWITCH-001 Phase 12 Step 2 テンプレート最適化 | L211 |
| 2026-02-25 - UT-UI-THEME-DYNAMIC-SWITCH-001 Phase 12準拠再確認（苦戦箇所追記） | L230 |
| 2026-02-25 - UT-UI-THEME-DYNAMIC-SWITCH-001 再監査（仕様同期） | L249 |
| 2026-02-25 - UT-IMP-PHASE12-SPEC-SYNC-SUBAGENT-GUARD-001 未タスク登録 | L269 |
| 2026-02-25 - UT-FIX-SKILL-EXECUTE-INTERFACE-001 仕様書別SubAgent同期（追補） | L293 |
| 2026-02-25 - UT-FIX-SKILL-EXECUTE-INTERFACE-001 仕様同期・再監査 | L318 |
| 2026-02-25 - UT-IMP-UNASSIGNED-AUDIT-SCOPE-CONTROL-001 再監査（仕様同期） | L343 |
| 2026-02-25 - UT-IMP-UNASSIGNED-AUDIT-SCOPE-CONTROL-001 完了反映 | L363 |

### references/logs-archive-2026-03-auth-mode-migration-sync.md

| セクション | 行 |
|------------|----|
| 2026-03-06 - TASK-FIX-AUTH-MODE-CONTRACT-ALIGNMENT-001 再監査（横断導線補強） | L5 |
| 2026-03-06 - TASK-FIX-AUTH-MODE-CONTRACT-ALIGNMENT-001 仕様同期（auth-mode contract alignment） | L34 |
| 2026-03-06 - TASK-FIX-SKILL-EXECUTOR-AUTHKEY-DI-001 completed-tasks 移管（Phase 12完了条件充足） | L69 |
| 2026-03-06 - UT-IMP-SKILLHANDLERS-AUTHKEY-DI-BOUNDARY-GUARD-001 追加（未タスク化 + 仕様同期） | L96 |
| 2026-03-06 - TASK-FIX-SKILL-EXECUTOR-AUTHKEY-DI-001 教訓同期強化（実装内容 + 苦戦箇所） | L124 |
| 2026-03-05 - TASK-FIX-SKILL-EXECUTOR-AUTHKEY-DI-001 再監査（仕様整合 + 画面回帰） | L154 |
| 2026-03-05 - TASK-FIX-SKILL-EXECUTOR-AUTHKEY-DI-001 仕様同期（AuthKeyService DI経路統一） | L185 |
| 2026-03-06 - UT-IMP-PHASE12-TASK-INVESTIGATE-FIVE-MINUTE-CARD-SYNC-VALIDATOR-001 起票同期 | L214 |
| 2026-03-06 - TASK-INVESTIGATE-ELECTRON-SANDBOX-ITERABLE-ERROR-001 追補2（5分解決カード同期 + 仕様書整形最適化） | L242 |
| 2026-03-06 - TASK-INVESTIGATE-ELECTRON-SANDBOX-ITERABLE-ERROR-001 Phase 12準拠再確認（実装内容+苦戦箇所同期） | L270 |
| 2026-03-06 - TASK-INVESTIGATE-ELECTRON-SANDBOX-ITERABLE-ERROR-001 再監査（Phase 11 実画面証跡） | L300 |
| 2026-03-05 - TASK-INVESTIGATE-ELECTRON-SANDBOX-ITERABLE-ERROR-001 Phase 12同期 | L330 |
| 2026-03-05 - TASK-UI-01-C 再監査追補（phase/index整合 + 実画面証跡） | L359 |

### references/logs-archive-2026-03-history-search-notification-center.md

| セクション | 行 |
|------------|----|
| 2026-03-10 - TASK-UI-06-HISTORY-SEARCH-VIEW system spec 形成をテンプレート準拠へ最適化 | L5 |
| 2026-03-10 - TASK-UI-06-HISTORY-SEARCH-VIEW Phase 12 再監査同期 | L17 |
| 2026-03-11 - TASK-UI-08-NOTIFICATION-CENTER 再監査追補 | L36 |
| 2026-03-11 - TASK-UI-08-NOTIFICATION-CENTER Phase 12 仕様同期 | L53 |
| 2026-03-10 - TASK-FIX-SAFEINVOKE-TIMEOUT-001 Phase 1-12 実装完了 | L71 |
| 2026-03-10 - TASK-UI-03 workflow と関連未タスクを completed-tasks へ移管 | L88 |
| 2026-03-10 - TASK-UI-03 未タスク仕様書に親タスクの苦戦箇所を継承 | L105 |
| 2026-03-10 - TASK-UI-03 実装内容と苦戦箇所の正本配置を最適化 | L122 |
| 2026-03-10 - TASK-UI-03 Phase 12再監査で型アサーション完了追随と token 未タスク化を同期 | L139 |
| 2026-03-10 - TASK-UI-03 再監査で current workflow 台帳と UI review パターン補完 | L156 |
| 2026-03-10 - UT-IMP-WORKSPACE-PHASE11-CURRENT-BUILD-CAPTURE-GUARD-001 を system spec へ同期 | L173 |
| 2026-03-10 - TASK-UI-04A-WORKSPACE-LAYOUT 再監査同期 | L191 |
| 2026-03-10 - TASK-FIX-SAFEINVOKE-TIMEOUT-001 再監査同期 | L210 |
| 2026-03-10 - TASK-UI-03-AGENT-VIEW-ENHANCEMENT current workflow 同期 | L228 |
| 2026-03-10 - TASK-FIX-AUTHGUARD-TIMEOUT-SETTINGS-BYPASS-001 実装完了 | L245 |
| 2026-03-10 - TASK-FIX-AUTHGUARD-TIMEOUT-SETTINGS-BYPASS-001 再監査追補 | L265 |
| 2026-03-09 - TASK-FIX-APP-DEBUG-LOCALSTORAGE-CLEAR-001 再監査同期 | L283 |
| 2026-03-09 - TASK-FIX-APP-DEBUG-LOCALSTORAGE-CLEAR-001 完了 | L302 |
| 2026-03-09 - TASK-FIX-AGENT-EXECUTE-SKILL-CONCURRENCY-GUARD-001 仕様反映 | L319 |
| 2026-03-09 - TASK-FIX-AGENT-EXECUTE-SKILL-CONCURRENCY-GUARD-001 再監査の教訓固定 | L337 |

### references/logs-archive-2026-03-ipc-fallback-phase12-sync.md

| セクション | 行 |
|------------|----|
| 2026-03-08 - TASK-FIX-IPC-HANDLER-GRACEFUL-DEGRADATION-001 仕様同期 | L5 |
| 2026-03-08 - TASK-FIX-SUPABASE-FALLBACK-PROFILE-AVATAR-001 Phase 12 実績同期と教訓追加 | L24 |
| 2026-03-08 - TASK-FIX-SUPABASE-FALLBACK-PROFILE-AVATAR-001 Phase 12完了同期 | L42 |
| 2026-03-08 - workflow11 再確認反映（画面証跡 + 未タスク + broken link 是正） | L59 |
| 2026-03-08 - TASK-10A-F final sync（2workflow 正規化） | L81 |
| 2026-03-08 - TASK-10A-F current workflow 再確認追補 | L104 |
| 2026-03-08 - TASK-10A-F Phase 12タスク仕様再確認 | L127 |
| 2026-03-08 - 06-TASK-FIX-SETTINGS-APIKEY-CONTRACT-GUARD-001 再監査同期 | L150 |
| 2026-03-07 - TASK-10A-F Store駆動ライフサイクルUI統合の仕様同期 | L173 |
| 2026-03-07 - TASK-FIX-SETTINGS-PERSIST-ITERABLE-HARDENING-001 仕様同期 | L201 |
| 2026-03-07 - TASK-10A-E-C Store駆動ライフサイクル統合設計の仕様同期 | L218 |
| 2026-03-07 - TASK-UI-03-AGENT-VIEW-ENHANCEMENT Phase 12 完了 | L220 |
| 2026-03-06 - TASK-UI-02 completed-tasks 移管（workflow + 派生未タスク） | L244 |
| 2026-03-06 - TASK-FIX-AUTH-MODE-CONTRACT-ALIGNMENT-001 completed-tasks 移管 | L267 |
| 2026-03-06 - auth-mode 由来の domain spec 同期ブロック残課題を仕様同期 | L295 |
| 2026-03-06 - TASK-FIX-AUTH-MODE-CONTRACT-ALIGNMENT-001 system spec 記述粒度最適化 | L324 |
| 2026-03-06 - TASK-FIX-AUTH-MODE-CONTRACT-ALIGNMENT-001 Phase 12準拠再確認（未タスク診断強化） | L353 |

### references/logs-archive-2026-03-line-budget-reform-formalize.md

| セクション | 行 |
|------------|----|
| 2026-03-12 - TASK-IMP-TASK-SPECIFICATION-CREATOR-LINE-BUDGET-REFORM-001 system spec sync | L5 |
| 2026-03-12 - TASK-IMP-LIGHT-THEME-CONTRAST-REGRESSION-GUARD-001 未タスク formalize | L23 |
| 2026-03-12 - TASK-IMP-LIGHT-THEME-CONTRAST-REGRESSION-GUARD-001 Phase 12 再確認追補 | L40 |
| 2026-03-12 - TASK-IMP-LIGHT-THEME-CONTRAST-REGRESSION-GUARD-001 仕様書集約（再利用導線最適化） | L57 |
| 2026-03-12 - TASK-IMP-LIGHT-THEME-CONTRAST-REGRESSION-GUARD-001 Phase 1-12 同期 | L74 |
| 2026-03-12 - TASK-FIX-LIGHT-THEME-SHARED-COLOR-MIGRATION-001 の spec_created 追補を system spec へ同期 | L92 |
| 2026-03-11 - TASK-UI-04C follow-up の未タスク formalize を system spec へ同期 | L110 |
| 2026-03-11 - TASK-UI-04C follow-up の未タスク formalize を system spec へ同期 | L128 |
| 2026-03-11 - TASK-UI-04C の cross-cutting system spec 入口を補完 | L146 |
| 2026-03-11 - TASK-UI-04C-WORKSPACE-PREVIEW を system spec 正本へ同期 | L164 |
| 2026-03-11 - TASK-UI-04B-WORKSPACE-CHAT Phase 12 仕様同期 | L182 |
| 2026-03-11 - TASK-FIX-LIGHT-THEME-TOKEN-FOUNDATION-001 global light remediation 仕様同期 | L200 |
| 2026-03-11 - TASK-FIX-LIGHT-THEME-TOKEN-FOUNDATION-001 completed workflow 同期 | L217 |
| 2026-03-11 - UT-IMP-APIKEY-CHAT-TRIPLE-SYNC-GUARD-001 完了移管 | L234 |
| 2026-03-11 - UT-IMP-APIKEY-CHAT-TRIPLE-SYNC-GUARD-001 追加 | L251 |
| 2026-03-11 - TASK-FIX-APIKEY-CHAT-TOOL-INTEGRATION-001 Phase 12再確認（ユーザー再依頼） | L268 |
| 2026-03-11 - TASK-FIX-APIKEY-CHAT-TOOL-INTEGRATION-001 仕様書集約（再利用導線最適化） | L286 |
| 2026-03-11 - TASK-FIX-APIKEY-CHAT-TOOL-INTEGRATION-001 Phase 12 再監査同期 | L303 |
| 2026-03-11 - TASK-UI-07 由来の dual skill-root follow-up を system spec へ登録 | L321 |
| 2026-03-11 - TASK-UI-07 の UI カタログ要約カードを system spec へ追加 | L338 |

### references/logs-archive-2026-03-line-budget-workflow-consolidation.md

| セクション | 行 |
|------------|----|
| 2026-03-13 - TASK-IMP-AIWORKFLOW-REQUIREMENTS-LINE-BUDGET-REFORM-001 workflow spec consolidation | L5 |
| 2026-03-06 - TASK-043B 再監査の状態契約・参照導線補強 | L34 |
| 2026-03-06 - TASK-043B Phase 12準拠再確認と skill 改善同期 | L59 |
| 2026-03-06 - TASK-043B 由来の legacy 未タスク正規化課題を分離 | L83 |
| 2026-03-06 - TASK-043B の簡潔解決手順を UI 機能仕様へ追補 | L105 |
| 2026-03-06 - TASK-043B 由来の skill import 契約横展開UTを追加 | L125 |
| 2026-03-06 - TASK-10A-E-C Phase 12再確認（仕様同期 + 画面証跡補完） | L150 |
| 2026-03-06 - TASK-10A-E-C Phase 12 準拠再確認（苦戦箇所同期 + 未タスク整形） | L173 |
| 2026-03-09 - TASK-10A-F P50検証ワークフロー実行（Phase 1-13完了） | L196 |
| 2026-03-08 - TASK-10A-E-D/TASK-UI-03/TASK-10A-F 仕様同期 | L211 |
| 2026-03-09 - TASK-FIX-AGENT-EXECUTE-SKILL-CONCURRENCY-GUARD-001 再監査追補 | L237 |
| 2026-03-09 - TASK-10A-G ライフサイクル統合テスト hardening と Phase 12再監査 | L260 |
| 2026-03-09 - TASK-FIX-AUTHGUARD-TIMEOUT-SETTINGS-BYPASS-001 | L287 |
| 2026-03-10 - TASK-10A-G | L303 |

### references/logs-archive-2026-03-mid-lifecycle-governance-improve.md

| セクション | 行 |
|------------|----|
| TASK-FIX-CONVERSATION-IPC-HANDLER-REGISTRATION 完了（2026-03-16） | L5 |
| TASK-FIX-ELECTRON-APP-MENU-ZOOM-001 完了（2026-03-16） | L20 |
| UT-06-001 完了（2026-03-16） | L31 |
| TASK-SKILL-LIFECYCLE-06 完了（2026-03-16） | L41 |
| UT-06-005 abort-skip-retry-fallback 完了（2026-03-16） | L59 |
| UT-LIFECYCLE-EXECUTION-STATUS-TYPE-SPEC-SYNC-001（2026-03-20） | L73 |
| UT-TASK06-007 IPC契約ドリフト自動検出スクリプト完了（2026-03-18） | L93 |
| 2026-03-24: TASK-IMP-ADVANCED-CONSOLE-SAFETY-GOVERNANCE-001 | L142 |
| UT-SC-02-005 preload execute 型追従の Phase 12 整理（2026-03-25） | L150 |

### references/logs-archive-2026-03-notification-history-sigterm-guard.md

| セクション | 行 |
|------------|----|
| 2026-03-05 - TASK-UI-01-C Notification/HistorySearch 実装の Phase 12仕様同期 | L5 |
| 2026-03-05 - UT-IMP-DESKTOP-TESTRUN-SIGTERM-FALLBACK-GUARD-001 未タスク登録 | L35 |
| 2026-03-05 - TASK-FIX-AUTH-KEY-HANDLER-REGISTRATION-001 追補（SIGTERM運用ガード + 5分解決カード） | L65 |
| 2026-03-05 - TASK-FIX-AUTH-KEY-HANDLER-REGISTRATION-001 再監査（Phase 11画面証跡同期） | L94 |
| 2026-03-05 - TASK-FIX-AUTH-KEY-HANDLER-REGISTRATION-001 Phase 12同期 | L125 |
| 2026-03-05 - TASK-UI-01-A Phase 12追補（workflowパス正規化ガード） | L154 |
| 2026-03-05 - TASK-UI-01-A Phase 12準拠再確認（未タスク運用追補） | L185 |
| 2026-03-05 - TASK-UI-01-A-STORE-SLICE-BASELINE 再監査（仕様同期漏れ是正） | L215 |
| 2026-03-05 - UT-TASK-10A-B-009 未タスク起票（配置3分類 + target監査境界ガード） | L246 |
| 2026-03-05 - UT-TASK-10A-B-001 再利用最適化（クイック解決カード同期） | L276 |
| 2026-03-05 - UT-TASK-10A-B-001 最終再監査（未タスク配置是正） | L301 |
| 2026-03-04 - Phase 11 画面カバレッジマトリクス未記載 warning の未タスク化 | L330 |
| 2026-03-04 - UT workflow Phase 11証跡正規化（coverage validator fail是正） | L354 |

### references/logs-archive-2026-03-skill-views-completed-move.md

| セクション | 行 |
|------------|----|
| 2026-03-01 - TASK-UI-05B spec_created 同期 + 参照切れ是正 | L5 |
| 2026-03-01 - TASK-UI-05 completed-tasks 移管 | L32 |
| 2026-03-01 - UT-UI-05-007 未タスク登録（UI仕様同期ガード） | L57 |
| 2026-03-01 - TASK-UI-05 UI仕様書追補（未タスク6件 + 苦戦箇所） | L83 |
| 2026-03-01 - TASK-UI-05 Phase 12再確認（苦戦箇所テンプレート追補） | L108 |
| [実行日時: 2026-03-06T04:42:41.549Z] | L131 |
| 2026-03-01 - TASK-UI-05-SKILL-CENTER-VIEW Phase 12 最終同期 | L141 |
| 2026-03-02 - TASK-10A-B 再監査（画面証跡ベース）と仕様同期 | L176 |
| 2026-03-05 - UT-TASK-10A-B-001 完了同期（自動修正可能フィルタボタン） | L213 |
| 2026-03-05 - UT-TASK-10A-B-001 再監査追補（light証跡ドリフト是正） | L241 |
| 2026-03-05 - TASK-UI-01-C Phase 12準拠の再確認（指定ディレクトリ未タスク監査） | L270 |
| 2026-03-05 - TASK-FIX-AUTH-KEY-HANDLER-REGISTRATION-001 教訓同期追補 | L301 |
| 2026-03-05 - TASK-FIX-SKILL-EXECUTOR-AUTHKEY-DI-001 Phase 12仕様準拠の再確認 | L326 |
| 2026-03-06 - TASK-043B SkillManagementPanel import list refinement 完了同期 | L355 |

### references/logs-archive-2026-03-task-10a-c-final-audit.md

| セクション | 行 |
|------------|----|
| 2026-03-03 - TASK-10A-C 最終再確認（仕様反映 + 画面証跡） | L5 |
| 2026-03-02 - TASK-10A-C SubAgent責務分離の仕様固定 | L31 |
| 2026-03-02 - TASK-10A-C 教訓追補（lessons-learned同期） | L57 |
| 2026-03-02 - TASK-10A-C SkillCreateWizard 再監査と仕様同期（Phase 12 Step 1-A） | L76 |
| 2026-03-02 - TASK-10A-B SkillAnalysisView 実装完了（Phase 12 Step 1-A） | L101 |
| 2026-03-02 - UT-IMP-PHASE12-TWO-WORKFLOW-EVIDENCE-BUNDLE-001 未タスク登録 | L121 |
| 2026-03-02 - Phase 12準拠再確認（TASK-UI-05A / TASK-UI-05） | L146 |
| 2026-03-02 - TASK-UI-05A 再監査（実装実体同期 + 未タスク正本化） | L172 |
| 2026-03-01 - TASK-UI-05A 包括的監査・getFileTree仕様追加 | L201 |
| 2026-03-01 - TASK-UI-05A spec_created 再監査（画面証跡付き） | L219 |
| 2026-03-02 - TASK-UI-05B 仕様書別SubAgent最適化（6仕様書分割） | L248 |
| 2026-03-02 - TASK-UI-05B Phase 12 再確認追補（苦戦箇所の再資産化） | L284 |
| 2026-03-02 - TASK-UI-05B 実装完了再同期（spec_created残存解消 + 画面証跡再取得） | L318 |
| 2026-03-01 - TASK-UI-05B アーキテクチャ層仕様書追補（多角的検証で検出） | L356 |

### references/logs-archive-2026-03-workflow02-screenshot-guard.md

| セクション | 行 |
|------------|----|
| 2026-03-04 - workflow02 再確認（screenshot Port 5174 競合ガード同期） | L5 |
| 2026-03-04 - UT-IMP-PHASE12-SCREENSHOT-COMMAND-REGISTRATION-GUARD-001 完了状態の再同期 | L30 |
| 2026-03-04 - 未タスク仕様書（coverage include pathガード）をシステム仕様へ同期 | L53 |
| 2026-03-04 - SkillCenter削除導線ホットフィックス実測値の再確定（coverage include path是正） | L77 |
| 2026-03-04 - TASK-FIX-SKILL-CENTER-METADATA-DEFENSIVE-GUARD-001 第2回再確認（証跡・未タスク移管の最終同期） | L101 |
| 2026-03-04 - SkillCenter削除導線ホットフィックス再確認（テスト・仕様同期） | L125 |
| 2026-03-04 - Phase 12テンプレート最適化の仕様同期（preview preflight分岐） | L150 |
| 2026-03-04 - TASK-FIX-SKILL-CENTER-METADATA-DEFENSIVE-GUARD-001 再監査追補（preview preflight課題の分離） | L173 |
| 2026-03-04 - TASK-FIX-SKILL-CENTER-METADATA-DEFENSIVE-GUARD-001 再監査（漏れ補完） | L197 |
| 2026-03-04 - TASK-FIX-SKILL-IMPORT 3連続是正の仕様同期（再監査） | L224 |
| 2026-03-04 - TASK-10A-D 苦戦箇所の未タスク分離（2件） | L251 |
| 2026-03-04 - TASK-10A-D 仕様書別SubAgent運用の最適化 | L272 |
| 2026-03-04 - TASK-10A-D 再確認追補（Phase 12再検証 + 画面証跡解釈同期） | L291 |
| 2026-03-03 - TASK-10A-D 再監査追補（証跡再取得 + 未タスクリンク是正） | L311 |
| 2026-03-03 - TASK-10A-D スキルライフサイクルUI統合 完了同期 | L330 |
| 2026-03-03 - TASK-10A-C 未タスク仕様書2件の追加（再発防止ガード） | L352 |

### references/logs-archive-index.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| archive list | L7 |

### references/logs-archive-legacy.md

| セクション | 行 |
|------------|----|
| TASK-AUTH-CALLBACK-001: OAuth認証コールバックPKCE移行 | L6 |
| TASK-FIX-4-2-SKILL-STORE-PERSISTENCE | L58 |
| 変更履歴アーカイブ | L111 |

### references/observability-monitoring.md

| セクション | 行 |
|------------|----|
| 1. 無料枠の境界 | L15 |
| 2. WAE 6 イベント設計（reference） | L42 |
| 3. アラート閾値設計指針 | L59 |
| 4. PII 除外ルール | L85 |
| 5. 苦戦箇所（恒久対策） | L101 |
| 6. 関連ファイル | L126 |
| 7. 09b Cron / Incident Response Runbook Linkage（2026-05-01） | L138 |
| 8. 変更履歴 | L146 |

### references/patterns-advanced.md

| セクション | 行 |
|------------|----|
| 成功パターン | L6 |
| 失敗パターン（避けるべきこと） | L67 |
| ガイドライン | L321 |

### references/patterns-core.md

| セクション | 行 |
|------------|----|
| 目次 | L6 |

### references/patterns-details.md

| セクション | 行 |
|------------|----|
| 成功パターン | L6 |

### references/patterns.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L13 |
| 関連ドキュメント | L18 |

### references/phase-12-documentation-retrospective.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 実施した内容 | L10 |
| 課題（苦戦ポイント） | L31 |
| 運用上の最適化提案 | L49 |
| 現在の状態 | L55 |

### references/plugin-development.md

| セクション | 行 |
|------------|----|
| プラグインアーキテクチャ概要 | L8 |
| プラグイン追加フロー | L33 |
| IWorkflowExecutor 実装ガイド | L62 |
| スキーマ定義ガイド | L101 |
| 共通インフラストラクチャの使用 | L137 |
| エラーハンドリング | L187 |
| テスト作成ガイド | L219 |
| Registry 登録 | L259 |
| 実装チェックリスト | L281 |
| サンプルプラグイン仕様 | L317 |
| 個人開発における注意点 | L345 |
| 関連ドキュメント | L373 |

### references/quality-e2e-testing.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 概要 | L21 |
| テスト戦略 | L35 |
| E2Eテストフィクスチャ | L55 |
| フィクスチャ詳細仕様 | L92 |
| フィクスチャ検証テスト | L142 |
| SkillScannerテスト統合パターン | L198 |
| 完了タスク | L218 |
| skill-creatorフィクスチャ検証テスト（TASK-8C-G） | L327 |
| 残課題（未タスク） | L366 |
| 関連ドキュメント | L377 |

### references/quality-requirements-advanced.md

| セクション | 行 |
|------------|----|
| 保守性 | L6 |
| アクセシビリティ | L106 |
| テストカバレッジ目標 | L125 |

### references/quality-requirements-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| パフォーマンス要件 | L37 |

### references/quality-requirements-details.md

| セクション | 行 |
|------------|----|
| テスト戦略（TDD実践ガイド） | L6 |
| セキュリティ | L343 |
| 可用性 | L371 |

### references/quality-requirements-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 完了タスク | L14 |
| 変更履歴 | L375 |

### references/r2-storage-decision-guide.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| 判断ポイント一覧 | L13 |
| 採用案 A: 環境別 2 バケット | L23 |
| 採用案 D: 専用 R2 Token | L51 |
| 採用案 F: プライベートバケット + Presigned URL / Proxy | L68 |
| CORS テンプレート | L101 |
| 変更履歴 | L119 |

### references/rag-desktop-state.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| テーマ状態管理 | L16 |
| ワークスペース状態管理 | L37 |
| システムプロンプト状態管理 | L60 |
| IPCチャネル設計（チャット・LLM選択） | L98 |
| LLM選択アーキテクチャ | L121 |
| セキュリティ考慮事項 | L154 |
| 関連ドキュメント | L165 |

### references/rag-knowledge-graph.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| 主要型定義 | L19 |
| EntityEntity型（ノード） | L32 |
| RelationEntity型（エッジ） | L63 |
| CommunityEntity型（クラスター） | L96 |
| バリデーション（Zod） | L118 |
| ユーティリティ関数 | L133 |
| 型安全性の保証 | L148 |
| テストカバレッジ | L160 |
| 関連ドキュメント | L174 |

### references/rag-query-pipeline.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| 概要 | L22 |
| GraphRAGクエリサービス | L28 |
| HybridRAG統合パイプライン | L104 |
| クエリタイプと検索重み | L185 |
| フォールバック設計 | L196 |
| パフォーマンス目標 | L210 |
| HybridRAGFactory | L222 |
| テスト品質 | L272 |
| 関連ドキュメント | L281 |

### references/rag-search-crag.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L14 |
| アーキテクチャ | L24 |
| 主要インターフェース | L50 |
| 型定義 | L70 |
| 設定オプション | L129 |
| 外部依存インターフェース | L151 |
| 定数 | L189 |
| 型ガード | L207 |
| アクション決定ロジック | L220 |
| テスト品質 | L230 |
| 関連ドキュメント | L240 |

### references/rag-search-graph.md

| セクション | 行 |
|------------|----|
| GraphSearchStrategyインターフェース | L14 |
| クエリタイプ | L24 |
| GraphSearchOptions | L34 |
| 依存インターフェース | L46 |
| スコアリング | L56 |
| 定数 | L66 |
| テスト品質 | L79 |
| 関連ドキュメント | L88 |

### references/rag-search-hybrid.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| HybridRAGEngineクラス | L29 |
| HybridRAGResponse | L56 |
| HybridRAGResult | L76 |
| PipelineStageResult | L88 |
| SearchOptions（HybridRAG） | L101 |
| HybridRAGOptions | L112 |
| 定数 | L121 |
| HybridRAGFactory | L131 |
| テスト品質 | L306 |
| 関連ドキュメント | L315 |

### references/rag-search-keyword.md

| セクション | 行 |
|------------|----|
| IKeywordSearchStrategy | L14 |
| KeywordSearchError | L28 |
| 定数 | L48 |
| 検索モード | L58 |
| FTS5テーブル構造 | L68 |
| FTS5クエリパターン | L81 |
| BM25スコア正規化 | L93 |
| データフロー | L106 |
| 非機能要件 | L121 |
| テスト品質 | L133 |
| 関連ドキュメント | L142 |
| 変更履歴 | L150 |

### references/rag-search-types.md

| セクション | 行 |
|------------|----|
| 主要型 | L14 |
| 列挙型 | L56 |
| 検索設定型 | L66 |
| デフォルト値 | L106 |
| ユーティリティ関数 | L114 |
| 型ガード | L129 |
| バリデーション | L139 |
| クエリ分類器 | L153 |
| 関連ドキュメント | L173 |

### references/rag-search-vector.md

| セクション | 行 |
|------------|----|
| ISearchStrategy実装 | L14 |
| VectorSearchStrategyインターフェース | L25 |
| Result型 | L35 |
| フィルタ対応 | L52 |
| 定数 | L65 |
| CachedVectorSearchStrategy | L77 |
| テスト品質 | L88 |
| 関連ドキュメント | L97 |
| 変更履歴 | L106 |

### references/rag-services.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| 概要 | L22 |
| クエリ分類器 | L28 |
| エンティティ抽出サービス (NER) | L88 |
| コミュニティ検出サービス (Leiden Algorithm) | L174 |
| 関連ドキュメント | L296 |
| Task08 完了記録（2026-03-19） | L304 |

### references/rag-vector-search.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| 概要 | L19 |
| アーキテクチャ構成 | L32 |
| 距離メトリクス | L57 |
| 類似度計算 | L67 |
| ベクトルインデックス設定 | L77 |
| プリセット設定 | L94 |
| データフロー | L104 |
| CASCADE DELETE | L114 |
| オフライン・同期アーキテクチャ | L120 |
| VectorSearchStrategy（セマンティック検索） | L151 |
| 関連ドキュメント | L221 |

### references/skill-executor-type-migration.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 実装内容 | L7 |
| 苦戦した箇所と解決策 | L28 |
| 関連タスク | L63 |
| 参照 | L72 |
| 変更履歴 | L77 |

### references/skill-ledger-fragment-spec.md

| セクション | 行 |
|------------|----|
| 1. 目的 | L7 |
| 2. fragment 命名規約 | L11 |
| 3. front matter schema | L40 |
| 4. TypeScript 型定義 | L60 |
| 5. render API（CLI / TS） | L83 |
| 6. append helper の責務 | L118 |
| 7. エラーハンドリング | L138 |
| 8. 4 worktree smoke | L147 |
| 9. 後方互換 | L159 |
| 10. 関連 references | L165 |

### references/skill-ledger-gitattributes-policy.md

| セクション | 行 |
|------------|----|
| 1. 目的 | L8 |
| 2. 位置付け | L12 |
| 3. 適用許可リスト | L16 |
| 4. 適用禁止リスト | L42 |
| 5. 検証 | L55 |
| 6. 2 worktree smoke | L69 |
| 7. 完了条件 | L91 |
| 8. 苦戦箇所 | L100 |
| 9. ロールバック | L109 |
| 10. 関連 references | L113 |

### references/skill-ledger-gitignore-policy.md

| セクション | 行 |
|------------|----|
| 1. 目的 | L8 |
| 2. 適用対象（gitignore 追記 glob） | L12 |
| 3. 適用 NG リスト | L32 |
| 4. 実施手順（runbook 抜粋） | L44 |
| 5. 検証コマンド | L78 |
| 6. 完了条件 | L102 |
| 7. 苦戦箇所（最重要） | L111 |
| 8. ロールバック | L120 |
| 9. 関連 references | L128 |

### references/skill-ledger-overview.md

| セクション | 行 |
|------------|----|
| 1. なぜこの設計が必要か | L7 |
| 2. 4 施策一覧 | L18 |
| 3. 実装順序（必須遵守） | L27 |
| 4. 責務分離の入口（references の役割分担） | L38 |
| 5. 後方互換方針 | L49 |
| 6. 集約 view の取得手段 | L56 |
| 7. 検証 / smoke の集約参照 | L67 |
| 8. ロールバック粒度 | L77 |
| 9. 関連タスクと canonical set | L88 |
| 10. 不変条件（Phase 12 で凍結） | L106 |

### references/skill-ledger-progressive-disclosure.md

| セクション | 行 |
|------------|----|
| 1. 目的 | L9 |
| 2. 行数ガード | L13 |
| 3. SKILL.md（entry）に残す要素 | L33 |
| 4. references への抽出ルール | L49 |
| 5. classification-first との関係 | L56 |
| 6. mirror 同期 | L62 |
| 7. リンク健全性検証 | L78 |
| 8. 完了条件 | L96 |
| 9. 苦戦箇所 | L105 |
| A-3 適用事例 | L116 |
| 10. 関連 references | L141 |

### references/spec-elegance-consistency-audit.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| 期待する出力 | L17 |
| SubAgent-Lane 分割 | L27 |
| 多角的監査マトリクス | L38 |
| 監査順序 | L63 |
| 必須コマンド | L71 |
| 完了判定 | L96 |
| 失敗時の処理 | L107 |
| 今後追加時の反映境界 | L116 |
| 今後追加時の同一 wave checklist | L128 |
| ユーザー依頼テンプレ | L140 |

### references/spec-guidelines.md

| セクション | 行 |
|------------|----|
| テンプレート一覧 | L7 |
| 命名規則 | L29 |
| 記述形式 | L75 |
| すべきこと | L95 |
| 避けるべきこと | L104 |
| 新規仕様の追加手順 | L113 |
| 完了タスクセクション標準化 | L121 |
| ファイルサイズ管理 | L169 |

### references/spec-splitting-guidelines.md

| セクション | 行 |
|------------|----|
| 概要 | L7 |
| 分割判断基準 | L13 |
| インターフェース仕様（interfaces-）の分割パターン | L23 |
| 2026-03 line budget reform 標準パターン | L56 |
| アーキテクチャ仕様（architecture-）の分割パターン | L173 |
| API仕様（api-）の分割パターン | L195 |
| UI/UX仕様（ui-ux-）の分割パターン | L217 |
| セキュリティ仕様（security-）の分割パターン | L239 |
| データベース仕様（database-）の分割パターン | L261 |
| 技術スタック仕様（technology-）の分割パターン | L283 |
| ワークフロー仕様（workflow-）の分割パターン | L303 |
| Claude Code仕様（claude-code-）の分割パターン | L323 |
| 分割実行手順 | L344 |
| 命名規則 | L399 |
| 分割後のメンテナンス | L430 |
| 関連ドキュメント | L450 |
| 変更履歴 | L459 |

### references/task-workflow-active.md

| セクション | 行 |
|------------|----|
| 概要 | L7 |
| ドキュメント構成 | L81 |
| フェーズ構造（概要） | L90 |
| 品質ゲート（概要） | L121 |
| 出力テンプレート | L132 |
| 実行時のコマンド・エージェント・スキル | L155 |
| 昇格パターン集 | L179 |
| Current Active / Spec Created Tasks | L181 |

### references/task-workflow-backlog-part2.md

| セクション | 行 |
|------------|----|
| 残課題（未タスク）続き | L4 |

### references/task-workflow-backlog.md

| セクション | 行 |
|------------|----|
| 残課題（未タスク） | L6 |
| task-worktree-environment-isolation follow-up（2026-04-28） | L356 |
| TASK-SKILL-CODEX-VALIDATION-001 follow-up（2026-04-28） | L367 |
| 続き | L377 |

### references/task-workflow-completed-abort-contract-auth-session-chat.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| TASK-10A-B: SkillAnalysisView 実装完了記録（2026-03-02） | L278 |

### references/task-workflow-completed-advanced-views-analytics-audit.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |

### references/task-workflow-completed-agent-view-line-budget.md

| セクション | 行 |
|------------|----|
| TASK-UI-03-AGENT-VIEW-ENHANCEMENT current workflow 再監査記録（2026-03-10） | L8 |
| TASK-IMP-LIGHT-THEME-CONTRAST-REGRESSION-GUARD-001 Phase 1-12 実行記録（2026-03-12 JST） | L43 |
| 07-TASK-FIX-SETTINGS-PERSIST-ITERABLE-HARDENING-001 完了記録（2026-03-08） | L107 |
| TASK-FIX-SAFEINVOKE-TIMEOUT-001 再監査同期（2026-03-10） | L127 |
| TASK-IMP-AIWORKFLOW-REQUIREMENTS-LINE-BUDGET-REFORM-001 | L164 |

### references/task-workflow-completed-chat-lifecycle-tests-part2.md

| セクション | 行 |
|------------|----|

### references/task-workflow-completed-chat-lifecycle-tests.md

| セクション | 行 |
|------------|----|
| 完了タスク | L9 |

### references/task-workflow-completed-debug-scheduler-doc-generation-theme.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |

### references/task-workflow-completed-ipc-contract-preload-alignment.md

| セクション | 行 |
|------------|----|
| 完了タスク | L7 |

### references/task-workflow-completed-ipc-graceful-degradation-lifecycle.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |
| TASK-FIX-CONVERSATION-DB-ROBUSTNESS-001 | L395 |

### references/task-workflow-completed-ipc-preload-foundation.md

| セクション | 行 |
|------------|----|

### references/task-workflow-completed-notification-history-auth-key-state.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |

### references/task-workflow-completed-quality-gates-module-resolution-logging.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |

### references/task-workflow-completed-recent-2026-03a.md

| セクション | 行 |
|------------|----|
| 完了タスク | L4 |

### references/task-workflow-completed-recent-2026-03b.md

| セクション | 行 |
|------------|----|
| 完了タスク | L4 |

### references/task-workflow-completed-recent-2026-03c.md

| セクション | 行 |
|------------|----|
| 完了タスク | L4 |

### references/task-workflow-completed-recent-2026-03d.md

| セクション | 行 |
|------------|----|
| 完了タスク | L4 |

### references/task-workflow-completed-recent-2026-03e.md

| セクション | 行 |
|------------|----|
| 完了タスク | L4 |

### references/task-workflow-completed-recent-2026-04a.md

| セクション | 行 |
|------------|----|
| 完了タスク | L4 |

### references/task-workflow-completed-recent-2026-04b.md

| セクション | 行 |
|------------|----|
| 完了タスク | L4 |
| UT-TASK-SPEC-TEMPLATE-IMPROVEMENT-001: task-specification-creator Phase-12 テンプレート改善 | L184 |

### references/task-workflow-completed-recent-2026-04c.md

| セクション | 行 |
|------------|----|

### references/task-workflow-completed-recent-2026-04d.md

| セクション | 行 |
|------------|----|

### references/task-workflow-completed-skill-create-ui-integration.md

| セクション | 行 |
|------------|----|
| TASK-10A-C: SkillCreateWizard 実装完了記録（2026-03-02） | L8 |
| TASK-10A-D: スキルライフサイクルUI統合 実装完了記録（2026-03-03） | L75 |
| TASK-SC-08-E2E-VALIDATION: Skill Creator LLM統合 E2E検証 + TerminalHandoff（2026-03-25） | L363 |

### references/task-workflow-completed-skill-import-skill-center-nav.md

| セクション | 行 |
|------------|----|
| 完了タスク | L6 |

### references/task-workflow-completed-skill-lifecycle-agent-view-line-budget.md

| セクション | 行 |
|------------|----|
| TASK-FIX-ELECTRON-APP-MENU-ZOOM-001: Electronアプリケーションメニュー初期化・ズームショートカット対応 完了記録（2026-03-16） | L20 |
| TASK-SKILL-LIFECYCLE-07: ライフサイクル履歴・フィードバック統合 設計完了記録（2026-03-16） | L81 |
| TASK-10A-C: SkillCreateWizard 実装完了記録（2026-03-02） | L131 |

### references/task-workflow-completed-skill-lifecycle-archive-2026-03.md

| セクション | 行 |
|------------|----|
| TASK-IMP-CHATPANEL-REAL-AI-CHAT-001: ChatPanel Real AI Chat 配線 設計完了記録（2026-03-18） | L9 |
| TASK-IMP-VIEWTYPE-RENDERVIEW-FOUNDATION-001: ViewType/renderView 基盤拡張 完了記録（2026-03-17） | L42 |
| UT-06-003: DefaultSafetyGate 具象クラス実装完了記録（2026-03-16） | L91 |
| UT-06-005: abort/skip/retry/timeout Permission Fallback 実装完了記録（2026-03-16） | L129 |
| UT-06-005-A: PreToolUse Hook fallback 統合完了記録（2026-03-17） | L166 |
| TASK-SKILL-LIFECYCLE-04: 採点・評価・受け入れゲート統合 再監査記録（2026-03-14） | L193 |
| TASK-SKILL-LIFECYCLE-05: 作成済みスキルを使う主導線（設計タスク）完了記録（2026-03-15） | L231 |
| TASK-SKILL-LIFECYCLE-08: スキル共有・公開・互換性統合（設計タスク）仕様書作成完了記録（2026-03-16） | L264 |
| TASK-SKILL-LIFECYCLE-06: 信頼・権限ガバナンス（設計タスク）完了記録（2026-03-16） | L290 |

### references/task-workflow-completed-skill-lifecycle-authfix.md

| セクション | 行 |
|------------|----|
| 完了タスク | L9 |

### references/task-workflow-completed-skill-lifecycle-design.md

| セクション | 行 |
|------------|----|
| TASK-SKILL-LIFECYCLE-04: 採点・評価・受け入れゲート統合 再監査記録（2026-03-14） | L8 |
| TASK-SKILL-LIFECYCLE-05: 作成済みスキルを使う主導線（設計タスク）完了記録（2026-03-15） | L93 |
| TASK-SKILL-LIFECYCLE-05: 作成済みスキル利用導線 再監査記録（2026-03-15） | L115 |
| TASK-SKILL-LIFECYCLE-08: スキル共有・公開・互換性統合（設計タスク）仕様書作成完了記録（2026-03-16） | L168 |
| TASK-SKILL-LIFECYCLE-06: 信頼・権限ガバナンス（設計タスク）完了記録（2026-03-16） | L205 |
| Task09-12: スキルライフサイクル統合 UI GAP 解消 + 状態遷移完成 仕様書作成記録（2026-03-18） | L254 |
| UT-SC-02-002: execute() terminal_handoff 分岐追加 完了記録（2026-03-23） | L295 |

### references/task-workflow-completed-skill-lifecycle-security.md

| セクション | 行 |
|------------|----|
| UT-06-003: DefaultSafetyGate 具象クラス実装完了記録（2026-03-16） | L7 |
| UT-06-005: abort/skip/retry/timeout Permission Fallback 実装完了記録（2026-03-16） | L45 |
| TASK-SKILL-LIFECYCLE-06: 信頼・権限ガバナンス（設計タスク）完了記録（2026-03-16） | L82 |
| UT-06-002: AllowedToolEntryV2 PermissionStore V2 拡張完了記録（2026-03-23） | L129 |

### references/task-workflow-completed-skill-lifecycle-ui-verify.md

| セクション | 行 |
|------------|----|
| TASK-RT-03-VERIFY-IMPROVE-PANEL-001: Verify / Improve 結果パネル実装 完了記録（2026-04-04） | L7 |
| TASK-SKILL-LIFECYCLE-04: 採点・評価・受け入れゲート統合 再監査記録（2026-03-14） | L48 |
| TASK-SKILL-LIFECYCLE-05: 作成済みスキルを使う主導線（設計タスク）完了記録（2026-03-15） | L133 |
| TASK-SKILL-LIFECYCLE-05: 作成済みスキル利用導線 再監査記録（2026-03-15） | L155 |
| TASK-SKILL-LIFECYCLE-08: スキル共有・公開・互換性統合（設計タスク）仕様書作成完了記録（2026-03-16） | L218 |
| Task09-12: スキルライフサイクル統合 UI GAP 解消 + 状態遷移完成 仕様書作成記録（2026-03-18） | L255 |
| TASK-RT-05: multi_select ユーザー入力種別追加 完了記録（2026-03-30） | L298 |
| UT-LIFECYCLE-EXECUTION-STATUS-TYPE-SPEC-SYNC-001: SkillExecutionStatus型3値追加の仕様書同期 完了記録（2026-03-20） | L349 |

### references/task-workflow-completed-skill-lifecycle-ui.md

| セクション | 行 |
|------------|----|
| TASK-RT-03: SkillCreationResultPanel orchestration wrapper 完了記録（2026-04-06） | L7 |
| TASK-IMP-VIEWTYPE-RENDERVIEW-FOUNDATION-001: ViewType/renderView 基盤拡張 完了記録（2026-03-17） | L49 |
| TASK-IMP-SKILLDETAIL-ACTION-BUTTONS-001: SkillDetailPanel action buttons handoff 完了記録（2026-03-19） | L98 |
| TASK-IMP-AGENTVIEW-IMPROVE-ROUTE-001: AgentView 改善導線 round-trip 完了記録（2026-03-20） | L137 |
| TASK-10A-C: SkillCreateWizard 実装完了記録（2026-03-02） | L193 |
| TASK-10A-D: スキルライフサイクルUI統合 実装完了記録（2026-03-03） | L260 |

### references/task-workflow-completed-skill-lifecycle.md

| セクション | 行 |
|------------|----|
| 分割ファイル一覧 | L7 |
| タスクID 逆引き | L14 |

### references/task-workflow-completed-ui-ux-visual-baseline-drift.md

| セクション | 行 |
|------------|----|
| メタ情報 | L9 |
| 完了記録 | L20 |
| 関連ドキュメント | L55 |
| 変更履歴 | L66 |

### references/task-workflow-completed-ut-06-safety-gate.md

| セクション | 行 |
|------------|----|
| UT-06-003: DefaultSafetyGate 具象クラス実装完了記録（2026-03-16） | L8 |
| UT-06-003-PRELOAD-API-IMPL: evaluateSafety Preload API 追加完了記録（2026-03-23） | L46 |
| UT-06-005: abort/skip/retry/timeout Permission Fallback 実装完了記録（2026-03-16） | L85 |
| UT-06-001: tool-risk-config-implementation 完了記録（2026-03-16） | L122 |

### references/task-workflow-completed-workspace-chat-lifecycle-tests.md

### references/task-workflow-completed-workspace.md

| セクション | 行 |
|------------|----|

### references/task-workflow-completed.md

| セクション | 行 |
|------------|----|
| 最近の完了タスク（2026-04） | L7 |
| 完了タスク（2026-03後半） | L128 |
| 完了タスク（機能別アーカイブ） | L136 |
| UT-TASK-SPEC-TEMPLATE-IMPROVEMENT-001: task-specification-creator Phase-12 テンプレート改善 | L245 |

### references/task-workflow-history.md

| セクション | 行 |
|------------|----|
| 関連ドキュメント | L6 |
| 変更履歴 | L16 |

### references/task-workflow-phases.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| フェーズ構造 | L18 |
| 出力テンプレート | L189 |
| Phase 12/13 Close-out Workflow（2026-04-07追加） | L218 |

### references/task-workflow-rules.md

| セクション | 行 |
|------------|----|
| 品質ゲート | L8 |
| コマンド・エージェント・スキル選定ルール | L37 |
| タスク分解ルール | L94 |
| ドキュメント更新ルール | L115 |
| 実行時のコマンド・エージェント・スキル | L136 |
| 関連ドキュメント | L160 |

### references/task-workflow.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L15 |
| 利用順序 | L44 |
| 関連ドキュメント | L49 |
| 2026-04-28 DevEx Conflict Prevention Spec Wave | L53 |

### references/testing-accessibility.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| 1. ARIA属性テスト | L17 |
| 2. キーボードナビゲーション | L105 |
| 3. スクリーンリーダー互換性 | L169 |
| 4. 色とコントラスト | L214 |
| 5. 検証チェックリスト | L244 |
| 6. 自動テストツール | L270 |
| 7. WCAG 2.1 AAチェックリスト | L300 |
| 参照 | L327 |
| 変更履歴 | L335 |

### references/testing-component-patterns-advanced.md

| セクション | 行 |
|------------|----|
| 13. Atoms コンポーネントテストパターン（TASK-UI-00-ATOMS） | L6 |
| 14. Preload Shape 異常系テストパターン（2026-03-07追加） | L108 |
| 15. SettingsView 統合ハーネスパターン（2026-03-08追加） | L164 |
| 16. 統合テストハーネスパターン | L198 |

### references/testing-component-patterns-core.md

| セクション | 行 |
|------------|----|
| 概要 | L6 |
| 1. Storeモッキングパターン | L15 |
| 2. テストデータファクトリ | L80 |
| 3. アクセシビリティテスト | L150 |
| 4. キーボードナビゲーション | L204 |
| 5. 非同期テスト | L243 |
| 6. テスト構成 | L281 |
| 7. userEvent vs fireEvent | L317 |
| 8. テストファイル分離パターン（TASK-FIX-4-2） | L340 |

### references/testing-component-patterns-details.md

| セクション | 行 |
|------------|----|
| 9. Zustand Store Hooks テストパターン | L6 |
| 9.1 AuthMode 契約テストパターン（TASK-FIX-AUTH-MODE-CONTRACT-ALIGNMENT-001） | L187 |
| 10. Main Process SDKテスト有効化パターン（TASK-FIX-11-1-SDK-TEST-ENABLEMENT） | L240 |
| 11. SkillEditor テストパターン（TASK-9A completed） | L300 |
| 12. テーマ横断テストヘルパー（TASK-UI-00-TOKENS） | L369 |

### references/testing-component-patterns-history.md

| セクション | 行 |
|------------|----|
| 参照 | L6 |
| 関連未タスク | L15 |
| 変更履歴 | L25 |

### references/testing-component-patterns.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| 仕様書インデックス | L6 |
| 利用順序 | L14 |
| 関連ドキュメント | L19 |

### references/testing-dialog-patterns.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 概要 | L16 |
| ダイアログ種別 | L22 |
| テストカテゴリ構成 | L32 |
| Basic Flowパターン | L45 |
| Edge Casesパターン | L141 |
| Accessibilityパターン | L180 |
| ヘルパー関数定義 | L256 |
| 定数パターン | L289 |
| テストファイル実装例 | L313 |
| 関連ドキュメント | L328 |

### references/testing-fixtures.md

| セクション | 行 |
|------------|----|
| 概要 | L9 |
| 1. ファクトリ関数パターン | L16 |
| 2. 境界値フィクスチャ | L106 |
| 3. Storeモック構築 | L155 |
| 4. Propsビルダー | L209 |
| 5. Providerラッパー | L251 |
| 6. フィクスチャファイル構成 | L308 |
| 7. ベストプラクティス | L349 |
| 8. electronAPI Mock ファクトリ | L371 |
| 参照 | L438 |
| 変更履歴 | L446 |

### references/testing-playwright-e2e.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L8 |
| 概要 | L19 |
| テスト構成 | L43 |
| セレクター戦略 | L67 |
| 待機戦略 | L101 |
| ヘルパー関数パターン | L137 |
| テストスイート構造 | L182 |
| アクセシビリティテスト | L229 |
| beforeEachパターン | L264 |
| テストスキップパターン | L290 |
| CI/CD統合 | L306 |
| デバッグパターン | L358 |
| 関連ドキュメント | L380 |

### references/ui-history-components.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| ファイル構成 | L18 |
| コンポーネント構成 | L41 |
| Props定義 | L92 |
| カスタムフック | L130 |
| 関連ドキュメント | L210 |

### references/ui-history-data-types.md

| セクション | 行 |
|------------|----|
| 変更履歴 | L10 |
| データ型 | L19 |
| IPC通信 | L99 |
| 関連ドキュメント | L142 |

### references/ui-history-design.md

| セクション | 行 |
|------------|----|
| UI設計 | L10 |
| アクセシビリティ | L74 |
| エラーハンドリング | L140 |
| パフォーマンス | L190 |
| 関連ドキュメント | L211 |
| 変更履歴 | L219 |

### references/ui-history-integration.md

| セクション | 行 |
|------------|----|
| テストカバレッジ | L10 |
| 統合手順 | L34 |
| 統合ステータス | L53 |
| IPCハンドラー詳細（history-ipc-handlers） | L85 |
| タスク依存関係一覧 | L119 |
| タスク: history-preload-setup（2026-01-13完了） | L133 |
| タスク: history-manual-testing（2026-01-17完了） | L163 |
| 残課題 | L211 |
| 関連ドキュメント | L225 |

### references/ui-history-search-view.md

| セクション | 行 |
|------------|----|
| 概要 | L10 |
| 実装内容（要点） | L25 |
| UI責務 | L37 |
| コンポーネント構成 | L50 |
| 状態・導線契約 | L66 |
| IPC契約 | L105 |
| テスト・画面検証 | L124 |
| 苦戦箇所（再利用形式） | L149 |
| ライフサイクルタイムライン観測項目（TASK-SKILL-LIFECYCLE-07） | L167 |
| 関連ドキュメント | L189 |
| 変更履歴 | L199 |

### references/ui-result-panel-pattern.md

| セクション | 行 |
|------------|----|
| 概要 | L3 |
| コンポーネント構成 | L7 |
| 重要設計決定 | L25 |
| コンポーネント設計パターン早見表 | L65 |
| テスト戦略 | L74 |
| SkillLifecyclePanel 責務別props分離パターン | L82 |

---

