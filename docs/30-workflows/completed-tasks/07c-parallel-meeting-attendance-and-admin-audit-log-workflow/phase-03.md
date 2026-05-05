# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 2 の設計に対して 3 つの alternative を比較し、PASS-MINOR-MAJOR で 1 案を選定する。MAJOR が残れば Phase 2 へ差し戻す。

## 実行タスク

- [ ] alternative 3 案を列挙し、長短を table 化
- [ ] 各案を不変条件 #5 / #7 / #11 / #13 / #15 に照らし、適合度を評価
- [ ] 採用案を確定し、PASS-MINOR-MAJOR 判定を下す
- [ ] MAJOR があれば Phase 2 戻し、なければ Phase 4 へ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 参考 | docs/30-workflows/02-application-implementation/_design/phase-3-review.md | 大元設計のレビュー |

## 実行手順

### ステップ 1: alternative 3 案の整理

| 案 | 概要 | 長所 | 短所 |
| --- | --- | --- | --- |
| A. **DB 制約のみ** | UNIQUE 制約のみで重複阻止、API は INSERT して D1 エラーをそのまま 500 で返す | 実装最少 | 409 が返らず client が誤解、idempotent retry が破綻、audit が残らない |
| B. **App 層 idempotent のみ** | API で `SELECT then INSERT`、DB 制約なし | 制約なしで migration 軽量 | 同時 2 リクエストで race condition、削除と作成の同時操作で食い違い |
| C. **二重防御（採用）** | UNIQUE 制約 + API gate (409 + 既存 row 返却) + audit hook | race condition 耐性、idempotent retry に 409 で答えられる、audit 残る | hook middleware を 1 個追加する実装コスト |

### ステップ 2: 不変条件適合度

| 条件 | A | B | C |
| --- | --- | --- | --- |
| #5 admin gate | 同等 | 同等 | 同等 |
| #7 削除済み除外 | 別途 resolver 必要 | 同等 | 同等 |
| #11 profile 直接編集なし | 同等 | 同等 | 同等 |
| #13 admin-managed | 同等 | 同等 | 同等 |
| #15 重複阻止 | 制約のみで race OK だが 500 返却 | race NG | OK |

### ステップ 3: PASS-MINOR-MAJOR 判定

- 採用: **C 二重防御**
- PASS: AC-1 (409 + idempotent), AC-3 (audit hook), AC-7 (二重防御明記)
- MINOR: hook middleware の test カバレッジを Phase 4 で追加する必要あり
- MAJOR: なし（あれば Phase 2 へ戻す）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | C 案の挙動を verify suite に展開 |
| Phase 5 | C 案の runbook |
| Phase 7 | C 案 × AC のトレース |
| Phase 10 | GO/NO-GO の根拠 |

## 多角的チェック観点

- 不変条件 **#5** / **#7** / **#11** / **#13** / **#15** すべてに照らして C 案を採用（理由: 二重防御で運用 trail と整合性が確保される）
- a11y: 409 時の UI 表示は toast + 既存 row 詳細ボタン（aria-live="polite"）
- 無料枠: hook で 1 操作 +1 write 増えるが 100 操作/日想定なら影響軽微

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 3 案列挙 | 3 | pending | A / B / C |
| 2 | 不変条件適合度評価 | 3 | pending | matrix |
| 3 | PASS-MINOR-MAJOR 判定 | 3 | pending | 採用案明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー成果物 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] alternative 3 案以上を列挙
- [ ] PASS-MINOR-MAJOR 判定が記録されている
- [ ] MAJOR がない（あれば Phase 2 戻し）

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 多角的チェック観点が網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 3 を completed に更新

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 採用案 C と MINOR (hook test 追加)
- ブロック条件: MAJOR 残置なら Phase 4 不可
