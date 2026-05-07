# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（受入条件 × 検証手段 × エビデンス × 担当 Phase） |
| 作成日 | 2026-05-07 |
| 前 Phase | 6（異常系） |
| 次 Phase | 8（DRY 化 / 仕様間整合） |
| 状態 | spec_created |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #517（CLOSED 維持） |

## 目的

`index.md` AC-1〜AC-10 を、(1) 検証手段（自動 / 手動）、(2) 検証コマンド、(3) 期待結果、(4) エビデンス保存先（`outputs/phase-11/evidence/...`）、(5) 担当 Phase（4 / 5 / 11）に 1:1 でマッピングし、Phase 10 最終ゲートが機械的に合否判定できる粒度に固定する。

---

## 1. AC マトリクス本体

| AC | 内容 | 検証手段 | 検証コマンド / 操作 | 期待結果 | evidence canonical path | 担当 Phase |
| --- | --- | --- | --- | --- | --- | --- |
| **AC-1** | 日次 cron (UTC 01:00) で起動・30 日 gate 不成立時 silent skip | 自動 | (1) `yq '.on.schedule' .github/workflows/post-release-30day-auto-summary.yml`<br>(2) `bash scripts/post-release-dashboard/30day-summary.sh` を gate-not-satisfied fixture 経由で起動 | (1) `cron: '0 1 * * *'`<br>(2) stdout `skipped: 30-day gate not satisfied` / exit 0 / 副作用ゼロ | `outputs/phase-11/evidence/silent-skip-exit0.log` | 4 / 11 |
| **AC-2** | 30 日 gate 成立時、conclusion 分布 / 連続 failure / 原因分類 / failure 比率を draft PR body に埋込 | 自動 + 手動 | (1) TC-01 (`aggregate_runs` 集計 6 keys)<br>(2) `--dry-run` で PR_BODY を stdout 確認 | PR_BODY に `runs_total` / `schedule_runs_total` / `conclusion 分布` / `longest_failure_streak` / `failure_rate` / `原因分類` の 6 項目が含まれる | `outputs/phase-11/evidence/pr-body-sample.md` | 4 / 5 / 11 |
| **AC-3** | Slack channel bootstrap + Webhook 集計サマリ（5 行以内）+ draft PR URL 通知 | 自動 + 手動 | (1) Phase 11 preflight で channel / Incoming Webhook / Secret を確認<br>(2) `--dry-run` で SLACK_PAYLOAD を stdout 取得<br>(3) `jq -r '.text' <payload> \| wc -l` | channel `w1618436027-ek2505248` の preflight 記録あり / text が 5 行以下 / PR URL を含む | `outputs/phase-11/evidence/slack-test-post.log` | 4 / 5 / 11 |
| **AC-4** | 二重起票防止（同月内既存 PR ならスキップ・Slack 通知もしない） | 自動 | TC-05 + 同月既存 PR 状態でエントリポイント実行 | stdout `skipped: existing PR found ($URL)` / exit 0 / Slack 関数 call_count=0 | `outputs/phase-11/evidence/duplicate-skip.log` | 4 / 11 |
| **AC-5** | redaction（token / bearer / secret / Authorization 含む行が出力に混入しない） | 自動 | (1) TC-03<br>(2) `bash 30day-summary.sh --dry-run \| grep -E '(token=\|Bearer \|secret:\|Authorization:)' \| wc -l` | (1) 4 パターン全件 redacted<br>(2) grep ヒット 0 件 | `outputs/phase-11/evidence/redaction-grep-audit.log` | 4 / 11 |
| **AC-6** | failure 比率 >= 10% 時、PR body に retry/alert 追加検討セクションを自動追記 | 自動 | TC-04（`gate-satisfied-failure-rate-high.json` 経由で render_pr_body） | stdout に `## retry/alert 追加検討` セクションが存在 | `outputs/phase-11/evidence/pr-body-failure-high.md` | 4 / 11 |
| **AC-7** | workflow_dispatch で手動実行可（dry_run input 対応） | 手動 | GHA UI > Run workflow > `dry_run=true` 起動 | job が success / step log に PR_BODY / SLACK_PAYLOAD 出力 / 副作用ゼロ | `outputs/phase-11/evidence/gha-dispatch-dry-run.log` | 11 |
| **AC-8** | ローカル `--dry-run` 成功（PR 起票・Slack 送信なし） | 自動 | `bash scripts/post-release-dashboard/30day-summary.sh --dry-run` | exit 0 / stdout に PR_BODY + SLACK_PAYLOAD / `[dry-run] no side effects` を含む | `outputs/phase-11/evidence/dry-run-stdout.log` | 4 / 11 |
| **AC-9** | Phase 12 で strict 7 成果物 + skill references 同期完了 | 手動 | Phase 12 で 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）+ `aiworkflow-requirements/references/deployment-gha.md` 章追加 + `changelog/20260507-issue517-followup-auto-summary.md` を生成・確認 | strict 7 ファイル + references 1 + changelog 1 = 9 成果物が `outputs/phase-12/` 以下と skill 直下に揃う | `outputs/phase-12/`（各 md ファイル） | 12 |
| **AC-10** | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS | 手動 | 全 Phase の「4 条件評価」表を Phase 10 で集約 | 全 Phase で全 4 条件 PASS、根拠付き | `outputs/phase-10/four-conditions-summary.md` | 10 |

---

