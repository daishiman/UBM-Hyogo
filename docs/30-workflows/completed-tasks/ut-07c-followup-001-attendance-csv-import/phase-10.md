# Phase 10 — 最終レビュー

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 名前 | 最終レビュー |
| 状態 | spec_created |
| 依存 | Phase 9 |
| 入力 | Phase 1-9 成果物 |
| 出力 | outputs/phase-10/final-review.md |

## 目的

Issue #312 の acceptance criteria 4 項目との突合を行い、Gate-B (implementation_review) 通過判定を出す。

## タスク

- [ ] Issue #312 の AC を 1 つずつ Phase 成果物に対応付ける
- [ ] 不変条件（CLAUDE.md, index.md）への適合を再確認する
- [ ] 未解決リスク / TODO を列挙する
- [ ] Phase 11 (VISUAL) 進入判定を出す

## Acceptance Criteria 突合表

| AC | 内容 | 検証 evidence |
| --- | --- | --- |
| AC-1 | dryRun=true が副作用なし | Phase 6 F7 + Phase 7 coverage |
| AC-2 | commit 経路が D1 batch + audit_log を出す | Phase 4 case#2,#10 + Phase 7 coverage |
| AC-3 | admin UI 3 ステップ wizard 動作 | Phase 4 case#12,#13 + Phase 11 screenshot |
| AC-4 | 500 超過 413 / 未認証 401 / non-admin 403 | Phase 4 case#3,#4,#5 + Phase 6 F9,F10 |

## 成果物

- `outputs/phase-10/final-review.md`
  - 上記突合表
  - 不変条件適合チェックリスト
  - Phase 11 GO 判定

## 完了条件

- AC 4 項目すべてが evidence と紐づく
- Phase 11 GO 判定が明文化される

## 注意点 / リスク

- ここで AC 不足が判明した場合は Phase 4-9 に戻る
- Gate-B の `evidence_path` は本ファイルを指す
