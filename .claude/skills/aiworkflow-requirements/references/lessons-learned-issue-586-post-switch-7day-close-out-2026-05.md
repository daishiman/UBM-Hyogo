# Lessons Learned: Issue #586 post-switch 7day close-out (2026-05)

> task: `issue-586-post-switch-7day-close-out`
> ブランチ: `docs/issue-586-post-switch-7day-close-out`
> 関連 spec: `references/task-workflow-active.md`（Issue #549 entry 内 3 段昇格）、`references/observability-monitoring.md` §11.1、`indexes/quick-reference.md`、`indexes/resource-map.md`、`indexes/topic-map.md`
> 関連 source: `.github/workflows/cf-audit-log-monitor.yml`、`.github/workflows/cf-audit-log-7day-summary.yml`、`scripts/cf-audit-log/observation/post-switch-monitor.ts`、`scripts/cf-audit-log/analyze.ts`、`scripts/cf-audit-log/classifier/ml.ts`
> 関連 reference: `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/`、`docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
> Issue: #549 / #586 ともに CLOSED 維持（`Refs #549, Refs #586`）。`pass_runtime_synced` 昇格は merge 後 D+7 の evidence PR 起票・user approval 後。

## 概要

親 Issue #549（cf-audit-log ML production switch）の merge 後、production runtime 上で 7 日連続観測（hourly snapshot 168 件）を行い、fallbackRateMean / leakageHits / actualSnapshots / skeleton zero metrics の 4 観測軸が許容内で揃った時点で初めて `pass_runtime_synced` に昇格する 7 日 close-out 儀式を整備した follow-up。`cf-audit-log-monitor.yml` 末尾 3 post-step（secret-leakage-grep / fallback-rate-alert / hourly artifact upload）追加と、`cf-audit-log-7day-summary.yml` 新設（cross-run aggregation + evidence PR 起票）を境界とする。

本タスクは production への副作用を「state-feedback only」（GitHub Variables の `CF_AUDIT_CLASSIFIER` 切替で 1 step rollback 可能、D1 列削除なし）に限定し、merge 前 = `implemented_local_runtime_pending` / merge 後 = `pass_boundary_synced_runtime_pending` / D+7 evidence PR 起票 + user approval 後 = `pass_runtime_synced` の 3 段昇格を不変条件とした。

## 苦戦箇所と学び

### L-586-001: cross-run artifact aggregation の認証 / scope / API 経路

**症状**:
`actions/download-artifact@v4` は same-run 限定で、別 run の hourly artifact を取得できないという制限が Phase 7〜8 設計時に判明。`gh api` を使う代替が必須となったが、`gh api workflows/<name>/runs` の認証 token に対して `actions:read` scope が必要であること、artifact zip download endpoint (`/repos/{owner}/{repo}/actions/artifacts/{id}/zip`) はバイナリ stream を返すため `gh api` の `--jq` が使えず `--silent --output -` で stdout に流す必要があること、retention 期間外の artifact は 404 を返すため list 段階で expired を除外する必要があること、を順番に踏み抜いた。

**原因**:
GitHub Actions の artifact API は (1) workflow runs API、(2) artifacts list API、(3) artifact zip download API の 3 段構成で、いずれも `actions:read`（download は `actions:write`）が必要であり、`actions/upload-artifact@v4` の retention-days を観測ウィンドウより短く設定すると aggregation が成立しない。設計テンプレに「観測ウィンドウ + 1 日マージン」の retention 規約が無く、また `actions/download-artifact` の same-run 制限を前提とした workflow 設計テンプレも無かった。

**解決**:
N 日 close-out の cross-run aggregation workflow は **以下 5 規約を canonical pattern として固定**:
1. **retention-days = 観測ウィンドウ + 1 日マージン**（7 日観測なら `retention-days: 8`）。merge 前の hourly run も含めて aggregation 範囲を保護する
2. **list → filter → download → unzip → aggregate** の 5 step 分離。list は `gh api workflows/<name>/runs --paginate`、filter は `created>=<merge_date>`、download は `gh api .../artifacts/<id>/zip --silent --output -`
3. **scope: `actions: read`（list/download）+ `contents: write`（PR 起票）+ `pull-requests: write`（PR 起票）+ `issues: write`（fail 時 Issue）** を最小権限として `permissions:` に明示
4. **expired artifact / 不足 run の早期検出**: list 段階で `expired: true` を grep で除外し、`actualSnapshots < expectedSnapshots` を aggregate step の exit 1 trigger とする
5. **artifact 取得失敗時は再観測**（PR 起票せず exit 1 → 7 日サイクル再起動）。「部分集計で PR 起票」は禁止

