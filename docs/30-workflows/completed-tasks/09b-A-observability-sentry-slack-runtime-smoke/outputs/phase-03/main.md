# Output Phase 3: 設計レビュー（確定）

## status

DESIGN_REVIEW_CONFIRMED / NOT_EXECUTED

## レビュー gate 記録

| 項目 | 値 |
| --- | --- |
| reviewer | self-review（solo dev policy） |
| tag | design-review |
| review 日 | 2026-05-05 |
| 対象 | `outputs/phase-02/main.md` および `phase-02.md` |

## レビュー観点ごとの判定

| # | 観点 | 判定 | コメント |
| --- | --- | --- | --- |
| R-01 | 不変条件レビュー（INV #14 / #16 / #17） | PASS | #14: free-tier 前提を Phase 2 「8. 設計上の前提」で明記。#16: 実値は op:// 参照のみで wrangler.toml / コード / evidence に書かない方針が「2 / 3 / 8」で一貫。#17: Sentry 受信導線 + Slack 通知導線 + fallback tree が「4 / 5 / 7」で揃う |
| R-02 | secret 漏洩リスク（grep gate / op:// / repo / log / PR / evidence） | PASS | grep gate `rg -n 'SENTRY_DSN assignment containing an https DSN\|hooks\.slack\.com/services/[A-Z0-9]+\|sentry\.io/[0-9]+'` が Phase 1/2 docs に対し 0 件。secret list 出力は値非表示形式のみ保存する evidence path（AC-03）が確定。Sentry test event evidence は event id のみで DSN URL を含めない設計 |
| R-03 | runbook 完備性（rollback / rotation / fallback） | PASS | Phase 2 「6.1 secret rollback」「6.2 Sentry DSN rotation」「6.3 Slack webhook revoke」「7 失敗時 fallback 判定 tree」が連続して記述され、Sentry / Slack / secret 配置の各失敗を tree で網羅 |
| R-04 | 既存 09b runbook との整合性 | FIX-NEEDED（軽微 / Phase 5 で対応） | `observability-monitoring.md` の既存 secret 名 `SLACK_ALERT_WEBHOOK_URL` と本設計の `SLACK_WEBHOOK_INCIDENT` の関係が Phase 2 で「Phase 5 で確定する」と委ねられている。Phase 5 開始時点で alias / 移行 / 旧名廃止のいずれかを決定すること。本観点では blocking ではなく Phase 5 forward 課題として記録 |
| R-05 | approval gate / 自走禁止カバレッジ | PASS | G-01〜G-05 が「設計確定 / staging secret put / production secret put / runbook commit / PR」を網羅し、自走禁止操作リスト 6 項目すべてに対応する gate が存在 |
| R-06 | Phase 4 前提引き渡し可否 | GO | テスト戦略（Phase 4）が必要とする入力: AC（5 件）/ evidence path（6 系統）/ 通知 matrix（5 行）/ fallback tree が揃っている。Sentry test event の redact ルールも明記済み |

## 修正必要点 / Phase 2 戻し判断

- R-04（FIX-NEEDED 軽微）は Phase 2 への戻しは行わず、**Phase 5（実装ランブック）冒頭で `SLACK_ALERT_WEBHOOK_URL` ⇆ `SLACK_WEBHOOK_INCIDENT` の取扱いを最初に確定する** ことを引き渡し条件にして前進する。
  - 既定方針: 既存 references の互換維持を優先し、`SLACK_WEBHOOK_INCIDENT` を**正本 secret 名として新規追加**、`SLACK_ALERT_WEBHOOK_URL` は **deprecation 表記を docs に入れて段階的廃止**。
  - 旧名参照コードがある場合は Phase 5 で `apps/api` を grep し、置換 PR を本タスクとは別に切る判断も可。
- 上記以外に PASS 以外の判定はない。

## Phase 4 GO/NO-GO 判定

**GO**

理由:

1. AC-01〜AC-05 がすべて observable な evidence path に紐づいている
2. 不変条件 #14 / #16 / #17 が設計に取り込まれている
3. rollback / rotation / fallback tree が runbook 化に十分な粒度で揃っている
4. R-04 の軽微な命名整合性は Phase 5 の冒頭タスクで吸収可能で、Phase 4（テスト戦略）の前提を阻害しない

## Phase 4 への引き渡し条件

- Phase 4 ではテスト戦略として以下を扱うこと:
  - AC-01 / AC-02 の staging smoke を「Phase 11 で実行可能な手順」に分解する戦略
  - AC-03 の grep gate を CI に組み込み可能か / 手動 evidence のみで足りるかの方針
  - Slack 通知 matrix の各 trigger を **どこまで staging で実発火させるか / dry-run で代替するか** の戦略
  - fallback tree の各分岐に対する verification 手段
- Phase 5 開始時点の必須先頭タスク: `SLACK_ALERT_WEBHOOK_URL` 命名整合性の確定（R-04 の forward 課題）

## レビュー結論

Phase 2 設計は本タスクの AC を実行可能な粒度で満たしており、R-04 を Phase 5 forward 課題として明示する条件付きで Phase 4 へ進む。
