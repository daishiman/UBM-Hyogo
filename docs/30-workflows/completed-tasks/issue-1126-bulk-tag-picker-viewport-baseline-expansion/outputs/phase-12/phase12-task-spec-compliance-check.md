# Phase 12 タスク仕様準拠チェック

**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

canonical 9 見出し（`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections）を逐語使用する。`verify-phase12-compliance` / pre-push `phase12-compliance-guard.sh` がこの見出しを SSOT として読む。

## メタ情報

| key | value |
|---|---|
| タスクID | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| タスク名 | bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide） |
| workflow | `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/` |
| branch | `docs/issue-1126-bulk-tag-picker-viewport-baseline-expansion-spec` |
| owner | `daishiman` |
| 実施日 | `2026-06-06` |
| workflow_state | `implemented_local_runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| issue | `#1126`（`CLOSED`・reopen しない） |
| 判定 | **PASS_BOUNDARY_SYNCED_RUNTIME_PENDING** |

## 1. Summary verdict

本 wave は Issue #1126（親 #1077 follow-up）の Phase 1-13 実装仕様書を作成する `implemented_local_runtime_pending` タスクである。bulk tag picker の authenticated staging visual baseline を desktop 単一から mobile/tablet/wide の 3 viewport へ additive 拡張する設計を実装可能粒度で固定する。本実行サイクルでコードを実装し、実コード差分・typecheck・lint・focused test・Phase 12 compliance は完了、staging visual capture・`--update-snapshots`・commit・push・PR・issue mutation は全て user-gated。

- 目的: `admin-members-bulk-tag-authenticated.spec.ts` の picker baseline を desktop（1280×800・無 suffix）のみから、mobile(390×844)/tablet(768×1024)/wide(1920×1080) × assign/unassign の **新規 6 枚**へ拡張し、レスポンシブ回帰検出範囲を広げる。
- スコープ: spec 1 本 + viewport fixture 1 本の編集 + baseline 6 枚生成で 1 サイクル完了（CONST_007）。result mutation baseline / project 複製 / CI yml 改修 / component 実装変更は明示スコープ外。
- 設計核心: B案（`page.setViewportSize()` per-test 切替 + snapshot 名 viewport suffix）。`viewports.ts` に `wide` を additive 追加し正本集約。desktop 無 suffix baseline 温存。read-only 維持（`bulk-tag-result` count 0）。
- 判定: canonical 7 成果物全 present、identifier drift なし、新規未タスク 0 件、Phase 11 evidence は runtime visual pending のため新規6枚は `pending` で **PASS**。

### 受け入れ条件 mapping（補足）

| AC | 内容（要約） | spec 対応 | 状態 |
| --- | --- | --- | --- |
| AC① | mobile/tablet/wide で picker assign/unassign baseline を取得 | `RESPONSIVE_VIEWPORTS` を `setViewportSize` で切替（Phase 2 §4.4 / impl-guide §2-3） | implemented_local_runtime_pending（設計確定・capture は user-gated） |
| AC② | viewport ごとに baseline を分離（`-mobile`/`-tablet`/`-wide` suffix） | `bulk-tag-picker-{assign,unassign}-mode-{vp}.png` 6 枚（Phase 2 §3） | implemented_local_runtime_pending |
| AC③ | 既存 desktop baseline を破壊しない | `SNAP.assign`/`SNAP.unassign`（無 suffix）の capture 経路温存 | implemented_local_runtime_pending |
| AC④ | CI で新 baseline が回帰検出に組込まれる | `staging-visual-authenticated` project の glob 経由・CI 無改修（Phase 2 §7） | implemented_local_runtime_pending |
| AC-R1〜R4 | read-only 維持 / staging D1 副作用ゼロ / mode reset / fixture additive 互換 | `bulk-tag-result` count 0 assert・`viewports.ts` additive（Phase 1 §6 補助 AC） | implemented_local_runtime_pending |

## 2. Changed-files classification

