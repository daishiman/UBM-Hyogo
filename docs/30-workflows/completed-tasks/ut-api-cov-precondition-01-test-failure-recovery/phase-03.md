# Phase 3: 設計レビュー — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 3 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| workflow_state | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 の設計が、既存仕様、不変条件、coverage AC、test-fixture implementation / NON_VISUAL 境界と矛盾しないことをレビューする。

## 参照資料

- phase-01.md
- phase-02.md
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/03-data-fetching.md
- .claude/skills/task-specification-creator/references/coverage-standards.md

## レビュー観点

| 観点 | 確認内容 | fail 時の扱い |
| --- | --- | --- |
| #1 responseEmail system field | F01-F04 で responseEmail を user editable field として扱っていない | Phase 2 へ差し戻し |
| #2 responseId/memberId separation | F03/F07 で responseId と memberId を混同していない | Phase 2 へ差し戻し |
| #5 public/member/admin boundary | F08-F12 の 401/403 契約が auth spec と一致する | Phase 2 へ差し戻し |
| #6 apps/web D1 direct access forbidden | recovery 設計が apps/web D1 直アクセスを含まない | Phase 2 へ差し戻し |
| coverage integrity | exclude / skip / threshold 緩和で AC を満たす設計ではない | Phase 4 へ進めない |
| implemented-local boundary | test fixture 実装済みと 85% upgrade gate 委譲を混同していない | 文言修正 |

## 実行タスク

1. Phase 2 の group / mock / fixture 設計を上表でレビューする。
2. failure ID の重複、漏れ、Phase 1 inventory との差分を検出する。
3. coverage AC が計測可能な形に分解されているか確認する。
4. 未実測を PASS 扱いする文言を除去する。

## レビュー結果の記録ルール

- `PASS`: 仕様文書として矛盾なし。実測 PASS ではない。
- `BLOCKED`: Phase 2 に不足があり、Phase 4 の test strategy に進めない。
- `DEFERRED_TO_IMPLEMENTATION`: 実装時に確認する項目。Phase 11 evidence が出るまで PASS 禁止。

## 成果物

- Phase 3: `outputs/phase-03/main.md`

## 統合テスト連携

設計レビュー上の PASS は実測 PASS ではない。Phase 11 の test / coverage / guard 実測で、F01-F13 の回復と不変条件 #1/#2/#5/#6 の regression なしを確認する。

## 完了条件

- [ ] F01-F13 の漏れがない。
- [ ] 不変条件 #1/#2/#5/#6 と矛盾する設計がない。
- [ ] coverage integrity を壊す設計が明示的に禁止されている。
- [ ] Phase 3 の `PASS` は設計レビュー上の PASS であり、test / coverage 実測 PASS ではない。
- [ ] 実装、deploy、commit、push、PR を実行していない。
## 次 Phase への引き渡し

Phase 4 へ、レビュー済み failure inventory、coverage integrity 禁止事項、設計上の未解決事項を渡す。
