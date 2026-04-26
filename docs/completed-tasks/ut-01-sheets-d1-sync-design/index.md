# UT-01-sheets-d1-sync-design - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-d1-sync-design |
| ディレクトリ | docs/ut-01-sheets-d1-sync-design |
| Wave | unassigned |
| 実行種別 | serial |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| 状態 | spec_created |
| タスク種別 | docs-only |
| Phase 12 実装状況 | spec_created |

## 目的

Google Sheets を入力源、Cloudflare D1 を canonical store として、両者間のデータ同期アーキテクチャ（方式・タイミング・エラーハンドリング）を設計文書として確定する。同期方式の比較評価・採択根拠・フロー設計・監査証跡方針を明文化し、下流実装タスク（UT-09）が迷わず着手できる状態をつくる。

## スコープ

### 含む

- 同期方式選定（push / pull / webhook / cron の比較評価と採択理由）
- 同期タイミング定義（手動同期 / 定期スケジュール / バックフィル）
- エラーハンドリング方針（リトライ / 冪等性 / 部分失敗）
- Sheets → D1 フロー図（手動・定期・バックフィルの3種）
- source-of-truth 優先順位の決定と明文化
- 既存 `sync_audit` 監査契約の運用設計方針
- Sheets API quota 制限への対処方針

### 含まない

- 実際の同期ジョブコード実装（→ UT-09）
- D1 物理スキーマ設計（→ UT-04）
- Sheets API 認証実装（→ UT-03）
- 本番データ投入

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02-serial-monorepo-runtime-foundation | monorepo 基盤が前提 |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | D1 binding 設定が前提 |
| 上流 | 01c-parallel-google-workspace-bootstrap | Sheets API 認証基盤が前提 |
| 下流 | UT-03 | Sheets API 認証実装が本仕様を参照 |
| 下流 | UT-09 | 同期ジョブ実装が本仕様を参照 |
| 下流 | 03-serial-data-source-and-storage-contract | ストレージ契約設計が本仕様を参照 |
| 並列 | なし | 独立実行可能 |

## 主要参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/completed-tasks/03-serial-data-source-and-storage-contract/index.md | データソース・ストレージ契約方針 |
| 必須 | docs/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | `sync_audit` / `response_id` 既存契約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | システム全体構成・D1/Sheets の役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Workers / Cron Triggers 制約 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 受入条件 (AC)

- AC-1: 同期方式（push / pull / webhook / cron）の比較評価表と採択理由が明文化されている
- AC-2: 手動同期・定期スケジュール・バックフィルの3種フロー図が存在する
- AC-3: エラーハンドリング方針（リトライ回数・冪等性確保・部分失敗時の継続戦略）が記載されている
- AC-4: 既存 `sync_audit` 監査契約の運用上の用途・記録項目が定義されている
- AC-5: source-of-truth の優先順位（通常運用は D1 canonical、復旧/backfill 入力は Sheets）が明文化されている
- AC-6: Sheets API quota 制限（500 req/100s）への対処方針（バッチサイズ・Exponential Backoff）が記載されている
- AC-7: UT-09 が本仕様書を参照して実装着手できる状態になっている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/design.md, outputs/phase-02/sync-flow.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/review.md |
| 4 | 事前検証手順 | phase-04.md | completed | outputs/phase-04 |
| 5 | セットアップ実行 | phase-05.md | completed | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | completed | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件・前提条件・AC確認 |
| ドキュメント | outputs/phase-02/design.md | 同期方式比較・採択根拠・`sync_audit` 運用・エラーハンドリング設計 |
| ドキュメント | outputs/phase-02/sync-flow.md | 手動/定期/バックフィル フロー図（Mermaid） |
| ドキュメント | outputs/phase-03/review.md | 4条件レビュー結果 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec update summary |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-7 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルール（implementation guide / system spec update summary / documentation changelog / unassigned-task detection / skill feedback / compliance check）が破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- GitHub Issue: #3
- 共通テンプレ: ../../01-infrastructure-setup/_templates/phase-template-infra.md
