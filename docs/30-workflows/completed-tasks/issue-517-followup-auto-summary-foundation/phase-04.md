# Phase 4: 検証戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略 |
| 作成日 | 2026-05-07 |
| 前 Phase | 3（設計レビューゲート） |
| 次 Phase | 5（実装 runbook） |
| 状態 | spec_created |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #517（CLOSED 維持） |

## 目的

Phase 3 で凍結した設計分岐点 D-1〜D-10 と関数 7 件（`aggregate_runs` / `redact_log` / `is_30day_gate_satisfied` / `find_existing_pr` / `render_pr_body` / `render_slack_payload` / `post_slack`）の入出力契約に対して、(1) **テストレベル戦略（unit / integration / E2E）**、(2) **追加するテストケース 7 件**、(3) **workflow level の dry-run 検証手順**、(4) **カバレッジ基準**、(5) **redaction の機械的検証手順**、(6) **検証コマンド一覧**を確定する。Phase 5 の実装 runbook は本 Phase で固定したテスト ID をもとに着手する。

---

## 1. テストレベル戦略

| レベル | 対象 | 実行手段 | 失敗時の対応 |
| --- | --- | --- | --- |
| **単体（unit）** | shell script 関数 7 件（`aggregate_runs` / `redact_log` / `is_30day_gate_satisfied` / `find_existing_pr` / `render_pr_body` / `render_slack_payload` / `post_slack`） | `bash scripts/post-release-dashboard/__tests__/30day-summary.test.sh`（plain shell test）。fixture を `__tests__/fixtures/30day-summary/` から読み込み、stdout / exit code を assertion | 対象関数を Phase 5 runbook に従って修正。fixture の hash も更新 |
| **結合（integration）** | workflow YAML × 30day-summary.sh の起動経路 | `act -W .github/workflows/post-release-30day-auto-summary.yml -j summarize --secret-file .secrets.local`（ローカル）、または GHA `workflow_dispatch` の `dry_run: true` 起動 | step 単位の log で gate / 重複 PR / dry-run 各経路の挙動を確認 |
| **E2E（手動）** | 本番 cron 起動相当の dry-run 1 周 | GHA UI 上で `Run workflow` → `dry_run=true` を選択し起動。Phase 11 evidence として log を保存 | 失敗時は Phase 6 異常系シナリオと突き合わせ、再実行 |
| **運用 preflight** | Slack channel / Incoming Webhook / GitHub Secret の外部準備 | Phase 11 の preflight checklist。channel 存在、Webhook bind、1Password 正本、GitHub Secret 登録、test post HTTP 200 を `slack-test-post.log` に記録 | Secret 未登録または channel 未作成なら Phase 11 を FAIL とし、G2 user approval で登録 / ローテーション |

**plain shell test の方針（Phase 1 NFR 整合）**:

- bats / vitest は導入しない。`__tests__/run-all.sh` から `30day-summary.test.sh` を呼び出す既存形式を踏襲。
- 各 TC は `assert_eq` / `assert_exit` 等の最小ヘルパで stdout / exit code を比較。
- fixture は静的 JSON / テキストとして commit。実 gh CLI / curl は呼ばず、`gh` / `curl` を関数 stub で差し替える。

---

## 2. 追加するテストファイル

### 2-1. ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` | 新規 | TC-01〜TC-07 を含む |
| `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/gate-not-satisfied.json` | 新規 | 最古 schedule run が today-29d 相当 |
| `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/gate-satisfied-clean.json` | 新規 | 30 日以上経過、failure_rate < 10% |
| `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/gate-satisfied-failure-rate-high.json` | 新規 | failure 比率 >=10%（10/30 など） |
| `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/gate-satisfied-redaction-trigger.txt` | 新規 | `token=xxx` / `Bearer xxx` / `secret:` / `Authorization:` を各 1 行ずつ含む |
| `scripts/post-release-dashboard/__tests__/run-all.sh` | 編集 | `bash 30day-summary.test.sh` を呼出に追加 |

### 2-2. テストケース（TC-01〜TC-07）

