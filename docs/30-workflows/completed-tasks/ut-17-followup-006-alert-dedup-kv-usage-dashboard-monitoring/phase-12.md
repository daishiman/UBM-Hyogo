# Phase 12: 正本同期

[実装区分: 実装仕様書]

## 1. 目的

本タスクの成果を正本ドキュメント / skill / aiworkflow index へ同期し、後続タスクが本変更を前提に動けるようにする。

## 2. 中学生レベル概念説明（task-specification-creator skill 準拠）

「Cloudflare KV」は、Cloudflare のサーバ群のあちこちに置ける「**簡単なメモ帳**」のような仕組みで、`apps/api` が Slack に同じ警告を二度送らないために「直前に送った警告メモ」をここに書き残している。今回のタスクは、その**メモ帳が破れていないか・容量が一杯になっていないか・書き込みに時間がかかりすぎていないか**を、Cloudflare の**自動見回りシステム**にチェックしてもらって、おかしいときだけ自動で Slack に「メモ帳がやばいよ」と通知する仕組みを作る作業。
今までは「人が毎月メモ帳の中身を覗いて確認」していたが、今回からは「機械が毎分見回って、閾値を超えたら通知」になる。仕組みの設定は IaC（infrastructure-as-code）と呼ばれる「設定をリポジトリの JSON ファイルで管理する方式」で行うので、誰がいつ何を変えたかが git の履歴で追える。

## 3. 必須 outputs（strict 7 outputs）

| パス | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | 後続 PR / 別 wave 用 implementation summary |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | task-specification-creator skill compliance check 9 項目 |
| `outputs/phase-12/system-spec-update-summary.md` | 正本仕様（CLAUDE.md / runbook / `infra/cloudflare-alerts/README.md`）の更新サマリ |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill / aiworkflow-requirements skill への feedback |
| `outputs/phase-12/unassigned-task-detection.md` | 本タスク完遂で新たに発見された未割当タスク（例: followup-005 KV error metrics 構造化との接続）|
| `outputs/phase-12/documentation-changelog.md` | 変更ドキュメント一覧 + 行数 + 反映先 |

## 4. 同期対象

### 4.1 正本仕様

- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` — Step 4 / 4b 更新（Phase 7 で編集し、Phase 12 で文言最終化）
- `infra/cloudflare-alerts/README.md` — policy 一覧表に KV 行追加（Phase 7 で編集し、Phase 12 で確認）
- 旧 `docs/30-workflows/unassigned-task/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md` — 作成 wave で `superseded` トレースを付与済み。本 Phase では後継参照が維持されていることを確認する

### 4.2 skill

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` — UT-17 follow-up 006 を active entry に追加（または既存 entry を更新）
- `.claude/skills/aiworkflow-requirements/references/patterns-kv-dedup.md` — KV 観測整備章（節）を追記。`infra/cloudflare-alerts/policies/workers-kv-*.json` への参照

### 4.3 CLAUDE.md / `docs/00-getting-started-manual/`

本タスクで `apps/web` / `apps/api` の env 取り扱いや D1 アクセスポリシーに変更はないため CLAUDE.md は更新不要。`infra/cloudflare-alerts/` 配下の README で完結。

## 5. Phase 12 compliance check（9 項目）

`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の 9 必須セクションを `phase12-task-spec-compliance-check.md` で機械検証する。各項目に `rg -n` の grep 結果と exit code を併記。

## 6. dirty-code gate

- `git status apps/ packages/` が空であること（本タスクは `infra/` / `docs/` のみ）
- 一行でも `apps/` / `packages/` に diff があれば、Phase 12 で分類トレースまたは復元を行い PASS にしない

## 7. 状態語彙

本サイクル close-out 時点の root status:

- Phase 1-12 完了 + Phase 11 で runtime evidence（Slack 着信）取得済 → `completed`
- runtime evidence 未取得（user 承認待ちで Phase 10-11 を skip した場合） → `implemented-local-runtime-pending`
- 仕様書作成のみで実コード / Cloudflare mutation / runtime evidence 未実行 → `spec_created`

判定根拠を `outputs/phase-12/main.md` に明記。

## 8. 完了条件 (DoD)

- [ ] strict 7 outputs すべて存在
- [ ] root `artifacts.json` と `outputs/artifacts.json` の workflow state / Phase status parity が保たれている
- [ ] compliance check 9 項目 PASS
- [ ] 旧 unassigned-task spec に `superseded` トレース追記
- [ ] aiworkflow active entry 更新
- [ ] dirty-code gate PASS
- [ ] 状態語彙が `main.md` に明示
