# Phase 12 タスク仕様準拠チェック

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

canonical 9 見出し（`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections）を逐語使用する。`verify-phase12-compliance` / pre-push `phase12-compliance-guard.sh` がこの見出しを SSOT として読む。

## メタ情報

| key | value |
|---|---|
| タスクID | `issue-1076-member-og-design-token-alignment` |
| タスク名 | member OG 画像の意匠デザイントークン整合 (FU-I1027-002) |
| workflow | `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/` |
| branch | `docs/issue-1076-member-og-design-token-alignment-spec` |
| owner | `daishiman` |
| 実施日 | `2026-06-03` |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| issue | `#1076`（gh issue view 2026-06-03 再確認時点 `CLOSED`（closedAt: 2026-06-03T04:23:12Z）） |
| 判定 | **PASS** |

## 1. Summary verdict

本 wave は Issue #1076（FU-I1027-002）の Phase 1-13 **実装仕様書**を作成し、同一サイクルで `apps/og` のローカル実装と検証まで完了した `implemented_local_evidence_captured` タスクである。実PNG screenshot、staging deploy、commit、push、PR、Issue mutation は user-gated として分離する。

- 目的: `apps/og` が生成する OG 画像のブランド配色・レイアウト・タイポグラフィを、デザイン正本 `apps/web/src/styles/tokens.css` の確定 hex と整合させ、再乖離を回帰テストで機械的に防ぐ。
- スコープ: `apps/og` 5 ファイル（新規 2 + 編集 3）であり 1 サイクル完了可能（CONST_007）。ランタイム A/B テスト基盤・serif font 追加は明示スコープ外。
- 設計核心: 新規 `apps/og/src/og-tokens.ts`（`OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` / `titleFontSize`）、`render.tsx` の `BRAND`→`OG_BRAND` 置換、`og-tokens.spec.ts` が tokens.css を fs パースして正本 hex 一致を検証（ドリフトガード）。
- 判定: canonical 7 成果物全 present、設計 identifier 一貫、新規未タスク 1 件（serif 見出し・将来候補）で **PASS**。

### 受け入れ条件 mapping（補足）

| AC | 内容（要約） | spec 対応 | 状態 |
| --- | --- | --- | --- |
| AC-1 | 配色を OKLch トークン正本と整合 | `OG_BRAND` ← tokens.css 確定 hex / `og-tokens.spec.ts` ガード | PASS |
| AC-2 | レイアウトをトークン整合 | `OG_LAYOUT` 由来へ `buildHtml` 構造整理 | PASS |
| AC-3 | member 名あり/なし両ケース視認性 | `titleFontSize` 適応 + subtitle 非空保証 + 3 ケーステスト | PASS |
| AC-4 | render smoke test 更新でデグレ防止 | `render-smoke.spec.ts` / `render-html.spec.ts` 拡充 | PASS |
| AC-5 | bundle Free 3MiB 上限内 | font 非 bundle 維持 + `check-worker-size.sh` 再確認 | PASS |
| AC-6 | 既存機能非回帰 | 既存 router / member-source / smoke test 維持 | PASS |
| AC-7 | typecheck / lint 緑 | `pnpm --filter @ubm-hyogo/og typecheck` / `pnpm --filter @ubm-hyogo/og lint` | PASS |

## 2. Changed-files classification

| class | files | 備考 |
|---|---|---|
| docs（本 wave で作成・同期） | 本 workflow root 配下 `index.md` / `artifacts.json` / `outputs/artifacts.json` / `outputs/phase-{1..13}/*` / Phase 12 strict 7 | implemented_local_evidence_captured |
| 実装対象（本 wave で実装） | `apps/og/src/og-tokens.ts`（新規）, `apps/og/src/render.tsx`（編集）, `apps/og/src/__tests__/og-tokens.spec.ts`（新規）, `apps/og/src/__tests__/render-html.spec.ts`（編集）, `apps/og/src/__tests__/render-smoke.spec.ts`（編集）, `apps/og/tsconfig.json`（編集） | 実コード差分あり |
| out-of-scope（不変） | `apps/web` / `apps/api` / D1 schema / Google Form / `og-cd.yml` / `check-worker-size.sh` / OG endpoint surface | 不変条件 #1〜#7 |

