# Implementation Guide

## 実装サマリ（2026-05-07 完了）

仕様書 `phase-01.md`〜`phase-13.md` に従い、Issue #517 follow-up auto-summary 基盤を実コード実装として完了した（Refs #517, Refs #497, Refs #351）。

### 追加ファイル

- `.github/workflows/post-release-30day-auto-summary.yml` — daily UTC 01:00 cron + workflow_dispatch（`dry_run` boolean input）。permissions: `contents: write` / `pull-requests: write` / `actions: read` の最小権限
- `scripts/post-release-dashboard/30day-summary.sh` — エントリポイント。`aggregate_runs` / `is_30day_gate_satisfied` / `redact_log` / `find_existing_pr` / `render_pr_body` / `render_slack_payload` / `post_slack` の 7 関数 + main 制御フロー。exit code 0 / 2 / 3 / 64
- `scripts/post-release-dashboard/lib/aggregate.sh` — schedule-only 集計ヘルパ。30 日連続 gate / gap 検出 / failure cause base classification を担当
- `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` — TC-01〜TC-07 + Slack secret failure を網羅する plain shell test（10 ケース）
- `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/` — fixture 4 件

### 編集ファイル

- `scripts/post-release-dashboard/__tests__/run-all.sh` — `30day-summary.test.sh` 呼び出し追加
- `scripts/post-release-dashboard/README.md` — 実行手順 / exit code / 関連ファイル節を追記
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` — 改訂履歴 v2.5.0 追記
- `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` — 実装完了サマリ追記

### ローカル検証結果

```text
PASS TC-01..TC-07 + TC-05b (10 cases)
30day-summary tests: PASS=10 FAIL=0
post-release-dashboard tests passed
YAML syntax OK (Python yaml.safe_load)
shellcheck OK
actionlint unavailable locally; YAML parse + manual workflow review used as fallback
```

### 残作業（user-gated 外部操作）

Slack channel `w1618436027-ek2505248` 作成 / Webhook bind / Secret 登録 / test post、30 日 schedule runtime 到達後の本番 cron 起動評価、GHA UI からの workflow_dispatch dry-run 起動 — いずれも workflow / shell script に自動化境界を持ち込まない設計（Slack App OAuth 化禁止）と整合し、Phase 11 evidence では `pending` 状態として扱う。

---

## Part 1: 中学生レベル概念説明

### この機能は何をするのか（全体像のたとえ話）

この仕組みは、**学校の先生がテストを返してから 30 日後に「振り返り宿題プリント」を自動配布する**ようなものです。先生（GitHub Actions の cron）は毎朝職員室で「あのテストから 30 日経ったかな？」とカレンダーを確認し、まだ 30 日経っていなければ何もせず帰ります。たとえば、テスト返却から 12 日目なら「まだ早いね」と言って黙って退勤するイメージです。30 日が経過した瞬間に、先生は過去 30 日分の答案（PR リリース後のデプロイ実行ログ）を集計し、「振り返り用の下書きプリント」（draft PR）と「クラス LINE への一言連絡」（Slack 通知）を用意します。

### schedule-only gate の概念（カレンダー判定のたとえ話）

schedule-only gate とは「**毎朝のカレンダーチェックで、30 日連続で授業があった日だけを数える**」仕組みです。たとえば、台風で休校になった日（手動で起動した workflow_dispatch 実行）はカウントに入れません。カレンダーには cron が回した自動実行日だけを丸で囲み、その丸が 30 日連続で並んでいれば「集計してよし」、丸が一日でも飛んでいれば「まだ条件を満たしていないので何もしない」と判断します。これにより、誰かが手で動かしたテスト実行のせいで早とちりして宿題プリントを配ってしまう事故を防ぎます。

### open PR idempotency の概念（同じプリントを二重配布しない仕組みのたとえ話）

open PR idempotency とは「**同じ振り返りプリントが既に配られていたら、二枚目を配らない**」というルールです。たとえば、先生が朝にプリントを配った後、午後にもう一度同じ授業を担当したとき、生徒の机にすでに同じプリントが置いてあれば、新しいプリントを重ねて置くのではなく「もう配ってあるね」と確認するだけで終わります。具体的には、同じタイトルの PR がすでに open 状態で存在していれば、新しい PR は作らず既存の PR を再利用します。これにより、レビュー待ちの PR が日ごとに増えていく事態を防ぎます。

### Slack channel bootstrap の概念（連絡網の事前準備のたとえ話）

Slack channel bootstrap とは「**プリントを配る前に、クラスの連絡網（連絡先）が完成していることを確認する**」段取りです。たとえば、先生が連絡を流そうとしても、クラス LINE グループがまだ作られていなかったり、保護者の電話番号が職員室の名簿に登録されていなかったりしたら、連絡は届きません。この機能では、Slack チャンネル `w1618436027-ek2505248` の作成、Incoming Webhook の接続、1Password への URL 保管、GitHub Secret への登録、テスト投稿確認 — の 5 ステップを **人間が事前に手作業で済ませておく** 必要があります。ワークフロー本体はチャンネルを自分で作りません。連絡網が未整備のままなら、通知ステップは `CONTRACT_READY_SECRET_PENDING` という状態で待機します。

## Part 2: 技術的詳細（5項目チェック）

### 全体フロー

```text
schedule/workflow_dispatch
  -> gh run list --workflow=post-release-dashboard.yml --limit=80
  -> schedule-only 30 day gate (>=30 schedule days, gap 0)
  -> silent skip or aggregate
  -> redaction
  -> duplicate PR check
  -> branch push + draft PR
  -> Slack POST