| ID | 対象関数 / 経路 | 入力 | 期待 stdout / exit | 検証ポイント |
| --- | --- | --- | --- | --- |
| TC-01 | `aggregate_runs` 正常系 | `gate-satisfied-clean.json` | `conclusion_dist` / `longest_failure_streak` / `failure_rate` / `runs_total` / `schedule_runs_total` / `oldest_schedule_created_at` の 6 keys を含む集計 JSON / exit 0 | 集計式（success/failure/cancelled の分布が input と一致） |
| TC-02 | `is_30day_gate_satisfied` | (a) `gate-not-satisfied.json` の oldest（today-29d）→ exit 1<br>(b) `gate-satisfied-clean.json` の oldest（today-31d）→ exit 0 | exit 1 / exit 0 | ISO 8601 文字列比較が macOS BSD date / GNU date 双方で安定 |
| TC-03 | `redact_log` | `gate-satisfied-redaction-trigger.txt` | stdout が `token=xxx` / `Bearer xxx` / `secret:` / `Authorization:` を含む行を `(redacted: <pattern>)` に置換 / exit 0 | `grep -E '(token=|Bearer |secret:|Authorization:)' <stdout>` が 0 件 |
| TC-04 | `render_pr_body` failure_rate >=10% | `gate-satisfied-failure-rate-high.json` を集計した summary JSON | stdout markdown に「retry/alert 追加検討」セクション存在 / exit 0 | `grep -F 'retry/alert 追加検討' <stdout>` が 1 件以上 |
| TC-05 | `find_existing_pr`（同月既存 PR） | mock `gh` 関数が `{ "url": "https://github.com/.../pull/999", "title": "[auto-summary] post-release-dashboard 30d 202605" }` を返す | stdout が当該 URL / exit 0 | YYYYMM 一致のときのみ非空、不一致時は空文字 |
| TC-06 | `--dry-run` フラグ | エントリポイント直接呼出 | 集計 JSON / PR_BODY / SLACK_PAYLOAD を stdout 出力。`gh pr create` / `git push` / `curl` 関数 stub が **呼ばれない**（`call_count=0`） / exit 0 | stub の call counter で副作用ゼロ確認 |
| TC-07 | silent skip 経路（gate 不成立） | `gate-not-satisfied.json` をエントリポイント経由で実行 | stdout に `skipped: 30-day gate not satisfied` / 副作用関数 call_count=0 / exit 0 | exit 0 を保証（NFR-2 の trace log だけ残す） |

各 TC は `__tests__/30day-summary.test.sh` 内に `tc01_aggregate_runs_clean()` 等の関数で実装し、`run-all.sh` から `bash 30day-summary.test.sh` で一括起動する。

---

## 3. workflow level の検証

### 3-1. ローカル `act`（任意）

```bash
# workflow_dispatch を act で再現（dry_run=true）
act workflow_dispatch \
  -W .github/workflows/post-release-30day-auto-summary.yml \
  --input dry_run=true \
  --secret-file .secrets.local
```

`.secrets.local` に `SLACK_WEBHOOK_URL=https://example.invalid/dummy` のダミー値を入れる（dry-run なので curl は実行されない）。

### 3-2. GHA workflow_dispatch dry-run

- GitHub Actions UI で `post-release-30day-auto-summary` を選択し、`Run workflow` から `dry_run=true` で起動。
- 期待: 単一 step `Run 30day summary` が `--dry-run` 起動し、stdout に PR_BODY / SLACK_PAYLOAD が出力され、PR / Slack 副作用ゼロ。
- log を `outputs/phase-11/evidence/dry-run-stdout.log` として保存。

### 3-3. workflow YAML 静的検証

```bash
# YAML 構文チェック
yq '.' .github/workflows/post-release-30day-auto-summary.yml >/dev/null

# permissions least-privilege 確認
yq '.jobs.summarize.permissions' .github/workflows/post-release-30day-auto-summary.yml
# 期待: contents: write / pull-requests: write / actions: read のみ
```

---

## 4. カバレッジ基準

shell script は line coverage を厳密計測しない代わりに、**主要分岐網羅**で代替する。

| 関数 / 経路 | 必須カバー分岐 |
| --- | --- |
| `aggregate_runs` | 正常 JSON / `runs_total=0`（empty）/ `event != schedule` のみ |
| `is_30day_gate_satisfied` | gate 成立 / 不成立 |
| `redact_log` | 4 パターン全 hit / hit 0 件 |
| `find_existing_pr` | 同月既存 / 同月不存在 / 別月既存 |
| `render_pr_body` | failure_rate < 10% / >= 10% |
| `post_slack` | 通常 / dry-run スキップ / curl 失敗 |
| エントリポイント | gate 不成立 silent skip / 重複 PR silent skip / 通常 / dry-run |

TC-01〜TC-07 で上記分岐の base case をカバー。残余分岐（empty / curl 失敗等）は Phase 6 異常系で fixture を追加して補完する。

---

## 5. redaction の機械的検証

### 5-1. fixture

`gate-satisfied-redaction-trigger.txt`:

```
2026-05-07T00:00:00Z run id=42 token=ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
2026-05-07T00:01:00Z Authorization: Bearer ABCDEFGH
2026-05-07T00:02:00Z client secret: REDACT_ME_PLEASE
2026-05-07T00:03:00Z normal log line without sensitive
```

### 5-2. 検証コマンド

