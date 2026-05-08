# Phase 9: 運用準備 / observability

## 目的

production switch 後 7 日間の hourly observation を **読み取り専用** に運用するための監視手順、fallback rate / leakage / hourly run 成功率の集計手順、alert 発火条件、rollback runbook 起動条件を確定する。runbook の物理ファイル生成は Phase 6 / Phase 12 / Phase 11 evidence で行うため、本 Phase ではパスと内容契約のみを宣言する。

## 前 Phase 依存

- Phase 3: hourly JSON snapshot の schema / fallback-rate-alert 発火条件 / rollback 3 step
- Phase 8: secret leakage gate 3 層 / forward-safe 検証コマンド / governance

## 完了条件

- [ ] 7 日 hourly observation の運用手順（hourly run 成否監視 / fallback rate 集計 / leakage grep 日次確認）を確定
- [ ] alert 条件（fallback rate / FP / FN / hourly run 失敗）を閾値付きで列挙
- [ ] runbook の参照パス（post-switch-observation / rollback）を確定し、内容契約を記述
- [ ] D1 列に touch しない（forward-safe）ことを再宣言
- [ ] `pnpm sync:check` / `gh run list` などの read-only コマンドのみで運用が完結することを確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 09 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 09-1 | hourly observation の 4 軸（run 成否 / fallback rate / leakage / latency）の集計手順を確定 |
| 09-2 | alert 条件と runbook 起動マッピングを確定 |
| 09-3 | post-switch-observation runbook / rollback runbook の配置パスと内容契約を確定 |
| 09-4 | D1 列を touch しない方針を再宣言（forward-safe） |
| 09-5 | 運用に使うコマンドが read-only であり secret 露出しないことを確認 |

## 1. 7 日 hourly observation 運用手順

### 1-1. hourly run 成否監視

```bash
# 直近 7 日（168 hour）の hourly run 一覧
gh run list --workflow cf-audit-log-monitor.yml --limit 168 --json status,conclusion,createdAt,databaseId,event

# 失敗のみ抽出
gh run list --workflow cf-audit-log-monitor.yml --limit 168 \
  --json status,conclusion,createdAt,databaseId \
  --jq '.[] | select(.conclusion!="success")'
```

期待: `conclusion=success` が 168/168（許容: 24 時間中 1 回までの transient failure を許容、連続 2 回 fail は alert 対象）。

### 1-2. fallback rate 集計

`scripts/cf-audit-log/observation/post-switch-monitor.ts` が hourly に出力する JSON snapshot（`outputs/phase-11/observation/{hour}.json`）を集計する read-only 手順:

```bash
# 7 日終端サマリ（observation script を集計モードで実行）
mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
  --aggregate \
  --input outputs/phase-11/observation/ \
  --output outputs/phase-11/observation/summary-7day.md
```

集計指標:

| 指標 | 計算式 | baseline | alert 閾値 |
| --- | --- | --- | --- |
| fallbackRate (mean) | 7 日合計 `classifierUsed='threshold'` 件数 / 全件 | – | mean > 5%（hourly で 3 hour 連続 > 5% は即 alert） |
| Issue 起票数 | hourly Issue 起票数の合計 | threshold 期 7 日 baseline | baseline mean ± 2σ を超える |
| p95 latency | hourly p95 の中央値 | threshold 期 baseline | +30% を超える |
| leakage 検出件数 | secret-leakage-grep の hit 合計 | 0 | 1 件以上で即 alert |

### 1-3. Issue body redaction の grep 日次確認

```bash
# 直近 24h に起票された hourly Issue を gh で取得し、生 IP / token らしき混入が無いか grep
gh issue list --label cf-audit-anomaly --state all --limit 50 \
  --search "created:>=$(date -u -v-1d +%Y-%m-%d)" \
  --json number,title,body \
  --jq '.[] | "\(.number)\t\(.title)"'

# 各 Issue body を取り出して grep（実値表示は禁止 - 件数のみ確認）
for n in $(gh issue list --label cf-audit-anomaly --state all --limit 50 \
  --search "created:>=$(date -u -v-1d +%Y-%m-%d)" --json number --jq '.[].number'); do
  gh issue view "$n" --json body --jq '.body' \
    | mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts --stdin --count-only
done
```

`--count-only` は件数のみ出力する mode（実値を stdout に出さない契約）。Phase 6 で既存 script に未実装なら追加する。

### 1-4. dry-run baseline 取得

切替直前に dry-run で baseline を 1 hour 分作成し、`outputs/phase-11/observation/dry-run-baseline.json` として保存する。

```bash
mise exec -- pnpm tsx scripts/cf-audit-log/analyze.ts \
  --dry-run \
  --since "$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)" \
  --output outputs/phase-11/observation/dry-run-baseline.json
```

## 2. Alert 条件と runbook 起動マッピング

| alert 条件 | 検知経路 | 起動 runbook | 対応 |
| --- | --- | --- | --- |
| fallbackRate > 5% を 3 hour 連続 | `fallback-rate-alert.ts`（hourly post-step） | post-switch-observation.md §rollback | env を `threshold` に戻す PR を即時作成 |
| leakage grep 1 件以上検出 | `secret-leakage-grep.ts --exit-on-detect`（hourly post-step） | rollback runbook §emergency | env 戻し + 該当 Issue 削除 + token revoke |
| hourly run 連続 2 回 fail | `gh run list` 監視（手動・日次） | post-switch-observation.md §run-failure | workflow log を確認、transient なら継続、structural なら env 戻し |
| 7 日終端で Issue 起票数が baseline mean ± 2σ 超 | 7 日終端サマリ（手動集計） | post-switch-observation.md §judge | FU-03-C #548 で artifact 再選定 Issue を起票 |
| p95 latency が baseline +30% 超 | hourly snapshot 集計 | post-switch-observation.md §latency | artifact 軽量化検討 Issue（FU-03-C 派生）を起票 |