| class | files | 備考 |
|---|---|---|
| 実装（本 WF で編集済み） | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`, `apps/web/playwright/fixtures/viewports.ts` | responsive 3 test 追加（既存 desktop 温存）/ `wide` additive。実差分は本実行サイクルで適用済み |
| docs（本 wave で作成） | 本 workflow root 配下 `index.md` / `artifacts.json` / `outputs/artifacts.json` / `outputs/phase-{1..13}/*` / Phase 12 strict 7 | implemented_local_runtime_pending の Phase 1-13 仕様書 |
| out-of-scope（不変） | bulk tag endpoint / D1 schema / `BulkActionBar.tsx` / `playwright.config.ts` / `playwright-staging-visual-authenticated.yml` / `mint-staging-storage-state.ts` / desktop 無 suffix baseline | 不変条件 #1 / #5 / CI 無改修 / AC③ |

### 不変条件 compliance（補足）

| 不変条件 | 判定 | 根拠 |
|---|---|---|
| #1 既存 API のみ | PASS | bulk tag endpoint 不変。read-only capture で mutation を発火しない |
| #5 D1 直接アクセス禁止 | PASS | spec は client-side state 操作（checkbox check / mode toggle）のみ。D1 binding 参照なし |
| read-only 維持 | PASS | タグ apply なし・各 test で `bulk-tag-result` count 0 assert・共有 staging D1 副作用ゼロ |
| CI 無改修 | PASS | `staging-visual-authenticated` project の glob 経由で新 baseline 自動参加。yml / config 不変 |
| fixture additive 互換（AC-R4） | PASS | `viewports.ts` は `wide` 1 行追加のみ。既存キー・値・`ViewportName` consumer 互換維持 |

## 3. `workflow_state` and phase status consistency

| source | 値 | 一致 |
|---|---|---|
| `index.md` front-matter `workflow_state` | `implemented_local_runtime_pending` | ✅ |
| `artifacts.json` `status` / `metadata.workflow_state` | `implemented_local_runtime_pending` | ✅ |
| `outputs/artifacts.json` | `implemented_local_runtime_pending`（root と byte-identical） | ✅ |
| `outputs/phase-12/main.md` | `implemented_local_runtime_pending` | ✅ |
| 本 compliance check | `implemented_local_runtime_pending` | ✅ |

- phase status: phase-1〜13 = `implemented_local_runtime_pending`。実コード実装済み・実 PNG 未取得。`artifacts.json` の `phases` と `index.md` の Phase 一覧が一致。
- Gate: Gate-A=passed（spec_review）/ Gate-B=passed（local implementation・runtime visual pending）/ Gate-C=pending（external_ops）が `artifacts.json` `metadata.gates` と §7 で一致。Gate-B の status enum は schema 制約（`pending`/`passed`/`failed`/`waived`）に従い `passed`。runtime visual pending の含意は notes / §7 boundary で表現する。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| viewport baseline (mobile assign・planned) | outputs/phase-11/screenshots/bulk-tag-picker-assign-mode-mobile.png | pending |
| viewport baseline (mobile unassign・planned) | outputs/phase-11/screenshots/bulk-tag-picker-unassign-mode-mobile.png | pending |
| viewport baseline (tablet assign・planned) | outputs/phase-11/screenshots/bulk-tag-picker-assign-mode-tablet.png | pending |
| viewport baseline (tablet unassign・planned) | outputs/phase-11/screenshots/bulk-tag-picker-unassign-mode-tablet.png | pending |
| viewport baseline (wide assign・planned) | outputs/phase-11/screenshots/bulk-tag-picker-assign-mode-wide.png | pending |
| viewport baseline (wide unassign・planned) | outputs/phase-11/screenshots/bulk-tag-picker-unassign-mode-wide.png | pending |
| manual test result | outputs/phase-11/manual-test-result.md | present |

> 本タスクは `implemented_local_runtime_pending` × `VISUAL_ON_EXECUTION` のため、Phase 11 の実 PNG は未取得。PNG 6 行は Status=`pending`（物理ファイル実在検証の対象外）。manual test result はローカル検証結果を記録済みのため `present`。実 baseline 6 枚は staging visual capture フェーズ（user-gated）の `--update-snapshots` で取得する。

## 5. Phase 12 strict 7 file inventory

| # | file | Status |
|---|---|---|
| 1 | outputs/phase-12/main.md | present |
| 2 | outputs/phase-12/implementation-guide.md | present |
| 3 | outputs/phase-12/phase12-task-spec-compliance-check.md | present（本ファイル） |
| 4 | outputs/phase-12/system-spec-update-summary.md | present |
| 5 | outputs/phase-12/skill-feedback-report.md | present |
| 6 | outputs/phase-12/unassigned-task-detection.md | present |
| 7 | outputs/phase-12/documentation-changelog.md | present |

- 補助: `outputs/phase-12/phase-12.md`（phase-12 ディレクトリ慣習のサマリ）も present。
- implementation-guide.md は Part 1（中学生レベル・visual regression baseline / viewport の例え話）+ Part 2（変更ファイル 2 件 / `viewports.ts` の wide before-after / spec の viewport ループ擬似実装 / snapshot 命名 / 検証コマンド / DoD）を含む。
- identifier drift 確認: `RESPONSIVE_VIEWPORTS` / `setViewportSize` / `switchToUnassignMode` / `SNAP.assign` / `SNAP.unassign` / `bulk-tag-result` が Phase 2 設計と implementation-guide で一致。

## 6. Skill/reference/system spec same-wave sync

| 対象 | 判定 | 根拠 |
|---|---|---|
| aiworkflow-requirements public system spec | N/A | 新規公開 interface / 型 / 定数 / API 変更なし（test artifact の additive のみ）。`system-spec-update-summary.md` で N/A を記録 |
| `docs/00-getting-started-manual/specs/*.md`（正本仕様） | N/A | プロダクション挙動・公開仕様の変更なし。test infra 拡張は正本仕様対象外 |
| task-specification-creator skill feedback | 同 wave 同期済み | implementation target が明確な VISUAL_ON_EXECUTION を `spec_created` で閉じない lesson を `patterns-lessons-and-pitfalls.md` / `SKILL-changelog.md` へ反映 |
| aiworkflow-requirements ledgers | 同 wave 同期済み | quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS / SKILL-changelog へ issue-1126 を登録 |
| workflow-local docs | 同 wave 同期済み | `index.md` / `artifacts.json` / `outputs/artifacts.json` / phase spec / Phase 11補助成果物 / Phase 12 strict 7 を同一 wave で作成 |

## 7. Runtime or user-gated boundary

| 項目 | 種別 | 境界 |
|---|---|---|
| `viewports.ts` の `wide` 追加 | local 実装 | 本実行サイクルで実施済み |
| spec の responsive 3 test 追加 | local 実装 | 本実行サイクルで実施済み |
| `pnpm --filter @ubm-hyogo/web typecheck` | local 検証（read-only） | 本実行サイクルで実行 |
| `pnpm --filter @ubm-hyogo/web lint` | local 検証（read-only） | 本実行サイクルで実行 |
| focused vitest `BulkActionBar.spec.tsx` | local テスト | 本実行サイクルで実行 |
| `pnpm verify:phase12-compliance -- --workflow ...` | local 検証 | 本実行サイクルで実行 |
| staging authenticated visual capture / `--update-snapshots` | visual evidence | user-gated（staging アクセス + baseline 確定） |
| staging admin storageState minting | external ops | user-gated |
| `git commit` / `git push` / `gh pr create --base dev`（`Refs #1126`） | external ops | user-gated |
| GitHub Issue #1126 の状態変更 | external ops | user-gated（CLOSED 維持・reopen / comment しない） |

> 本 WF は implemented_local_runtime_pending。実コード差分・typecheck・lint・focused test・Phase 12 compliance は完了、staging visual capture・`--update-snapshots`・commit・push・PR・Issue mutation は全て user-gated。

## 8. Archive/delete stale-reference gate

| 項目 | 判定 | 根拠 |
|---|---|---|
| 完了タスク dir の `completed-tasks/` 移動 | 実施済み | 本 WF は `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/` へ移動済み。workflow_state は `implemented_local_runtime_pending`（staging visual capture は user-gated）だが、参照群（resource-map / quick-reference / task-workflow-active / artifact inventory / 両 artifacts.json evidence_path）も同 wave で completed-tasks 方向へ更新済み。dangling active-root 参照 0 件 |
| stale 参照の削除 / 書換 | なし | 既存 workflow / skill ファイルを削除・改名していない |
| 親 #1077 成果物の越境編集 | 不実施 | `completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/` 配下を編集しない |
| 発見元 unassigned spec | 温存 | `docs/30-workflows/unassigned-task/task-issue-1077-followup-001-bulk-tag-picker-viewport-baseline-expansion.md` は温存。consumed pointer は本実行サイクルで追記済み |

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | workflow_state（`index.md` / root artifacts / output artifacts / phase-12 main / 本 compliance check）が `implemented_local_runtime_pending` で一致。Gate-A=passed / Gate-B=passed / Gate-C=pending で一致（artifacts.json `metadata.gates` の enum と逐語一致） |
| 漏れなし | PASS | Phase 1-13 spec、Phase 12 canonical 7 outputs、AC①〜④ + AC-R1〜R4 mapping、設計核心識別子、新規 baseline 6 枚の命名規約を反映 |
| 整合性あり | PASS | identifier（`RESPONSIVE_VIEWPORTS` / `setViewportSize` / `prepareBulkRegion` / `switchToUnassignMode` / `SNAP.*`）が phase-2 spec と impl-guide で一致。canonical 9 見出し逐語、§4 evidence inventory は runtime visual `pending`、root/outputs artifacts byte-identical parity |
| 依存関係整合 | PASS | bulk tag endpoint / D1 / `BulkActionBar.tsx` / `playwright.config.ts` / CI yml / desktop 無 suffix baseline は不変。staging capture・commit・push・PR・Issue mutation は user-gated boundary として分離 |

総合 verdict: **4 条件 PASS**。本 WF は implemented_local_runtime_pending。staging visual capture（新規 6 baseline）・PR・Issue mutation は user-gated（Phase 13）。
