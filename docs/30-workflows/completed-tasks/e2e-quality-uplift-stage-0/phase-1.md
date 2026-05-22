# Phase 1: 要件定義（Stage 0）

date (absolute): 2026-05-08 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

---

## P50 pre-check

| 項目 | 値 |
| --- | --- |
| current branch implementation status | `feat/e2e-quality-uplift` 上、`.claude/skills/task-specification-creator/references/quality-gates.md` のみ modified（tier-aware 化済み）。`apps/web/playwright/` 配下のコード変更なし。 |
| upstream merged | PR #594 が `dev` に merge 済み（前提）。本サイクル開始時点で `dev` を取り込む差分はなし。 |
| dependency tasks | なし（Stage 0 は最上流）。下流の Stage 1 が AC-0c-1（§7.1 例外リスト）に依存。 |

---

## naming conventions analysis（既存リポ準拠）

| 種別 | 規約 | 根拠 |
| --- | --- | --- |
| spec ファイル | `<feature>.spec.ts`（kebab-case） | `apps/web/playwright/tests/profile-readonly.spec.ts` 等 |
| Playwright project 名 | kebab-case `desktop-chromium` / `mobile-webkit` | `apps/web/playwright.config.ts:28-46` |
| fixture export 名 | camelCase `memberPage` / `adminPage` | `apps/web/playwright/fixtures/auth.ts`（既存命名） |
| docs ディレクトリ | kebab-case `e2e-quality-uplift-stage-0` | `docs/30-workflows/` 配下の既存命名 |
| 新規 project 名 | `evidence-capture`（kebab-case、env opt-in） | 既存 project 命名規約に整合 |

---

## Stage 0b — Playwright README 新規作成

### scope

`apps/web/playwright/README.md`（新規）を 1 ファイル作成する。Playwright 環境に新規参加した開発者 / Claude Code が、§7 / §7.5 と現 spec 群の運用ルールを 1 ファイルで把握できる状態にする。

### pre-conditions

- `apps/web/playwright/{tests,fixtures,page-objects}/` 配下のファイルが本サイクル中に追加・改名されない（仕様書化対象を確定させるため）。
- `.claude/skills/task-specification-creator/references/quality-gates.md` §7 / §7.5 が tier-aware 化された状態で固定されている（現 worktree で modified 済）。

### acceptance criteria（testable）

| # | criterion | 検証コマンド / 方法 |
| --- | --- | --- |
| 0b-AC1 | README に「un-skip 不変条件」見出しがあり、§7.1 (4) の本文要旨を含む | `grep -n "un-skip" apps/web/playwright/README.md` |
| 0b-AC2 | README に「coverage tier (standard / lines >= 70%)」の章があり、`coverageTier: standard` を明示 | `grep -n "coverageTier" apps/web/playwright/README.md` |
| 0b-AC3 | README に `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test` 形式の 1 行実行コマンドが含まれる | code fence の grep |
| 0b-AC4 | critical route smoke list が箇条書きで 4 項目以上記載される（auth / public visitor / admin destructive / 申請承認） | 目視 + 章見出し grep |
| 0b-AC5 | `auth fixture` の `memberPage` / `adminPage` の責務とログイン経路が記述される | 章見出し grep |
| 0b-AC6 | `coverage/e2e/coverage-summary.json` の参照方法（artifact path）が記載 | grep |

### inventory（touch するファイル）

| 種別 | path | 操作 |
| --- | --- | --- |
| docs (new) | `apps/web/playwright/README.md` | 新規作成 |

### task classification

`implementation`。コード edit / config edit は伴わない。

### targeted test file list（SIGKILL 回避のため明示）

本タスクは implementation のため、テスト実行は不要。Phase 11 evidence は L1 docs-grep（章見出しの存在確認）で代替する（`phase-11-non-visual-alternative-evidence.md` L1 相当）。

### implementation_mode

`new`

---

## Stage 0c — profile-readonly skip cleanup

### scope

(c-1) 旧 `apps/web/playwright/tests/profile-readonly.spec.ts` の `test.skip(!storageState, ...)` を `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` へ移し、「`evidence-capture` Playwright project 配下の opt-in spec」として正式分離する仕様を確立する。標準 `pnpm e2e` 実行から除外。
(c-2) `apps/web/playwright/tests/profile-visibility-request.spec.ts:2` と `profile-delete-request.spec.ts:2` の stale comment（`Phase 11 manual smoke で test.describe.skip を解除して活性化する`）を削除する仕様を記述。
(c-3) `quality-gates.md §7.1 (4)` に「`evidence-capture` project は un-skip 不変条件の例外」として追記する仕様を記述。

