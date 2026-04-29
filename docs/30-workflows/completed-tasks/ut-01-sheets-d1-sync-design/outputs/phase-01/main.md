# Phase 1: 要件定義 - 成果物（main.md）

> **ステータス**: completed
> 本ファイルを Phase 1 要件定義の正本とする。仕様本体は `../../phase-01.md` を参照。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase | 1 / 13 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| scope | design_specification |
| 実行日 | 2026-04-29 |

## 2. 背景・目的

UBM 兵庫支部会メンバーサイトでは、Google Form 回答が Google Sheets に集約され、これを正本（source-of-truth）として Cloudflare D1 を canonical store に反映する構造を採る。両者間の同期方式・タイミング・エラーハンドリング・冪等性確保・監査証跡が未定では下流の UT-09（Sheets→D1 同期ジョブ実装）が着手できない。本タスクは UT-09 の上流設計タスクとして、設計文書のみを生成する **docs-only / NON_VISUAL** タスクであり、実装・スキーマ DDL・Secrets 設定はすべて下流（UT-03 / UT-04 / UT-09）に委譲する。`workflow_state = spec_created` を Phase 12 close-out 後も据え置き、実装完了 = UT-09 完了と分離する。

## 3. スコープ

### 3.1 含む

- 同期方式の選定（push / pull / webhook / cron の比較評価と採択理由の文書化）
- 同期タイミング定義（手動トリガー / スケジュール（Cron） / バックフィル の 3 種フロー）
- エラーハンドリング方針（リトライ戦略・Exponential Backoff・冪等性確保・部分失敗時の扱い・failed ログ保持）
- Sheets → D1 フロー図（手動 / 定期 / バックフィルのシーケンス図 + エラーパス共通図）
- source-of-truth の優先順位決定（Sheets 優先）と障害時のロールバック判断フローチャート
- `sync_log` テーブルの **論理スキーマ設計**（ジョブ ID / 状態 / オフセット / タイムスタンプ / エラー）
- Google Sheets API v4 quota（500 req/100s/project）への対処方針（バッチサイズ・待機戦略）

### 3.2 含まない

- 実際の同期ジョブのコード実装（→ UT-09）
- D1 物理スキーマのマイグレーション作成（→ UT-04）
- Sheets API 認証実装・Service Account JSON の Secret 化（→ UT-03）
- 通知基盤との統合（→ UT-07）
- モニタリング/アラート設計（→ UT-08）
- エラーハンドリング標準化のフォーマライズ（→ UT-10）
- 本番データ投入・staging E2E（→ UT-26）

## 4. 苦戦箇所（7 件）

1. **push vs pull の状況依存判断**: Workers の CPU 30ms バーストと Sheets API 応答 200ms〜1s が衝突。webhook（Apps Script）と Workers 定期 pull のいずれを base にするかを Phase 2 で確定しないと実装が迷走する。
2. **冪等性担保の難しさ（行 RowIndex 一意性問題）**: Sheets 行に一意キーがなく、行番号 UPSERT は行挿入・削除で意図しない上書きを生む。固有 ID 列または行ハッシュ管理を UT-04 引き継ぎとして明文化する。
3. **部分失敗時のリトライと監査証跡**: 1000 行同期途中で失敗した場合、書込済みオフセットを `sync_log.processed_offset` で追跡しなければ full-resync で整合が崩れる。
4. **Sheets API quota との衝突**: 500 req/100s/project の制限。バックフィル / 障害後の一括再同期で超過しやすく、Backoff（1s→32s）と batch size（100 行）を設計段階で固定する。
5. **workflow_state の誤書換え**: 本タスクは設計タスクであり、Phase 12 close-out で `workflow_state` を `completed` に書き換えてはならない（実装完了 = UT-09）。UT-GOV-005 縮約テンプレに従い `spec_created` を据え置く。
6. **設計タスクの自己完結性**: AC-9「UT-09 が本仕様書のみで着手可能」を満たすため、Phase 3 / Phase 10 で open question を 0 件に詰める義務がある。「実装で判断」表現は禁止。
7. **代替案数の確保**: task-specification-creator skill の最低代替案 3 件を Phase 3 で必ず満たす（A=push / B=pull(base) / C=webhook / D=hybrid の 4 件で着地）。

## 5. 受入条件（AC-1〜AC-10）