```

### ファイル構成

| File | Responsibility |
| --- | --- |
| `.github/workflows/post-release-30day-auto-summary.yml` | Scheduled and manual workflow entry |
| `scripts/post-release-dashboard/30day-summary.sh` | Main script and side-effect control |
| `scripts/post-release-dashboard/lib/aggregate.sh` | jq aggregation helpers |
| `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` | Shell test coverage |
| `scripts/post-release-dashboard/README.md` | Dry-run, secret, and Slack bootstrap runbook |

### [C12P2-1] Schedule-only 30-day gate の判定ロジック

`is_30day_gate_satisfied`（`30day-summary.sh`）で `gh run list --workflow=post-release-dashboard.yml --limit=80` の結果から `event=schedule` のみを抽出し、`aggregate.sh` で 30 日連続・gap=0 を検証する。`workflow_dispatch` 起動分は集計対象から除外することで、手動起動が gate 判定に混入しない要件を満たす。要件充足根拠: schedule イベント以外を fixture で混在させた TC-02 が PASS し、gap がある場合の TC-03 が exit 0 silent skip となること。

### [C12P2-2] Open PR idempotency（重複 PR 抑止）

`find_existing_pr` で `gh pr list --state=open --search "in:title 'Post-release 30-day auto-summary'"` を実行し、既存 PR を検出した場合は新規ブランチ push と PR 作成を skip して既存 PR ID を再利用する。要件充足根拠: TC-04 で同タイトル open PR が存在する fixture を投入し、新規 PR 作成 API が呼ばれず既存 PR の URL のみが Slack payload に渡ることを assert している。

### [C12P2-3] Slack channel bootstrap の preflight 契約

ワークフロー本体は Slack channel を作成しない。`SLACK_WEBHOOK_URL` secret 未登録時は `post_slack` が exit code 64（`CONTRACT_READY_SECRET_PENDING`）を返し、PR 作成自体は完了させる二段階契約とする。要件充足根拠: TC-05b で secret 未設定時に PR が完成し Slack POST のみ skip される挙動を検証済み。Slack App OAuth 化は禁止し、Incoming Webhook 一本に固定する。

### [C12P2-4] Redaction（機密マスキング）

`redact_log` で aggregated log から token / webhook URL / email / OAuth-like 文字列を `[REDACTED]` に置換した後でのみ PR body / Slack payload に渡す。要件充足根拠: TC-06 で URL パターン・token パターン・email を含む fixture を投入し、生成された `render_pr_body` 出力に元値が一切残らないことを `grep -v` assert している。

### [C12P2-5] Exit code contract と runtime evidence

exit code 0（成功 / silent skip）, 2（aggregate error）, 3（PR 作成失敗）, 64（Slack secret pending）の 4 値で運用層に状態を伝達する。Phase 11 evidence は最初の実 30 日 schedule 実行が draft PR + Slack 通知を生成するまで `CONTRACT_READY_RUNTIME_PENDING` のままとし、それまでは Phase 12 完了 = 実装契約完了として扱う。要件充足根拠: TC-07 で各 exit code path を網羅し、`run-all.sh` 経由で 10 ケース PASS=10 FAIL=0 が記録されている。