### pre-conditions

- `profile-readonly-logged-in.spec.ts` 中の `storageState` 参照が `process.env.PROFILE_EVIDENCE_STORAGE_STATE` 等の env 経由であること（spec 上段の declaration を同一サイクルで確認する前提）。
- `apps/web/playwright.config.ts` が project 配列に新規 entry を追加できる構造（既存 4 project と同形式）。

### acceptance criteria（testable）

| # | criterion | 検証方法 |
| --- | --- | --- |
| 0c-AC1 | quality-gates.md §7.1 (4) に「`evidence-capture` project は例外」と明記される追記文面が phase-2 で確定 | phase-2 文面 review |
| 0c-AC2 | `profile-readonly-logged-in.spec.ts` の `test.describe('06b-C ...')` を `evidence-capture` project でのみ実行する設計が phase-2 で確定 | phase-2 design topology |
| 0c-AC3 | `profile-visibility-request.spec.ts:2` / `profile-delete-request.spec.ts:2` の冒頭 comment 1 行を削除する仕様が記述される | phase-2 inventory |
| 0c-AC4 | `pnpm e2e` 標準実行の project filter `--project=desktop-chromium,desktop-firefox,mobile-webkit` を README に明記する | Stage 0b の README で吸収 |
| 0c-AC5 | `evidence-capture` project は env `PROFILE_EVIDENCE_STORAGE_STATE` が set されている時のみ意味のある実行になる旨が明記 | phase-2 design |

### inventory（仕様書で参照する既存ファイル）

| path:line | 現状 | 仕様化後の処遇 |
| --- | --- | --- |
| `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` | `test.describe('06b-C ...')` 内に `test.skip(!storageState, ...)` | `evidence-capture` project 専用に分離。`pnpm e2e` 標準実行から除外 |
| `apps/web/playwright/tests/profile-visibility-request.spec.ts:2` | stale comment 1 行 | 削除 |
| `apps/web/playwright/tests/profile-delete-request.spec.ts:2` | stale comment 1 行 | 削除 |
| `apps/web/playwright.config.ts:26-47` | 既存 4 project | `evidence-capture` project 追加（実コード edit は本サイクル） |
| `.claude/skills/task-specification-creator/references/quality-gates.md` §7.1 | un-skip 不変条件 4 項目 | (4) に「例外: `evidence-capture` project」追記 |

### task classification

`implementation`（本セッション）。コード edit と skill 本体の追記は本サイクルで `implementation_mode: "edit"` の同一タスクとして実施。

### targeted test file list（SIGKILL 回避）

本サイクルは implementation。実 spec は触らないが、仕様書が参照する spec ファイル一覧:

- `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts`
- `apps/web/playwright/tests/profile-visibility-request.spec.ts`
- `apps/web/playwright/tests/profile-delete-request.spec.ts`

将来活性時の standard run 対象 spec（参考）:

- `apps/web/playwright/tests/profile.spec.ts`
- `apps/web/playwright/tests/profile-pending-sticky.spec.ts`
- `apps/web/playwright/tests/auth-gate-state.spec.ts`
- `apps/web/playwright/tests/admin-pages.spec.ts`
- `apps/web/playwright/tests/public-flow.spec.ts`
- `apps/web/playwright/tests/a11y.spec.ts`
- `apps/web/playwright/tests/attendance.spec.ts`
- `apps/web/playwright/tests/search-density.spec.ts`

### implementation_mode

`new`（仕様書として new、対象コードへの edit は同一タスク）

---

## CONST_007 整合確認

| 観点 | 判定 |
| --- | --- |
| 単一サイクル内に複数機能を詰めていないか | OK（README 新設 + comment cleanup の 2 サブタスクのみ） |
| skip / fixme の先送りをしていないか | OK（0c は skip を「解除」ではなく「正式分離」する。例外条件を §7.1 に明示する形で正規化する） |
| coverage 閾値を下げていないか | OK（standard tier, lines >= 70% は不変） |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 1
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