| AC | 内容 | 検証方法 | Phase 配置 |
| --- | --- | --- | --- |
| AC-1 | 同期方式 4 種の比較評価表が `outputs/phase-02/sync-method-comparison.md` に作成され採択理由が明文化 | ファイル存在 + 4 方式 × 8 観点表の存在確認 | Phase 2 |
| AC-2 | 手動 / 定期 / バックフィルの 3 種フロー図が `outputs/phase-02/sync-flow-diagrams.md` に存在 | Mermaid シーケンス 3 種 + エラーパス図の存在 | Phase 2 |
| AC-3 | エラーハンドリング方針（最大 3 回 retry / Backoff / 冪等性 / 部分失敗 / failed ログ）が文書化 | sync-method-comparison §確定パラメータ / sync-flow-diagrams §エラーパス | Phase 2 |
| AC-4 | `sync_log` 論理スキーマが `outputs/phase-02/sync-log-schema.md` に定義 | 13 カラム + 状態遷移 + 索引候補 | Phase 2 |
| AC-5 | source-of-truth 優先順位とロールバック判断フローチャートが明文化 | sync-flow-diagrams §6 ロールバック判断図 | Phase 2 |
| AC-6 | Sheets API quota（500 req/100s）対処方針（batch 100〜500 / Backoff / 待機）が記載 | sync-method-comparison §確定パラメータ + フロー図 quota 分岐 | Phase 2 |
| AC-7 | 冪等性担保戦略（行ハッシュ / 固有 ID / UPSERT 前提）が UT-04 引き継ぎとして整理 | sync-log-schema §UT-04 引き継ぎ事項 | Phase 2 |
| AC-8 | Phase 3 で代替案 3 件以上を PASS / MINOR / MAJOR 評価し base case 確定 | alternatives.md に 4 案記載、main.md に判定表 | Phase 3 |
| AC-9 | UT-09 が本仕様書のみで実装着手可能（open question 0 件） | Phase 3 main.md §UT-09 着手準備チェック | Phase 3 / 10 |
| AC-10 | `taskType=docs-only` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` / `scope=design_specification` が固定され `artifacts.json` と一致 | artifacts.json metadata と本 main.md §1 の一致 | Phase 1 |

## 6. Schema / 共有コード Ownership 宣言

| 対象 | 本タスクでの扱い | 影響 Phase |
| --- | --- | --- |
| `packages/shared` 型定義 | 触らない | - |
| `packages/integrations` Sheets クライアント | 触らない（実装は UT-09） | - |
| `apps/api` ルート / handler | 触らない（実装は UT-09） | - |
| D1 物理マイグレーション | 触らない（→ UT-04） | - |
| Cloudflare Secrets | 触らない（→ UT-03 / UT-09） | - |
| `.env` / 1Password 参照 | 触らない | - |
| `sync_log` 論理スキーマ | 設計のみ（Phase 2） | Phase 2 |
| 同期方式比較 / フロー図 | 設計のみ（Phase 2） | Phase 2 |

## 7. 4 条件評価

### 7.1 価値性（Value） — PASS

UT-09 が本仕様書のみで実装着手できる状態を作ることで、設計の手戻り（同期方式の差し戻し / sync_log カラム不足によるリファクタ / quota 設計の後付け）を未然に防ぐ。Phase 1〜3 の docs-only 投資が UT-09 の実装速度と品質に直結する。

### 7.2 実現性（Feasibility） — PASS

成果物はすべて Markdown / Mermaid のみで、CI・runtime・Cloudflare bindings に副作用なし。原典スペックの苦戦箇所 4 件はいずれも先行設計で解決可能な範囲（採択方式選定 / 冪等性キー設計 / sync_log オフセット設計 / quota 対処）に収まる。

### 7.3 整合性（Consistency） — PASS

- 不変条件 #1（schema をコードに固定しすぎない）: Sheets→D1 マッピングはスキーマ層に閉じる旨を設計に記述し、コード固定化を回避
- 不変条件 #4（admin-managed data 分離）: Sheets 由来データを admin-managed として D1 に配置する境界を明文化
- 不変条件 #5（D1 アクセスは `apps/api` に閉じる）: 同期ジョブは `apps/api` scheduled handler のみで実行する設計を Phase 2 で固定
- 上流 3 タスク（02-monorepo / 01b-cloudflare / 01c-google-workspace）成果物と整合
- 下流 UT-04（物理スキーマ）/ UT-09（実装）への引き継ぎ事項が明確

### 7.4 運用性（Operability） — PASS（with notes）

Cloudflare Workers Cron Triggers / D1 / Sheets API v4 すべて無料枠で完結。Cron 間隔の最終確定（6h / 1h / 5min）は staging 計測タスクで、本仕様で方式は確定済み。MINOR-M-02 として UT-09 staging に追跡委譲する。

## 8. 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | schema をコードに固定しすぎない | マッピング設計はスキーマ層に閉じる旨を明文化、固定 SQL の生成は UT-09 |
| #4 | admin-managed data 分離 | Sheets 由来 admin-managed data の D1 配置方針を Phase 2 設計に含める |
| #5 | D1 アクセスは `apps/api` に閉じる | 同期ジョブを `apps/api` scheduled handler 限定とする設計上の固定 |

## 9. タスクタイプ確定根拠（NON_VISUAL）

| 観点 | 確認結果 |
| --- | --- |
| UI 変更 | なし |
| 視覚的な成果物 | なし（フロー図は文書内 Mermaid のみ） |
| screenshot 要求 | 不要 |
| 結論 | `visualEvidence: NON_VISUAL` 確定。Phase 11 縮約テンプレ（main.md / manual-smoke-log.md / link-checklist.md の 3 点）を発火 |

## 10. 次 Phase 引き継ぎ事項

- AC-1〜AC-10 の確定値（特に AC-1 採択方式 = Workers Cron Triggers 定期 pull）
- 苦戦箇所 7 件の解決責務配分（Phase 2 / Phase 3 / UT-04 / UT-09）
- Schema Ownership 宣言（本タスクは何も実装変更しない）
- タスクタイプ確定値（docs-only / NON_VISUAL / spec_created / design_specification）
- 比較対象 4 案（A=push / B=pull(base) / C=webhook / D=hybrid）の Phase 3 評価義務
- 冪等性 / quota / 部分失敗の 3 大設計論点の Phase 2 closure 要件