## 3. Runbook 配置パスと内容契約

本 Phase では契約のみを宣言する。物理生成は Phase 6（実装）/ Phase 12（implementation-guide.md 連携）で行う。

### 3-1. post-switch-observation.md

- パス: `docs/30-workflows/issue-549-cf-audit-ml-production-switch/runbooks/post-switch-observation.md`
- 内容契約:
  - §preflight: dry-run baseline 取得手順
  - §monitor-hourly: hourly run 成否確認 / fallback rate 集計の read-only コマンド
  - §monitor-daily: leakage grep 日次確認 / Issue 起票数集計
  - §judge: 7 日終端で switch 継続 / rollback / 部分継続のいずれかを判定する decision table
  - §run-failure: hourly run 失敗時の確認フロー
  - §latency: p95 latency 悪化時の対応
  - §rollback: rollback runbook への遷移条件（fallback rate / leakage / FN 増加）

### 3-2. rollback runbook

- パス: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（既存ファイルへ追記）
- 追記節（3 step、Phase 3 §4 で確定済み）:
  1. PR を作成し `cf-audit-log-monitor.yml` の `CF_AUDIT_CLASSIFIER` を `threshold` に戻す（merge は rollback approval/governance evidence後、緊急時は self-merge → 事後 audit）
  2. D1 列（`classifier_used` / `classifier_version` / `confidence`）は **削除しない**（forward-safe）
  3. fallback rate / leakage が継続する場合、artifact 再選定 Issue を FU-03-C #548 へ差し戻す
- 緊急時の即時手段（PR を待たない場合）:

```bash
# workflow_dispatch 経由で env を override 起動（緊急 1-shot）
gh workflow run cf-audit-log-monitor.yml \
  -f override_classifier=threshold
# ※ workflow YAML 側に override input が無い場合は、上記の代わりに env を threshold に戻す PR を最優先で merge する
```

> 自動 rollback は採用しない（Phase 1 §論点 3）。alert は通知のみ、判断と PR は手動。

## 4. D1 列に touch しない（forward-safe 再宣言）

本 Phase の運用手順は **すべて read-only** であり、以下を行わない:

- `bash scripts/cf.sh d1 execute ... INSERT/UPDATE/DELETE` の実行
- `bash scripts/cf.sh d1 migrations apply` の production 実行（既に #515 で apply 済み）
- 列削除 / 列追加 / 既存値の書き換え

rollback 時も D1 列は残置する（Phase 8 §4 forward-safe 検証スクリプトで担保）。

## 5. 運用コマンドの read-only / secret 非露出確認

| コマンド | read-only | secret 露出可能性 | 緩和策 |
| --- | --- | --- | --- |
| `gh run list / gh issue list / gh issue view` | yes | Issue body に redaction 漏れがあると露出しうる | §1-3 で `--count-only` 経由のみ集計 |
| `bash scripts/cf.sh d1 execute --command "PRAGMA table_info..."` | yes | なし | – |
| `bash scripts/cf.sh d1 migrations list` | yes | なし | – |
| `mise exec -- pnpm tsx ... --aggregate / --dry-run` | yes（local file 集計） | なし | – |
| `pnpm sync:check` | yes | なし | – |

`op read` を運用 step で使う場合は §Phase 8 §5 と同じく中間ファイルを残さない。

## 6. AC との対応

| AC | 担保箇所 |
| --- | --- |
| AC-3（observation JSON 必須 field） | §1-2 集計指標 |
| AC-4（fallback rate alert step） | §2 fallbackRate alert 条件 |
| AC-5（hourly post-step の leakage grep） | §1-3 / §2 leakage alert |
| AC-6（rollback runbook 3 step） | §3-2 |
| AC-7（D1 列 forward-safe 性） | §4 |
| AC-10（dry-run evidence） | §1-4 |

## 出力

- `outputs/phase-09/main.md`

## Handoff

- Phase 10: 本 Phase の alert 条件・rollback 起動条件を Definition of Done の検証コマンドへ展開する。`gh run list --limit 168` / D1 forward-safe 検証 / leakage grep 件数 0 を DoD checklist 化する。
- Phase 11: 本 Phase の集計コマンド出力を evidence として保存（hourly JSON / 日次サマリ / 7 日終端サマリ / dry-run baseline）。
- Phase 12: post-switch-observation.md / 15-infrastructure-runbook.md 追記節の物理生成を担当する。

## 参照資料

- `index.md`
- `phase-01.md` / `phase-03.md` / `phase-08.md`
- `CLAUDE.md`（Cloudflare CLI / sync:check）
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/phase-09.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- 本タスクは NON_VISUAL のため、observation script の focused Vitest が integration を兼ねる。Phase 9 で `post-switch-monitor.test.ts` / `fallback-rate-alert.test.ts` の test ケース一覧を `outputs/phase-09/main.md` に転記する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 8 の成果物を上流契約として参照する。

## 成果物/実行手順

本 Phase の成果物は `phase-09.md`。test command は実装サイクル用 contract であり、本 spec_created サイクルでは実行しない。
