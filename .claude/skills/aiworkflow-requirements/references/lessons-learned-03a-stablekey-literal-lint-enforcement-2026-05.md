# lessons-learned: 03a stableKey Literal Lint Enforcement 苦戦箇所（2026-05-01）

> 対象タスク: `docs/30-workflows/03a-stablekey-literal-lint-enforcement/`
> 状態: `enforced_dry_run` / warning mode / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` / `scripts/lint-stablekey-literal.{mjs,test.ts}` / `package.json`
> 関連: 03a AC-7（stableKey literal 直書き禁止）

03a AC-7 を「お願い」から「自動見回り」へ昇格させた wave。ESLint 基盤未導入の monorepo で warning-mode dry-run までを安全に到達させたため、次回の lint enforcement / static-check 系タスクで同じ判断を短時間で再現できるよう、苦戦箇所を promotion target 付きで固定する。

## L-03A-LINT-001: ESLint 未導入 monorepo では standalone Node script に倒す

**苦戦箇所**: 当初 Phase 3 では「ESLint custom rule」を第一候補として比較したが、本リポは ESLint 基盤を持たないため、ルール実装より基盤導入コストが上回る。ts-morph / runtime guard まで含めて 3 案比較したうえで、既存 `scripts/lint-boundaries.mjs` パターンに合わせた軽量 Node script を採択した。ESLint 基盤導入後の loss-less 昇格は維持できる構造にしてある。

**5分解決カード**: 新規 lint rule を提案する前に、まず `ls scripts/lint-*.mjs` で既存 standalone lint の有無を確認する。`lint-boundaries.mjs` のような既成パターンが 1 本でもあれば、新ルールはそのパターン拡張として実装し、`package.json` の `lint` chain に直接組み込む。allow-list / exception glob / `--strict` / `--json` の 4 つを引数 contract として最初に固定し、ESLint 移植時はこれらを 1:1 で rule options に写像する。

**promoted-to**: `task-specification-creator/references/spec-template-implementation-evaluation.md`, `references/architecture-monorepo.md`

## L-03A-LINT-002: warning と error は同一実装で mode flag 分離する

**苦戦箇所**: 「baseline 違反 147 件」を残したまま CI を通すには、warning / error を別 script にしない設計が必須。同一 entrypoint に `--strict` flag を持たせ、warning モードは exit 0、strict モードは違反検出時 exit 1 と分離した。これにより `pnpm lint` chain は CI を block せず、`lint:stablekey:strict` だけが fail 動作確認用となる。

**5分解決カード**: enforcement 系 lint は最初から **mode = "warning" | "error"** の 2 値で設計し、default は warning、`--strict` で error に昇格させる。`package.json` には `lint:<rule>` と `lint:<rule>:strict` の両方を露出させ、CI 切替は `lint` chain への参照差し替えだけで済むようにする。「strict mode default 化」は別 task（`task-03a-stablekey-strict-ci-gate-001.md`）に分離して、cleanup 完了まで待たせる。

**promoted-to**: `references/deployment-details.md`, `task-specification-creator/references/spec-template-quality-gates.md`

## L-03A-LINT-003: allow-list の正本は source-of-truth module パスで固定する

**苦戦箇所**: stableKey literal の唯一の正当書き場所は `packages/shared/src/zod/field.ts`（schema SSOT）と `packages/integrations/google/src/forms/mapper.ts`（Google Form mapping）の 2 箇所のみ。allow-list を「ファイル名」や「ディレクトリ glob」で書くと、後段で similar-named module が増えたときに silent drift する。

**5分解決カード**: allow-list は **ファイルパス完全一致**で 2 件に限定し、`StableKeyLintConfig` の `allowList: string[]` として TypeScript 型で固定する。allow-list file が存在しなければ fail-fast し、設定 drift として扱う（=リネーム検知も兼ねる）。新たな module を allow-list に追加する変更は、必ず invariant #1（schema を fixed しすぎない）の整合性レビューを通す。

**promoted-to**: `references/architecture-monorepo.md`, `references/spec-guidelines.md`

## L-03A-LINT-004: docs / fixtures / tests は exception glob、inline suppression は 0 維持

**苦戦箇所**: `__fixtures__/` の violation サンプルや `*.test.ts` の literal は仕様上必須なので除外せざるを得ないが、inline suppression（`// lint-disable`）を許すと、apps/api 配下の legacy literal がそこに退避されてしまい lint が骨抜きになる。

**5分解決カード**: 例外は **glob レベル** で `["**/*.test.ts", "**/__fixtures__/**", "docs/**"]` に限定し、inline suppression baseline は **0 件** を不変条件として維持する。Phase 11 evidence で `rg "lint-disable.*stablekey"` の 0 件を毎回確認する。fixture は `violation.ts` / `allowed.ts` / `edge.ts` の 3 種に分け、edge case（static template literal を含むなど）は edge.ts に集約する。

**promoted-to**: `task-specification-creator/references/spec-template-evidence.md`, `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md`（NOT_EXECUTED → executed への昇格運用と整合）

## L-03A-LINT-005: spec_created → enforced_dry_run の lifecycle 再分類は同 wave で全 7 同期点を更新する

**苦戦箇所**: もとは spec_created の docs-only workflow として作成したが、実装ファイルと runtime evidence が後追いで揃った時点で `enforced_dry_run` へ再分類する必要が出た。再分類は単に root `artifacts.json` を書き換えるだけでは drift し、`outputs/artifacts.json` / Phase 12 compliance check / system-spec-update-summary / SKILL.md changelog / resource-map / quick-reference / task-workflow-active の 7 箇所を同 wave で更新する必要がある。

**5分解決カード**: lifecycle 再分類時は次のチェックリストを 1 wave で消化する: ①root `artifacts.json` ②`outputs/artifacts.json`（parity）③`outputs/phase-12/phase12-task-spec-compliance-check.md` ④`outputs/phase-12/system-spec-update-summary.md` ⑤SKILL.md 変更履歴 ⑥resource-map / quick-reference / task-workflow-active ⑦LOGS。`fully enforced` の昇格は別 wave（cleanup + strict CI gate 完了後）に必ず分離する。

**promoted-to**: `task-specification-creator/references/phase12-skill-feedback-promotion.md`, `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md`

## L-03A-LINT-006: skill feedback は「記録のみ」と「実 skill edit」を skill-feedback-report で明示分離する

**苦戦箇所**: Phase 12 の skill-feedback-report には Phase 11 evidence drift / canonical filename drift / parity 検査強化 / lifecycle 再分類運用などの promotion items が並ぶが、本 wave で実際に skill ファイルを書き換えるべきは aiworkflow-requirements の lessons-learned 1 件のみ。残りは task-specification-creator 側の guidance 追補なので、本 wave では「記録のみ」とした。

**5分解決カード**: `skill-feedback-report.md` の各行に **Decision 列**（`Promote` / `Defer` / `No-op`）と Evidence path を必ず明記し、Promote 行は本 wave で実行、Defer は次回類似 wave での再評価対象、No-op は理由ログとして残す。本人 wave での skill 編集対象を 1 行に絞ることで、編集を直列で安全に進められる。

**promoted-to**: `skill-creator/references/patterns-success-skill-phase12.md`, `task-specification-creator/references/phase12-skill-feedback-promotion.md`
