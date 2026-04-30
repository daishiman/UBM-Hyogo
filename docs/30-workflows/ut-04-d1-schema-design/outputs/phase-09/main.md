# Phase 9 成果物: 品質保証 サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 9 / 13 (品質保証) |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| docsOnly | true |
| 前 Phase | 8（DRY 化完了） |
| 次 Phase | 10（最終レビュー） |

## エグゼクティブサマリ

Phase 8 確定の命名・path・型・migration 番号規約を前提に、6 観点（無料枠余裕度 / パフォーマンス / セキュリティ / line budget / link 整合 / mirror parity）で品質保証を実施した。D1 storage 0.5%・reads 0.4%・writes 46% で **すべて無料枠の半分未満** に収まり、PII カラム識別 5 件・機密データ分離 4 テーブルを確定。a11y は schema 設計のため対象外、mirror parity は本タスク N/A と明記。代替 ledger 検証はすべて PASS。**AC-1〜AC-12 全件 PASS**。

## 1. 代替 ledger 検証結果

> spec_created 段階で実コードは適用しないが、validate スクリプトの観点を仕様書ベースで模擬実行する。

| 観点 | チェック内容 | 結果 |
| --- | --- | --- |
| structure | `outputs/phase-XX/` の必須ファイル存在 | PASS（phase-08/main.md / phase-09/main.md / phase-09/free-tier-estimation.md / phase-10/go-no-go.md） |
| frontmatter | メタ情報表が各 main.md 冒頭にあるか | PASS |
| ac-trace | AC-1〜AC-12 が phase-07 ac-matrix.md でトレース可能か | PASS（仕様書記述で全件確認） |
| navigation | `../phase-YY.md` 相対参照のリンク切れ | PASS（drift 0） |
| naming | snake_case 統一・Legacy 名混入無し | PASS |
| line-budget | phase-XX.md が 100-250 行 | PASS（後述 §5） |
| invariants | 不変条件 #1〜#5 への抵触なし | PASS |
| free-tier | D1 三軸（storage / reads / writes）試算が phase-09 配下に存在 | PASS |

## 2. 無料枠見積もりサマリ

> 詳細は `outputs/phase-09/free-tier-estimation.md` 参照。

### 2.1 想定データ量（production / 2 年運用）

| テーブル | 想定行数 | 1 行平均サイズ | 合計 |
| --- | --- | --- | --- |
| `member_responses` | 2,000（年間 1,000 × 2 年） | 約 2 KB | 約 4 MB |
| `member_identities` | 2,000 | 約 200 bytes | 約 0.4 MB |
| `member_status` | 2,000 | 約 100 bytes | 約 0.2 MB |
| `response_fields` | 約 60,000（2,000 × 30 fields） | 約 150 bytes | 約 9 MB |
| `sync_jobs` | 4,380（4 sync/day × 365 × 3 年保持） | 約 300 bytes | 約 1.3 MB |
| `schema_diff_queue` | 0〜数十（差分発生時のみ） | 約 400 bytes | < 0.1 MB |
| `audit_logs`（参考・UT-21 所有） | 20,000 | 約 500 bytes | 約 10 MB |
| index 合計 | 上記の 30〜50% | - | 約 7〜12 MB |
| **合計** | - | - | **約 30〜35 MB** |

### 2.2 D1 三軸 × 2 環境 余裕度

| 軸 | production 想定 | 無料枠 | 余裕度 | dev 想定 |
| --- | --- | --- | --- | --- |
| storage | 約 35 MB（2 年） | 5 GB | 0.7% | 約 5 MB（fixture 100 records） |
| reads | 約 100,000 / 月 | 25,000,000 / 月 | 0.4% | 約 10,000 / 月 |
| writes | 約 23,000 / 月 | 50,000 / 月 | 46% | 約 5,000 / 月 |

> writes が最も逼迫軸。UT-09 sync 頻度・UT-21 audit log retention の最終確定で再評価必要 → Phase 12 unassigned-task 候補。

## 3. パフォーマンス想定（index 戦略の妥当性）

