# Phase 6: 異常系

| ID | シナリオ | 期待動作 | 検証手段 |
| -- | -------- | -------- | -------- |
| E-1 | runbook ファイルが削除された | bats `migration-guideline-presence.bats` の "guideline file exists" が fail。CI 全体 red | bats |
| E-2 | runbook の必須見出しが typo / 削除 | 対応する bats ケースが fail | bats |
| E-3 | CI で `pull-requests: write` permission が無い | github-script step が 403 で fail。verify job 全体は **fail** にせず continue-on-error で warn 扱い。Phase 13 runtime evidence で未投稿を検出して権限修正する | yml `always()` + `continue-on-error: true` を comment step に設定 |
| E-4 | PR に migration 変更が無いのに workflow が dispatched された | paths filter で trigger されないため発生しない（filter で防御） | n/a |
| E-5 | comment marker が重複（手動コメントと衝突） | marker `<!-- d1-migration-guideline-bot -->` は十分に unique。手動衝突は起こらない前提。万一一致しても update で上書きされるだけ | code review |
| E-6 | github-script の rate limit | 1 PR あたり 1 comment（update）のため rate limit に達しない | n/a |
| E-7 | runbook link が存在しない blob ref を指す | `pull_request.head.sha` を使うため、その時点の sha では runbook が存在しない可能性（同一 PR で初投入時のみ）。link は対象 PR の head にあるため、PR で runbook 自体を追加すれば自然解消 | code review |

## 対策の実装反映

- E-3 対策: comment step に `if: always() && github.event_name == 'pull_request'` と `continue-on-error: true` を追加し、前段 verify fail 時も runbook link post を試行しつつ verify job 全体を保護
- E-7 対策: runbook が repository に merge 済み（dev/main）であれば link は安定。初回投入 PR では link が同 PR の head を指すため self-referential で破綻しない

## 完了条件

- 各異常系に対する防御策が Phase 5 の実装手順に反映可能なレベルで決定済み

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 6 |
| status | completed |

## 目的

runbook 欠落、CI comment 権限不足、重複 comment などの異常系を事前に潰す。

## 実行タスク

- 各異常系の期待動作と検証手段を定義する。
- Phase 5 の実装手順へ防御策を反映する。

## 参照資料

- `phase-02.md`
- `phase-05.md`

## 成果物/実行手順

異常系表と対策の実装反映をこのファイルに保持する。

## 統合テスト連携

E-1/E-2 は bats、E-3 は Phase 11/13 evidence で検証する。
