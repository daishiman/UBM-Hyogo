# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の test architecture について alternative 3 案を比較し、PASS-MINOR-MAJOR で 1 案を選定する。

## 実行タスク

- [ ] alternative 3 案を列挙し table 化
- [ ] 各案の PASS-MINOR-MAJOR 判定
- [ ] 採用案確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象 |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 不変条件 |

## alternative 3 案

| 案 | D1 mock | Forms API mock | 長所 | 短所 |
| --- | --- | --- | --- | --- |
| A. **msw 全面**（D1 も msw で wrap） | msw HTTP layer | msw | mock の流儀統一 | D1 binding の呼び出しを HTTP 化する shim が必要、実装コスト高 |
| B. **miniflare D1**（Cloudflare 公式 D1 emulator） | miniflare | msw or local | 本番に近い、binding 経由で実行 | miniflare の D1 互換性に未解決バグあり、CI 時間増 |
| C. **in-memory sqlite + msw**（採用） | better-sqlite3 :memory: | msw | 高速、CI 0 円、実装シンプル | D1 固有 SQL（JSON1, fts5）一部対応必要、`PRAGMA` で吸収 |

## PASS-MINOR-MAJOR 判定

- 採用: **C**
- PASS: AC-1〜7 達成可能、無料枠で運用可
- MINOR: D1 固有 SQL（fts5 / JSON1）は sqlite ビルドフラグで吸収。Phase 5 runbook で `pnpm setup:test-db` を整備
- MAJOR: なし

## 不変条件適合度

| 不変条件 | A | B | C |
| --- | --- | --- | --- |
| #1 schema 固定しすぎない | 同等 | 同等 | 同等 |
| #2 responseEmail system field | 同等 | 同等 | 同等 |
| #5 3 層分離 | 同等 | 同等 | 同等 |
| #6 apps/web → D1 禁止 | lint で同等 | lint で同等 | lint で同等 |
| #7 論理削除 | 同等 | 同等 | 同等 |
| #11 profile 編集なし | 同等 | 同等 | 同等 |
| 無料枠 | △ msw 過多で CI 時間増 | △ miniflare で時間増 | ◎ |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | C 案で verify suite 設計 |
| Phase 5 | runbook |
| Phase 7 | AC × C 案の対応 |

## 多角的チェック観点

- 不変条件 **#1 / #2 / #5 / #6 / #7 / #11**: いずれの案も不変条件適合度は同等。差は CI 時間と運用容易性。C を採用
- 無料枠: in-memory sqlite で CI 時間 ≤ 5 min を目指す
- secret hygiene: msw は HTTP mock で secret を要求しない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 3 案 | 3 | pending | A / B / C |
| 2 | PASS-MINOR-MAJOR | 3 | pending | 採用 C |
| 3 | 不変条件適合度 | 3 | pending | matrix |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 3 案以上列挙
- [ ] PASS-MINOR-MAJOR 判定記録
- [ ] 採用案確定

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] artifacts.json の phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 採用案 C と MINOR (sqlite ビルドフラグ吸収)
- ブロック条件: MAJOR 残置なら Phase 2 戻し
