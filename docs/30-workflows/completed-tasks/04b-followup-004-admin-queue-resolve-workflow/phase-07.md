# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (Web UI 実装) |
| 次 Phase | 8 (リファクタリング / DRY 化) |
| 状態 | completed |

## 目的

AC-1〜AC-6 と実装・テスト・証跡を 1:1 で対応させ、Phase 9 の品質 gate に渡せる状態にする。

## 実行タスク

1. `outputs/phase-07/ac-matrix.md` を作る
2. 各 AC に invariant / failure case / test / evidence を記録する
3. 未検証 AC があれば Phase 5 / 6 へ戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 1 | phase-01.md | AC 定義 |
| Phase 4 | phase-04.md | TC 対応 |
| Phase 5 | phase-05.md | API 実装 |
| Phase 6 | phase-06.md | UI 実装 |

## 実行手順

| AC | 内容 | 主テスト | evidence |
| --- | --- | --- | --- |
| AC-1 | pending 依頼一覧を取得できる | repository / route test | response rows / Phase 11 queue screenshot |
| AC-2 | visibility_request 承認で `member_status.publish_state` が更新される | route + D1 integration test | DB 状態 / response |
| AC-3 | delete_request 承認で `member_status.is_deleted=1` になる | route + D1 integration test | DB 状態 / response |
| AC-4 | reject 時は `member_status` を変更せず note のみ rejected になる | route + D1 integration test | DB 差分が note 列のみ |
| AC-5 | 同 noteId への二重 resolve は 409 で拒否される | route test | HTTP 409 / message |
| AC-6 | member_status + note 更新が atomic（途中失敗で rollback） | integration test（fault inject） | rollback 後 DB が pre-state |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | quality gate の入力 |
| Phase 10 | final GO/NO-GO |
| Phase 11 | visual evidence 対象（queue / modal / empty） |

## 多角的チェック観点（AIが判断）

- AC は「実装済み」ではなく「証跡あり」まで揃って PASS
- atomic 検証は fault injection（中間 statement の意図的失敗）で rollback を確認する
- 二重 resolve の 409 は race condition simulation（並列 request）で検証する
- audit metadata（`resolved_by_admin_id` / `resolved_at` / `resolutionNote`）の書き込みも各 AC の evidence に含める

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | AC matrix 作成 | pending | outputs/phase-07 |
| 2 | evidence link 記録 | pending | Phase 9 / 11 連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC 対応表 |

## 完了条件

- [ ] AC-1〜AC-6 の全行に test と evidence がある
- [ ] 未検証 AC が 0
- [ ] Phase 9 に渡せる

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md + ac-matrix.md 配置
- [ ] artifacts.json の Phase 7 を completed に更新

## 次Phase

次: 8 (リファクタリング / DRY 化)。
