# Lessons Learned — Issue #546 Cloudflare Audit Logs 90 Day Baseline Observation (2026-05)

Issue #408 / #515 系の Cloudflare Audit Logs 監視について、90 日 runtime evidence を実測し、Gate-A FAIL / Gate-B-C pending として `observation_continue` に留めた docs-only / NON_VISUAL workflow の知見。
根拠は `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/` と `outputs/phase-12/implementation-guide.md`。

---

## L-ISSUE546-001: Hourly 90 day evidence は `gh run list --limit` ではなく paginated API を JSON 配列化する

### 現象
90 日 hourly run は約 2160 件になるため、`gh run list --limit 500` では Gate-A の連続稼働判定に必要な入力が欠ける。

### 採用解決策
`gh api --paginate ... --jq '.workflow_runs[] | {...}' | jq -s '.'` で JSON Lines を JSON 配列へ正規化し、`outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` に保存する。

### 再利用ガイド
GitHub Actions の長期観測は必ず paginated API + machine-parseable JSON array を evidence 正本にする。JSON Lines のまま `.json` に保存しない。

---

## L-ISSUE546-002: Alert 0 件は D1 readiness なしに FPR PASS としない

### 現象
`cf-audit` label issue が 0 件でも、production D1 が `no such table: cf_audit_log` を返す状態では、監視が正常に記録・分類した結果として alert 0 件だったとは判断できない。

### 採用解決策
Gate-B は alert issue count だけでなく D1 readiness と baseline threshold evidence を前提にする。D1 unreadiness / baseline 欠測 / label 欠測は `PENDING_RUNTIME_EVIDENCE` として扱い、FPR 0% PASS にしない。

### 再利用ガイド
ゼロ件 evidence は、入力系が動いていることを別 evidence で証明できる場合だけ PASS に使う。上流が壊れているゼロ件は pending または fail として分離する。

---

## L-ISSUE546-003: docs-only observation でも root state と phase state は分離する

### 現象
docs-only workflow は root `spec_created` を維持する一方、Phase 11/12 evidence は実際に取得・同期済みになるため、全 phase を `spec_created` のままにすると成果物状態と矛盾する。

### 採用解決策
Root workflow state は `spec_created` のままにし、phase status は Phase 1-10 `completed`、Phase 11 `completed_with_runtime_blockers`、Phase 12 `completed`、Phase 13 `pending_user_approval` に分けた。

### 再利用ガイド
`spec_created` は workflow root の実装区分を表す語彙として扱い、Phase evidence の完了状態とは混ぜない。

---

## L-ISSUE546-004: helper が出力しない成果物は pending evidence marker を実体化する

### 現象
`baseline-90day-thresholds.json` が仕様にあるのに helper failure で実体がないと、後続実行者が欠落か未実行かを判別できない。

### 採用解決策
同じ canonical path に `PENDING_RUNTIME_EVIDENCE` marker JSON を保存し、Gate-B への影響を明記した。

### 再利用ガイド
runtime blocker で出力が作れない場合も、canonical path に redacted pending marker を置く。空ファイルや outputs 内 note だけで代替しない。

---

## 参照元

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gate-decision.md`
- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/manual-smoke-log.md`
- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` §11
