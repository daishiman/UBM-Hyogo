# Lessons: N-day close-out cross-run aggregation pattern

> 起点: Issue #586 cf-audit-log post-switch 7day close-out（2026-05-09）
> 関連 spec: `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-586-post-switch-7day-close-out-2026-05.md`、`references/phase-template-phase11.md`、`references/phase-12-documentation-guide.md`、`references/workflow-state-vocabulary.md`
> 適用範囲: production runtime 観測そのものが merge を起点とする時間経過に依存する task（post-switch observation、N 日 baseline、time-windowed close-out）

## 何が起きたか

Issue #586 7day close-out の Phase 7〜9 設計時、`actions/download-artifact@v4` が **same-run 限定** で別 run の artifact を取得できないという制限と、aggregate gate が「閾値超過」のみ fail trigger としており「観測 0 件で全 metric zero の skeleton JSON」を生成する偽 PASS 経路があるという 2 件が、Phase 12 close-out 直前にまとめて顕在化した。

合わせて、`implemented_local_runtime_pending` / `pass_boundary_synced_runtime_pending` / `pass_runtime_synced` の 3 段昇格が状態語彙正本（`workflow-state-vocabulary.md`）に未登録だったため、Phase 12 system-spec-update-summary.md / LOGS / artifacts.json の表記が drift しかけた。

## 学び 1: cross-run artifact aggregation pattern

N 日 close-out workflow は以下 5 規約を canonical pattern として固定する:

1. **`retention-days = 観測ウィンドウ + 1 日マージン`**: 7 日観測なら `retention-days: 8`。merge 前後の hourly run も含めて aggregation 範囲を保護する
2. **`actions/download-artifact@v4` は same-run 限定** であることを明示し、cross-run aggregation には `gh api workflows/<name>/runs --paginate` + `gh api .../actions/artifacts/<id>/zip --silent --output -` の 5 step（list → filter → download → unzip → aggregate）に分離
3. **scope 必須 set**: `actions: read`（list/download）+ `contents: write`（PR 起票）+ `pull-requests: write`（PR 起票）+ `issues: write`（fail 時 Issue）。`permissions:` block に明示
4. **expired artifact 早期検出**: list 段階で `expired: true` を grep 除外。`actualSnapshots < expectedSnapshots` を aggregate exit 1 trigger に含める
5. **部分集計禁止**: artifact 取得失敗時は **PR 起票せず exit 1** → 観測サイクル再起動。「部分集計で PR 起票」は禁止

`peter-evans/create-pull-request@v6` で evidence PR を `chore/issue-<n>-<window>day-evidence-${{ github.run_id }}` ブランチに base=`dev` で起票するパターンを Phase 11 / Phase 13 テンプレに据える。

## 学び 2: skeleton zero metrics gate

aggregate gate は「閾値超過」だけでなく「観測不足（skeleton）」も同等の fail trigger として実装する。Issue #586 では `post-switch-monitor.ts --aggregate --require-non-skeleton --expected-snapshots=168` で以下 4 条件のいずれかで exit 1:

1. `actualSnapshots < expectedSnapshots`（観測不足）
2. `fallbackRateMean > 0.05`（threshold 超過）
3. `leakageHits > 0`（漏洩検知）
4. `mlSnapshots = 0` かつ `thresholdSnapshots = 0`（skeleton zero metrics）

aggregate JSON schema に `expectedSnapshots` を必須フィールドとして固定し、code と documentation の両方で SSOT 化する。task spec の Phase 7 観測仕様 / Phase 9 test 戦略 / Phase 11 NON_VISUAL evidence matrix に「skeleton zero metrics gate」を明示項目として記載する。

## 学び 3: 3 段昇格状態語彙

time-deferred runtime tasks は 3 段昇格を持つ:

| 段階 | 状態語彙 | 条件 |
| --- | --- | --- |
| merge 前 | `implemented_local_runtime_pending` | 境界整備（workflow YAML / monitor flag / Phase 12 strict 7 files）はローカル PASS、production hourly run は未開始 |
| merge 後 | `pass_boundary_synced_runtime_pending` | production hourly run は開始したが N 日 window 未完。aggregate gate 未確定 |
| D+N + approval 後 | `pass_runtime_synced` | aggregate gate 4 軸 PASS + evidence PR + user approval |

`pass_boundary_synced_runtime_pending` は Issue #572 の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（user approval 待ち）と意味合いが近いが、**user approval 待ちではなく時間経過待ち**である点で区別する。両者は同じ状態語彙を共有してよいが、Phase 12 implementation-guide で「runtime は時間経過依存である」と明示する必要がある。

## 学び 4: Part 1 ドラフト逐語コピペ運用

Phase 12 implementation-guide.md の **Part 1（中学生レベル）** は、Phase 仕様書 phase-12.md の Part 1 ドラフトをそのまま **逐語コピペ**することを必須とする。AI による「自然な書き直し」「言い回しの推敲」は禁止。

**理由**:
- Part 1 ドラフトは task-specification-creator skill が「中学生でも理解できる」レベルで意図的に冗長化したテキストであり、推敲によって専門用語に戻る経路がある
- Part 1 が再生成されると、phase-12.md の用語表とコピペ整合が崩れ、Phase 12 compliance check の「逐語コピー前提」が成立しなくなる
- Part 1 を改稿するなら、同 wave で `implementation-guide.md` 全体・`phase-12.md` Part 1 ドラフト・`workflow-state-vocabulary.md` のいずれかを更新する必要がある（drift fence）

## 反映先

- `references/phase-template-phase11.md` — N 日 close-out matrix / cross-run pattern / skeleton metrics gate（Issue #586 cycle で same-wave 反映済）
- `references/phase-12-documentation-guide.md` — N 日 close-out sync 必須項目 / Part 1 逐語コピペルール
- `references/workflow-state-vocabulary.md` — `implemented_local_runtime_pending` / `pass_boundary_synced_runtime_pending` / `pass_runtime_synced` を canonical sub-state として登録
- `references/phase-template-execution.md`（候補） — production deploy workflow YAML 必須 set（`vars.<KEY>` / `secrets.<KEY>` / `permissions:` / `retention-days = window + 1 day`）

## 用語集

- **N-day close-out cross-run aggregation pattern**: `actions/download-artifact@v4` の same-run 制限を回避するため、`gh api` 経由で別 run の artifact を取得し、`retention-days = 観測ウィンドウ + 1 日マージン` を必須とする workflow 設計
- **skeleton zero metrics gate**: aggregate JSON が全 numeric field zero の場合に「観測 0 件 skeleton」と判定し exit 1 する gate
- **3 段昇格 (implemented_local_runtime_pending → pass_boundary_synced_runtime_pending → pass_runtime_synced)**: time-deferred runtime task の段階表現
- **Part 1 逐語コピペ運用**: Phase 12 implementation-guide.md の Part 1（中学生レベル）は phase-12.md の Part 1 ドラフトを推敲なしで逐語コピペする規約

## 引用元

- Issue #586 spec: `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/`
- workflow: `.github/workflows/cf-audit-log-monitor.yml`、`.github/workflows/cf-audit-log-7day-summary.yml`
- monitor: `scripts/cf-audit-log/observation/post-switch-monitor.ts`
- aiworkflow lessons: `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-586-post-switch-7day-close-out-2026-05.md`
