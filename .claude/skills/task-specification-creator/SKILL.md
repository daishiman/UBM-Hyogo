---
name: task-specification-creator
description: |
  タスクを単一責務原則で分解しPhase 1-13の実行可能な仕様書を生成。Phase 12は中学生レベル概念説明を含む。
  Anchors:
  • Clean Code / 適用: SRP / 目的: タスク分解基準
  • Continuous Delivery / 適用: フェーズゲート / 目的: 品質パイプライン
  • DDD / 適用: ユビキタス言語 / 目的: 用語統一
  Trigger:
  タスク仕様書作成, タスク分解, ワークフロー設計, Phase実行, インテグレーション設計, ワークフローパッケージ, Cloudflare Workers, Web API設計, 外部連携パッケージ, completed-tasks 移動, task path normalization, docs-only spec_created, phase12 compliance ci gate, verify-phase12-compliance, Phase 12 canonical heading SSOT, recovery workflow, recovery-mode, since-filter, evidence-step parity gate, max-2-cycle guard, D'+0 reset, fallback retirement, dual-environment coverage gate, physical deletion 2-stage, lookup contract sync
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# Task Specification Creator

開発タスクを Phase 1〜13 の実行可能な仕様書へ落とし込む。`SKILL.md` は入口だけを持ち、詳細は `references/` と `LOGS.md` に分離する。

## 変更履歴

詳細は [SKILL-changelog.md](SKILL-changelog.md) を参照。最新 3 件のみ列挙する。

