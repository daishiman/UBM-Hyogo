# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の cron schedule / 監視 / runbook 章立てに対して alternative 3 案を比較し、PASS-MINOR-MAJOR 判定でレビューを締める。

## 実行タスク

1. alternative 3 案（cron 頻度 / 監視 / rollback 戦略）
2. PASS-MINOR-MAJOR 判定
3. 不変条件 #5/#6/#10/#15 review
4. open question clearance

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-3-review.md | review 観点 |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-02.md | レビュー対象 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | cron 正本 |

## 実行手順

### ステップ 1: alternative 3 案
- A 案: cron `*/5` (高頻度 / 早く反映 / 無料枠リスク)
- B 案: cron `0 18 * * *` のみ（schema sync 1 日 1 回 / response は手動）
- C 案: `0 * * * *` + `0 18 * * *` + `*/15 * * * *` の current facts を採択（wrangler.toml と aiworkflow-requirements の現行記録を優先）

### ステップ 2: PASS-MINOR-MAJOR
- 4 領域 × 3 案

### ステップ 3: 不変条件 review
- #5/#6/#10/#15

### ステップ 4: open question clearance

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採択案を verify suite 対象に |
| Phase 10 | review 結果を GO/NO-GO 根拠に |
| 並列 09a | staging cron が無料枠内か相互参照 |
| 下流 09c | 採択案を production cron に転用 |

## 多角的チェック観点（不変条件）

- #6: GAS apps script trigger を一切使わない（Workers Cron Triggers のみ）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 3 案作成 | 3 | pending | A / B / C |
| 2 | PASS-MINOR-MAJOR | 3 | pending | 12 セル |
| 3 | 不変条件 review | 3 | pending | #5/#6/#10/#15 |
| 4 | open question clearance | 3 | pending | Phase 1 持ち越し |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 3 案 / PASS-MINOR-MAJOR |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 完了条件

- [ ] alternative 3 案
- [ ] PASS-MINOR-MAJOR 12 セル
- [ ] MAJOR 0 件、または差し戻し記録あり
- [ ] 不変条件 review 完了

## タスク100%実行確認【必須】

- 全実行タスクが completed
- main.md 完成
- artifacts.json の phase 3 を completed に更新

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採択案 C / PASS-MINOR-MAJOR 結果
- ブロック条件: MAJOR 残存で次 Phase に進まない

## Alternative 3 案

| 案 | 概要 | Pros | Cons |
| --- | --- | --- | --- |
| A | cron `*/5 * * * *` で response sync を 5 分毎、schema sync 12 時間毎 | 反映が早い | 無料枠 100k req/day を逼迫（5 分 × 24h × 30day = 8640 req/月だが他リクエストと併算） |
| B | schema sync `0 18 * * *` のみ。response は admin が手動で叩く | 無料枠最大余裕 | 反映遅延が大きく、UX 悪化 |
| C（採択） | `0 * * * *` (legacy Sheets/current 残存) + `0 18 * * *` (schema) + `*/15 * * * *` (response) | `apps/api/wrangler.toml` current facts と一致し、legacy 撤回は UT21-U05 に分離済み | 15 分の遅延と legacy 行の監視ノイズあり |

## PASS-MINOR-MAJOR 判定

| 領域 | A | B | C |
| --- | --- | --- | --- |
| cron 頻度 | MINOR（無料枠リスク） | MINOR（UX 悪化） | PASS |
| 監視 dashboard | PASS | PASS | PASS |
| rollback 戦略 | PASS | PASS | PASS |
| 二重起動防止 | PASS | PASS | PASS |

採択: **C 案**。MAJOR 0、MINOR 0、PASS 4。

## 不変条件 review 結果

| 不変条件 | 結果 | 根拠 |
| --- | --- | --- |
| #5 | PASS | rollback で web に D1 操作含めない |
| #6 | PASS | Workers Cron Triggers のみ採用、GAS なし |
| #10 | PASS | C 案で 100k req/day 内 |
| #15 | PASS | rollback で attendance 整合性保つ手順を Phase 6 で詳述 |