**再発防止**:
`task-specification-creator` skill の `phase-template-phase11.md` に「N 日 close-out cross-run aggregation pattern」テンプレを追加（本サイクルで same-wave 反映）。`actions/download-artifact@v4` を見たら same-run 限定として alarm を上げる grep gate を `phase-12-documentation-guide.md` で推奨。

**参照**: `.github/workflows/cf-audit-log-7day-summary.yml`、`docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/implementation-guide.md` §workflow contract / `skill-feedback-report.md` §Workflow

---

### L-586-002: skeleton zero metrics gate — 「動いたが何も観測していない」状態の検出

**症状**:
Phase 9 dry-run で `post-switch-monitor.ts --aggregate` が exit 0 を返すケースが、実は (a) hourly artifact 取得 0 件 + (b) `actualSnapshots = 0` + (c) `fallbackRateMean = 0` + (d) `leakageHits = 0` の「全フィールドが zero / null の skeleton JSON」を生成するパターンで偽 PASS していた。`fallbackRateMean = 0` は本来「ML が完全 PASS」を意味するが、aggregation 失敗時の skeleton と区別できないため、この状態で PR が起票されると「runtime 観測 0 件で `pass_runtime_synced` 昇格」という致命的な誤昇格に至る経路があった。

**原因**:
aggregate gate の閾値判定が「fallbackRateMean > 0.05 で fail」「leakageHits > 0 で fail」のみで、`actualSnapshots = 0` を fail 条件に含めていなかった。`expectedSnapshots = 168` という contract は documentation 上にしか存在せず、コード側の必須検証になっていなかった。

**解決**:
`--require-non-skeleton` フラグを `post-switch-monitor.ts --aggregate` に追加し、以下 4 条件のいずれかで exit 1:
1. `actualSnapshots < expectedSnapshots`（観測不足）
2. `fallbackRateMean > 0.05`（threshold 超過）
3. `leakageHits > 0`（漏洩検知）
4. `mlSnapshots = 0` かつ `thresholdSnapshots = 0`（skeleton zero metrics）

aggregate JSON schema に `expectedSnapshots: 168` を必須フィールドとして固定し、code と documentation の両方で SSOT 化。`aiworkflow-requirements` の `observability-monitoring.md` §11.1 に skeleton zero metrics gate を canonical evidence 要件として明記。

**再発防止**:
N 日 close-out の aggregate gate は **「閾値超過」だけでなく「skeleton（観測不足）」も同等の fail trigger** とする規約を追加。`task-specification-creator` の `phase-template-phase11.md` の N 日 close-out matrix に skeleton zero metrics gate を必須項目として記載。

**参照**: `scripts/cf-audit-log/observation/post-switch-monitor.ts`、`scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts`、`docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/implementation-guide.md` §エラーハンドリング

---

### L-586-003: 3 段昇格状態語彙 — `implemented_local_runtime_pending` / `pass_boundary_synced_runtime_pending` / `pass_runtime_synced`

**症状**:
Phase 12 close-out 時、本タスクは「workflow YAML 編集 + 新規 workflow 投入は完了」「production runtime での 7 日観測は merge 後にしか始まらない」という二重の runtime 待機状態に置かれ、Issue #572 で導入した `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（user approval 待ち）とも区別が必要だった。merge 前にも runtime evidence が無い段階を表す中間状態が無く、`spec_created` と `pass_boundary_synced_runtime_pending` の間にギャップがあった。

**原因**:
N 日 close-out のような「runtime 観測そのものが merge を起点とする時間経過に依存する」タスクは、user approval 待ち（#572 の中間状態）とは異なる「時間経過待ち」の中間状態を持つ。既存語彙では表現できなかった。

**解決**:
3 段昇格を canonical pattern として `task-workflow-active.md` Issue #549 entry / `observability-monitoring.md` §11.1 に固定:
- **`implemented_local_runtime_pending`** = merge 前。境界整備（workflow YAML 編集 + 新規 YAML + monitor flag + Phase 12 strict 7 files）はローカル PASS、production hourly run は未開始
- **`pass_boundary_synced_runtime_pending`** = merge 後。production hourly run は開始したが 7 日 window 未完。skeleton metrics gate も未確定
- **`pass_runtime_synced`** = D+7 evidence PR 起票 + user approval 後。`actualSnapshots ≥ 168` + `fallbackRateMean ≤ 0.05` + `leakageHits = 0` + `mlSnapshots > 0` の 4 観測軸が揃った状態

`pass_boundary_synced_runtime_pending` は #572 の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と意味合いが近いが、**user approval 待ちではなく時間経過待ち**である点で区別する。

