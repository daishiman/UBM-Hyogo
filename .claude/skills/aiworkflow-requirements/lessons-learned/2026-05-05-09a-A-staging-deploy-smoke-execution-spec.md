# Lessons Learned — 09a-A Staging Deploy Smoke Execution Spec（2026-05-05）

> task id: `09a-A-staging-deploy-smoke-execution`
> branch: `docs/09a-A-staging-deploy-smoke-execution-task-spec`
> wave: 2026-05-05 / spec_contract_completed / runtime_evidence_pending_user_approval
> created: 2026-05-05
> canonical root: `docs/30-workflows/09a-A-staging-deploy-smoke-execution/`
> 関連 reference: `references/task-workflow-active.md` / `references/legacy-ordinal-family-register.md` / `references/workflow-task-09a-A-staging-deploy-smoke-execution-artifact-inventory.md`
> 関連 spec: `docs/00-getting-started-manual/specs/00-overview.md` / `docs/00-getting-started-manual/specs/08-free-database.md`

## 教訓一覧

### L-09AA-001: spec contract complete と runtime evidence PASS は **必ず分離**して扱う（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）

- **背景**: 09a-A は Phase 1-10 + 12 の spec contract を完了したが、Phase 11 runtime evidence（staging deploy / Forms sync / D1 apply / Playwright smoke / wrangler tail）は全て pending_user_approval。spec close と runtime PASS を同一視すると、未実施の deploy を「合格済み」と読み違える事故になる。
- **教訓**: Phase 11 が runtime evidence 未取得のまま Phase 12 strict 7 files が揃ったケースは、close-out 判定を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で固定する。`artifacts.json` の `metadata.workflow_state` は `spec_contract_completed`、`visualEvidence` は `VISUAL_ON_EXECUTION`、Phase 11 は `pending_user_approval`、Phase 13 も `pending_user_approval` を維持する。
- **適用条件**: 仕様策定済 + 実 deploy / 実 D1 apply / 実 Forms sync / 実 screenshot のいずれかが未取得である runtime workflow。
- **再利用方法**: 新規 `*-execution` 系 workflow の Phase 12 compliance check に「runtime evidence boundary 確認」項目を入れ、未取得項目を逐一 `outputs/phase-11/evidence/` reserve path として宣言する。spec close 時に PASS_FULL と誤判定しないよう `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を 5 段階判定の 1 つとして固定する。

### L-09AA-002: G1-G4 multi-stage approval gate（runtime deploy / Forms sync / D1 apply / commit-push-PR）を **独立**して承認する

- **背景**: 09a-A は (a) staging Pages/Workers deploy、(b) Forms schema/responses sync 実行、(c) staging D1 への migration apply、(d) Phase 13 commit / push / PR を全て user 承認制にしている。これらを 1 つの gate にまとめると、片方だけ通したい場合や、片方だけが失敗した時の rollback 境界が曖昧になる。
- **教訓**: 各 runtime mutation を独立 approval gate に分け、以下のように label する。
  - **G1 staging runtime deploy gate**: Pages/Workers `pnpm deploy:staging` 系の実行承認。
  - **G2 Forms sync gate**: Google Forms schema/responses sync 実行承認（admin-managed data 反映）。
  - **G3 D1 apply gate**: staging D1 への `migrations apply` 実行承認（pending → applied 確定）。
  - **G4 commit/push/PR gate**: Phase 13 git mutation 承認。
- **適用条件**: 1 wave 内に複数の runtime mutation が含まれる task（deploy + DB migration + 外部 API 同期 + git push）。
- **再利用方法**: artifact inventory に「Approval Gates」セクションを設け、各 gate に対する「実行コマンド」「rollback 手順」「失敗時の next gate ブロック条件」をマトリクスで明記する。Phase 12 implementation guide の冒頭にも G1-G4 を引用し、Claude Code 側が gate を独自にバイパスしない構造にする。

### L-09AA-003: D1 schema parity 検証は staging vs production の **table / index / `PRAGMA table_info` ワンショット比較**で固定する

- **背景**: staging への migration apply 後に「staging では PASS、production apply 後に column drift で 500 多発」を防ぐには、apply 直後に staging と production の schema が同一であることを確実に検証する必要がある。`d1_migrations` の applied 数値だけ比較しても、production が他経路（手動 apply / cutover）で先行したケースを見逃す。
- **教訓**: D1 schema parity は以下 3 種を staging と production で取得して diff を取る。
  - `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`
  - `SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY name;`
  - 主要テーブルごとに `PRAGMA table_info('<table>');`（`name / type / notnull / dflt_value / pk` を取得）
  - `SELECT id, applied_at FROM d1_migrations ORDER BY id;`（applied / pending 数値の正本）
- **適用条件**: staging と production の双方が active な D1 を持ち、migration を順次 apply する workflow。Issue #359 のような out-of-band apply が past に発生したケースでは特に必須。
- **再利用方法**: `templates/staging-deploy-smoke-evidence-template.md` に「D1 schema parity 検証手順」を section 化し、ワンショット script の引数（DB 名 / env 名）を artifact に固定する。差分 0 を通過条件とし、差分があった場合は production 側を正本として staging を再適用するルートに分岐する。

### L-09AA-004: parent directory missing blocker は **canonical-directory-restoration** task と直接連携する

- **背景**: 09a-A の旧 task path は `docs/30-workflows/02-application-implementation/09a-A-staging-deploy-smoke-execution/` だったが、`02-application-implementation/` 配下の path drift を補正するため canonical workflow root 直下へ昇格する必要があった。restoration 未完のままで Phase 12 strict 7 files を生成すると、artifact inventory / quick-reference / resource-map / task-workflow-active が旧 path を citation し続け、後段で grep 引き直しが必要になる。
- **教訓**: parent directory が drift している task は **classification-first** の原則に従い、まず legacy-ordinal-family-register.md の Task Root Path Drift Register に新旧 path を登録し、quick-reference / resource-map / task-workflow-active / artifact inventory / SKILL.md changelog を **同一 wave** で同期する。restoration の lessons は本ファイルに集約する。
- **適用条件**: `02-application-implementation/` 配下 / `_design/` 配下 / `unassigned-task/` 配下から canonical workflow root へ昇格する全ケース。
- **再利用方法**: restoration 同伴 wave のチェックリストとして、(1) legacy register 行追加、(2) artifact inventory の `Former generated root` / `Current canonical root` 記入、(3) keywords.json / topic-map / quick-reference / resource-map / task-workflow-active 同期、(4) lessons-learned + changelog + LOGS の 3 点セット作成、を mandatory 化する。

### L-09AA-005: 09a-A は **09c production deploy への blocker** を保持し、09c 着手前に必ず unblock 状態を確認する

- **背景**: 09a-A の Phase 11 runtime evidence が pending のまま 09c production deploy execution（`task-09c-production-deploy-execution-001`）を着手すると、staging で確認できていない migration や Pages config を production に反映する事故が起きる。staging smoke は production deploy の precondition である。
- **教訓**: artifact inventory に `Blocks: 09c-production-deploy-execution-001` を明記し、09c 側 artifact inventory にも `Blocked by: 09a-A-staging-deploy-smoke-execution` を双方向で記録する。`task-workflow-active.md` の同 wave 行にも blocker を併記する。
- **適用条件**: staging → production の 2 段 deploy 系 workflow（09a → 09c / 03b → 03c など）。
- **再利用方法**: blocker propagation を artifact inventory の固定セクションにし、09c 着手前に `grep -rl '09a-A-staging-deploy-smoke-execution' docs/30-workflows/09c-production-deploy-execution-001/` で双方向参照が両側に存在することを Phase 1 P50 既実装状態調査で必ず確認する。Phase 11 runtime evidence が PASS になった時点で初めて 09c gate を user に提示できる。

### L-09AA-006: 親 directory 不在の successor は **独立完結経路**で runtime evidence を保存し、parent mirror update を分離 step として明記する

- **背景**: 09a-A は親 `09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` directory が現 worktree に不在のまま spec contract を完了している。restoration task 完了を待つと runtime evidence 取得が無期限に遅延し、09c production deploy も連鎖的に blocked となる。一方で restoration なしに親 path を参照する evidence dump を保存すると、後段で grep 引き直しと artifact 重複が発生する。
- **教訓**: 親 directory drift / absent の場合、successor は **自身の root 配下のみで evidence path を完結**させ、親 mirror update は exec task の独立 step（例: Step 6）に分離する。restoration task 未完でも 09a-A は単独で runtime PASS まで進められる経路を保ち、親 mirror update は restoration が green になった時点で別 PR / 別 wave で実施する。
- **適用条件**: parent canonical directory が drift / absent / restoration pending のまま、successor の Phase 11 runtime evidence 取得が必要なケース。
- **再利用方法**: exec task spec の Step 一覧に「親 mirror update は restoration 完了後の別 step」を mandatory 化し、Phase 11 evidence root は successor 自身の `outputs/phase-11/evidence/` のみを正本とする。successor artifact inventory に `Parent mirror update: pending_until_restoration_pass` 行を固定する。

### L-09AA-007: spec contract PASS と runtime PASS を視覚的に分離するため、**Phase 11 main.md 冒頭に状態行**を必ず置く

- **背景**: Phase 12 strict 7 files が揃っていても Phase 11 runtime evidence が `NOT_EXECUTED` のままの状態は、artifacts.json / quick-reference / resource-map のいずれかを読み損なうと「全 Phase PASS」と読み違える。特に Phase 12 を後から開いた読者は Phase 11 main.md の本文後半の `NOT_EXECUTED` 注記を見落とす可能性が高い。
- **教訓**: `outputs/phase-11/main.md` の冒頭 1 行目に必ず状態 banner を置く: `state: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / runtime_evidence: NOT_EXECUTED / approval: G1-G4 pending_user_approval`。Phase 12 の `phase12-task-spec-compliance-check.md` 判定行と一字一句揃え、Phase 12 を「PASS」と要約しても Phase 11 が runtime PASS でないことが必ず露出するようにする。
- **適用条件**: spec contract 完成と runtime evidence 取得が分離している全 `*-execution` workflow（09a-A / 09c production / 06b-c runtime evidence / 08b-A full execution など）。
- **再利用方法**: `templates/staging-deploy-smoke-evidence-template.md` の Phase 11 main.md 雛形冒頭に状態 banner 行を含め、generate-index.js 系の validate でこの 1 行が欠落した場合に fail させる validator を将来追加する。

### L-09AA-008: G1-G4 包括承認の解釈リスクは **gate 直前提示プロトコル**で防ぐ

- **背景**: user 発言「進めて」「OK」「実行して」は曖昧で、4 gate 同時実行と解釈すると spec の「合算承認禁止 / 逆順実行禁止」に違反する。特に G3 Forms sync のように外部 API quota を消費する gate を G1 deploy と同時承認したと誤解した場合、rollback 境界が崩れる。
- **教訓**: 各 gate 直前で **(1) 対象操作 (2) 影響範囲 (3) rollback 手段 (4) 次 gate との独立性** の 4 点を 1 メッセージで提示し、user 承認応答を**当該 gate のみ**に限定する。承認は gate ごとに独立イベントとして記録し、artifact に `approved_at_g1`, `approved_at_g2`, ... のように分離する。「全部 OK」など包括承認発言があった場合でも、Claude Code 側は **gate ごとに再提示・再承認**を求める。
- **適用条件**: 1 wave に複数 runtime mutation gate がある execution task（deploy + DB migration + 外部 API + git push 等）。
- **再利用方法**: artifact inventory の `Runtime Execution Task` セクションに `Pre-G1..G4 提示テンプレ` 行を追加し、各 gate の (1)-(4) フィールドを必須化する。Claude Code 運用上は「包括承認発言を gate 数に分割再確認する」を運用ルールとして lessons-learned に固定する。

## Same-Wave Sync

| target | purpose |
| --- | --- |
| `references/task-workflow-active.md` | 09a-A wave 行（spec_contract_completed / runtime_pending） |
| `references/legacy-ordinal-family-register.md` | Task Root Path Drift Register に 09a-A 行追加 |
| `references/workflow-task-09a-A-staging-deploy-smoke-execution-artifact-inventory.md` | artifact inventory（Same-Wave Sync テーブル拡充） |
| `indexes/quick-reference.md` | 09a-A セクション（approval gates / evidence root） |
| `indexes/resource-map.md` | current canonical set 行 |
| `indexes/topic-map.md` | artifact-inventory セクション目次 |
| `indexes/keywords.json` | 09a-A 関連 keyword 12 件 |
| `SKILL.md` 変更履歴 | `v2026.05.05-09a-a-staging-smoke-execution-root-sync` |
| `lessons-learned/2026-05-05-09a-A-staging-deploy-smoke-execution-spec.md` | 本ファイル |
| `changelog/20260505-09a-A-staging-deploy-smoke-execution-spec.md` | 同期 changelog |
| `LOGS/20260505-09a-A-staging-deploy-smoke-execution-sync.md` | operational sync log |
| `templates/staging-deploy-smoke-evidence-template.md` | Phase 11 evidence 取得手順テンプレ |
