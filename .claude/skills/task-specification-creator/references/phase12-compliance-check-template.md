# Phase 12 Task Spec Compliance Check Template

Use this template when generating
`outputs/phase-12/phase12-task-spec-compliance-check.md`. The check must compare
the task specification, actual changed files, evidence files, and system ledgers.

## Required Sections

1. Summary verdict
2. Changed-files classification
3. `workflow_state` and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict

> CI gate `verify-phase12-compliance` (`.github/workflows/verify-phase12-compliance.yml`)
> reads this `Required Sections` list as the canonical heading SSOT. Keep the
> numbering 1..9 and heading text stable. If any heading changes, update
> `scripts/verify-phase12-compliance.ts`, `scripts/lib/phase12-compliance/`,
> and `scripts/__tests__/fixtures/phase12-compliance/` in the same PR.
>
> **Phase 11 evidence existence 検証の統合（Refs #730）**: 同 verifier は
> `Phase 11 evidence file inventory` セクションを `scripts/lib/phase12-compliance/parse-phase11-evidence.ts`
> でパースし、`scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` が
> `Status=present` 行に対応する物理 file が workflow root 配下に存在することを検査する。
> したがって `Phase 11 evidence file inventory` の見出しテキストおよび
> `| Path | Status | ... |` 形式のテーブル構造（`Path` / `Status` 列必須）も
> heading SSOT として固定する。drift 時は parser / verifier / fixtures を同 PR で更新する。

## Verification Commands

```bash
git status --short
git diff --stat
test -f docs/30-workflows/<task>/artifacts.json
test -f docs/30-workflows/<task>/outputs/artifacts.json
find docs/30-workflows/<task>/outputs/phase-12 -maxdepth 1 -type f | sort
rg -n 'workflow_state|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING|implemented_local_evidence_captured' docs/30-workflows/<task>
rg -n '<workflow-root-name>' .claude/skills/aiworkflow-requirements .claude/skills/task-specification-creator docs/30-workflows
```

For every stale-reference hit, classify it as live inventory, active workflow,
consumed trace, historical changelog, lessons, or generated index. A deleted
root with any live inventory / active workflow / consumed trace hit is FAIL
unless the same wave restores the root or rewrites those references to a new
canonical root.

For skill-promotion tasks, also verify:

```bash
rg -n 'workflow-state-vocabulary|phase12-compliance-check-template' .claude/skills/task-specification-creator/SKILL.md
rg -n 'workflow-state-vocabulary|phase12-compliance-check-template' .claude/skills/task-specification-creator/references/phase-12-spec.md .claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md .claude/skills/task-specification-creator/references/phase-template-phase11.md
```

## Drift Patterns

| Pattern | FAIL condition | Fix |
| --- | --- | --- |
| Spec-only root claims implementation complete | `metadata.workflow_state=spec_created` while Phase 11/12 says local implementation is done | Reclassify or remove implementation-complete wording. |
| Runtime PASS without runtime evidence | `PASS` or `completed` is written while production/staging evidence is pending | Use `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` and attach pending evidence path. |
| Missing Phase 12 files | Any of the strict 7 file names are absent | Create the exact canonical filenames. |
| Stale deleted root | A workflow root is deleted while live inventory, active workflow, consumed trace, quick-reference, resource-map, or task-workflow points to it | Restore/move the root or update all ledgers in the same wave; historical-only hits must be labeled as such. |
| Skill feedback not promoted | `skill-feedback-report.md` names a target but owning skill files are unchanged | Apply the owning skill/reference update or mark a scoped no-op with evidence. |
| Heading-only `implementation-guide.md` PASS | strict 7 内の `implementation-guide.md` が Part 1〜11 の見出しだけ存在し、各 Part の本文が 3 行未満 / 必須 key section（背景・要約・実装ステップ・検証コマンド・既知制限 等）を欠く | 各 Part に最小 3 行以上の本文と key sections を補完してから PASS にする。見出し存在のみの strict PASS は FAIL とする（PARALLEL-01-NAV 由来） |
| Phase 11 evidence Status=present だが物理 file 不在 / 絶対パス / workflow root 外パス | `Phase 11 evidence file inventory` の `Status=present` 行に対し、`Path` 列が `/` で始まる絶対パス、`../` を含む workflow root 外パス、または workflow root からの相対パスを解決した結果 file が存在しない | `verify-phase11-evidence-existence.ts` が `missing-evidence` で FAIL を返す。`Path` は workflow root からの相対パスのみ許容し、物理 file を `outputs/phase-11/evidence/` 等に配置するか、`Status` を `absent` / `not_executed` に修正する（Refs #730） |

