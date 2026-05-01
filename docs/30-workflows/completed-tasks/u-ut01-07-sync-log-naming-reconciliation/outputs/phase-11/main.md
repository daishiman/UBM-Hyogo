# Phase 11 outputs: 手動テスト検証トップ index（NON_VISUAL 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| タスク | U-UT01-07: sync_log 論理名と既存 sync_job_logs / sync_locks の整合 |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## テスト方式

- **mode: NON_VISUAL（docs walkthrough）**
- screenshot 撮影なし（生成禁止: false green 防止）
- 一次証跡は **文書 grep ログ / AC matrix 充足結果 / cross-link 通過記録 / aiworkflow-requirements drift 検出 grep 出力**
- 設計文書ウォークスルー方式を採用

## 必須 outputs（NON_VISUAL 縮約 3 点）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | 本ファイル。Phase 11 トップ index・代替 evidence 差分表・既知制限 |
| `outputs/phase-11/manual-smoke-log.md` | 実行コマンド・期待結果・実測欄（採取は実行 Phase で実施） |
| `outputs/phase-11/link-checklist.md` | workflow 内リンクと参照先実在性のチェックリスト |

> screenshot は作成しない（NON_VISUAL 整合）。既存の `manual-smoke-log.md` は互換用の補助ログであり、skill 準拠上の正本は `manual-smoke-log.md` と `link-checklist.md`。

## 代替 evidence 差分表

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 保証外 / 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 用語整合 | 用語の手作業突き合わせ | rg による 4 種 grep | 文書全体の用語一貫性 | 実装ファイル側の用語整合（→ UT-09 phase-08 DRY 化） |
| S-2 AC 充足 | 主観での AC 評価 | outputs の存在確認 + 内容目視 | spec_created 段階の AC 充足 | 実装後の AC 達成（→ UT-04 / UT-09） |
| S-3 navigation drift | リンク手動辿り | cross-link checklist + ls による file 実在確認 | 文書間の遷移可能性 | 外部リンク死活（→ Phase 12） |
| S-4 aiworkflow-requirements drift | 主観での整合確認 | rg による sync 系記述の実測 | drift の客観的有無 | drift 解消の実適用（→ Phase 12 doc-only 更新 + .agents mirror sync） |
| S-5 UT-04 / UT-09 引き継ぎ | 担当者ヒアリング | 本仕様書の self-review | 引き継ぎ十分性 | 担当者着手後の実フィードバック（→ 後続 review） |
| S-6 既存 migration 不変性 | 物理 SQL Read のみ | `apps/api/migrations/0002_sync_logs_locks.sql` の差分 0 確認 | 既存 migration を改変していない | 本番 D1 への適用（→ UT-04 / UT-26） |

## 既知制限

| # | 制限 | 委譲先 |
| --- | --- | --- |
| 1 | DDL 発行 / migration 適用は本タスクで行わない | UT-04 / UT-26 |
| 2 | mapper 実装 / コード変更は本タスクで行わない | UT-09 |
| 3 | enum 値 / retry / offset の canonical 決定は含まない | U-8 / U-9 |
| 4 | 既存 `apps/api/migrations/0002_sync_logs_locks.sql` の改変権限なし | UT-04 |
| 5 | aiworkflow-requirements drift の実適用は Phase 12 | Phase 12 + `.agents` mirror sync |
| 6 | NON_VISUAL のため screenshot 不要、文書 grep が一次証跡 | manual-smoke-log.md / link-checklist.md で補完 |

## L1 〜 L4 結果サマリ（NON_VISUAL プレイブック準拠）

| 階層 | 代替手段 | 結果 |
| --- | --- | --- |
| L1: 型 | （該当なし: docs-only のため型なし） | N/A |
| L2: lint / boundary | rg による用語整合 grep | spec_created 段階で計画済み（実測は実行 Phase） |
| L3: in-memory test | （該当なし: コード変更なし） | N/A |
| L4: 意図的 violation | （該当なし: 静的解析対象コードなし） | N/A |

> docs-only / 設計 reconciliation のため L1 / L3 / L4 は構造的に N/A。L2 のみ rg ベースで適用する。

## 第一適用例 / 参照

- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` の docs-only テンプレを適用。
- 書式参考: `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-11/main.md`。

## Phase 12 への引き継ぎ

- drift 検出結果を documentation で formalize。
- 既知制限 #1〜#5 を該当タスクへ register。
- screenshot 不要であり、`screenshots/` ディレクトリを作成しないこと。
