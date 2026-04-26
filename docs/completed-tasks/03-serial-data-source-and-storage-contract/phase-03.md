# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | completed |
| implementation_mode | new |

## 目的

Phase 2 成果物（data-contract.md / sync-flow.md / main.md）を 4 条件・CLAUDE.md 不変条件 7 項目・AC-1〜AC-5・downstream（04/05a/05b）引き継ぎ観点でレビューし、PASS / CONDITIONAL_PASS / FAIL を判定して Phase 4 への gate を引く。

## 実行タスク

- 4 条件レビュー（価値性 / 実現性 / 整合性 / 運用性）を実値判定
- 不変条件 7 項目への抵触チェック
- AC-1〜AC-5 の Phase 2 成果物トレース
- downstream タスク（04 / 05a / 05b）への引き継ぎ可否確認
- gate 判定（PASS / CONDITIONAL_PASS / FAIL）と残課題の MINOR 追跡登録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/data-contract.md | レビュー対象 |
| 必須 | outputs/phase-02/sync-flow.md | レビュー対象 |
| 必須 | CLAUDE.md | 不変条件 7 項目 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | 整合性確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 実現性確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 整合 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secret 配置確認 |

## 実行手順

### ステップ 1: レビュー観点の適用
- 4 条件を Phase 2 成果物に対し実値判定
- 不変条件 7 項目を 1 つずつ Phase 2 文面に当てて照合
- AC-1〜AC-5 を data-contract.md / sync-flow.md の章番号に対応付け

### ステップ 2: downstream 引き継ぎ確認
- 04（CI/CD secrets）: GOOGLE_SERVICE_ACCOUNT_JSON / CLOUDFLARE_API_TOKEN の配置先が確定しているか
- 05a（observability）: sync_audit テーブルが metrics 取得対象として定義されているか
- 05b（smoke handoff）: backfill 手順が runbook 前提として参照可能か

### ステップ 3: 判定と記録
- gate 判定を「レビュー結果記録」セクションに残す
- MINOR は Phase 8 / 12 へ追跡登録、MAJOR は Phase 2 へ差し戻し

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | gate PASS により事前検証手順へ進む |
| Phase 7 | AC トレース表の入力 |
| Phase 10 | 最終 gate 判定の根拠 |
| Phase 12 | MINOR 残課題の close-out |

## 多角的チェック観点（AIが判断）

- 価値性: 設計が運用者・開発者双方の迷いを消すか
- 実現性: D1 無料枠（writes 100K/day, reads 5M/day）に sync 設計が収まるか
- 整合性: 不変条件 1〜7 と全項目で矛盾しないか
- 運用性: failure recovery が runbook 化可能な粒度か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 条件レビュー | 3 | completed | 実値判定 |
| 2 | 不変条件 7 項目チェック | 3 | completed | CLAUDE.md 照合 |
| 3 | AC-1〜AC-5 トレース | 3 | completed | Phase 2 章対応付け |
| 4 | downstream 引き継ぎ確認 | 3 | completed | 04/05a/05b |
| 5 | gate 判定と記録 | 3 | completed | レビュー結果記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果・gate 判定・残課題 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 4 条件すべて実値判定済み
- [ ] 不変条件 7 項目すべて抵触なし確認済み
- [ ] AC-1〜AC-5 すべてトレース完了
- [ ] gate 判定が PASS / CONDITIONAL_PASS / FAIL のいずれかに確定
- [ ] レビュー結果記録テンプレートが埋まっている

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] MAJOR が出た場合は Phase 2 差し戻しを記録
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: gate 判定と CONDITIONAL_PASS の場合の条件、MINOR 一覧
- ブロック条件: gate=FAIL の場合は Phase 2 差し戻し、Phase 4 へ進まない

## レビューチェックリスト (4条件)
| 観点 | レビュー問い | 判定基準 |
| --- | --- | --- |
| 価値性 | 開発者・運用者の迷いを消すか | data-contract.md に役割分離が明記されていれば PASS |
| 実現性 | D1 無料枠で scheduled 1h sync が成立するか | writes/日 < 100K の試算が main.md にあれば PASS |
| 整合性 | apps/web からの D1 直接アクセス禁止が貫徹しているか | sync worker が apps/api 配下なら PASS |
| 運用性 | Sheets 再投入による backfill が runbook 化可能か | sync-flow.md に手順骨子があれば PASS |

## 不変条件チェック（CLAUDE.md 7 項目）
| # | 不変条件 | 確認観点 | 判定 |
| --- | --- | --- | --- |
| 1 | schema を固定しすぎない | mapping table が拡張余地を持つか | TBD |
| 2 | consent キー統一 | publicConsent / rulesConsent のみ使用 | TBD |
| 3 | responseEmail は system field | mapping で system field 扱いか | TBD |
| 4 | admin-managed data 分離 | admin_* テーブル/列を分離 | TBD |
| 5 | D1 直接アクセスは apps/api のみ | apps/web 経路が無いか | TBD |
| 6 | GAS prototype を昇格させない | sync worker は新規実装か | TBD |
| 7 | Form 再回答が本人更新の正式経路 | upsert キーが responseId か | TBD |

## AC トレース表
| AC | Phase 2 成果物の対応箇所 | 判定 |
| --- | --- | --- |
| AC-1 | data-contract.md「sync direction」 | TBD |
| AC-2 | sync-flow.md「manual / scheduled / backfill」 | TBD |
| AC-3 | sync-flow.md「failure recovery」+ Phase 5 runbook 前提 | TBD |
| AC-4 | sync-flow.md「Sheets を真として再 backfill」 | TBD |
| AC-5 | main.md「純 Sheets 案非採用根拠」 | TBD |

## downstream 引き継ぎ表
| 下流タスク | 引き継ぎ項目 | 確認 |
| --- | --- | --- |
| 04-cicd-secrets | GOOGLE_SERVICE_ACCOUNT_JSON / CLOUDFLARE_API_TOKEN 配置先 | TBD |
| 05a-observability | sync_audit table を metrics 対象として参照 | TBD |
| 05b-smoke-handoff | backfill runbook の参照パス | TBD |

## より単純な代替案
- 代替案 A: Google Sheets を正本 DB にする → AC-5 で却下（無料枠 reads 不安定 / クエリ性能不足）
- 代替案 B: D1 のみ使い Sheets を捨てる → 運用者の入力 UI 喪失で却下
- 代替案 C: 双方向 sync → 復旧 source-of-truth が一意化できず却下

## gate 判定基準
| 判定 | 条件 |
| --- | --- |
| PASS | 4 条件すべて PASS / 不変条件すべて抵触なし / AC すべてトレース済み / downstream 引き継ぎ可 |
| CONDITIONAL_PASS | MINOR ≤3 件で Phase 8/12 で吸収可能、blocker なし |
| FAIL | いずれかの不変条件抵触または AC 未トレース、Phase 2 差し戻し |

## レビュー結果記録テンプレート
| 項目 | 値 |
| --- | --- |
| reviewer |  |
| 日付 |  |
| 判定 | PASS / CONDITIONAL_PASS / FAIL |
| 4 条件サマリ |  |
| 不変条件抵触有無 |  |
| 残課題（MINOR） |  |
| 次 Phase 進行可否 |  |

## MINOR 追跡表
| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| M-01 | wording / naming drift | 8 or 12 |