### 不変条件 compliance（補足）

| 不変条件 | 判定 | 根拠 |
|---|---|---|
| #1 既存 API のみ | PASS | OG endpoint surface / member fetch 不変 |
| #2 OKLch トークン正本（apps/web の HEX 直書き禁止） | PASS | hex は `apps/og`（Satori 制約）に閉じ test ガード付き。`verify-design-tokens` は apps/og 非対象 |
| #5 D1 直接アクセス禁止 | PASS | `apps/og` は D1 binding を持たない |
| #6 GAS prototype 非昇格 | PASS | 無関係 |

## 3. `workflow_state` and phase status consistency

| source | 値 | 一致 |
|---|---|---|
| `index.md` front-matter `workflow_state` | `implemented_local_evidence_captured` | ✅ |
| `artifacts.json` `status` / `metadata.workflow_state` | `implemented_local_evidence_captured` | ✅ |
| `outputs/artifacts.json` | `implemented_local_evidence_captured`（root と byte-identical） | ✅ |
| `outputs/phase-12/main.md` | `implemented_local_evidence_captured` | ✅ |
| 本 compliance check | `implemented_local_evidence_captured` | ✅ |

- phase status: phase-1〜12 = `completed`（spec）、phase-13 = `pending_user_approval`。`artifacts.json` の `phases` と `index.md` の Phase 一覧が一致。
- Gate: Gate-A=passed（spec_review）/ Gate-B=passed（local implementation review）/ Gate-C=pending（external_ops）が `artifacts.json` `metadata.gates` と §7 で一致。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| screenshot plan | outputs/phase-11/screenshot-plan.json | present |
| capture metadata | outputs/phase-11/phase11-capture-metadata.json | present |
| screenshot (default og) | outputs/phase-11/screenshots/og-default-token-aligned.png | pending |
| screenshot (member with tagline) | outputs/phase-11/screenshots/og-member-with-tagline.png | pending |
| screenshot (member fallback tagline) | outputs/phase-11/screenshots/og-member-fallback-tagline.png | pending |

> implemented_local_evidence_captured + VISUAL_ON_EXECUTION のため、実 OG 画像 screenshot はstaging runtime cycleで取得（`pending`）。設計時証跡（plan / metadata / manual test plan）は `present`。OG は Workers ランタイム Satori でのみ実描画され Node/jsdom では fallback PNG に分岐するため、意匠 screenshot は staging `apps/og` で取得する。

## 5. Phase 12 strict 7 file inventory

| # | file | Status |
|---|---|---|
| 1 | outputs/phase-12/main.md | present |
| 2 | outputs/phase-12/implementation-guide.md | present |
| 3 | outputs/phase-12/system-spec-update-summary.md | present |
| 4 | outputs/phase-12/documentation-changelog.md | present |
| 5 | outputs/phase-12/unassigned-task-detection.md | present |
| 6 | outputs/phase-12/skill-feedback-report.md | present |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | present（本ファイル） |

- implementation-guide.md は Part 1（中学生レベル・例え話）+ Part 2（型 / 定数 / マッピング表 / `titleFontSize` / render 構造 / Satori 制約 / 検証コマンド / 既知制限）+ 視覚証跡を含む。
- identifier drift 確認: `OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` / `titleFontSize` / `buildHtml` / `tagLine` が Phase 2 §2.3-2.6 設計と implementation-guide で一致。

## 6. Skill/reference/system spec same-wave sync

