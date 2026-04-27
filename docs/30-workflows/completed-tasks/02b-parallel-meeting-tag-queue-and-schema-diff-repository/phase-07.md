# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 6 |
| 下流 | Phase 8 |
| 状態 | completed |

## 目的

AC-1〜AC-9 を verify suite × 実装 step × failure case で 1 枚 matrix 化。

## AC matrix

| AC | 内容 | Phase 4 verify | Phase 5 step | Phase 6 case | コマンド |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 7 repo unit pass | unit test 7 | Step 2〜6 | F-1〜F-5 | `pnpm test repository` |
| AC-2 | attendance PK 重複阻止 | DB-1, DB-2 | Step 3 (try/catch) | F-2, R-1 | `pnpm test attendance` |
| AC-3 | getLatestVersion = active 1 件 | schemaVersions.test.ts | Step 6 | F-4 | `pnpm test schemaVersions` |
| AC-4 | tagQueue unidirectional | ST-1〜ST-5 | Step 5 (ALLOWED) | ST-1〜ST-3 | `pnpm test tagQueue` |
| AC-5 | schemaDiffQueue list ASC | schemaDiffQueue.test.ts | Step 6 | ST-4 | `pnpm test schemaDiffQueue` |
| AC-6 | tagDefinitions 6 カテゴリ非空 | tagDefinitions.test.ts | Step 4 | F-3 | `pnpm test tagDefinitions` |
| AC-7 | listAttendableMembers 削除済み除外 | DB-3, DB-5 | Step 3 (status check + JOIN) | A-1, A-2 | `pnpm test attendance.attendable` |
| AC-8 | N+1 防止 | attendance.test.ts query count | Step 3 (JOIN) | — | `pnpm test attendance.n-plus-one` |
| AC-9 | 02a/02c 相互 import ゼロ | depcruise CI | — | A-5 | `pnpm depcruise apps/api` |

## 不変条件 × AC

| 不変条件 | 関連 AC | 守り方 |
| --- | --- | --- |
| #5 D1 boundary | AC-9 | depcruise rule |
| #13 tag 直接編集禁止 | AC-4, AC-6 | tagDefinitions write 不在、tagQueue 状態遷移 |
| #14 schema 集約 | AC-3, AC-5 | schemaDiffQueue / schemaVersions 単一 source |
| #15 attendance 重複 + 削除済み | AC-2, AC-7 | PK 制約 + listAttendableMembers JOIN |
| #10 無料枠 | AC-8 | index 利用 + JOIN 1 回 |

## トレース完全性

| Phase | 件数 | 完了率 |
| --- | --- | --- |
| Phase 1 AC | 9 | 9/9 = 100% |
| Phase 4 verify | 7 unit + 6 DB + 5 状態 + 4 contract = 22 | 22/22 集約 |
| Phase 5 step | 8 | 8/8 |
| Phase 6 case | 18 (F+ST+A+R) | 18/18 |

漏れ: 0

## 実行タスク

1. AC matrix を `outputs/phase-07/ac-matrix.md`
2. 不変条件 × AC を `outputs/phase-07/main.md`
3. トレース完全性チェック

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 1, 4, 5, 6 | matrix 起点 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 8 | DRY 化 |
| Phase 10 | GO/NO-GO |
| 08a | repository contract test |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| AC 漏れ | — | 9 AC 全て 1:1 |
| 不変条件 | #5 #13 #14 #15 #10 | 全 5 件マップ |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC matrix | completed |
| 2 | 不変条件 × AC | completed |
| 3 | トレース完全性 | completed |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-07/main.md | 不変条件 × AC + トレース |
| outputs/phase-07/ac-matrix.md | 9 AC × 4 軸 |

## 完了条件

- [ ] 9 AC × 4 軸完成
- [ ] 不変条件 5 件全マップ
- [ ] トレース 100%

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜3 completed
- [ ] outputs/phase-07/* 配置済み
- [ ] artifacts.json の Phase 7 を completed

## 次 Phase

- 次: Phase 8
- 引き継ぎ事項: AC matrix
- ブロック条件: 漏れ > 0 なら戻し
