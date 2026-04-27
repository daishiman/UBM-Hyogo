# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 3 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 2 (設計) |
| 下流 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の DDL / migration 分割を simpler alternative と比較し、PASS / MINOR / MAJOR を判定する。漏れ（specs/08 のテーブル不足）を確認し、後続 Wave の repository 実装が破綻しないことを保証する。

## 実行タスク

1. alternative 案 3 件以上を列挙
2. 4 条件評価
3. 漏れチェック（specs/08 + 04-types.md と一致）
4. PASS / MINOR / MAJOR 判定
5. outputs/phase-03/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 完全性確認 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型対応 |

## 実行手順

### ステップ 1: alternative 列挙
- 案 A: 1 ファイル巨大 migration
- 案 B: 4 ファイル分割（採用）
- 案 C: テーブルごと（20 ファイル）

### ステップ 2: 評価
### ステップ 3: 漏れチェック
### ステップ 4: outputs/phase-03/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案で test 計画 |
| Phase 10 | GO/NO-GO 根拠 |

## 多角的チェック観点（不変条件参照）

- **#1〜#15**（Phase 1 マッピング）すべてが採用案で守られていることを再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 列挙 | 3 | pending | 3 案 |
| 2 | 評価 | 3 | pending | 4 条件 |
| 3 | 漏れチェック | 3 | pending | specs/08 |
| 4 | 判定 | 3 | pending | PASS 目標 |
| 5 | outputs 作成 | 3 | pending | outputs/phase-03/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果 |
| メタ | artifacts.json | Phase 3 を completed |

## 完了条件

- [ ] alternative 3 件評価
- [ ] 漏れ 0 件
- [ ] PASS 判定

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-03/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 4
- 引き継ぎ事項: 採用案
- ブロック条件: NO-GO

## Alternative 評価

### 案 A: 1 ファイル巨大 migration

| 観点 | 評価 |
| --- | --- |
| 価値性 | OK（review しづらいが apply は単純） |
| 実現性 | OK |
| 整合性 | NG: Group 単位の rollback 不可 |
| 運用性 | NG: 1 行修正で全体再 apply 必要 |
| 判定 | **MAJOR**（reject） |

### 案 B: 4 ファイル分割（init / admin / auth / seed）

| 観点 | 評価 |
| --- | --- |
| 価値性 | OK |
| 実現性 | OK |
| 整合性 | OK（group 境界で rollback 可） |
| 運用性 | OK（migration 順序が明示的） |
| 判定 | **PASS**（採用） |

### 案 C: テーブルごと（20 ファイル）

| 観点 | 評価 |
| --- | --- |
| 価値性 | OK |
| 実現性 | MINOR: 順序管理が複雑 |
| 整合性 | MINOR: FK 順序の見落とし懸念 |
| 運用性 | MINOR: 番号衝突リスク |
| 判定 | **MINOR**（reject 理由: 過剰分割） |

## 漏れチェック

| specs/08 テーブル | DDL 確定 |
| --- | --- |
| `member_responses` | OK |
| `member_identities` | OK |
| `member_status` | OK |
| `deleted_members` | OK |
| `meeting_sessions` | OK |
| `member_attendance` | OK |
| `admin_member_notes` | OK |
| `tag_assignment_queue` | OK |
| `magic_tokens` | OK |
| `tag_definitions` | OK |
| `member_tags` | OK |
| `admin_users` | OK |
| `sync_jobs` | OK |
| `form_manifests` | → schema_versions に統合 |
| `form_fields` | → schema_questions に統合 |
| `form_field_aliases` | → schema_diff_queue に統合 |
| 追加: `response_sections` / `response_fields` / `member_field_visibility` / `schema_diff_queue` | OK |

`profile_overrides` は不変条件 #4 で意図的に作らない。

## 最終判定

**GO（PASS）**。採用案 B で Phase 4 へ。