```bash
# redact_log を通したあとに 4 パターンが含まれないことを確認
bash -c 'source scripts/post-release-dashboard/30day-summary.sh; redact_log scripts/post-release-dashboard/__tests__/fixtures/30day-summary/gate-satisfied-redaction-trigger.txt' \
  | tee /tmp/redacted.txt

# 4 パターンが残っていないこと
grep -E '(token=|Bearer |secret:|Authorization:)' /tmp/redacted.txt && {
  echo 'FAIL: redaction leaked'; exit 1
} || echo 'PASS: no leak'

# normal line は残ること
grep -F 'normal log line without sensitive' /tmp/redacted.txt
```

### 5-3. PR body / Slack payload の二重 grep audit

```bash
# 集計から PR body 生成までを通し、最終 stdout に対して 4 パターン grep
bash scripts/post-release-dashboard/30day-summary.sh --dry-run \
  | tee outputs/phase-11/evidence/redaction-grep-audit.log \
  | grep -E '(token=|Bearer |secret:|Authorization:)' && {
    echo 'FAIL: leak in dry-run output'; exit 1
  } || echo 'PASS'
```

---

## 6. 検証コマンド一覧（ローカル）

```bash
# 単体（TC-01〜TC-07）
bash scripts/post-release-dashboard/__tests__/run-all.sh

# 30day 単体実行（dry-run）
bash scripts/post-release-dashboard/30day-summary.sh --dry-run

# workflow YAML 構文
yq '.' .github/workflows/post-release-30day-auto-summary.yml >/dev/null

# permissions least-privilege 確認
yq '.jobs.summarize.permissions' .github/workflows/post-release-30day-auto-summary.yml

# redaction grep audit
bash scripts/post-release-dashboard/30day-summary.sh --dry-run \
  | grep -E '(token=|Bearer |secret:|Authorization:)' \
  && echo 'FAIL' || echo 'PASS'

# Issue #517 再 OPEN 含意の検出（仕様書 grep）
grep -RE 'gh issue reopen|Closes #517|Fixes #517' \
  docs/30-workflows/issue-517-followup-auto-summary-foundation/ \
  && echo 'FAIL' || echo 'PASS'
```

---

## 7. evidence 種別と保存パス

| evidence | パス | 紐付く AC |
| --- | --- | --- |
| dry-run stdout | `outputs/phase-11/evidence/dry-run-stdout.log` | AC-7 / AC-8 |
| silent skip log | `outputs/phase-11/evidence/silent-skip-exit0.log` | AC-1 / AC-4 |
| redaction grep audit | `outputs/phase-11/evidence/redaction-grep-audit.log` | AC-5 |
| TC-01〜07 出力 | `outputs/phase-11/evidence/unit-tests.log` | AC-2 / AC-6 |
| GHA workflow_dispatch log | `outputs/phase-11/evidence/gha-dispatch-dry-run.log` | AC-7 |
| permissions YAML 抜粋 | `outputs/phase-11/evidence/permissions.yaml` | NFR-6 |
| Slack bootstrap log | `outputs/phase-11/evidence/slack-test-post.log` | AC-3 |

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | TC-01〜07 で AC-1〜AC-8 のうち自動検証可能な 7 件を機械的に保証。redaction grep audit で NFR-3 を二重に担保 |
| 実現性 | PASS | plain shell test + fixture のみで実装。bats / vitest 不要。`act` は任意で本検証は GHA `workflow_dispatch` だけでも完結 |
| 整合性 | PASS | 既存 `__tests__/run-all.sh` 形式を踏襲。Phase 1 / 2 で固定した関数 7 件と 1:1 対応 |
| 運用性 | PASS | カバレッジ目標を主要分岐網羅で表現し、追加 fixture が必要なケース（empty / curl 失敗）を Phase 6 に明示引き渡し |

---

## DoD（Phase 4）

- [ ] テストレベル戦略（unit / integration / E2E）が表で固定
- [ ] TC-01〜TC-07 が関数 7 件 + dry-run + silent skip を網羅
- [ ] workflow YAML 静的検証 / `act` / `workflow_dispatch` dry-run の 3 経路が記述
- [ ] Slack channel bootstrap preflight が Phase 11 evidence と AC-3 に接続されている
- [ ] redaction の grep audit 手順が fixture 込みで再現可能
- [ ] evidence 6 種の保存パスが Phase 11 と整合
- [ ] 4 条件評価が全 PASS

---

## 次 Phase への引き渡し

- 次 Phase: 5（実装 runbook）
- 引き継ぎ事項:
  - TC-01〜TC-07（実装側で関数シグネチャを変えないこと）
  - fixture 5 ファイル（パス・最低スキーマ）
  - redaction grep audit のコマンドライン
  - evidence 保存パス 6 件
- ブロック条件:
  - TC が関数 7 件のいずれかをカバーしていない
  - redaction grep audit が手動工程に依存する
