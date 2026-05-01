# lessons-learned: 09a Staging Smoke / Forms Sync Validation 苦戦箇所（2026-05-01）

> 対象タスク: `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/`
> 状態: `spec_created` / implementation execution spec / `VISUAL_ON_EXECUTION`
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check}.md`

09a は実 staging deploy をまだ実行しない close-out である。将来の staging smoke 実行と Phase 12 同期を短時間で正しく閉じるため、実測 evidence と placeholder の境界、path realignment、artifact parity を再利用可能な形で固定する。

## L-09A-001: `NOT_EXECUTED` placeholder は PASS 証跡にしない

**苦戦箇所**: Phase 11 に `manual-smoke-log.md`、`wrangler-tail.log`、`sync-jobs-staging.json` が存在すると、ファイル実体だけで staging smoke 済みに見えやすい。しかし 09a close-out では staging 環境の実 deploy / auth / Forms sync は未実行で、これらは実行時の保存先を予約する placeholder である。

**5分解決カード**: `rg -n "NOT_EXECUTED|PASS|成功" outputs/phase-11 outputs/phase-12` を先に実行し、placeholder が `PASS` と併記されていないことを確認する。Phase 12 では `phase12-task-spec-compliance-check.md` に「placeholder not counted as PASS」を明記し、実行タスクは `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` へ分離する。

**適用条件**: UI screenshot / tail log / API dump の保存先だけを作る spec_created task。

## L-09A-002: staging smoke は delegated evidence の集約 gate として扱う

**苦戦箇所**: 05a/06a/06b/06c/08b から visual smoke が 09a に委譲されているため、09a を単独の deploy task と見ると upstream の未取得 evidence を取り落とす。09c production deploy は 09a の実測結果を gate にするため、委譲元を明示しないと production 判定が曖昧になる。

**5分解決カード**: 09a の artifact inventory と quick-reference に「consumes 05a/06a/06b/06c/08b」「blocks 09c」を必ず書く。実行時は `/`, `/members`, `/login`, `/profile`, `/admin/*`, Forms schema / responses sync の各 evidence を同じ Phase 11 bundle に保存する。

**適用条件**: 複数 task の visual / integration smoke を後続 staging wave に集約する場合。

## L-09A-003: root/output `artifacts.json` parity は warning ではなく blocker

**苦戦箇所**: root `artifacts.json` と `outputs/artifacts.json` がずれても以前は warning 扱いで、status / path / phase artifact の drift が残りやすかった。09a では path realignment と spec_created 状態が重要なため、parity drift は後続 09c の前提を壊す。

**5分解決カード**: `cmp artifacts.json outputs/artifacts.json` と `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js <workflow>` を実行する。`validate-phase-output.js` は parity drift を error 扱いにしているため、PASS するまで Phase 12 を閉じない。

**適用条件**: root と outputs の二重 ledger を持つ workflow。

## L-09A-004: path realignment は top register と drift register の両方に書く

**苦戦箇所**: `legacy-ordinal-family-register.md` の上部 mapping に 09a 旧→新 root を追加しても、後半の Task Root Path Drift Register に漏れると検索導線が割れる。08a と同じ root 移動パターンなので、同じ粒度で記録する必要がある。

**5分解決カード**: 旧 root がある場合は `legacy-ordinal-family-register.md` の mapping table と drift register の双方へ追加し、resource-map / task-workflow-active / artifact inventory も current root を指すようそろえる。

**適用条件**: `02-application-implementation/` 配下から `30-workflows/` 直下または `completed-tasks/` へ semantic root を移す場合。

## L-09A-005: skill feedback は報告で止めず promotion target を決める

**苦戦箇所**: `skill-feedback-report.md` に「validator hardening」や「placeholder 境界」を書いても、どの skill reference に昇格したかが残らないと次回再利用できない。09a では task-specification-creator の parity error 化と skill-creator の Phase 12 promotion workflow が両方関係した。

**5分解決カード**: 各 feedback item に `promotion target / no-op reason / evidence path` を付ける。workflow/template 問題は `task-specification-creator/references/*`、skill update process 問題は `skill-creator/references/update-process.md`、domain lesson は本ファイルのような `aiworkflow-requirements/references/lessons-learned-*.md` に反映する。

**適用条件**: Phase 12 で複数 skill にまたがる改善提案が出た場合。