| 対象 | 判定 | 根拠 |
|---|---|---|
| aiworkflow-requirements system spec（Step 2） | N/A | 新規公開 interface / 型 / API 変更なし（OG 内部定数のみ）。`system-spec-update-summary.md` で N/A を記録 |
| task-specification-creator / aiworkflow-requirements LOGS.md・SKILL.md | PASS | aiworkflow-requirements は active guide / indexes / LOGS / changelog / artifact inventory を同一 wave で同期。task-specification-creator は既存 same-wave implementation rule で充足し、追加候補を `skill-feedback-report.md` に記録 |
| workflow-local docs | 同 wave 同期済み | `index.md` / `artifacts.json` / `outputs/artifacts.json` / phase spec / Phase 12 strict 7 を同一 wave で作成 |
| indexes（topic-map / keywords） | 別 skill 管理・本 WF 非対象 | `docs/30-workflows` は aiworkflow-requirements indexes の対象外 |

## 7. Runtime or user-gated boundary

| 項目 | 種別 | 境界 |
|---|---|---|
| Phase 1-13 仕様書作成 | docs | 完了（本 wave） |
| `apps/og` コード実装（og-tokens.ts / render.tsx / 3 spec） | local 実装 | 同一サイクルで実装済み |
| focused Vitest 実走（og-tokens / render-html / render-smoke を含む apps/og 全体） | local テスト | PASS（6 files / 23 tests） |
| `pnpm --filter @ubm-hyogo/og build` + `check-worker-size.sh` | local 検証 | PASS（dry-run gzip 719.13 KiB、size gate 718KiB/3072KiB） |
| OG render screenshot 取得（staging `apps/og`） | visual evidence | user-gated（実装後） |
| `git commit` / `git push` / `gh pr create --base dev` / staging deploy | external ops | user-gated |
| GitHub Issue #1076 の状態変更 | external ops | user-gated（reopen / close しない・現状 CLOSED 維持） |

> 本 WF は仕様書作成、実コード実装、ローカルテスト、dry-run build、size gate まで完了。実PNG screenshot、PR、Issue mutation は user-gated。

## 8. Archive/delete stale-reference gate

| 項目 | 判定 | 根拠 |
|---|---|---|
| 完了タスク dir の `completed-tasks/` 移動 | 実施済み | Issue #1076 `CLOSED` + 実装 landed を踏まえ `docs/30-workflows/completed-tasks/issue-1076-member-og-design-token-alignment/` へ移動（user 承認済み・2026-06-03）。`workflow_state` は `implemented_local_evidence_captured` 維持。skill index / artifacts.json の参照は全て completed-tasks 経路へ整合済み（active-path stale 0） |
| stale 参照の削除 / 書換 | なし | 既存 workflow / skill ファイルを削除・改名していない |
| 親 #1027 成果物の越境編集 | 不実施 | `completed-tasks/issue-1027-.../` は編集しない。検出元参照は read-only |
| 発見元 unassigned spec | 温存 | 親 #1027 `outputs/phase-12/unassigned-task-detection.md` の将来候補表が出自。co-locate は実装完了後の close-out で判断 |

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | workflow_state（`index.md` / root artifacts / outputs artifacts / phase-12 main / 本 compliance check）が `implemented_local_evidence_captured` で一致。Gate-A=passed / Gate-B=passed / Gate-C=pending が一致 |
| 漏れなし | PASS | Phase 1-13 spec、Phase 12 canonical 7 outputs、AC-1〜AC-7 mapping、設計核心 identifier、Phase 11 evidence inventory（present 3 / pending 3）を反映 |
| 整合性あり | PASS | identifier（`OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` / `titleFontSize`）が phase-2 spec と impl-guide で一致。canonical 9 見出し逐語、§4 evidence の `present`/`pending` 区別、root/outputs artifacts byte-identical parity |
| 依存関係整合 | PASS | tokens.css（正本）/ og-tokens.ts（派生）/ render.tsx（消費）/ spec（検証）の責務分離。apps/web / apps/api / D1 / Google Form / og-cd.yml 不変。commit・push・PR・Issue mutation は user-gated boundary として分離 |

総合 verdict: **4 条件 PASS**。本 wave は仕様書作成、コード実装、ローカルテスト、dry-run build、size gate まで完了。実PNG screenshot・PR・Issue mutation は user-gated。