| Version | Date | Changes |
| --- | --- | --- |
| v2026.05.17-issue749-primitive-adoption-tracker | 2026-05-17 | Issue #749 primitive adoption tracker review を反映。`apps/` / `scripts/` / workflow 実差分と Phase 11 local evidence がある場合は `implemented_local_evidence_captured` へ再分類する運用、placeholder import ではなく実 JSX / `.trigger()` 実使用を gate 化する運用、moved completed SCOPE を route SSOT として参照する運用、同一サイクルで解消可能な未タスク候補を 0 件へ戻す運用を確認。 |
| v2026.05.16-issue718-closed-canonical-recovery-and-governance-yaml | 2026-05-16 | Issue #718 legacy CF token revocation を契機に、closed GitHub issue で canonical workflow root が欠落していた場合の **後付け生成パターン** を `references/closed-issue-canonical-workflow-recovery.md` として新設。unassigned-task は削除せず `status: consumed` / `canonical_workflow:` pointer を追記し、`Refs #<n>` 限定で後付け root（Phase 1-13）を生成する手順を固定。あわせて不可逆 mutation を含む unassigned-task の YAML フロントマターに `governance_mutation_user_gate` / `mutation_commands` / `read_only_evidence_allowed_pre_gate` / `user_approval_marker` の 4 フィールドを必須化（`references/unassigned-task-required-sections.md` §6）。audit script の fail 種別を `MISSING_GOVERNANCE_CONTRACT` / `CONTRACT_INCONSISTENT` / `MISSING_USER_APPROVAL_MARKER` で 3 値定義。 |
| v2026.05.15-issue655-recovery-window-evidence-parity | 2026-05-15 | Issue #655 D+7 recovery 2nd-cycle review feedback を反映。`references/phase12-skill-feedback-promotion.md` に Recovery Window Evidence Parity Gate を追加し、`since` / D'+0 を metadata だけにせず実 aggregation window に適用すること、recovery mode でも run URL list / aggregate JSON / leakage log / comparison evidence を通常 mode と同粒度で生成すること、local implementation diff がある場合に `spec_created` / `no code changed` と close-out しないことを必須化。 |
| v2026.05.14-issue668-required-check-precheck | 2026-05-14 | Issue #668 RB-3b-03 / RB-3b-04 review feedback を反映。required status check を path 条件で軽量化する場合は、別 workflow `paths-ignore` 補完を既定案にせず、single workflow precheck + no-op required context branch を Phase 11 NON_VISUAL evidence pattern として正本化。 |
| v2026.05.14-issue638-closed-fold-state-sync | 2026-05-14 | Issue #638 review feedback を反映。CLOSED Issue / folded follow-up の Phase 12 では fold 先 issue state と外部 mutation 実行後 state を同一 wave で同期し、source unassigned YAML status を `superseded` / `consumed` へ更新する gate を追加。 |
| v2026.05.15-issue655-recovery-window-evidence-parity | 2026-05-15 | Issue #655 D+7 recovery 2nd-cycle review feedback を反映。`references/phase12-skill-feedback-promotion.md` に Recovery Window Evidence Parity Gate を追加し、`since` / D'+0 を metadata だけにせず実 aggregation window に適用すること、recovery mode でも run URL list / aggregate JSON / leakage log / comparison evidence を通常 mode と同粒度で生成すること、local implementation diff がある場合に `spec_created` / `no code changed` と close-out しないことを必須化。 |
| v2026.05.11-issue616-conditional-implementation-category | 2026-05-11 | Issue #616 Miniflare / undici upstream tracking review feedback を反映。`schemas/artifact-definition.json` の `metadata.implementationCategory` に `conditional` を正式追加し、上流改善検知時のみ code/config 変更が発生する implementation task を `verified_current_no_code_change_pending_pr` で閉じる境界を明確化。 |
| v2026.05.11-issue603-phase12-compliance-ci-gate | 2026-05-11 | Issue #603 を反映。`references/phase12-compliance-check-template.md` の Required Sections 9 項目を CI gate `verify-phase12-compliance` の canonical heading SSOT として固定し、template / script / fixture の同一 PR 同期を必須化。 |
| v2026.05.10-issue590-phase11-canonical-evidence-paths | 2026-05-10 | Issue #590 Phase 11 canonical evidence path feedback を反映。`outputs/phase-11/canonical-paths.json` 用 schema、validator、node:test、`pnpm validate:phase11-paths` を追加し、親 Issue #549 の canonical path 表を machine-readable manifest へ接続。 |
| v2026.05.11-task15-todo-gate-mock-screenshot-state-alias | 2026-05-11 | task-15 admin dashboard and members 実装サイクル feedback を反映。`references/quality-gates.md` §7.3 に **`it.todo` / `test.todo` 残留禁止 (Phase 6 close-out gate)** を追加し a11y todo の実 assertion 昇格と CI `todo-count` step を必須化。`references/workflow-state-vocabulary.md` に State Aliases 節を追加し `implemented-local-runtime-pending` (kebab) と `implemented_local_runtime_pending` (snake) の同一性および遷移条件を明示。`references/phase-11-screenshot-guide.md` に **VISUAL タスクの local mock-screenshot 経路** を追加し、standalone mock を single source of truth とする許容条件 4 件と落とし穴（mock 二重化 / selector drift / provenance 偽装）を規定。 |
| v2026.05.10-stage3-skill-feedback-promotion | 2026-05-10 | e2e-quality-uplift stage-3-impl 3b / 3c の Phase 12 skill-feedback を反映。(1) `schemas/artifact-definition.json` の `phases[].status` / root `status` enum に canonical 3-state（`spec_created` / `runtime_pending`）を追加し、`metadata` に `governance_mutation_user_gate` / `mutation_commands` / `read_only_evidence_allowed_pre_gate` / `user_approval_marker` / `actual_read_only_evidence_files` / `actual_mutation_evidence_files` を追加。(2) `references/workflow-state-vocabulary.md` に canonical short-form alias 表を追加し `PASS` 単独表記禁止を明文化。(3) `references/phase12-compliance-check-template.md` に 3-state verdict vocabulary / evidence ledger split / branch-specific drift check / Server Component E2E compliance を追加。(4) 新規 `references/server-component-e2e-pattern.md`（`page.route()` 禁則 / `INTERNAL_API_BASE_URL` 差し替え / mock API + seed / tracked evidence）と `references/governance-branch-protection-pattern.md`（dev / main 個別 GET / 個別 PUT / branch-specific evidence 分離）を新設。(5) `references/completed-tasks-policy.md` に親アーカイブパス整合性チェック（親 → 子 sub-workflow 同 wave 移動 / aiworkflow register 同期）を追加。(6) `references/resource-map.md` へ 2 新規 reference を登録。 |
| v2026.05.10-task17-existing-ui-inventory-gate | 2026-05-10 | task-17 admin schema/conflicts/audit spec review feedback を反映。UI 実装タスクでは元仕様の `new` 前提をそのまま採用せず、Phase 1 で current worktree の route/component/helper を確認し、実在する場合は `existing-*-hardening` / `existing-*-alignment` に再分類する gate を追加。 |
| v2026.05.10-task16-stale-topology-gate | 2026-05-10 | task-16 admin-tags-meetings-requests review feedback を反映。`references/phase-12-pitfalls.md` に **[UBM-032]** を追加し、Phase 1〜2 で旧 repo topology（`apps/web/src/app` / `/decision` 等）を残したまま生成して Phase 5 で乖離する苦戦パターンを正本化。Phase 1 の `implementation_mode` 判定直前に現行 topology を実測してから仕様本文へ引用する運用と、既存実装確認済み case の `verify_existing` 切替手順を明示。 |
| v2026.05.09-issue325-rename-evidence-state-sync | 2026-05-09 | Issue #325 test suffix rename review feedback を反映。rename-only workflow で実コード差分が同一 cycle に入った場合は `spec_created` / pending 表記を残さず、root artifacts / Phase 11 / Phase 12 / aiworkflow を `implementation_completed` へ同時同期する。`rename-mapping.csv` は header + data rows、raw command logs、glob evidence を Phase 11 に保存する。 |
| v2026.05.09-e2e-tracked-evidence-server-fetch | 2026-05-09 | e2e-quality-uplift-stage-1 review feedback を反映。Playwright / Next Server Component 系 E2E では `page.route()` が server-side `fetch()` を捕捉しないため、Phase 2/4/11 に server fetch 経路へ効く mock API / seed / `INTERNAL_API_BASE_URL` 差し替え証跡を必須化。Phase 11 evidence は `.gitignore` 対象の `*.log` ではなく tracked `.txt` / `.md` を canonical とし、untracked evidence を PASS 根拠にしない。 |
| v2026.05.09-task11-implemented-local-runtime-pending | 2026-05-09 | task-11 public top/member list review feedback を反映。`apps/` / `packages/` dirty diff がある `spec_created` PASS を禁止し、ローカル実装済み・runtime evidence 未取得の状態語彙 `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を Phase 12 再分類表に追加。 |
| v2026.05.09-phase12-strict-gates-from-stage3-impl | 2026-05-09 | e2e-quality-uplift stage-3-impl 3a/3b/3c の Phase 12 課題を反映。(1) `phase12-checklist-definition.md` に Phase 12 必須 7 outputs path existence pre-check（`main / implementation-guide / phase12-task-spec-compliance-check / system-spec-update-summary / skill-feedback-report / unassigned-task-detection / documentation-changelog`）を spec_verified gate として追加、欠落 1 件で FAIL 固定。(2) `phase-12-spec.md` に Phase ステータス語彙 3 値定義（`spec_created` / `runtime_pending` / `completed`）を追加し runtime CI 実行前の `completed` 付与を禁止、`PASS` 単独表記禁止。(3) `non-visual-irreversible-task-rules.md` §0 に Governance mutation user 明示承認 gate を新設し `gh api -X PUT` / `wrangler deploy` / `d1 migrations apply` / `gh secret set` 等の不可逆 mutation を user 承認 evidence なしに AI 実行禁止、read-only evidence 取得と draft 生成のみ承認前 AI 実行可。 |
| v2026.05.08-issue553-live-wiring-patterns | 2026-05-08 | Issue #553 (live audit-correlation endpoint) の実装結果を反映。`references/patterns-live-wiring.md` を新設し、(1) Cloudflare Worker `scheduled` event の retry-after 制約（同期 sleep 不可、次 cron cycle 委譲）、(2) redact-safe 4 layer grep gate（route / persist / notify / log）の Phase 2/4/12 必須化、(3) test fixture placeholder と CI grep gate の path filter 整合、(4) `correlationKey = (fingerprintHash, fingerprintVersion)` による salt rotation 期間中の incident 履歴分離、(5) Cloudflare Secrets 投入は `scripts/cf.sh secret put` + op 参照経由のみ（`wrangler secret put` 直接禁則）、(6) Phase 1〜13 の足し算チェックリストを canonical 化。 |
| v2026.05.08-test-executability-dod | 2026-05-08 | UI E2E failure recovery workflow の skill feedback を反映。`references/quality-gates.md` に **§7. テスト常時実行可能性 DoD** を新設。実装仕様書側で「対象 spec の列挙 / 1 行実行コマンド / 実行前提と自動化スクリプト / un-skip 不変条件」の 4 点と、infra 側で「browser binary 自動 install / dev server 自動起動 / CI gate 化」の 3 点を必須化。`test.describe.skip` を先送り目的で使う運用を CONST_007 と同列の禁止事項とし、Phase 11 evidence canonical path に `e2e-run.log` / `e2e-skip-count.txt` / `runner-version.txt` を追加。さらに **§7.5 E2E lines coverage ≥ 80%** をリポジトリ閾値・タスク閾値として導入し、`monocart-reporter` / `c8` 経由の `coverage/e2e/coverage-summary.json` を CI で enforce。Phase 12 close-out で計 8 点 checklist を `phase12-task-spec-compliance-check.md` に強制反映。 |
| v2026.05.08-task04-eslint-gate-command-sync | 2026-05-08 | task-04 window guard / logger review feedback を反映。Phase 12 command drift gate に lint / ESLint gate の実接続確認を追加。ESLint config 配置だけ、または `lint` が `tsc` のみの状態を AC PASS にしない。 |
| v2026.05.08-issue546-long-running-gha-observation | 2026-05-08 | Issue #546 CF audit-log 90 day baseline observation の Phase 12 feedback を反映。長期 GitHub Actions 観測では `gh api --paginate` + JSON array evidence を正本とし、JSON Lines `.json`、readiness 不足のゼロ件 PASS、baseline/helper 欠測の黙殺を禁止するルールを Phase 11 NON_VISUAL evidence guide に追加。 |
| v2026.05.08-issue532-command-contract-drift-phase2 | 2026-05-08 | Issue #532 write/tag/note provider ctx injection の Phase 12 skill feedback を反映。Phase 2 validation matrix 作成前に対象 workspace の `package.json` / test runner config を確認し、実在 package name / scripts のみを command gate に書くルールを `references/phase-template-core.md` へ追加。`@repo/api` / `test:run` / `test:typecheck` の stale command drift を Phase 11/12 で補正した実例を `references/phase12-skill-feedback-promotion.md` に登録。 |
| v2026.05.07-task19-phase12-validator-promotion | 2026-05-07 | task-19 09c primitives full spec の Phase 12 review 続編を反映。`references/phase-12-documentation-guide.md` に (1) placeholder token grep 0 件 gate（禁止語リスト + コマンド逐語 + exit code 記録）、(2) §99 必須項目 content check（見出し存在ではなく本文 keyword 出現を `rg -n` で確認）、(3) docs-only 隣接コード差分検出（Phase 12 entry checklist 必須、`git status apps/ packages/` 出力転記）、(4) deterministic verify script の Phase 1-4 前倒し配置運用、(5) `documentation-changelog.md` 必須エントリ最小セット拡張（specs 個別 path / validator 実行記録セクション = コマンド + exit code + 件数 3 値必須）を追加。 |
| v2026.05.07-task19-placeholder-dirty-code-gates | 2026-05-07 | task-19 09c primitives full spec review feedback を反映。docs-only / NON_VISUAL close-out でも `apps/` / `packages/` dirty diff があれば分類・分離記録なしに PASS しない dirty-code gate、`token-sized` / `09b-token-value` / `token-mix` など placeholder token 0 件 gate、§99 content gate を Phase 12 compliance に追加。 |
| v2026.05.07-task-06-ui-ux-contract-rewrite-classification | 2026-05-07 | task-06 UI/UX contract rewrite review feedback を反映。docs markdown のみでも正本仕様ファイルを全面 rewrite して後続実装 contract を unblock する場合は `implementation / NON_VISUAL` とし、`artifacts.json` / Phase 11 表現 / diff scope を一致させる。主成果物 M が宣言されている場合は同サイクルで実ファイルを更新し、無関係 D diff は active 正本参照を壊すため復元または formal trace を必須にする。 |
| v2026.05.06-issue371-implemented-local-state-vocab | 2026-05-06 | Issue #371 UT-02A follow-up 003 Hono ctx DI migration の Phase 12 skill-feedback を反映。`spec_created` task に `apps/` / `packages/` の code wave が入った場合は同サイクル内で `implemented-local` へ再分類する手順を `references/phase-12-documentation-guide.md` に明文化。`CONTRACT_READY_IMPLEMENTATION_PENDING`（pre-code・docs/.claude のみ）と `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（local PASS 5 点取得済 + runtime pending）の使い分けマトリクスを追加。`references/phase-11-guide.md` に状態語彙対応表と Phase 11 evidence canonical path 規約 `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` を local PASS 5 点セットとして固定。 |
| v2026.05.06-workflow-path-existence-gate | 2026-05-06 | U-FIX-CF-ACCT-01-DERIV-02 token split review feedback を反映。CI/CD workflow 変更タスクでは Phase 2 / 5 / 9 / 12 で `.github/workflows/*.yml` の実在確認を必須化し、存在しない `deploy-staging.yml` / `deploy-production.yml` 等を正本として参照したまま PASS しない workflow path existence gate を追加。 |
| v2026.05.05-task-05a-form-preview-503-bugfix-runbook-integrity | 2026-05-05 | task-05a-form-preview-503-001 の Phase 12 skill-feedback を反映。`references/phase12-skill-feedback-promotion.md` Applied Examples に bugfix / NON_VISUAL タスクの routing decision を 1 行追加。runbook 内 seed file 参照と `schema_versions.state` inline SQL の整合性を同 wave で実ドキュメント側に補正し、テンプレ差分は no-op routing。`logWarn({ code: "UBM-5500", context })` 構造化ログ追加と TC-RED-03 ルート 503 contract test 配置、runtime curl evidence を `PENDING_RUNTIME_EVIDENCE` で Phase 11 close-out する流れを併記。 |
| v2026.05.05-issue379-stale-current-no-code | 2026-05-05 | Issue #379 schemaDiffQueue fakeD1 compat verification の skill feedback を反映。`implementation / NON_VISUAL` でも Phase 1 current baseline で報告 fail が再現せず GREEN の場合は `verified_current_no_code_change` (`implementation_mode=stale-current-verification`) として close-out できる Stale-current no-code verification rule を `references/phase12-skill-feedback-promotion.md` / `references/task-type-decision.md` に追加。元 unassigned task は consumed trace に書き換え、推測実装（fakeD1 parser 拡張 / seed edit / SQL rewrite）を撤回する。 |
| v2026.05.05-09a-A-staging-deploy-smoke-execution | 2026-05-05 | 09a-A staging deploy smoke execution 仕様書策定 feedback を反映。`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態語彙（spec contract 完了 + runtime pending、`PASS` 単独表記禁止）を `phase-template-phase11.md` に追加。`phase-11-non-visual-alternative-evidence.md` に **D1 schema parity verification evidence** セクション（staging vs production の `migrations list` / `PRAGMA table_info` 比較、applied/pending 数値、差分時の `task-d1-prod-parity-followup-NNN.md` 自動発行）を追加。`phase-template-phase13.md` に **G1-G4 multi-stage approval gate**（runtime deploy / Forms sync / D1 apply / commit-push-PR を独立承認、合算承認禁止）を追加。 |
| v2026.05.05-issue377-retry-tick-default-path | 2026-05-05 | Issue #377 retry tick + DLQ audit review feedback を反映。scheduled / queue retry workflow では injected failure callback だけでなく default scheduled path を focused test で証明し、retry/backoff/DLQ SQL は repository primitive に寄せる。 |
| v2026.05.05-issue347-external-saas-decision-evidence | 2026-05-05 | Issue #347 Cloudflare Analytics export decision feedback を反映。外部 SaaS / Cloudflare dashboard 認証が必要な docs-only decision workflow では representative schema sample、runtime production sample、constraints file を分離し、user auth 不在の runtime sample を PASS 化しない。 |
| v2026.05.05-06b-pending-banner-skill-audit | 2026-05-05 | 06b-B pending banner sticky の skill 反映監査を補強。`unassigned-task-required-sections.md` を SKILL.md References と `agents/generate-unassigned-task.md` リソース表に明示し導線化。`phase-12-documentation-guide.md` Task 12-3 へ「`.claude/skills/<skill>/LOGS.md` 更新行を canonical absolute path で必ず列挙する（SKILL.md だけ列挙して LOGS.md 省略は FAIL）」と必須エントリ最小セット表（skill 正本 / skill 履歴 / reference / workflow artifacts / outputs / system spec）を追加。 |
| v2026.05.04-08b-a-runtime-contract-code-alignment | 2026-05-04 | 08b-A Playwright full execution review feedback を反映。VISUAL_ON_EXECUTION の docs formalization でも、実行時コードの report / screenshot 出力先が Phase 11 evidence manifest と不一致なら実コード設定を同一 wave で補正する。Phase 11 は `completed` と runtime PASS を混同せず `contract_ready_runtime_pending` 等の境界語彙で記録し、30+ screenshot / admin UI gate / direct API 403 / foreign content edit 403 / secret hygiene / zero skip inventory を fresh evidence 条件にする。 |
| v2026.05.04-ut07b-fu04-already-applied-verification | 2026-05-04 | UT-07B-FU-04 review feedback を反映。production D1 ledger 既適用時は apply execution を already-applied verification へ再分類し、`d1 migrations apply` を forbidden path、`apply.log` を no-op prohibition evidence とする。post-check は target migration owned objects のみに限定し、placeholder evidence と fresh runtime evidence を Phase 12 で分離する。 |
| v2026.05.04-ut-09a-cloudflare-cli-non-visual | 2026-05-04 | UT-09A Cloudflare auth token injection recovery feedback を反映。Cloudflare CLI / shell wrapper 系 NON_VISUAL Phase 11 は `phase-11-cloudflare-cli-non-visual-evidence.md` を使い、`main.md` PASS 後に helper artifacts / artifacts ledgers / Phase 12 compliance / aiworkflow index を同一 wave で runtime state に同期する。`whoami` exit 0 と deploy scope PASS を混同しない。 |

## 設計原則

| 原則                      | 説明                                                        |
| ------------------------- | ----------------------------------------------------------- |
| Script First              | 決定論的処理は `scripts/` で固定する                        |
| LLM for Judgment          | 判断、設計、レビューだけを LLM が担う                       |
| Progressive Disclosure    | 必要な reference だけを段階的に読む                         |
| 1 File = 1 Responsibility | 大きくなった guide は family file へ分離する                |
| `.claude` Canonical       | 正本は `.claude/skills/...`、`.agents/skills/...` は mirror |

## 要件レビュー思考法（要約）

要件・設計レビューでは、システム系 / 戦略・価値系 / 問題解決系の 3 系統を必ず通し、真の論点 / 因果と境界 / 価値とコスト / 改善優先順位 / 4 条件評価を明示してから Phase 1 へ進む。詳細手順は [references/requirements-review.md](references/requirements-review.md) を参照。

## タスクタイプ判定（要約）

タスク作成前に **taskType**（implementation / docs-only）と **visualEvidence**（VISUAL / NON_VISUAL）を確定し、Phase 1 〜 artifacts.json 生成まで一貫して使う。判定フローと各分岐の運用ルールは [references/task-type-decision.md](references/task-type-decision.md) を参照。

---

## クイックスタート

| モード              | 用途                               | 最初に読むもの                                                                           |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `create`            | 新規 workflow を作る               | [references/create-workflow.md](references/create-workflow.md)                           |
| `execute`           | Phase 1〜13 を順番に実行する       | [references/execute-workflow.md](references/execute-workflow.md)                         |
| `update`            | 既存仕様書を修正する               | [references/phase-templates.md](references/phase-templates.md)                           |
| `detect-unassigned` | Phase 12 の残課題を formalize する | [references/phase-12-documentation-guide.md](references/phase-12-documentation-guide.md) |

```bash
node scripts/detect-mode.js --request "{{USER_REQUEST}}"
```

## 実行フロー（要約）

`create` フローは `agents/decompose-task.md` → `agents/identify-scope.md` → `agents/design-phases.md` → `agents/generate-task-specs.md` → `agents/output-phase-files.md` → `agents/update-dependencies.md` → `agents/verify-specs.md` の順で gate を通す。`execute` フローは Phase 1（要件定義）〜 Phase 13（PR 作成）の 13 段階を順次実行する。各 Phase の目的と Feedback 注釈、Task 仕様ナビ表は [references/phase-templates.md](references/phase-templates.md) を参照。

## Phase 12 重要仕様（要約）

Phase 12 は次の **6 必須タスク** を実行し、最低 7 ファイルを実体確認する（Task 6 は実態として全タスクが生成しているため 6 番目に昇格）:

1. 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）
2. システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）
3. ドキュメント更新履歴作成
4. 未タスク検出レポート作成（**0 件でも出力必須**。coverage 型タスクは coverage layer 表 `file/before%/after%/delta%` で代替可能）
5. スキルフィードバックレポート作成（**改善点なしでも出力必須**。章立ては「テンプレ改善 / ワークフロー改善 / ドキュメント改善」の 3 観点固定）
6. タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

詳細仕様（Part 1/2 セルフチェック・Step 1-A〜1-D ルール・`spec_created` close-out・docs-only → code 再判定）は [references/phase-12-spec.md](references/phase-12-spec.md)。`spec_created` / docs-only / NON_VISUAL は root workflow state を据え置き、Phase status と 7 ファイル実体・current/baseline 監査値で検証する。よくある漏れ（UBM-009〜017 含む）と苦戦防止 Tips は [references/phase-12-pitfalls.md](references/phase-12-pitfalls.md)。

## 重要ルール（要約）

- **Phase 完了時の必須アクション**: タスク完全実行 / 成果物確認 / `complete-phase.js` で artifacts.json 更新 / 完了条件チェック明記
- **PR 作成は自動実行しない**: 必ずユーザーの明示的な許可を得てから実行する
- **Phase 12 と Phase 13 の境界**: Task 12-1〜12-5 の完了条件と Phase 13（commit/PR）の承認ゲート

詳細と検証コマンド一覧は [references/quality-gates.md](references/quality-gates.md) を参照。

## agent 導線

- [agents/decompose-task.md](agents/decompose-task.md)
- [agents/identify-scope.md](agents/identify-scope.md)
- [agents/design-phases.md](agents/design-phases.md)
- [agents/generate-task-specs.md](agents/generate-task-specs.md)
- [agents/output-phase-files.md](agents/output-phase-files.md)
- [agents/update-dependencies.md](agents/update-dependencies.md)
- [agents/verify-specs.md](agents/verify-specs.md)
- [agents/update-system-specs.md](agents/update-system-specs.md)
- [agents/generate-unassigned-task.md](agents/generate-unassigned-task.md)

## References

| topic | path |
| --- | --- |
| 要件レビュー思考法 | [references/requirements-review.md](references/requirements-review.md) |
| タスクタイプ判定フロー | [references/task-type-decision.md](references/task-type-decision.md) |
| Phase テンプレ詳細（Phase 1〜13 / Task ナビ） | [references/phase-templates.md](references/phase-templates.md) |
| Phase 12 重要仕様（5 タスク詳細） | [references/phase-12-spec.md](references/phase-12-spec.md) |
| Phase 12 skill feedback promotion | [references/phase12-skill-feedback-promotion.md](references/phase12-skill-feedback-promotion.md) |
| workflow_state 語彙 / 状態 → 必要証跡マッピング / reclassify ルール / 禁止表記 | [references/workflow-state-vocabulary.md](references/workflow-state-vocabulary.md) |
| Phase 12 compliance-check テンプレ（観点 / 検証コマンド / drift パターン例） | [references/phase12-compliance-check-template.md](references/phase12-compliance-check-template.md) |
| Phase 12 よくある漏れ / 苦戦防止 Tips | [references/phase-12-pitfalls.md](references/phase-12-pitfalls.md) |
| Phase 12 sync パターン（aiworkflow-requirements 同時更新 / workflow root 移動チェックリスト） | [references/patterns-phase12-sync.md](references/patterns-phase12-sync.md) |
| 未タスクテンプレ必須 4 セクション（苦戦箇所 / リスクと対策 / 検証方法 / スコープ）+ §6 governance YAML フロントマター契約 | [references/unassigned-task-required-sections.md](references/unassigned-task-required-sections.md) |
| CLOSED Issue で canonical workflow root が欠落していた場合の後付け生成 / unassigned-task consumed 化 / governance YAML 契約 | [references/closed-issue-canonical-workflow-recovery.md](references/closed-issue-canonical-workflow-recovery.md) |
| 品質ゲート / Phase 境界 / 検証コマンド導線（commands.md とハブ関係） | [references/quality-gates.md](references/quality-gates.md) |
| オーケストレーション / リソース導線 / ベストプラクティス | [references/orchestration.md](references/orchestration.md) |
| NON_VISUAL governance パターン（Phase 8 単一正本 YAML / check-runs 並走 / Phase 13 二重承認） | [lessons-learned/non-visual-governance-pattern.md](lessons-learned/non-visual-governance-pattern.md) |
| NON_VISUAL 不可逆操作タスク（3-gate 分離 / migration literal / SSOT リテラル禁則 / runtime spec_created 起票） | [references/non-visual-irreversible-task-rules.md](references/non-visual-irreversible-task-rules.md) |
| Live wiring タスク運用パターン（Cloudflare scheduled retry-after 制約 / redact-safe 4 layer grep gate / fingerprintVersion による salt rotation 分離 / Cloudflare Secrets op 参照 / Phase ごと足し算チェックリスト） | [references/patterns-live-wiring.md](references/patterns-live-wiring.md) |
| Completed Tasks Path Normalization（Phase 13 完了後の `completed-tasks/<category>/` 移動 / `Refs #XXX` 連結 / metadata 据え置き） | [references/completed-tasks-policy.md](references/completed-tasks-policy.md) |

