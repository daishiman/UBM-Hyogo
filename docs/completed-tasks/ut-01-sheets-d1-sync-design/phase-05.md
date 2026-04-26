# Phase 5: 設計文書作成実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 設計文書作成実行 |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系・エラーケース検証) |
| 状態 | completed |

## 目的

Phase 2 で設計した内容をもとに、具体的な設計成果物を作成する。
同期方式比較表の詳細化・シーケンス図（Mermaid 形式）の作成・既存 `sync_audit` 契約の運用定義・リトライポリシーの文書化を行い、UT-09 実装担当者が迷いなく参照できる設計文書一式を完成させる。

## 実行タスク

- 同期方式比較表（Push / Poll / Webhook / Trigger の比較）の詳細化
- シーケンス図の作成（Mermaid 形式：正常系・異常系それぞれ）
- sync_audit 監査契約の運用定義の文書化
- リトライポリシー（最大試行回数・バックオフ戦略・DLQ 方針）の文書化
- source-of-truth の定義の明文化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | 要件定義・AC-1〜AC-7 |
| 必須 | outputs/phase-02/design.md | 同期方式設計の原案 |
| 必須 | outputs/phase-02/sync-flow.md | 同期フロー原案 |
| 必須 | outputs/phase-04/pre-verification.md | 事前検証で確認した open question |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成と無料制限 |

## 実行手順

### ステップ 1: 同期方式比較表の詳細化

- Push / Poll / Webhook / Apps Script Trigger の各方式について、実現性・quota 消費・冪等性・運用コストの観点で比較する。
- 採用方式を 1 つ選定し、選定理由を明記する。
- `outputs/phase-05/sync-method-comparison.md` に出力する。

### ステップ 2: シーケンス図の作成

- Mermaid `sequenceDiagram` 形式で以下を作成する:
  - 正常系: Sheets → GAS/Worker → D1 への同期フロー
  - 異常系: 部分失敗・quota 超過・DB 書き込み失敗のフロー
- `outputs/phase-05/sequence-diagrams.md` に出力する。

### ステップ 3: sync_audit 運用定義の文書化

- 既存 `sync_audit` テーブルのカラム一覧（run_id, trigger, status, started_at, finished_at, rows_upserted, rows_upserted, rows_skipped, error_reason, diff_summary_json）を運用観点で説明する。
- 冪等キーは `member_responses.response_id` を第一候補とし、`sync_audit` は監査・再開判断に使うことを明記する。
- `outputs/phase-05/sync-audit-contract.md` に出力する。

### ステップ 4: リトライポリシーの文書化

- 最大試行回数・バックオフ戦略（固定 / 指数）・DLQ（Dead Letter Queue）方針を定義する。
- Google Sheets API quota 超過時の待機戦略を明記する。
- `outputs/phase-05/retry-policy.md` に出力する。

### ステップ 5: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase（異常系・エラーケース検証）に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 本 Phase の sequence-diagrams.md を異常系検証の入力として使用 |
| Phase 7 | sync-method-comparison / sync-log-schema が AC トレースの根拠 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 設計文書が UT-09 実装担当者の実装判断を十分サポートするか。
- 実現性: D1 無料枠・Sheets API quota の制約内で設計が成立するか。
- 整合性: シーケンス図・スキーマ・リトライポリシーが矛盾なく連携しているか。
- 運用性: sync_audit からエラー原因を追跡できるか、リトライが冪等に動作するか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 同期方式比較表の詳細化 | 5 | completed | outputs/phase-05/sync-method-comparison.md |
| 2 | シーケンス図の作成 | 5 | completed | outputs/phase-05/sequence-diagrams.md |
| 3 | sync_audit 運用定義の文書化 | 5 | completed | outputs/phase-05/sync-audit-contract.md |
| 4 | リトライポリシーの文書化 | 5 | completed | outputs/phase-05/retry-policy.md |
| 5 | 4条件確認と handoff | 5 | completed | 次 Phase へ引き継ぎ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/sync-method-comparison.md | 同期方式比較表（採用方式選定含む） |
| ドキュメント | outputs/phase-05/sequence-diagrams.md | Mermaid 形式シーケンス図（正常系・異常系） |
| ドキュメント | outputs/phase-05/sync-audit-contract.md | 既存 sync_audit 監査契約の運用定義 |
| ドキュメント | outputs/phase-05/retry-policy.md | リトライポリシー文書 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 4 つの成果物ドキュメントがすべて作成済み
- 採用する同期方式が 1 つ選定され、選定理由が明記されている
- シーケンス図が Mermaid 形式で正常系・異常系ともに記述されている
- sync_audit 運用定義に response_id による冪等性と監査記録の関係が含まれている
- リトライポリシーに quota 超過時の対処が含まれている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 設計文書内の曖昧表現が除去されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系・エラーケース検証)
- 引き継ぎ事項: sequence-diagrams.md の異常系フロー・retry-policy.md を Phase 6 の入力として使用する。
- ブロック条件: 4 つの成果物ドキュメントのいずれかが未作成なら次 Phase に進まない。

## 各ステップ後の sanity check

- scope 外のコード実装（TypeScript / SQL 等）を追加していない（docs-only タスクのため）
- シーケンス図が実際の Google Sheets → D1 の処理フローと対応しているか
- sync_audit 運用定義が既存 data-source contract と矛盾していないか
- downstream（UT-09）が参照できる path が具体化されているか
