# Phase 8: リファクタリング（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

---

## 1. 方針

Stage 0 は implementation。本 phase は **(a) 仕様書群の章間整合のリファクタ** と、**(b) 本サイクルで適用される stale comment 削除を含む Before/After を確定する**。実コード refactor は本サイクル責務。

---

## 2. Before / After テーブル（仕様書側）

| 観点 | Before（PR #594 直後） | After（本 PR 後） |
| --- | --- | --- |
| `apps/web/playwright/` 運用 README | 不在 | 仕様書 phase-2 §3 で 7 章構成確定 |
| §7.1 (4) 不変条件と spec 実態の矛盾 | `profile-readonly.spec.ts:63` の `test.skip` が宙に浮く | 例外条項文面確定（Phase 2 §4） |
| `profile-{visibility,delete}-request.spec.ts:2` の stale comment | 残存（`describe.skip` は除去済み・comment のみ stale） | 本サイクル で削除する仕様確定 |
| `profile-readonly.spec.ts` の責務名 drift | evidence-only spec なのに標準 readonly spec のように見える | R1 案 A: evidence-only spec rename/extract 確定（Phase 4 §0） |
| Playwright project | 4 件（desktop-chromium / desktop-firefox / mobile-webkit / staging） | 5 件目 `evidence-capture` 追加仕様確定 |
| `pnpm e2e` script | project filter 暗黙（全 project 実行） | `--project=desktop-chromium,desktop-firefox,mobile-webkit` 明示仕様確定 |

---

## 3. Before / After テーブル（本サイクルコード edit 確定文面）

| path:line | Before | After |
| --- | --- | --- |
| `apps/web/playwright/README.md` | 存在しない | 7 章構成（Phase 2 §3 正本） |
| `apps/web/playwright.config.ts:projects[]` | 4 entry | 5 entry（末尾に `evidence-capture`） |
| `apps/web/playwright/tests/profile-readonly.spec.ts` | evidence-only spec だが名前が曖昧 | 削除し、`profile-readonly-logged-in.spec.ts` に移す |
| `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` | 不在 | 新規（`06b-C` 移植） |
| `apps/web/playwright/tests/profile-visibility-request.spec.ts:2` | `// 実体テストは Phase 11 manual smoke で test.describe.skip を解除して活性化する。` | 削除 |
| `apps/web/playwright/tests/profile-delete-request.spec.ts:2` | 同上 | 削除 |
| `.claude/skills/task-specification-creator/references/quality-gates.md` §7.1 (4) | 不変条件のみ | 例外条項 8 行追記（Phase 2 §4） |
| `apps/web/package.json` の `e2e` script | `playwright test`（暗黙全 project） | `playwright test --project=desktop-chromium,desktop-firefox,mobile-webkit` |

---

## 4. 仕様書間の duplication 排除

| 項目 | 正本 | 参照側（再掲しない） |
| --- | --- | --- |
| README 7 章構成 | `phase-2.md §3` | phase-5 / phase-8 は表 1 行参照のみ |
| 例外条項文面 8 行 | `phase-2.md §4` | phase-5 §3-A / phase-8 で再掲（差分 0） |
| RG-1〜RG-10 grep gate | `phase-4.md §1` | phase-6 / phase-9 から ID 参照のみ |
| FP-1〜FP-7 fail path | `phase-6.md §1` | phase-9 は ID 参照 |

> README で skill spec を再掲しないルール（phase-2 R2 緩和策）と整合。

---

## 5. stale comment 削除の正当化

| 観点 | 内容 |
| --- | --- |
| なぜ削除して問題ないか | (a) 同 spec の `test.describe.skip(...)` は既に除去されている（PR #594）、(b) comment は「skip 復活待ち」を示唆するが、実態は active spec |
| 削除しないと何が起きるか | 開発者 / Claude Code が「`describe.skip` を復活させる作業が pending」と誤認、§7.1 (4) 不変条件と矛盾する操作を誘発 |
| 削除のリスク | なし（実体は active であり comment と乖離している） |
| 削除タイミング | 本サイクル（README 新設と同 PR で扱い、整合性を保つ） |

---

## 6. リファクタリング非対象（CONST_007 守備範囲）

以下は本サイクルの非対象:

- `apps/web/playwright/fixtures/auth.ts` の内部実装
- `apps/web/playwright/page-objects/*` の構造
- 既存 spec の test logic（comment 削除のみ対象外、本体は変更なし）
- skill `task-specification-creator/SKILL.md` の本文（§7.1 references のみ touch）
- `docs/00-getting-started-manual/specs/` 群

---

## 7. Phase 8 完了条件

- 仕様書側 Before/After テーブル ✓
- コード edit 側 Before/After テーブル ✓
- duplication 排除ルール明示 ✓
- stale comment 削除の正当化記録 ✓
- CONST_007 非対象範囲明示 ✓

→ Phase 9 へ。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 8
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
