# Lessons Learned: Issue #572 attendanceProvider Production Runtime Smoke (2026-05)

> task: `issue-572-attendance-provider-production-runtime-smoke`
> ブランチ: `docs/issue-572-attendance-provider-production-runtime-smoke`
> 関連 spec: `references/task-workflow-active.md`（Issue #572 行）、`indexes/quick-reference.md`（Issue #572 セクション）、`indexes/resource-map.md`（Issue #572 行）
> 関連 source: `apps/api/scripts/runtime-smoke/run-smoke.sh`、`apps/api/scripts/runtime-smoke/run-production-smoke.sh`、`apps/api/scripts/runtime-smoke/redact-filter-production.sh`、`apps/api/scripts/runtime-smoke/lib/api-url-guard.sh`、`apps/api/scripts/runtime-smoke/lib/evidence-summary.sh`、`scripts/lib/redaction.sh`、`tests/unit/runtime-smoke.test.sh`、`tests/unit/redaction.test.sh`
> 関連 reference: `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/`（implementation-guide / system-spec-update-summary / documentation-changelog / skill-feedback-report / phase12-task-spec-compliance-check）、`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`
> Issue: #572 CLOSED（`Refs #572` のみ。`Closes #572` 不可）。`PASS_RUNTIME_VERIFIED` 昇格は Issue #371 attendanceProvider DI migration に対する production GET smoke 実行後の user approval 段階で行う。

## 概要

Issue #371 で実装済みの attendanceProvider DI migration（Hono container 経由の境界化）について、production read-only GET smoke を user-gated で安全に実行するための runner / runbook / redaction / unit test 基盤を整備した follow-up。Phase 12 subagent 監査により、`run-smoke.sh` / `legacy alternate runner name` / `compatibility wrapper name` という 3 系の命名分裂、`implemented-local` と `pending_user_gate` を併存表現する状態語彙の不在、Phase 12 outputs / runbook / runner の path 実在検証ゲート不足、の 3 件が抽出された。本 lessons-learned はそれらを L-572-001..003 として正本化する。

本タスクは production への副作用ゼロ（GET only / Cloudflare Secrets 揮発注入 / redaction 強制）を不変条件とし、`apps/api/scripts/runtime-smoke/` 一式・`scripts/lib/redaction.sh`（R-07 production 拡張）・`tests/unit/runtime-smoke.test.sh` / `tests/unit/redaction.test.sh`・`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` を一括投入する。production 実行・Issue #371 `PASS_RUNTIME_VERIFIED` 昇格・commit / push / PR はすべて user approval gate 後にのみ行う。

## 苦戦箇所と学び

### L-572-001: runtime-smoke runner 命名分裂の防止 — 単一 runner path / runbook path / redaction SSOT を Phase 11 前に確定する

**症状**:
Phase 7〜9 実装中に runner script の命名候補が `run-smoke.sh`（短縮形）/ `run-production-smoke.sh`（環境 suffix 付き正本）/ legacy 互換ラッパー名 / smoke wrapper 互換名 と 3〜4 系統に揺らぎ、Phase 11 evidence 取得直前に runbook / unit test / Phase 12 implementation-guide が異なる runner を参照する状態になりかけた。compliance check 直前に統一したが、検出が後段だったため、redaction SSOT (`scripts/lib/redaction.sh`) の参照経路と runner の引数規約も同期 refactor が必要となり工数が膨らんだ。

**原因**:
production runtime smoke のような「複数の境界（runbook / runner / unit test / redaction / Phase 12 outputs）を同時に整備する」タスクで、Phase 4〜5 の段階で正本ファイル名（runner path / runbook path / redaction source / Phase 11 summary-only evidence path / Phase 13 commit & PR gate 分離）を SSOT として確定しないまま Phase 7 実装に入ってしまった。task-specification-creator skill の `WORKFLOW_AUTOMATION` モードに「runtime smoke canonical implementation set」テンプレが無く、runner と wrapper を区別する命名規約が局所判断に委ねられていた。

**解決**:
Production runtime smoke タスクは **Phase 11 前に以下 5 path を canonical implementation set として固定する** ルールを採用:
1. **single runner path**: 環境別 entry point の正本（本タスクでは `apps/api/scripts/runtime-smoke/run-production-smoke.sh`）と汎用 runner（`run-smoke.sh`）を 1 対のみ許容、それ以外は禁止
2. **single runbook path**: `docs/30-workflows/runbooks/production-runtime-smoke-<domain>.md` のみ正本（本タスクでは `production-runtime-smoke-attendance.md`）
3. **redaction source of truth**: `scripts/lib/redaction.sh` を SSOT とし、runner 内で個別に redaction ロジックを書かない（filter wrapper は薄い委譲のみ可）
4. **Phase 11 summary-only evidence path**: runtime evidence は Phase 11 main.md のサマリ表記のみ、本実行ログは production approval 後の追補
5. **Phase 13 commit / PR gate separation**: implementation commit と production execution evidence commit を **別 PR** に分離（本タスクは前者のみ）