## 最小 workflow

```
decompose-task → identify-scope → design-phases → generate-task-specs
   → output-phase-files → update-dependencies → verify-specs
   → (Phase 1〜13 を execute) → update-system-specs (Phase 12)
   → generate-unassigned-task (条件分岐)
```

詳細な履歴と usage log は [LOGS.md](LOGS.md)、[SKILL-changelog.md](SKILL-changelog.md)、[references/logs-archive-index.md](references/logs-archive-index.md) を参照。

## タスクタイプ判定フロー（docs-only / NON_VISUAL）

Phase 1 で `artifacts.json.metadata.visualEvidence` を必ず確定する。未設定で Phase 11 縮約テンプレが
発火しない事故を防ぐため、Phase 1 完了条件として必須化する（[references/phase-template-phase1.md](references/phase-template-phase1.md) §「Phase 1 必須入力: artifacts.json.metadata.visualEvidence」）。

### 発火マトリクス

| 入力（artifacts.json.metadata） | 適用テンプレ |
| --- | --- |
| `taskType: docs-only` かつ `visualEvidence: NON_VISUAL` | [references/phase-template-phase11.md](references/phase-template-phase11.md) §「docs-only / NON_VISUAL 縮約テンプレ」+ Phase 12 docs-only 判定ブランチ |
| `taskType: docs-only` かつ `visualEvidence: VISUAL` | UI task 追加要件（screenshot 必須） |
| `taskType: implementation` 等 | 通常テンプレ |

### 状態分離（spec_created vs completed）

| レイヤ | フィールド | 値の意味 |
| --- | --- | --- |
| workflow root | `metadata.workflow_state` または `index.md` メタ「状態」 | `spec_created` = 仕様書作成済 / 実装着手前。Phase 12 close-out で書き換えない |
| Phase 別 | `phases[].status` | `completed` / `pending` / `blocked` |

Phase 12 close-out で workflow root を `completed` に書き換えるのは実装完了タスクのみ。
docs-only / `spec_created` タスクは workflow root を据え置き、`phases[].status` のみ更新する。

### 第一適用例（drink-your-own-champagne）

`docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/` 自身が本フローの第一適用例。
e-skill-sync/` 自身が本フローの第一適用例。
