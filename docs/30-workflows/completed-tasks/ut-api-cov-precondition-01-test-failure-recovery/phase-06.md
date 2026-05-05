# Phase 6: 異常系検証 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 6 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| workflow_state | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

F01-F13 の root cause と異常系 coverage を記録し、単に green に戻すだけでなく regression を再発させない検証観点を固定する。

## 参照資料

- phase-02.md
- phase-05.md
- outputs/phase-05/main.md
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/03-data-fetching.md

## Root Cause 記録フォーマット

| failure ID | suspected cause | required check | evidence when implemented |
| --- | --- | --- | --- |
| F01-F04 | form payload / identity / fixture drift | null/empty response、duplicate response、responseEmail system field | focused test log + root cause note |
| F05 | schema alias not-found handling drift | missing question、deleted question、revision scope | focused test log + payload assertion |
| F06 | tag queue status alias drift | queued/resolved/confirmed mapping、invalid transition | focused test log + transition assertion |
| F07 | repository seed or query scope drift | memberId mismatch、soft delete、empty list | focused test log + D1 seed note |
| F08-F11 | admin authz helper/session drift | no session 401、member 403、admin 200 where applicable | route focused test log |
| F12 | `/me` unauthenticated path drift | no session 401、valid member 200 unaffected | route focused test log |
| F13 | unresolved async hook / timer | hook cleanup、promise settle、timeout no longer reached | auth route focused test log |

## 異常系チェックリスト

- null / empty input が expected error または empty response になる。
- D1 failure は redacted error を返し、secret / raw SQL を漏らさない。
- auth failure は 401、role mismatch は 403 として分離する。
- network / external fetch failure は retryable / non-retryable を分類する。
- timeout recovery は非決定的な sleep 依存にしない。

## 実行タスク

1. F01-F13 の suspected cause と required check を root cause 表に記録する。
2. 異常系 checklist を Phase 7 AC matrix へ接続する。
3. 実装時の evidence 欄は Phase 11 実測まで pending と明記する。
4. root cause 未確定の failure は PASS ではなく `needs implementation investigation` と分類する。

## 成果物

- Phase 6: `outputs/phase-06/main.md`

## 依存成果物参照

- Phase 5: `outputs/phase-05/main.md`

## 統合テスト連携

root cause 表は Phase 11 の実測ログに接続する。`FakeD1` の不足が `enqueueTagCandidate` 経由で `runResponseSync` を failed にする因果を検証し、authz / identity / timeout 系の先行回復分も regression なしとして確認する。

## 完了条件

- [ ] F01-F13 の root cause 記録フォーマットがある。
- [ ] authz、D1、network、timeout、identity の異常系観点が漏れていない。
- [ ] root cause 未確定を PASS と記載していない。
- [ ] 実装、deploy、commit、push、PR を実行していない。
## 次 Phase への引き渡し

Phase 7 へ、root cause 表、異常系 checklist、pending evidence の扱いを渡す。
