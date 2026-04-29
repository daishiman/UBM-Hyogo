# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 1（要件定義） |
| 下流 | Phase 3（設計レビュー） |
| 状態 | spec_created |
| user_approval_required | false |

## 目的

Phase 1 で確定した AC-1〜AC-10 と苦戦箇所 7 件を元に、(1) 同期方式の比較評価と採択、(2) 手動 / 定期 / バックフィルの 3 種フロー図、(3) `sync_log` 論理スキーマを **設計成果物として確定** する。Phase 3 設計レビューの入力を凍結する。

## 入力

| 種別 | パス |
| --- | --- |
| 上流成果物 | `outputs/phase-01/main.md` |
| 上流タスク完成物 | `01b-parallel-cloudflare-base-bootstrap`（D1 binding）/ `01c-parallel-google-workspace-bootstrap`（Sheets ID） |
| 必読 reference | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` / `database-schema.md` |
| 公式参照 | Cloudflare Workers Cron Triggers / Google Sheets API v4 リファレンス |

## 設計事項

### 1. 成果物 3 点と章立て

| 成果物 | 役割 | 主章立て |
| --- | --- | --- |
| `outputs/phase-02/sync-method-comparison.md` | 同期方式 4 種（push / pull / webhook / cron）の比較評価表と採択方式の理由 | 評価観点 / 比較マトリクス / 採択結論 / 不採択理由 / 既知制約 |
| `outputs/phase-02/sync-flow-diagrams.md` | 手動 / 定期 / バックフィルの 3 種フロー図（Mermaid シーケンス図 or データフロー図） | 手動トリガー / 定期 Cron / バックフィル / エラーパス共通 |
| `outputs/phase-02/sync-log-schema.md` | `sync_log` テーブル論理スキーマと運用ルール | カラム定義 / 状態遷移 / 索引方針 / 保持期間 |

### 2. 同期方式比較の評価観点（sync-method-comparison.md 設計）

| 観点 | 内容 |
| --- | --- |
| トリガー源 | Sheets 側 / Workers 側 / 第三者 |
| 即時性 | リアルタイム / 数秒 / 分単位 / 時間単位 |
| 実装コスト | Apps Script / Workers / 統合複雑度 |
| Workers CPU 制限適合性 | 30ms バーストとの整合（Sheets API 応答 200ms〜1s） |
| Sheets API quota 適合性 | 500 req/100s/project の安全マージン |
| 冪等性確保のしやすさ | 単一実行点 / 多重実行のリスク |
| 障害復旧戦略との親和性 | バックフィル / リトライの親和性 |
| 無料枠適合性 | Cloudflare / Google 双方の無料枠で完結するか |

採択候補: **Cloudflare Workers Cron Triggers による定期 pull** を base case として比較表に組み込み、Apps Script webhook（push）と hybrid（webhook + cron fallback）を対立案として評価する。

### 3. フロー図設計（sync-flow-diagrams.md）

| フロー | トリガー | 主体 | エラーパス |
| --- | --- | --- | --- |
| 手動同期 | 管理者の `/admin/sync` POST | Workers (apps/api) | 401/403 → 認証エラー記録、5xx → sync_log failed 記録 |
| 定期同期 | Cron Triggers（例: 0 */6 * * *） | Workers scheduled handler | quota 超過 → Backoff → 次回実行 / D1 書込失敗 → SQLITE_BUSY retry |
| バックフィル | 管理者の `/admin/sync?full=true` | Workers (apps/api) | 全件再同期、失敗時は完了オフセットから再開 |

各フローは **エラーパスを含むシーケンス図** で表現し、状態遷移を sync_log との整合とともに表記する。

### 4. sync_log 論理スキーマ（sync-log-schema.md 設計）

| カラム | 型 | 説明 |
| --- | --- | --- |
| `id` | TEXT (UUID) | ジョブ ID（PK） |
| `trigger_type` | TEXT | `manual` / `cron` / `backfill` |
| `status` | TEXT | `pending` / `in_progress` / `completed` / `failed` |
| `started_at` | INTEGER (epoch ms) | 開始時刻 |
| `finished_at` | INTEGER NULL | 完了時刻 |
| `processed_offset` | INTEGER | 書き込み完了済みオフセット（行番号 or chunk index） |
| `total_rows` | INTEGER NULL | 取得行数 |
| `error_code` | TEXT NULL | quota / 5xx / mapping_error 等 |
| `error_message` | TEXT NULL | スタックトレース要約 |
| `retry_count` | INTEGER | リトライ実施回数 |
| `created_at` | INTEGER | 作成時刻 |

> **論理設計のみ**：CREATE TABLE 文の発行・マイグレーションは UT-04 / UT-09 の責務。本タスクは「カラム / 型 / 制約 / 索引候補 / 状態遷移」までを文書として確定する。

### 5. エラーハンドリング方針（sync-method-comparison.md or 専用節）

| 観点 | 方針 |
| --- | --- |
| リトライ | 最大 3 回 / Exponential Backoff（1s → 2s → 4s）|
| Sheets API quota 超過 | 100s 待機後 Backoff 再開、3 回失敗で sync_log failed |
| D1 SQLITE_BUSY | retry/backoff（UT-02 で確定済み方針を継承）/ batch-size 100 行上限 |
| 部分失敗 | `processed_offset` を sync_log に記録、次回実行時に当該オフセットから再開 |
| Dead Letter 相当 | failed 状態の sync_log を 30 日保持、UT-08 監視で検知 |
| 二重実行防止 | 開始時に `in_progress` 状態のレコードを SELECT、存在すればスキップ |

### 6. source-of-truth 優先順位とロールバック判断

- **平常時**: Sheets が source-of-truth、D1 は反映先。同期は Sheets → D1 の単方向のみ
- **Sheets 障害時**: D1 を read-only fallback として使用、書き戻しはしない
- **D1 破損時**: Sheets から full backfill で再構築可能（バックフィルフローを保証）
- **ロールバック判断フローチャート**: Phase 2 設計成果物に Mermaid 図として配置

### 7. Sheets API quota 対処方針

| 項目 | 値 |
| --- | --- |
| バッチサイズ | 100 行/req（最大 500） |
| 同時並列度 | 1（Cron handler 内では直列） |
| Backoff 初期値 | 1s |
| Backoff 上限 | 32s |
| quota 超過判定 | HTTP 429 / `RESOURCE_EXHAUSTED` |

### 8. 冪等性担保戦略（UT-04 引き継ぎ事項）

| 戦略 | 内容 | 引き継ぎ先 |
| --- | --- | --- |
| 行ハッシュ管理 | Sheets 行の SHA-256 ハッシュを D1 側で保持し、変更検知に使用 | UT-04 |
| バンドマン固有 ID | Sheets 上で固有 ID 列を先行定義し、UPSERT の一意キーとする | UT-04 / Form 改修 |
| INSERT ... ON CONFLICT DO UPDATE | D1 UPSERT の前提として確定 | UT-09 |

### 9. SubAgent Lane 設計（Phase 2 内）

| Lane | 役割 | 並列性 |
| --- | --- | --- |
| Lane 1 | sync-method-comparison.md 作成（比較表 / 採択理由） | 単独 |
| Lane 2 | sync-flow-diagrams.md 作成（3 種フロー図 + ロールバック判断図） | Lane 1 と並列可（参照のみ） |
| Lane 3 | sync-log-schema.md 作成（論理スキーマ + 状態遷移） | Lane 1 / 2 と並列可 |

> Lane 数は 3 以下（phase-template-core 上限準拠）。

## 実行タスク

1. 同期方式 4 種の比較表を 8 観点で評価（sync-method-comparison.md）
2. base case として Cloudflare Workers Cron Triggers 定期 pull を採択し、不採択理由を明記
3. 手動 / 定期 / バックフィルの 3 種フロー図を Mermaid で作成（sync-flow-diagrams.md）
4. エラーパス共通図とロールバック判断フローチャートを追加
5. sync_log 論理スキーマを 13 カラムで定義（sync-log-schema.md）
6. 状態遷移（pending → in_progress → completed / failed）と索引候補を文書化
7. エラーハンドリング方針 6 項目（リトライ / quota / SQLITE_BUSY / 部分失敗 / Dead Letter / 二重実行防止）を確定
8. Sheets API quota 対処方針を 5 項目で確定
9. 冪等性担保戦略を UT-04 引き継ぎ事項として整理
10. SubAgent Lane を 3 以内で設計

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` |
| 参考 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-02/`（下流の参考。実装目線） |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-02/sync-method-comparison.md` | push / pull / webhook / cron 比較表と採択理由 |
| `outputs/phase-02/sync-flow-diagrams.md` | 手動 / 定期 / バックフィル 3 種フロー図 + ロールバック判断 |
| `outputs/phase-02/sync-log-schema.md` | sync_log 論理スキーマ（13 カラム + 状態遷移 + 索引候補） |