### Heading-only reject gate（PARALLEL-01-NAV 由来）

`implementation-guide.md` の Part 1〜11 は **見出し存在チェック単独で PASS 判定しない**。compliance check 実行時に以下の static validator パターンで Part ごとの本文量を必ず検査する。

```bash
# Part 1〜11 各見出しから次の Part 見出しまでの本文行数を測る
awk '
  /^## Part [0-9]+/ {
    if (part != "") print part, count;
    part=$0; count=0; next
  }
  part != "" && NF > 0 { count++ }
  END { if (part != "") print part, count }
' docs/30-workflows/<task>/outputs/phase-12/implementation-guide.md \
  | awk '{ if ($NF < 3) { print "FAIL heading-only:", $0; rc=1 } } END { exit rc }'
```

判定ルール:

- 各 Part の本文（見出し行を除く非空行）が **3 行未満**なら `FAIL heading-only`。
- 各 Part に必須 key section（例: `背景` / `要約` / `実装ステップ` / `検証コマンド` / `既知制限` のうちタスク種別に応じた最低 2 項目）が含まれていない場合も FAIL。
- compliance check の `Phase 12 strict 7 file inventory` セクションで Part 毎の `lines / key_sections_present` を表形式で記録し、reviewer が見出し存在だけで PASS にできない構造にする。

## Four-Condition Verdict Template

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS/FAIL | State, scope, and evidence wording do not conflict. |
| 漏れなし | PASS/FAIL | Required skill outputs and Phase 12 files are present. |
| 整合性あり | PASS/FAIL | Terms, paths, JSON metadata, and ledger entries match. |
| 依存関係整合 | PASS/FAIL | Upstream/downstream tasks, moved/deleted roots, and indexes are synchronized. |

## 3-state Verdict Vocabulary（PASS 単独表記禁止 / 2026-05-10 stage-3 由来）

各 AC / Step / 行レベルの判定は **`spec_created` / `runtime_pending` / `completed` の 3-state で suffix する**。`PASS` 単独表記は禁止。

| 表記 | 適用条件 |
| --- | --- |
| `spec_created (no impl yet)` | 仕様書のみ。コード差分・evidence なし |
| `runtime_pending (CI scheduled)` | local 5 点 PASS 取得済 / runtime CI / staging deploy / fresh GET いずれか未完 |
| `completed (runtime PASS / verified at <ISO8601>)` | runtime artifact が tracked file として物理生成済 + 検証コマンドと exit code 記録 |
| `PASS_WITH_OPEN_SYNC` | same-wave sync 未完。blocker を逐語列挙する場合のみ許容 |
| `FAIL` | 上記のいずれにも該当しない / blocker 解消不能 |

### Evidence Ledger Split（NON_VISUAL / governance task 必須）

governance mutation / 不可逆 deploy / D1 migrations apply 等を含むタスクでは、`artifacts.json.metadata` の evidence ledger を **read-only と mutation で分離** する:

| ledger key | 内容 |
| --- | --- |
| `actual_read_only_evidence_files` | AI が user 承認前に取得した read-only evidence（before GET / migrations list / fresh GET の read-only スナップショット 等） |
| `actual_mutation_evidence_files` | user 承認後に mutation 実行後の after evidence（PUT 直後 fresh GET / deploy log / apply log 等） |

compliance check では両 ledger の tracked file 存在を独立に検証する。`actual_mutation_evidence_files` が空のまま root `workflow_state=completed` は FAIL。

### Branch-specific Drift Check（branch protection 等）

dev / main 等の **ブランチ別 governance API** を扱うタスクでは、ブランチごとに before / payload / after evidence を分離し、compliance check 行も branch ごとに独立に判定する。詳細は [governance-branch-protection-pattern.md](governance-branch-protection-pattern.md) を参照。

### Server Component E2E 系の compliance check

Server Component / Server Action E2E を含むタスクは [server-component-e2e-pattern.md](server-component-e2e-pattern.md) に従い、`page.route()` を server-side fetch evidence にしていないこと、`INTERNAL_API_BASE_URL` 差し替え / mock API / seed の 3 点が tracked file で揃っていることを compliance check の独立行として検証する。
