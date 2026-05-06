# Phase 11: 手動 smoke / 実測 evidence — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ] / CONST_004 例外根拠: 本タスクは runbook formalization と evidence template 確定のみを担う `taskType: docs-only / NON_VISUAL / spec_created / remaining-only` であり、実 secret 登録・実 deploy・実 test event 発火は user approval 経由の後続 runtime wave に委ねる。CONST_004（実装着手前の commit / push / 実値投入禁止）の例外を発生させない構造になっているため、本仕様書段階では evidence placeholder すら作成しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 11 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| state | spec_created |
| runtime PASS 取得 wave | 別 wave（user approval 経由の runtime execution wave） |

## 目的

後続 runtime wave で実 smoke を実行する際に、漏洩なく PASS 判定が可能となるよう、**evidence template / redact 規則 / grep gate / PASS 判定基準** を確定する。本仕様書作成タスクでは実 evidence は取得しない。

## 入力

- Phase 1 AC: AC-01 (Sentry staging test event 証跡), AC-02 (Slack test alert 証跡), AC-03 (secret 漏洩ゼロ), AC-04 (fallback runbook), AC-05 (placeholder 解除)
- Phase 2 設計: 1Password item / Cloudflare secret 命名表 / Sentry test event 仕様 / Slack 通知 matrix / rotation rollback / fallback tree
- Phase 5 runbook（後続作成想定）: secret 投入手順 / smoke 実行手順
- Phase 7 AC matrix / Phase 9 品質保証
- 既存正本: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`, `deployment-secrets-management.md`

## 実行ルール（NON_VISUAL / runtime PASS 別 wave）

- 本仕様書作成タスクでは実 evidence は取得しない（実 secret 登録 / 実 test event 発火 / 実 Slack 通知発火を行わない）
- 実 evidence 取得は user approval gate G-03（production secret 登録前）/ G-04（runbook 更新コミット前）通過後の **別 wave** で実施する
- Phase 11 の `outputs/phase-11/main.md` は「runtime evidence template + PASS 判定基準 + redact 規則」を仕様化するもの
- evidence file は本タスク完了時点では `outputs/phase-11/main.md`、`outputs/phase-11/manual-smoke-log.md`、`outputs/phase-11/link-checklist.md` の 3 点。後者 2 点は NON_VISUAL helper artifact であり、実 smoke PASS 証跡ではない。残り 7 種の runtime evidence は後続 wave で実体化する（runtime placeholder は本仕様書では作成しない）

## evidence file 一覧（後続 wave で実体化）

| # | ファイル | 用途 | redact ルール | PASS 判定 |
| --- | --- | --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | Phase 11 概要・取得指示・template 集約（**本タスクで作成**） | DSN URL / webhook URL / token 値を一切記録しない | template が後続 wave で参照可能であること |
| 1a | `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL helper。現 cycle の NOT_EXECUTED 境界と後続 runtime wave 記録フォーマット | 実値・hash・URL は記録しない | current cycle が runtime PASS でないことが明確 |
| 1b | `outputs/phase-11/link-checklist.md` | NON_VISUAL helper。参照先と後続 evidence link の検査表 | 実値・hash・URL は記録しない | canonical docs / runtime evidence slots が追跡可能 |
| 2 | `outputs/phase-11/sentry-secret-list-redacted.md` | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` 結果（値非表示） | wrangler の `name` / `type` 列のみ。`value` は出力されないが念のため `***` mask 確認 | `SENTRY_DSN_API` の name 行が staging に存在 |
| 3 | `outputs/phase-11/sentry-test-event-id.md` | Sentry dashboard event id 記録 | DSN URL を含めない。event id は短縮 hex 8 桁、project name は表示可、timestamp は ISO8601 | event id が 1 件以上、timestamp が 60s 以内に着信 |
| 4 | `outputs/phase-11/slack-secret-list-redacted.md` | Slack webhook secret list（値非表示） | webhook URL を含めない | `SLACK_WEBHOOK_INCIDENT` の name 行が staging に存在 |
| 5 | `outputs/phase-11/slack-test-notification-evidence.md` | Slack permalink / screenshot 参照 | webhook URL は記録しない。permalink の `T<workspace>/C<channel>/p<ts>` は記録可（webhook secret ではない） | message が channel `#ubm-incident` に着信、permalink 取得可 |
| 6 | `outputs/phase-11/redaction-grep-result.md` | 3 系統 grep の hit/no-hit 結果 | grep コマンド本体は記録、ヒットがあれば該当行を `***` mask して記録 | 3 系統すべて 0 hit |
| 7 | `outputs/phase-11/runbook-update-diff.md` | 09b 既存 runbook の placeholder 更新差分 | placeholder 文言と更新後文言、実 DSN / URL は含めない | placeholder「未登録」表記が「実 secret 登録済・値は 1Password 正本」に置換済 |
| 8 | `outputs/phase-11/user-approval-record.md` | production secret 登録の user approval 記録 | approval 時刻 / 承認者 hash（user email を直接記録しない場合は ID）/ 対象 secret 名のみ | G-03 通過の record が timestamp 付きで残る |