## 完了条件 (DoD)

- [ ] sync-method-comparison.md に 4 方式 × 8 観点の比較表が存在
- [ ] base case が Cron Triggers 定期 pull で確定し、不採択 3 案の理由が明記
- [ ] sync-flow-diagrams.md に 3 種フロー図（手動 / 定期 / バックフィル）+ ロールバック判断図が存在
- [ ] sync-log-schema.md に 13 カラム + 状態遷移 + 索引候補が定義
- [ ] エラーハンドリング 6 項目が文書化
- [ ] Sheets API quota 対処方針が 5 項目で確定
- [ ] 冪等性担保戦略が UT-04 引き継ぎ事項として整理

## 苦戦箇所・注意

- **比較表の主観化を避ける**: 「実装コスト」等の観点は見積根拠（時間 / リスク）を併記し、レビューで反証可能にする
- **フロー図の粒度ばらつき**: 3 種フロー図は同じ抽象度（エンティティ / メッセージ）で揃える。手動だけ詳細にしない
- **論理設計の越境**: sync-log の物理 DDL は書かない（UT-04 / UT-09 の責務）。カラム定義 + 状態遷移までで止める
- **採択方式の硬直化**: base case が Cron Triggers 定期 pull だが、Phase 3 で hybrid に動く可能性を残す（PASS with notes 対応）

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パス 3 点と `artifacts.json` の outputs が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計タスクであり、アプリケーション統合テストは追加しない
- 統合検証は Phase 11 の docs-only / NON_VISUAL 縮約テンプレで代替する
- 下流実装（UT-09）が本仕様書の AC を満たす形で統合テストを行うため、本タスクの成果物は「UT-09 が参照可能な状態」までを担保する

## 次 Phase

- 次: Phase 3（設計レビュー：代替案 3 件以上 / PASS-MINOR-MAJOR / 4 条件再評価 / 着手可否ゲート）
- 引き継ぎ: 比較表 / 3 種フロー図 / sync_log 論理スキーマ / エラーハンドリング方針 / quota 対処 / 冪等性戦略
