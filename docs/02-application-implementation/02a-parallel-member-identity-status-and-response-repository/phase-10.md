# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-identity-status-and-response-repository |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 9 (品質保証) |
| 下流 | Phase 11 (手動 smoke) |
| 状態 | pending |

## 目的

Phase 1〜9 の結果を **GO / NO-GO** で判定し、blocker と open question を顕在化する。下流（03b / 04* / 08a）が安心して着手できるかを確認する。

## GO/NO-GO 判定基準

| 軸 | 判定基準 | 結果 |
| --- | --- | --- |
| 上流 Wave AC | 01a / 01b の AC が全て pass | TBD（Phase 10 実行時に確認） |
| 本タスク AC | AC-1〜AC-8 全て pass | TBD |
| 不変条件 | #4 / #5 / #7 / #11 / #12 / #10 全て守れている | TBD |
| 品質チェック | Q-1〜Q-5 全て pass | TBD |
| 無料枠 | reads/writes < 5% | TBD |
| 02b / 02c との相互 import | 0 件 | TBD |
| Phase 8 DRY | 5 カテゴリ全て一致 | TBD |
| Phase 9 secret hygiene | 5 項目 OK | TBD |

**全項目 PASS → GO、1 件でも NO-GO → 該当 Phase に戻る**

## blocker 一覧

| ID | blocker | 影響範囲 | 対処先 |
| --- | --- | --- | --- |
| B-1 | 01a の `member_field_visibility` table が migration に含まれていない | builder の visibility filter が動かない | 01a に diff を依頼 |
| B-2 | 01b の `MemberProfile` 型に `attendance` が無い | builder の戻り値が型不一致 | 01b に diff を依頼 |
| B-3 | `apps/api/src/env.ts` が未着手で D1 binding 取得 helper が無い | repository 起動不能 | 00 foundation に依頼 or 02c で実装 |
| B-4 | dep-cruiser config が 02c で未配置 | AC-8 検証不能 | 02c の進捗待ち（同 Wave） |

blocker B-1〜B-4 は **想定** で、Phase 10 実行時に実態を確認する。

## open question

| Q | 問い | 想定解 | 確認先 |
| --- | --- | --- | --- |
| OQ-1 | `findCurrentResponse` を JOIN 1 回で取るか、2 SQL に分けるか | JOIN 1 回（無料枠 reads 節約） | Phase 5 placeholder |
| OQ-2 | `member_field_visibility` の default が無い field をどう扱うか | default = `member`（最も保守的）として扱う | 04a/04b 検証時 |
| OQ-3 | builder で `tags` を `IN (?)` で取る上限件数 | D1 SQL 引数上限（100 件）を超えないようバッチング | 03b sync 時に偏りが出るか確認 |
| OQ-4 | `responses` 本文の partial update が「絶対」必要なシナリオが将来出るか | 出ない（Form 再回答が正本、不変条件 #4） | 仕様に明記 |

## 4 条件最終評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 03b / 04a / 04b / 04c / 08a が同 interface で並列着手可 |
| 実現性 | PASS | D1 無料枠 0.47% reads / 1.21% writes、bundle size 余裕 |
| 整合性 | PASS | branded type で型混同を構文不可、boundary を dep-cruiser で構造化 |
| 運用性 | PASS | repository は idempotent、02b/02c と互いに独立、Wave 2 の他 task に影響なし |

## レビューチェックリスト

- [ ] AC-1〜AC-8 全て test 設計済み
- [ ] 不変条件 #4 / #5 / #7 / #11 / #12 / #10 全てに対応 case
- [ ] Phase 9 Q-1〜Q-5 が pass 想定
- [ ] 無料枠 < 5%
- [ ] blocker B-1〜B-4 のうち実在するものに対応 plan
- [ ] open question OQ-1〜OQ-4 に解
- [ ] 02b / 02c との相互 import がゼロになる想定

## 実行タスク

1. GO/NO-GO 判定基準を `outputs/phase-10/go-no-go.md` に作成
2. blocker 一覧を `outputs/phase-10/main.md` に作成
3. open question を main.md に追加
4. 4 条件最終評価を main.md に追加
5. 全項目 PASS を確認したら **GO** をマーク

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 1 〜 9 全 outputs | レビュー対象 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 2 全体 |
| 参考 | 並列タスク 02b / 02c | 相互 import 確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定後の manual smoke 範囲 |
| 03b / 04* / 08a | GO 判定後に着手可 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 上流 AC | — | 01a / 01b 完了確認 |
| 不変条件 | #4 #5 #7 #11 #12 #10 | 全 6 件で blocker なし |
| 並列独立 | — | 02b / 02c と互いに blocker 無し |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | GO/NO-GO 判定基準 | 10 | pending | 8 軸 |
| 2 | blocker 一覧 | 10 | pending | B-1〜B-4 |
| 3 | open question | 10 | pending | OQ-1〜OQ-4 |
| 4 | 4 条件最終 | 10 | pending | PASS x4 想定 |
| 5 | GO マーク | 10 | pending | 全 PASS 後 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | blocker / open question / 4 条件 |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定 |

## 完了条件

- [ ] 8 軸の判定基準が記載
- [ ] blocker / open question が顕在化
- [ ] 4 条件全て PASS
- [ ] GO マーク（または NO-GO 理由 + 戻し先 Phase）

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-10/{main,go-no-go}.md が配置済み
- [ ] GO 判定（または NO-GO 後戻し計画）
- [ ] artifacts.json の Phase 10 を completed に更新

## 次 Phase

- 次: Phase 11 (手動 smoke)
- 引き継ぎ事項: GO 判定 + open question
- ブロック条件: NO-GO の場合は該当 Phase に戻る、Phase 11 に進めない