## 2. evidence canonical path 一覧

| evidence ファイル | 紐付く AC | 生成 Phase |
| --- | --- | --- |
| `outputs/phase-11/evidence/silent-skip-exit0.log` | AC-1 | 11 |
| `outputs/phase-11/evidence/pr-body-sample.md` | AC-2 | 11 |
| `outputs/phase-11/evidence/slack-payload-sample.json` | AC-3 | 11 |
| `outputs/phase-11/evidence/duplicate-skip.log` | AC-4 | 11 |
| `outputs/phase-11/evidence/redaction-grep-audit.log` | AC-5 | 4 / 11 |
| `outputs/phase-11/evidence/pr-body-failure-high.md` | AC-6 | 11 |
| `outputs/phase-11/evidence/gha-dispatch-dry-run.log` | AC-7 | 11 |
| `outputs/phase-11/evidence/dry-run-stdout.log` | AC-8 | 11 |
| `outputs/phase-11/evidence/unit-tests.log` | AC-2 / AC-4 / AC-5 / AC-6 補強 | 11 |
| `outputs/phase-11/evidence/permissions.yaml` | NFR-6 補強 | 11 |
| `outputs/phase-12/<7 files>` | AC-9 | 12 |
| `outputs/phase-10/four-conditions-summary.md` | AC-10 | 10 |

---

## 3. 担当 Phase 別の責務

| Phase | 担当 AC | 役割 |
| --- | --- | --- |
| Phase 4（検証戦略） | AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-8 の自動検証手順を確定 | TC-01〜07 + grep audit を定義 |
| Phase 5（実装 runbook） | AC-2 / AC-3 / AC-6 の出力フォーマットを雛形で固定 | render_pr_body / render_slack_payload |
| Phase 10（最終ゲート） | AC-10 を集約判定 | 全 Phase の 4 条件評価を集計 |
| Phase 11（手動検証） | AC-1〜AC-8 の evidence 生成・保存 | dry-run / GHA dispatch / log 保存 |
| Phase 12（ドキュメント） | AC-9 を達成 | 7 成果物 + skill 同期 |

---

## 4. AC を満たさない場合の差戻し方針

| 不満足 AC | 差戻し先 | 修正対象 |
| --- | --- | --- |
| AC-1（cron / silent skip） | Phase 2 / Phase 5 | workflow YAML cron 値 / `is_30day_gate_satisfied` 実装 |
| AC-2（PR body 4 集計） | Phase 5 | `aggregate_runs` jq 式 / `render_pr_body` テンプレ |
| AC-3（Slack 5 行 + URL） | Phase 5 | `render_slack_payload` 行数制御 |
| AC-4（重複 PR skip） | Phase 5 | `find_existing_pr` 検索クエリ |
| AC-5（redaction） | Phase 5 / Phase 6 | `redact_log` パターン / 多層防御の不足層 |
| AC-6（failure>=10% 検討節） | Phase 5 | `render_pr_body` 内 awk 判定 |
| AC-7（dispatch + dry_run） | Phase 5 | workflow YAML inputs / env 流入 |
| AC-8（ローカル --dry-run） | Phase 5 | `parse_args` / dry-run 分岐 |
| AC-9（7 成果物 + skill 同期） | Phase 12 | 不足成果物の追加生成 |
| AC-10（4 条件 PASS） | 該当 Phase（MINOR / MAJOR の出元） | 4 条件評価表の再評価 |

---

## 5. AC 充足の最終判定フロー

```text
Phase 11 evidence 生成完了
   ↓
Phase 7 マトリクス × evidence の全 AC に対し
  - 自動検証: 検証コマンドの期待結果と evidence 内容が一致
  - 手動検証: evidence ファイルが存在し、内容が期待と一致
   ↓
1 件でも不一致 → 該当 AC の差戻し先 Phase に戻して再実行
全 AC PASS → Phase 13 PR 作成へ進行
```

---

## 6. 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC-1〜AC-10 の検証手段 / コマンド / 期待結果 / evidence パス / 担当 Phase が 1:1 でマップされ、Phase 10 / 11 が機械判定可能 |
| 実現性 | PASS | 自動検証（TC + grep + yq）+ 手動検証（GHA UI dispatch + Phase 12 成果物確認）のみで全 AC 充足 |
| 整合性 | PASS | evidence canonical path が Phase 4 / 11 で一貫。差戻し先が Phase 5 / 6 / 12 / 該当 Phase に明示マップ |
| 運用性 | PASS | AC 不満足時の差戻し先が表で固定、判定フローが線形 |

---

## DoD（Phase 7）

- [ ] AC-1〜AC-10 が検証手段 / コマンド / 期待結果 / evidence / 担当 Phase の 5 列で網羅
- [ ] evidence canonical path が `outputs/phase-11/evidence/...` 配下に統一
- [ ] AC 不満足時の差戻し先 Phase が表で固定
- [ ] AC 充足判定フローが線形に記述
- [ ] 4 条件評価が全 PASS

---

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化 / 仕様間整合）
- 引き継ぎ事項:
  - AC マトリクス（Phase 8 で他仕様書との重複検出に利用）
  - evidence canonical path 一覧（Phase 11 で再利用）
  - 差戻し先表（Phase 10 で最終判定に利用）
- ブロック条件:
  - AC のいずれかに evidence path が未割当
  - 担当 Phase が抜けている AC が存在
