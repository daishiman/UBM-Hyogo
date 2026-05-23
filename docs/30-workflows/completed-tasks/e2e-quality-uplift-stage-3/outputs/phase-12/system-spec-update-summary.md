# System Spec Update Summary — Stage 3 (Issue #608)

本 Phase 12 の責務は、Stage 3 のローカル実装（branch protection contexts 拡張 + lighthouse readiness 安定化）を `.claude/skills/aiworkflow-requirements/` 配下の正本仕様に直列で反映することである。Phase 2 で別エージェントが本ファイルに従って実編集を行う。

## 同期スコープ（直列編集対象）

| 同期対象 | パス | 編集タイプ |
| --- | --- | --- |
| indexes / quick-reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Stage 3 セクション更新（実装ステートとカードキー値の最新化） |
| indexes / resource-map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 既存 Stage 0-3 行の status 更新 |
| indexes / topic-map | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | branch-protection / lighthouse-ci / e2e-tests-coverage-gate キーワードに本 stage を関連付け |
| references / artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md` | Stage 3 status / Current Facts / Phase 11 Evidence 行を更新（既編集済み・最終確認のみ） |
| references / task-workflow-active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Stage 3 実装完了行と evidence boundary を最新化（既編集済み・最終確認のみ） |
| references / branch-protection | `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | 「desired-state manifest vs operational fresh GET」原則と `apply.sh` invariant 正規化規則を追記 |
| references / quality-e2e-testing | `.claude/skills/aiworkflow-requirements/references/quality-e2e-testing.md` | `lighthouse-ci` の `wait-on` readiness pattern を追記 |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` | L-E2EQU-S3A-001..003 を追記（後述） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260512-e2e-quality-uplift-stage-3-issue-608.md` | 新規 changelog エントリ |
| LOGS | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | ヘッドラインに 1 行追加 |

## quick-reference.md への追記内容（案）

```markdown
### E2E Quality Uplift Stage 3 — branch protection contexts apply（Issue #608 / 2026-05-12）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/e2e-quality-uplift-stage-3/` |
| 状態 | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| desired contexts manifest | `.github/branch-protection/{dev,main}.json`（`ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`） |
| governance apply script | `.github/branch-protection/apply.sh`（fresh GET → contexts 差し替え → CLAUDE.md 不変条件正規化 → optional fields 保持） |
| drift verification | `scripts/verify-branch-protection.sh`（contexts / strict / reviews / force_push / deletions / enforce_admins / linear_history / lock / conversation_resolution / environment branch policies） |
| lighthouse readiness | `.github/workflows/lighthouse.yml`（`nohup` 起動 + `pnpm dlx wait-on -t 120000 http-get://localhost:3000`、`pull_request.branches=[dev,main]` + `workflow_dispatch`） |
| evidence boundary | Phase 11 に branch-protection-{dev,main}-{pre,post}.json + apply/verify stdout を取得済み。PR `gh pr checks` required 表示と Lighthouse workflow run は user-gated |
| operational SSOT | GitHub branch protection fresh GET（`gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection`）。repo 側 JSON は desired-state manifest 扱い |
| INV 正規化 | INV-SOLO (`required_pull_request_reviews=null`) / INV-ENF (`enforce_admins=true`) / INV-LINEAR (`required_linear_history=true`) / INV-LOCK (`lock_branch=false`) |
| 関連 lessons | `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` L-E2EQU-S3A-001..003 |
```

既存 `### E2E Stage 3 Branch Protection Contexts（3c / ...）` セクションは「3c の spec 段階」を記録した過去状態。本 Stage 3 (umbrella) の完了は別の見出しで残す。3c カードの `state` 値を `applied_runtime_pending` に書き換える単独編集も Phase 2 範囲に含めて差し支えない。

## resource-map.md への追記内容（案）

既存行を以下に置換:

```markdown
| E2E quality uplift Stage 3 branch protection contexts（implemented_local_runtime_pending / implementation / NON_VISUAL / 2026-05-12） | `docs/30-workflows/e2e-quality-uplift-stage-3/index.md`, `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/main.md`, `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-12/phase12-task-spec-compliance-check.md`, `.claude/skills/aiworkflow-requirements/references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md` | `.github/branch-protection/{dev,main}.json`, `.github/branch-protection/apply.sh`, `scripts/verify-branch-protection.sh`, `.github/workflows/lighthouse.yml`, `.claude/skills/aiworkflow-requirements/references/branch-protection.md`, `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` |
```

## topic-map.md への追記キーワード

`branch-protection desired manifest`, `apply.sh fresh GET`, `INV-SOLO / INV-ENF / INV-LINEAR / INV-LOCK`, `lighthouse wait-on readiness`, `e2e-tests-coverage-gate aggregate required context`, `verify-branch-protection.sh` をそれぞれ Stage 3 の参照先 (`workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md` / `branch-protection.md`) に紐付ける。`pnpm indexes:rebuild` で `keywords.json` を再生成する。

## branch-protection.md への追記内容（案）

新規セクションを追加:

```markdown
## desired-state manifest と operational SSOT の境界（2026-05-12 / Issue #608）

GitHub branch protection の **operational source of truth は GitHub API 実値**（fresh GET）。
`.github/branch-protection/{dev,main}.json` は `required_status_checks.contexts` と `strict` の **desired-state manifest** であって PUT body 全体ではない。

`.github/branch-protection/apply.sh` の責務:

1. `gh api GET` で fresh state を取得
2. `required_status_checks.contexts` を `<branch>.json` で差し替え、`strict` も desired 値で置換
3. CLAUDE.md 不変条件を明示正規化:
   - INV-SOLO: `required_pull_request_reviews = null`
   - INV-ENF: `enforce_admins = true`
   - INV-LINEAR: `required_linear_history = true`
   - INV-LOCK: `lock_branch = false`
4. `allow_force_pushes` / `allow_deletions` / `required_conversation_resolution` / `allow_fork_syncing` などの optional fields は fresh GET 値を保持（`// false` / `// true` で safe default）
5. `gh api -X PUT` でアトミック適用

