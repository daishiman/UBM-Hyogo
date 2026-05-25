# Phase 12: ドキュメント同期（概念説明 + spec sync）

> 入力: [phase-11-manual-test.md](phase-11-manual-test.md) / [phase-10-final-review.md](phase-10-final-review.md)
> 出力: `outputs/phase-12/` 配下 strict 7 ファイル + `outputs/phase-11/manual-test-result.md`
> 状態: `implemented_local_runtime_pending`（コード実装はローカル反映済み。Sentry API apply・staging 疎通・commit/push/PR は user-gated 未実施）

本 Phase は issue #863「admin scope `error.boundary.caught` を Sentry alert policy で IaC 化」のドキュメント同期作業を定義する。
Part 1 は中学生にも分かる概念説明、Part 2 は技術者向けの実装詳細を扱う。実装コードは書かず、何をどう同期するかの仕様のみを記す。

---

## Part 1: 中学生向け概念説明（なぜ必要か → 何をするか）

### なぜ必要か（火災報知器の例え）

学校の教室には火災報知器が付いている。煙を感知したら自動でベルが鳴り、先生がすぐ駆けつけられる。
もしこの報知器が「鳴る煙の濃さ」や「どの教室を見張るか」を、先生が個人のメモ帳に手書きでメモしているだけだったらどうなるだろう。
メモを無くしたり、別の先生が勝手に設定を変えても誰も気づけない。これはとても危ない。

このサイトの管理画面（先生だけが使う事務室のような場所）でも、同じことが起きていた。
管理画面でエラーが起きたとき、それを知らせる「報知器の設定」が、きちんとした台帳（みんなが見られる正式な記録）ではなく、
バラバラの場所に散らばっていて、「どの濃さの煙で鳴らすか」を後から確認したり、変更履歴を追ったりできなかった。

### 何をするか（メモ帳をやめて台帳で管理する）

そこで、報知器の設定書を「メモ帳」ではなく「台帳」で管理することにする。台帳とは、ここでは設定をきちんとした書類（ファイル）に書き残し、
誰がいつ変えたかが全部分かる仕組みのことだ。この「設定を書類で管理して、書類どおりに自動で反映する」やり方を IaC（あいえーしー / 設定の書類化）と呼ぶ。

具体的には次の 3 つをやる。

1. エラーの煙を感知する装置（ログを送る部品）に「どの教室で起きたか（admin かどうか）」「何番の事故か（digest という番号）」という札（ラベル）を確実に付けるよう直す。
2. 「admin の教室で、同じ番号の事故が短時間に何回も起きたらベルを鳴らす」という報知器の設定を、台帳ファイルに書く。
3. 台帳とおりに設定が保たれているか毎月自動でチェックし、ズレていたら教えてくれる見張り役（CI）を置く。

これで、管理画面で前と同じ種類のエラーがまた起きたとき、人が気づく前にチャットへ自動で通知が飛ぶようになる。
報知器の設定はもうメモ帳ではなく台帳にあるので、誰でも内容を確認でき、勝手に変わっても見張り役が気づく。

---

## Part 2: 技術者向け詳細（logger tag 昇格 / Sentry alert rule JSON / IaC CLI API / drift CI）

### logger tag 昇格の型

核心コード変更は `apps/web/src/lib/logger.ts` の `emit()`。現状 Sentry `captureException` / `captureMessage` に渡す `tags` は
`{ event, runtime }` のみで、`scope` / `digest` は `extras` 止まりのため Sentry alert rule の tag フィルタに使えない。
`merged.scope` / `merged.digest` が `string` のときに限り `sentryTags` へ昇格する（PII / 型不定値の混入を防ぐ index-signature 由来 `typeof` guard）。
詳細差分は [phase-5-implementation.md](phase-5-implementation.md) §5-1 を正本とする。

### Sentry alert rule JSON

`infra/sentry-alerts/policies/admin-error-boundary.json` が宣言的定義の正本。
`filters` は `event=error.boundary.caught` と `scope=admin` の AND、`frequency` は `window_minutes=5 / threshold=3`、`actions` は `slack → #ubm-hyogo-incidents`（09b-A で連携済みチャンネル）。digest は logger tag と Slack notification tags に含め、Sentry Issue Alert API の native 形状では任意 tag group-by を宣言しない。

### IaC CLI API

`infra/sentry-alerts/lib/` は `infra/cloudflare-alerts/lib/` と同型。
`load.ts#loadPolicies(dir)` / `canonicalize.ts#canonicalize(input)` / `diff.ts#diffPolicies(local, remote)` /
`api-client.ts#{setRuleTokenMode, listRules, createRule, updateRule}` / `cli.ts#runCli(argv)`（`list|diff|plan|apply`）。
read/apply token は scope 分離し、apply 用 write token は CI Secret に入れない。

### drift CI

`.github/workflows/sentry-alerts-drift.yml` は `cloudflare-alerts-drift.yml` をミラー。
PR では `pnpm test:sentry-alerts`（schema-contract / load / diff の unit）で manifest を検証し、
schedule / dispatch では read-only token で `cli.ts diff --ci` を実行して drift があれば exit 2 で fail させる。

---

## 実施項目（Phase 12 step）

| Step | 作業 | 出力 |
|---|---|---|
| implementation-guide 作成 | Part 1（中学生向け概念）+ Part 2（技術詳細）を厚く記述。視覚証跡は不要明記 | `outputs/phase-12/implementation-guide.md` |
| system-spec 更新判定 | Step 1-A/1-B/1-C/Step2 を個別判定。logger は内部実装変更で interface N/A、`infra/sentry-alerts` は新規 IaC surface として記録 | `outputs/phase-12/system-spec-update-summary.md` |
| changelog | 全 Step 結果を個別明記（該当なしも記録）。workflow-local と global skill sync を別ブロック | `outputs/phase-12/documentation-changelog.md` |
| 未タスク検出 | 0 件でも出力。followup-001 / followup-003 と重複しないことを確認。current/baseline 分離 | `outputs/phase-12/unassigned-task-detection.md` |
| skill-feedback | 改善点なしでも出力。テンプレ / ワークフロー / ドキュメント観点 | `outputs/phase-12/skill-feedback-report.md` |
| aiworkflow-requirements 記録 | `task-workflow-active.md` / indexes / changelog へ本 workflow を登録（user 承認後の commit 範囲） | `.claude/skills/aiworkflow-requirements/**` |
| LOGS x2 同期 | workflow-local `docs/30-workflows/LOGS.md` と global skill `LOGS/_legacy.md` の 2 系統に追記 | LOGS 2 系統 |
| compliance check | strict 9 セクション逐語一致で生成（CI gate 正本） | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| main サマリ | 6 成果物リンク + close-out 状態 | `outputs/phase-12/main.md` |

> 本 Phase の成果物とローカル実装は `implemented_local_runtime_pending`。Sentry API apply・staging 疎通・commit/push/PR は
> user-gated 操作であり、本 Phase では「未実施」と明記する。