**再発防止**:
`task-specification-creator` skill の `WORKFLOW_AUTOMATION` モードに「runtime smoke canonical implementation set」条項を追加し、本 lessons-learned を `references/` から参照する。runner / wrapper 命名は kebab-case + 環境 suffix を必須とし、`run-smoke.sh`（汎用）以外の短縮命名は禁止。

**参照**: `apps/api/scripts/runtime-smoke/run-production-smoke.sh` / `apps/api/scripts/runtime-smoke/README.md` / `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/skill-feedback-report.md` §Template

---

### L-572-002: `implemented-local` + `pending_user_gate` を表現する状態語彙 — `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` の採用

**症状**:
Phase 11 close-out 時、attendanceProvider DI migration（Issue #371）に対する production GET smoke の runner / runbook / unit test / redaction 拡張は **すべてローカルで PASS** している一方、production approval は user gate 待ちで未実行という中間状態が発生。既存の `PASS_RUNTIME_VERIFIED`（runtime まで通過）も `blocked_runtime_evidence`（実行できない）も意味が合わず、`state: completed` を主張すると Issue #371 の昇格と区別がつかなくなる事故が起きかけた。

**原因**:
Phase 11 / 12 の状態語彙は「契約完成 = runtime 完成」または「runtime 不可」の二値モデルが主で、Issue #517 の `CONTRACT_READY_SECRET_PENDING` のような中間状態は導入済みだが、本タスクは secret 投入ではなく **既存 secret 下での read-only production GET 実行が user 承認待ち** という別の中間状態に該当し、専用語彙が無かった。

**解決**:
新しい状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を導入し、以下を意味する:
- 境界整備（runner / runbook / unit test / redaction SSOT / Phase 12 strict 7 files）はローカルで完成
- production runtime evidence のみが user approval 待ちで未取得
- `PASS_RUNTIME_VERIFIED` への昇格は production GET smoke 実行 + redaction grep PASS + Issue #371 への evidence 連携 + user approval 後

skill 語彙としての推奨表記を `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に統一し、`PASS_RUNTIME_VERIFIED` は production 実行成果の昇格専用語として温存する。

**再発防止**:
`task-specification-creator` skill の `references/phase-11-guide.md` に `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を正式採用し、`CONTRACT_READY_SECRET_PENDING`（外部 secret 投入待ち）との使い分け表を追記する想定。Phase 11 main.md / artifacts.json / `references/task-workflow-active.md` の表記をこの語彙に揃え、SKILL.md changelog 行でも明示。

**参照**: `references/task-workflow-active.md`（Issue #572 行）/ `SKILL.md` v2026.05.08 行 / `outputs/phase-12/skill-feedback-report.md` §Workflow

---

### L-572-003: Phase 12 path 実在検証 — runbook / runner / unit test の実在を strict gate に組み込む

**症状**:
Phase 12 subagent 監査で、task spec（Phase 4〜10 の各 .md）が参照する runbook path / runner path / unit test path が実在ファイルと食い違うケースが発見された。具体的には「nonexistent runbook reference file」を指す行が残っており、検出されなければ Phase 13 PR 本文生成時にリンク切れ・user 手動オペレーション時の参照断・runtime evidence 取得時の path 不在エラーとして顕在化する経路があった。

**原因**:
Phase 12 strict filename exact match（Issue #517 の L-517-006 で導入済み）は **Phase 12 outputs ディレクトリ内 7 files** のみを対象としており、task spec 本文・runbook・runner script・unit test path のような **outside-of-phase-12 references** は実在検証の対象外だった。したがって命名 drift は検出できても、外部 path 参照の dangling は素通りしていた。

**解決**:
Phase 12 compliance-check の Mandatory Checks に **「task spec / outputs 内で参照される runbook / runner / unit test path は実ファイルとして存在する、または `references/task-workflow-active.md` 等の concrete 代替が示されている」** を追加。具体的には:
- `outputs/phase-12/implementation-guide.md` / `outputs/phase-12/main.md` / 各 phase-NN.md 内の `docs/30-workflows/runbooks/` `apps/api/scripts/runtime-smoke/` `tests/unit/` などのパス文字列を grep で抽出
- 抽出結果の各 path を `test -e` で実在検証
- 不在 path は fail、ただし `references/task-workflow-active.md` のような正当な reference 参照は許容

