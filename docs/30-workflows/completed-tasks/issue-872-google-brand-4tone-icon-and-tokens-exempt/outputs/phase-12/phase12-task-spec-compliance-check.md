**[実装区分: 実装仕様書 / 状態: spec_created]**

# Phase 12: phase12 task spec compliance check

skill `references/phase12-compliance-check-template.md` の canonical 9 headings (Required Sections 1..9) を逐語使用する。`verify-phase12-compliance` / pre-push `phase12-compliance-guard.sh` が本見出しを SSOT として読む。

## 1. Summary verdict

総合 verdict: `local_static_pass_browser_pending`。実コード・token verifier・focused test は更新済み。Chromium install と `next build --webpack` は local filesystem `ENOSPC`（空き 103MiB）で止まったため、browser screenshot / build evidence は pending として分離する。

- 矛盾なし: PASS (brand exempt は `.svg` のみに統一し、`.tsx` wrapper の HEX 直書き経路を撤去)
- 漏れなし: PASS_WITH_BROWSER_PENDING (Phase 12 strict 7 / Phase 11 render evidence / skill 同期 / spec 反映を記録。browser screenshot は ENOSPC blocker)
- 整合性あり: PASS (実コード / verifier / 09b spec / Phase 6・8・12 の `.svg` 限定が一致)
- 依存関係整合: PASS (親 workflow `login-page-prototype-alignment` の FU-LOGIN-001 を consumed として明示)
- 4-state suffix: `local_static_pass_browser_pending` (PASS 単独表記禁止 v2026.05.09 状態語彙準拠)

## 2. Changed-files classification

| scope | 想定 diff | 種別 |
|-------|-----------|------|
| `apps/web/src/components/ui/brand-icons/{google.svg,GoogleBrandIcon.tsx}` | 新規 2 件 | implementation |
| `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | `<Icon name="google" />` → `<GoogleBrandIcon />` | implementation |
| `apps/web/src/components/ui/{icons.ts,Icon.tsx}` | `"google"` union 削除 + `case "google"` 削除 | implementation |
| `scripts/verify-design-tokens.ts` | `DEFAULTS.brandIconExemptPaths` 追加 + scan filter | tooling |
| `scripts/verify-design-tokens.spec.ts` | exempt 単体テスト追加 | test |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | brand-asset exempt 章追加 | spec |
| `apps/web/playwright/tests/visual/login.spec.ts-snapshots/login-visual-chromium-linux.png` | baseline 更新 | test (visual baseline) |
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` | FU-LOGIN-001 consumed 表記 | docs (consumed trace) |
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | `status: consumed` + canonical_workflow 追加 | docs (consumed trace) |
| `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/**` | 仕様書 + evidence + artifacts | docs |
| `.claude/skills/aiworkflow-requirements/**` | quick-reference / resource-map / task-workflow-active / SKILL-changelog / indexes rebuild | skill (same-wave) |
| `docs/30-workflows/LOGS.md` | 1 行追記 | docs |
| 他 (`apps/api/**` / `packages/**`) | 0 件 | n/a |

classification verdict: 全 diff が本 task スコープ宣言と一致。

## 3. `workflow_state` and phase status consistency

| ファイル | 宣言値 | 整合 |
|----------|--------|------|
| `artifacts.json#workflow_state` | `local_static_pass_browser_pending` | OK |
| `outputs/phase-12/phase-12.md` 状態 | `spec_created` (本仕様書時点) / `implemented_local_visual_evidence_captured` (Phase 11 完了後の想定終端) | OK |
| `outputs/phase-13/phase-13.md` | Phase 13 procedure (user gated) | OK |
| Phase 1〜13 entry 表 | done (spec) / spec ready evidence pending / done (spec) | OK |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `completed (runtime PASS)` | 未使用 | OK |

`workflow_state` と各 Phase 表記の drift なし。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| local validation summary | outputs/phase-11/evidence/local-validation-summary.txt | present |
| typecheck log | outputs/phase-11/evidence/typecheck.txt | present |
| lint log | outputs/phase-11/evidence/lint.log | pending |
| build log | outputs/phase-11/evidence/build.log | pending |
| verify-design-tokens log | outputs/phase-11/evidence/verify-design-tokens.txt | present |
| vitest verify log | outputs/phase-11/evidence/vitest-verify.txt | present |
| playwright visual log | outputs/phase-11/evidence/playwright-visual.log | pending |
| visual render (4tone desktop) | outputs/phase-11/screenshots/login-google-button-4tone.png | present |
| visual render (4tone mobile) | outputs/phase-11/screenshots/login-google-button-4tone-mobile.png | present |
| browser screenshot (4tone desktop) | outputs/phase-11/screenshots/login-google-button-4tone.browser.png | pending |
| browser screenshot (4tone mobile) | outputs/phase-11/screenshots/login-google-button-4tone-mobile.browser.png | pending |

`present` は物理ファイル実在を確認済み。Browser screenshot / build は `ENOSPC` のため pending。

## 5. Phase 12 strict 7 file inventory

| # | path | status | lines / key_sections_present | 補足 |
|---|------|--------|------------------------------|------|
| 1 | `outputs/phase-12/main.md` | present | sufficient / 背景・Task 12-1〜12-6 入口 | Phase 12 strict 7 main |
| 2 | `outputs/phase-12/implementation-guide.md` | present | Part 1〜11 各 3 行以上 / 背景・要約・実装ステップ・検証コマンド・既知制限・視覚証跡 | Part 1 (中学生) + Part 2 (技術者) の 2 部構成。Heading-only reject gate (PARALLEL-01-NAV 由来) 適合 |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present | canonical 9 headings 逐語 | 本ファイル (SSOT 準拠) |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | present | Step 1-A / 1-B / 1-C / Step 2 | `09b-design-tokens.md` 反映 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | present | candidate 3 件 | task-specification-creator / aiworkflow-requirements への feedback |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | present | current / baseline 分離 | FU-872-001..003 + Baseline 継承 + CONST_007 例外宣言 |
| 7 | `outputs/phase-12/documentation-changelog.md` | present | workflow-local / global skill 分離 block | docs / skill / spec / 実コード block 分離記録 |