## 取得タイミング / 取得手段（runtime wave 想定）

| evidence | 取得タイミング | 取得手段 |
| --- | --- | --- |
| sentry-secret-list-redacted | staging secret put 直後 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` の stdout を redact 確認の上保存 |
| sentry-test-event-id | Sentry SDK で `captureMessage('UBM staging smoke <ISO8601>')` 送信後 60s 以内 | Sentry dashboard → Issues → 該当 event id（短縮 hex）を手動で記録 |
| slack-secret-list-redacted | Slack secret put 直後 | 上記 cf.sh secret list の Slack 行抽出 |
| slack-test-notification-evidence | Slack 連携経由で test alert 送信後 | Slack message permalink 取得（右クリック → Copy link）/ 必要なら redact 済 screenshot |
| redaction-grep-result | 上記 4 evidence 確定後、commit 前 | Phase 1/2 ですでに定義済の 3 系統 grep（下記）を repo / outputs 全体に対し実行 |
| runbook-update-diff | placeholder 更新コミット前 | `git diff` を redact フィルタ（DSN / webhook URL を含む行は記録しない判断）にかけて保存 |
| user-approval-record | G-03 / G-04 通過時 | 承認 timestamp / 承認者 ID / 対象 secret 名を Markdown table で記録 |

## redact 規則（宣言）

- DSN URL（`https://<key>@<host>/<project>` 形式）は base64 / hash でも記録しない。`redacted=YES` の表記のみで存在を示す
- Slack webhook URL（`https://hooks.slack.com/services/...`）も同上
- token 値（Sentry auth token / Cloudflare API token）は op:// 参照のみで一切記録しない
- secret list 出力で `value` 列が出る ver の wrangler を使う場合は `***` で mask した上で保存
- Slack permalink の `T*/C*/p*` 形式 ID は webhook URL とは異なるため記録可（message 公開範囲を controller できる）

## grep gate（3 系統 / AC-03 直結）

```
rg -n 'SENTRY_DSN assignment containing an https DSN' .
rg -n 'hooks\.slack\.com/services/[A-Z0-9]+' .
rg -n 'sentry\.io/[0-9]+' .
```

PASS 条件: 3 系統すべて 0 hit。1 件でも hit があれば即 rotation（Phase 2「6.2 / 6.3」の rotation / revoke 手順を発火）。

## approval gate（runtime wave で必要）

| gate id | タイミング | 判定基準 |
| --- | --- | --- |
| G-03 | production secret 登録前 | staging smoke で AC-01 / AC-02 / AC-03 が PASS している evidence を user が確認 |
| G-04 | 09b 既存 runbook の placeholder 更新コミット前 | runbook diff の文言レビューが完了している |


## 実行タスク

1. この Phase の入力、出力、approval gate、redaction 境界を確認する。
2. 実 secret 値、DSN URL、Slack webhook URL、token 値が仕様書に含まれていないことを確認する。
3. 後続 Phase または runtime wave へ引き渡す evidence path を明示する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-11/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件（本仕様書作成段階）

- `outputs/phase-11/main.md`、`outputs/phase-11/manual-smoke-log.md`、`outputs/phase-11/link-checklist.md` が存在する
- 上記 7 種 runtime evidence template が `outputs/phase-11/main.md` 内で定義され、redact 規則 / PASS 判定 / 取得タイミング / 取得手段が網羅されている
- 本タスク作成段階では evidence 2〜8 の placeholder ファイルを作成しない（spec_created の境界維持）

## 次 Phase への引き渡し

Phase 12 へ。AC / blocker / evidence path / approval gate / runtime wave 取得契約 を渡す。