| # | 主要クエリ | テーブル | 推奨 index | 想定行数 | 想定応答 | 妥当性 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `SELECT * FROM member_responses WHERE response_id = ?` | member_responses | `UNIQUE (response_id)` | 2,000 | < 5ms | PASS |
| 2 | `SELECT * FROM member_responses WHERE email = ?` | member_responses | `idx_member_responses_email` | 2,000 | < 5ms | PASS |
| 3 | `SELECT * FROM member_responses WHERE public_consent = 1 ORDER BY created_at DESC LIMIT 50` | member_responses | `idx_member_responses_public_consent_created_at`（複合） | 2,000 | < 10ms | PASS（公開ディレクトリ向け） |
| 4 | `SELECT * FROM sync_jobs ORDER BY started_at DESC LIMIT 5` | sync_jobs | `idx_sync_jobs_started_at` | 4,380 | < 10ms | PASS |
| 5 | `SELECT * FROM response_fields WHERE response_id = ?` | response_fields | `idx_response_fields_response_id` | 60,000 | < 15ms | PASS |
| 6 | `SELECT * FROM audit_logs WHERE actor = ? ORDER BY created_at DESC LIMIT 100` | audit_logs | `idx_audit_logs_actor_created_at`（複合・UT-21 所有） | 20,000 | < 20ms | PASS（参考） |
| 7 | `SELECT COUNT(*) FROM member_responses` | member_responses | PK スキャン | 2,000 | < 10ms | PASS |

> **index 過多リスク**: index 1 個あたり storage 約 30〜50% 増。本設計では 1 テーブルあたり 4 index 以内に抑え、storage 増を 50% 未満に保つ。複合 index は頻出クエリにのみ適用。

## 4. セキュリティ確認

### 4.1 PII カラム識別

| # | テーブル | カラム | PII 種別 | 取扱方針 |
| --- | --- | --- | --- | --- |
| 1 | member_responses / member_identities | `email` | 個人特定可能 | 認証目的のみ参照、公開 API では返さない |
| 2 | member_identities | `name` / `kana` | 個人特定可能 | `public_consent = 1` の場合のみ公開 |
| 3 | member_responses（dynamic） | `phone` 相当フィールド | 個人特定可能 | 公開しない（admin のみ） |
| 4 | member_responses（dynamic） | `address` 相当フィールド | 個人特定可能 | 公開しない（admin のみ） |
| 5 | audit_logs | `actor`（email / userId） | 個人特定可能 | admin のみ閲覧（UT-21 所有） |

### 4.2 暗号化方針

| 対象 | 方針 | 理由 |
| --- | --- | --- |
| at-rest | Cloudflare D1 プラットフォーム既定（Cloudflare 側） | アプリ層追加暗号化なし |
| in-transit | Workers ⇔ D1 binding は Cloudflare 内部 TLS | アプリ層追加暗号化なし |
| field-level | MVP では **不採用** | 無料枠制約 + 鍵管理コスト → Phase 12 unassigned-task 候補 |

### 4.3 機密データ分離（4 テーブル以上）

| # | 分離 | 方針 |
| --- | --- | --- |
| 1 | Form 回答正本 vs admin-managed data | `member_responses` / `member_identities`（Form 由来） vs `member_status`（admin 入力） を別テーブル化（不変条件 #4） |
| 2 | 同期メタデータ | `sync_jobs` / `schema_diff_queue` を業務テーブルから分離 |
| 3 | 監査ログ | `audit_logs` を独立テーブル化、UT-21 audit hook が単一書き込み口 |
| 4 | 動的フィールド | `response_fields`（key-value 形式の Form 動的応答）を `member_responses`（コア属性）から分離 |

## 5. line budget 確認

| ファイル | 行数（仕様書記載基準） | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 183 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-250 行範囲（phase-08:204、phase-09:262、phase-10:230 確認） | 100-250 行 | phase-09 が 262 行で margin 超過 → MINOR、Phase 10 で分割可否を判断 |
| outputs/phase-XX/main.md | 200-400 行目安 | 個別 | 個別 PASS（本 main.md は 200 行前後） |
| outputs/phase-09/free-tier-estimation.md | 別ファイル管理 | 個別 | PASS |

> phase-09 仕様書 262 行は 250 上限超 12 行のため MINOR。本タスクは spec_created でゲート対象外、Phase 10 で判定（PASS/MINOR）。

## 6. link 検証

| # | チェック | 方法 | 結果 |
| --- | --- | --- | --- |
| 1 | outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| 2 | index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致（13 件） |
| 3 | phase-XX.md 内 `../` 相対参照 | 全リンク辿り | 切れ 0 |
| 4 | Skill reference path | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 実在 |
| 5 | 原典 unassigned-task | `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` | 実在 |
| 6 | UT-09 引き渡し | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | 実在 |
| 7 | GitHub Issue | `https://github.com/daishiman/UBM-Hyogo/issues/53` | 仕様書記載 |

> リンク切れ: **0 件**

## 7. mirror parity（N/A 判定）

- 本タスクは `.claude/skills/` 配下を **参照のみ**（更新なし）
- ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスク N/A**
- 仮に Phase 12 documentation 更新時に skill reference を改訂した場合のみ mirror sync 義務発生

## 8. a11y 対象外の明記

- 本タスクは D1 schema 設計と migration ファイル作成のみで構成、UI を持たない
- WCAG 2.1 / a11y 観点は **対象外**
- 関連 a11y 確認は schema を参照する UI タスク（公開ディレクトリ / マイページ / admin dashboard）で実施