本タスクでは `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`、`apps/api/scripts/runtime-smoke/run-production-smoke.sh`、`tests/unit/runtime-smoke.test.sh`、`tests/unit/redaction.test.sh`、`scripts/lib/redaction.sh` を 5 必須実在 path として固定し、Phase 12 close-out 前に全件 `test -e` PASS を確認した。

**再発防止**:
`.claude/skills/task-specification-creator/references/phase-12-guide.md` の Mandatory Checks に「referenced path existence verification」を追加。strict filename exact match（7 files）と並ぶ第 2 の path gate として位置付ける。grep gate キーワードは `runbooks/` `scripts/` `tests/unit/` `apps/api/scripts/runtime-smoke/` を初期セットとし、ドメインごとに拡張可能とする。

**参照**: `outputs/phase-12/phase12-task-spec-compliance-check.md` / `outputs/phase-12/skill-feedback-report.md` §Documentation / `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`

---

## 横断的な学び

3 件の苦戦は次の共通根本原因に集約される:

1. **複数境界（runner / runbook / unit test / redaction / Phase 12 outputs）を同時に整備する production runtime タスクは、Phase 4〜5 で canonical implementation set を SSOT 化しないと、後段で命名分裂・path drift・状態語彙不足が連鎖する**
2. **「契約完成 / runtime 未実行」の中間状態は、`CONTRACT_READY_SECRET_PENDING` と区別する `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のような専用語彙が必要**（user approval 種別ごとに語彙を分離）
3. **Phase 12 strict gate は filename exact match だけでなく、参照 path の `test -e` 実在検証も第 2 軸として必須**

## 反映先（promoted to）

- `references/task-workflow-active.md` — Issue #572 行に本 lessons-learned へのリンク追加
- `references/workflow-issue-572-attendance-provider-production-runtime-smoke-artifact-inventory.md` — 成果物 inventory（同 wave で新設）
- `changelog/20260508-issue-572-attendance-provider-production-runtime-smoke.md` — sync record
- `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` — Issue #572 / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` キーワード反映
- `.claude/skills/task-specification-creator/references/phase-11-guide.md`（想定）— `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態語彙
- `.claude/skills/task-specification-creator/references/phase-12-guide.md`（想定）— Mandatory Checks に referenced path existence verification を追加

## 再発防止サマリ表

| ID | カテゴリ | 再発防止の正本反映先 | grep / gate キーワード |
|----|----------|-----------------------|--------------------------|
| L-572-001 | runner / runbook 命名 SSOT | task-specification-creator `WORKFLOW_AUTOMATION` モード | `apps/api/scripts/runtime-smoke/run-production-smoke.sh` / `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` |
| L-572-002 | 状態語彙 | `phase-11-guide.md` の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `PASS_RUNTIME_VERIFIED` |
| L-572-003 | Phase 12 path 実在検証 | `phase-12-guide.md` Mandatory Checks | `runbooks/` / `scripts/` / `tests/unit/` / `apps/api/scripts/runtime-smoke/` |

## 用語集（本タスクで導入 / 確定した語彙）

- **runtime smoke canonical implementation set**: production runtime smoke タスクで Phase 11 前に SSOT 化すべき 5 path（single runner / single runbook / redaction SSOT / Phase 11 summary-only evidence / Phase 13 commit&PR gate 分離）。
- **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING**: 境界整備はローカル PASS、production runtime evidence のみが user approval 待ちで未取得という中間状態。`PASS_RUNTIME_VERIFIED` 昇格は production 実行 + 承認後。
- **referenced path existence verification**: Phase 12 compliance-check の Mandatory Check で、outputs / phase spec が参照する runbook / runner / unit test path を `test -e` 実在検証する gate。

## 引用元

- runner: `apps/api/scripts/runtime-smoke/run-production-smoke.sh`、`apps/api/scripts/runtime-smoke/run-smoke.sh`、`apps/api/scripts/runtime-smoke/redact-filter-production.sh`、`apps/api/scripts/runtime-smoke/lib/api-url-guard.sh`、`apps/api/scripts/runtime-smoke/lib/evidence-summary.sh`
- redaction SSOT: `scripts/lib/redaction.sh`（R-07 production 拡張）
- runbook: `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`
- unit tests: `tests/unit/runtime-smoke.test.sh`、`tests/unit/redaction.test.sh`
- Phase 12 outputs: `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- 関連 issue: GitHub Issue #572（本タスクの起票元、CLOSED 維持）、Issue #371（attendanceProvider DI migration / `PASS_RUNTIME_VERIFIED` 昇格対象）
- 関連 PR: 本タスクの implementation commit PR は user approval 後に作成、production runtime evidence commit は別 PR に分離
- 状態: `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