drift 検査は `scripts/verify-branch-protection.sh`。出力末行 `OK(<branch>): no drift` を契約とし、PASS / INFO 行は監査用補助情報。
```

## quality-e2e-testing.md への追記

```markdown
### lighthouse-ci の readiness pattern

production server 起動を待つ step は手作りの retry loop ではなく `wait-on` を使用する:

\`\`\`yaml
- name: Start server (background)
  run: |
    nohup pnpm --filter @ubm-hyogo/web start > /tmp/web-server.log 2>&1 &
    echo $! > /tmp/web-server.pid
- name: Wait for server (wait-on)
  run: pnpm dlx wait-on -t 120000 http-get://localhost:3000
\`\`\`

理由: 手作り loop は早期成功時の二重起動・遅延時の SIGTERM 漏れ・ログ未収集が発生しやすい。`wait-on` は exit code と timeout を明示し、`nohup` + PID 保存で post-step cleanup を可能にする。
```

## lessons-learned 追記（新セクション L-E2EQU-S3A-001..003）

`lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` 末尾に追記:

- **L-E2EQU-S3A-001 desired-state manifest と operational SSOT の二層**: branch protection は GitHub 側が正本。repo 内 JSON を full-PUT-body 正本にすると Issue 範囲外の field を巻き込みかねず、rollback 境界が崩れる。`apply.sh` は fresh GET と desired manifest の合成で「変更したい field のみ正規化」する。
- **L-E2EQU-S3A-002 PR 範囲外の governance drift をどう扱うか**: pre snapshot で `enforce_admins=false` / `required_linear_history=false` を検知。`required_status_checks.contexts` 拡張と無関係だが CLAUDE.md 宣言済み不変条件であるため Phase 3 R-2 で「同時正規化」を選択。Issue 単独範囲を超える drift は CLAUDE.md 不変条件カバー範囲に限定し、それ以外の field は fresh GET 値保持で **rollback と監査の境界を明確化**する。
- **L-E2EQU-S3A-003 集約 required context の選択基準**: matrix shard 個別 (`e2e (desktop-chromium)` 等) を required 化すると required context 数だけ運用面が増える。`e2e-tests-coverage-gate` のように **「全 shard 成功 + coverage gate」をまとめる集約 job** を required 化することで、契約面を最小化しつつ覆う範囲は据え置きにできる。

## changelog 新規ファイル

`.claude/skills/aiworkflow-requirements/changelog/20260512-e2e-quality-uplift-stage-3-issue-608.md`:

```markdown
# E2E Quality Uplift Stage 3 — Issue #608 branch protection contexts apply sync

Date: 2026-05-12

Synced `docs/30-workflows/e2e-quality-uplift-stage-3/` as `implemented_local_runtime_pending / implementation / NON_VISUAL`.

Changes:
- Added desired-state manifests `.github/branch-protection/{dev,main}.json` with contexts `ci / Validate Build / coverage-gate / lighthouse-ci / e2e-tests-coverage-gate`.
- Added governance-invariant idempotent apply script `.github/branch-protection/apply.sh` (fresh GET → contexts swap → CLAUDE.md invariant normalize → optional preserve).
- Added drift verifier `scripts/verify-branch-protection.sh`.
- Stabilized `.github/workflows/lighthouse.yml` server readiness with `nohup` + `wait-on`, enabled `main` PR trigger.
- Captured Phase 11 apply/verify evidence.

User-gated remaining work: PR creation, `gh pr checks` required-context display capture, Lighthouse workflow runtime evidence.
```

## LOGS ヘッドライン追記

`LOGS/_legacy.md` のヘッドラインテーブル先頭に 1 行追加:

```markdown
| 2026-05-12 - Issue #608 E2E quality uplift Stage 3 branch protection contexts apply sync（`docs/30-workflows/e2e-quality-uplift-stage-3/` を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期。`.github/branch-protection/{dev,main}.json` desired manifest、`apply.sh` の CLAUDE.md 不変条件正規化、`scripts/verify-branch-protection.sh`、`.github/workflows/lighthouse.yml` wait-on readiness と main PR trigger を実装。Phase 11 evidence は apply/verify stdout + pre/post snapshot を captured。lessons L-E2EQU-S3A-001..003 と branch-protection.md / quality-e2e-testing.md 追記を同一 wave で反映。PR creation / `gh pr checks` required 表示 / Lighthouse runtime evidence / commit / push / PR は user-gated） |
```

## 非編集（参照のみ）

- `references/gate-metadata.md`: 本 stage の `e2e-tests-coverage-gate` は GitHub Actions の job name 由来であり、`metadata.gates[]` schema 対象外。互換情報のため artifact inventory 側にのみ言及。
- `references/architecture-monorepo.md`: 構成変更なし。

## 適用順序（Phase 2 直列編集）

1. `branch-protection.md` 追記（SSOT 文書）
2. `quality-e2e-testing.md` 追記
3. `workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md` の最終確認
4. lessons-learned 追記
5. quick-reference.md / resource-map.md / task-workflow-active.md 更新
6. changelog 新規作成
7. LOGS/_legacy.md 追記
8. `pnpm indexes:rebuild` で `keywords.json` / `topic-map.md` 再生成し drift を吸収

## classification

| Item | Value |
| --- | --- |
| classification | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `implemented_local_runtime_pending` |
| semantic filename | `system-spec-update-summary.md`（Phase 12 strict 7 規約） |

500 行制約遵守済。