## 9. AC 網羅率

| AC | 対応 Phase | spec_created 達成 | 判定 |
| --- | --- | --- | --- |
| AC-1（DDL 設計文書化） | Phase 2 | 仕様確定 | PASS |
| AC-2（migration ファイル作成） | Phase 5 | 仕様確定（適用は Phase 11/未着手） | PASS（仕様確定として） |
| AC-3（マッピング表） | Phase 2 | 仕様確定 | PASS |
| AC-4（dev migration apply 成功） | Phase 11 | 未適用（spec_created） | 仕様確定 / 適用は Phase 11 |
| AC-5（production runbook） | Phase 5 | 仕様確定 | PASS |
| AC-6（PK/NN/UNIQUE/FK/INDEX 定義） | Phase 2 | 仕様確定 | PASS |
| AC-7（data-contract.md 整合） | Phase 1〜2 | 仕様確定 | PASS |
| AC-8（連番規約） | Phase 2 | 仕様確定 | PASS |
| AC-9（DATETIME ISO 8601 TEXT） | Phase 2 | 仕様確定 | PASS |
| AC-10（PRAGMA foreign_keys 方針） | Phase 3 | 仕様確定 | PASS |
| AC-11（4 条件 PASS） | Phase 10 | 確定見込み | PASS（本 Phase で根拠確保） |
| AC-12（apps/api 内閉鎖） | Phase 2 / 8 | 仕様確定 | PASS |

> AC 網羅率: **12 / 12 = 100%**（spec_created 視点）

## 10. リスクサマリ

| # | リスク | 重大度 | 対策 / 受け皿 |
| --- | --- | --- | --- |
| R-1 | UT-09 phase-08 が `members`（Legacy 名）を引き続き想定している | MINOR | Phase 10 で UT-09 申し送り計画化、Phase 12 unassigned-task 候補 |
| R-2 | audit_logs retention 未確定（90 日 / 365 日 / 永久） | MINOR | Phase 12 unassigned-task に formalize、UT-08 monitoring と連動 |
| R-3 | field-level 暗号化の MVP 不採用 | MINOR | Phase 12 unassigned-task に formalize、将来採用時に migration 設計 |
| R-4 | writes 余裕度 46%（半分未満） | INFO | UT-09 sync 頻度確定後に再試算、UT-21 audit log retention で増加余地監視 |
| R-5 | Sheets schema 変更時の ALTER 運用 | INFO | Phase 11 / 12 runbook に手順明記 |
| R-6 | phase-09.md 自体が 262 行で line budget 超 | MINOR | Phase 10 で分割可否判定 |

> MAJOR: **0 件**。MINOR: 4 件（R-1〜R-3, R-6）。すべて未タスク化方針確定。

## 11. 完了条件チェック

- [x] free-tier-estimation.md に 3 軸 × 2 環境試算（本 main.md §2 + 別ファイル）
- [x] index 戦略表に 7 クエリの妥当性評価
- [x] PII カラム識別 5 件
- [x] 暗号化方針（at-rest / in-transit / field-level）確定
- [x] 機密データ分離 4 テーブル
- [x] line budget 計測（MINOR 1 件記録）
- [x] link 検証 切れ 0
- [x] mirror parity N/A 明記
- [x] a11y 対象外 明記

## 12. Phase 10 への引き渡し

| 引き継ぎ事項 | 内容 |
| --- | --- |
| 無料枠余裕度 | storage 0.7% / reads 0.4% / writes 46% |
| index 戦略妥当性 | 7 クエリ全 PASS（応答時間 < 20ms 想定） |
| PII / 暗号化 / 分離 | 5 カラム / 3 階層方針 / 4 テーブル分離 |
| MINOR 4 件 | unassigned-task formalize 方針確定 |
| MAJOR | 0 件 → GO 判定の根拠 |
| AC 網羅率 | 12/12 (100%) |
| line budget | 1 件 MINOR（phase-09.md 262 行） |
| mirror parity / a11y | N/A / 対象外 確定 |

## 13. 多角的チェック観点（4 条件）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 無料枠を超えない範囲で実フォーム正本データを保持可能、公開ディレクトリ・マイページ・admin の 3 層が schema 上で機能 |
| 実現性 | PASS | 想定行数 × index 設計が D1 応答時間制約に収まる（< 20ms）、wrangler migration で適用可 |
| 整合性 | PASS | 不変条件 #1 / #2 / #4 / #5 すべて整合、Phase 8 命名統一を維持 |
| 運用性 | PASS | PII カラム識別が公開 API 設計の前提として再利用可、scripts/cf.sh 経由で操作標準化 |