strict 7 verdict: 全 7 ファイル present。`implementation-guide.md` は Heading-only reject gate を満たす本文量を計画。

## 6. Skill/reference/system spec same-wave sync

| 同期対象 | 同 wave で更新するか | 計画 |
|---------|------------------|------|
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` (brand-asset exempt 章) | YES | Step 2 で同 PR 内追記。`verify-design-tokens.ts` の `DEFAULTS.brandIconExemptPaths` 実装と双方向参照。対象は `apps/web/src/components/ui/brand-icons/*.svg` のみ |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | YES | 本 workflow の quick reference を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | YES | 本 workflow の quick lookup を追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | YES | `spec_created / implementation / VISUAL` と user-gated boundary を追記 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-872-google-brand-4tone-icon-and-tokens-exempt-artifact-inventory.md` | YES | artifact inventory を新規作成 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | YES | brand-icons 新規ディレクトリと exempt allowlist 追加を 1 行記録 |
| `docs/30-workflows/LOGS.md` | YES | 本 workflow の spec_created 行を追記 |
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` | YES | FU-LOGIN-001 行を `consumed by issue-872-google-brand-4tone-icon-and-tokens-exempt` に更新 |
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | YES | `status: consumed` / canonical_workflow を本 workflow に更新 |
| `.claude/skills/task-specification-creator/**` | NO (改修なし) | 本 task 内で skill 改修は行わない。feedback report に候補のみ記録 |

same-wave verdict: manual ledger 7 ファイルを同 wave で同期。`topic-map.md` / `keywords.json` は generated index 扱いのため、本 spec_created wave では直接編集しない。skill 構造変更は scope 外として feedback に格下げ。

## 7. Runtime or user-gated boundary

| 境界 | 種別 | 解放条件 |
|------|------|---------|
| Phase 11 local validation (typecheck / lint / build / verify-design-tokens / vitest verify / playwright visual) | local-runtime | 実装後 Phase 11 で実行し evidence 取得 |
| Playwright visual baseline 更新 (`login-visual-chromium-linux.png` 等) | local-runtime + user-gated | local 取得後、baseline 上書きは user の目視確認 ok を経て commit |
| `commit` / `push` / `gh pr create` | user-gated | Phase 13 で user 明示承認後のみ実行 |
| staging visual smoke | future scope (FU-872-003) | 本 task のスコープ外。unassigned で baseline 継承 (FU-LOGIN-003) |
| issue #872 close 動作 | NO-OP | issue は CLOSED のまま維持。PR は `Refs #872` のみ (Closes 禁止) |

boundary verdict: 全 mutation が user 承認の後段に置かれ、AI が独断で外向き操作する経路 0 件。

## 8. Archive/delete stale-reference gate

| 対象 | 削除/移動 | stale ref 確認 |
|------|----------|---------------|
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | 削除しない (consumed 表記で残置) | `rg -n 'login-page-prototype-alignment-followup-001'` を実装 PR で 0 件以外時は live ref を本 workflow へ書き換え |
| `apps/web/src/components/ui/icons.ts` の `"google"` union | 削除 | `rg -n '"google"' apps/web/src/components/ui` で 0 件、`<Icon name="google"` で 0 件を Phase 5 ステップ 6 で確認 |
| `apps/web/src/components/ui/Icon.tsx` の `case "google":` | 削除 | 同上 |
| 旧 1-tone google アイコン参照箇所 | grep 確認 | `rg -n 'Icon name="google"' apps/web` で 0 件 |
| `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/` 自身 | 完了後 `completed-tasks/` へ移動予定 (Phase 13 後段) | 全 stale ref を `completed-tasks/issue-872-...` に同 wave 書き換え |

stale-reference gate verdict: 削除対象 3 件すべてに grep 0 件確認手順を Phase 5 / 8 に組込済。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `GoogleBrandIcon.tsx` から HEX を撤去し、`verify-design-tokens` / tests / 09b spec / Phase docs を `.svg` only exempt に統一 |
| 漏れなし | PASS_WITH_BROWSER_PENDING | code / docs / skill sync / render PNG は完了。browser screenshot と build は local `ENOSPC` blocker として分離 |
| 整合性あり | PASS | brand-asset exempt の path-glob は `apps/web/src/components/ui/brand-icons/*.svg` に限定し、`.tsx` / `.ts` / `.css` への HEX 逃げ道を作らない |
| 依存関係整合 | PASS | 親 workflow consumed trace / issue #872 Refs / unassigned-task status 更新 / 09b spec ↔ verify-design-tokens 双方向参照 / playwright baseline ↔ Phase 11 evidence の 5 経路すべて §7 / Step 1-C で整合確認済 |

総合 verdict: `local_static_pass_browser_pending`。実装・静的検証・render PNG は完了。Phase 13 user approval 前に browser screenshot / build evidence を再取得できる空き容量を確保する必要がある。

## 次 Phase への引き継ぎ

Phase 11 実行後、本ファイル §1 状態 / §4 inventory status / §9 verdict を `implemented_local_visual_evidence_captured` に同 wave 更新する。