**再発防止**:
`task-specification-creator` の `workflow-state-vocabulary.md` 正本で、`implemented_local_runtime_pending` を `implemented_local_evidence_captured` の派生 sub-state（runtime-deferred 専用）として位置付け、N 日 close-out 系タスクの推奨表記とする。`task-workflow-active.md` Issue #549 entry を canonical example として参照。

**参照**: `references/task-workflow-active.md` Issue #549 entry、`references/observability-monitoring.md` §11.1、`docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/system-spec-update-summary.md` §Step 1-B

---

## 横断的な学び

3 件の苦戦は次の共通根本原因に集約される:

1. **N 日 close-out は cross-run + 時間経過依存タスクであり、`actions/download-artifact@v4` の same-run 制約 / `actions:read` scope / retention-days 設計を前提とした dedicated pattern が必要**
2. **aggregate gate は「閾値超過」と「観測不足（skeleton）」の両方を fail trigger とする必要があり、`expectedSnapshots` を schema 必須化することで code-documentation drift を防げる**
3. **「time-deferred runtime」状態は user-approval-deferred と区別する必要があり、`implemented_local_runtime_pending` / `pass_boundary_synced_runtime_pending` / `pass_runtime_synced` の 3 段昇格を canonical 表記とする**

## 反映先（promoted to）

- `references/observability-monitoring.md` §11.1 — N 日 close-out evidence canonical path / 4 観測軸 threshold（本サイクルで same-wave 反映済）
- `references/task-workflow-active.md` Issue #549 entry — 3 段昇格手順（本サイクルで same-wave 反映済）
- `references/workflow-issue-586-post-switch-7day-close-out-artifact-inventory.md` — 成果物 inventory（同 wave で新設）
- `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` — Issue #586 / `pass_runtime_synced` / `7day-close-out` キーワード反映
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md` — N 日 close-out matrix / cross-run pattern / skeleton metrics gate（本サイクルで same-wave 反映済）
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` — N 日 close-out sync 必須項目（本サイクルで same-wave 反映済）
- `.claude/skills/task-specification-creator/lessons-learned/n-day-close-out-cross-run-aggregation.md` — task-spec 側からの cross-reference

## 再発防止サマリ表

| ID | カテゴリ | 再発防止の正本反映先 | grep / gate キーワード |
|----|----------|-----------------------|--------------------------|
| L-586-001 | cross-run aggregation pattern | `phase-template-phase11.md` N 日 close-out matrix | `actions/download-artifact@v4` / `gh api workflows/.+/runs` / `retention-days` |
| L-586-002 | skeleton zero metrics gate | `post-switch-monitor.ts --require-non-skeleton` / `phase-template-phase11.md` | `expectedSnapshots` / `actualSnapshots` / `--require-non-skeleton` |
| L-586-003 | 3 段昇格状態語彙 | `workflow-state-vocabulary.md` / `task-workflow-active.md` Issue #549 entry | `implemented_local_runtime_pending` / `pass_boundary_synced_runtime_pending` / `pass_runtime_synced` |

## 用語集（本タスクで導入 / 確定した語彙）

- **N 日 close-out cross-run aggregation pattern**: `actions/download-artifact@v4` の same-run 制限を回避するため、`gh api workflows/<name>/runs` + `gh api .../artifacts/<id>/zip` で別 run の artifact を取得し、`retention-days = 観測ウィンドウ + 1 日マージン` を必須とする workflow 設計
- **skeleton zero metrics gate**: aggregate JSON が全 numeric field zero の場合に「観測 0 件の skeleton」と判定し exit 1 する gate。`--require-non-skeleton` で有効化
- **3 段昇格 (implemented_local_runtime_pending → pass_boundary_synced_runtime_pending → pass_runtime_synced)**: time-deferred runtime task の段階表現。merge 前 / merge 後 / D+N evidence PR + approval 後 の 3 段階

## 引用元

- workflow: `.github/workflows/cf-audit-log-monitor.yml`、`.github/workflows/cf-audit-log-7day-summary.yml`
- monitor / classifier: `scripts/cf-audit-log/observation/post-switch-monitor.ts`、`scripts/cf-audit-log/analyze.ts`、`scripts/cf-audit-log/classifier/ml.ts`
- runbook: `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`
- specs: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- Phase 12 outputs: `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- 関連 issue: GitHub Issue #586（本タスク起票元、CLOSED 維持）、Issue #549（親 ML production switch、CLOSED 維持で `pass_runtime_synced` 昇格対象）
- 状態: 本タスクは `implemented_local_runtime_pending`、merge 後に `pass_boundary_synced_runtime_pending`、D+7 evidence PR + user approval 後に `pass_runtime_synced`
