# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (Web UI 実装) |
| 次 Phase | 8 (リファクタリング / DRY 化) |
| 状態 | spec_created |

## 目的

AC-1〜AC-10 と実装・テスト・証跡を 1:1 で対応させる。

## 実行タスク

1. `outputs/phase-07/ac-matrix.md` を作る
2. 各 AC に invariant / failure case / test / evidence を記録する
3. 未検証 AC があれば Phase 5/6 に戻す

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
| AC-1 | 非 admin 拒否 | API route / Playwright | 403/redirect |
| AC-2 | action filter | repository / route | response rows |
| AC-3 | actor/target filter | repository / route | response rows |
| AC-4 | JST/UTC date range | repository | boundary fixture |
| AC-5 | JSON 初期折り畳み | web test / screenshot | collapsed image |
| AC-6 | PII mask | web/API test | response has masked view only / DOM has no raw PII |
| AC-7 | pagination filter保持 | web / route | URL state |
| AC-8 | limit / invalid query | route | 400/cap |
| AC-9 | empty/error/broken JSON | web test | UI state |
| AC-10 | read-only UI | DOM assertion | no edit/delete |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | quality gate の入力 |
| Phase 10 | final GO/NO-GO |
| Phase 11 | visual evidence 対象 |

## 多角的チェック観点（AIが判断）

- AC は「実装済み」ではなく「証跡あり」まで揃って PASS
- screenshot は mask 後の表示を含む
- read-only は hidden button ではなく機能自体が存在しないことを確認

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | AC matrix 作成 | pending | outputs/phase-07 |
| 2 | evidence link 記録 | pending | Phase 9/11 連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC 対応表 |

## 完了条件

- [ ] AC-1〜AC-10 の全行に test と evidence がある
- [ ] 未検証 AC が 0
- [ ] Phase 9 に渡せる

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md + ac-matrix.md 配置
- [ ] artifacts.json の Phase 7 を completed に更新

## 次Phase

次: 8 (リファクタリング / DRY 化)。
