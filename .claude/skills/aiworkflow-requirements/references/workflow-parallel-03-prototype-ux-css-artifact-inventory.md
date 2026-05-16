# workflow-parallel-03-prototype-ux-css-artifact-inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | parallel-03-prototype-ux-css |
| Workflow root | `docs/30-workflows/completed-tasks/parallel-03-prototype-ux-css/` |
| Parent workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| Source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-prototype-ux-css/spec.md` |
| State | `implemented_local_visual_runtime_captured / implementation / VISUAL / Phase 12 strict 7 present / Phase 13 user-gated` |
| visualEvidence | `VISUAL` |
| Phase status | Phase 1-12 completed / Phase 13 `blocked_pending_user_approval` (commit / push / PR) |
| Sync date | 2026-05-15 |

## Scope (G3-1 / G3-2 / G3-3)

| ID | Target | UX Goal |
| --- | --- | --- |
| G3-1 | tag pill (active filter) | selected fill via `aria-pressed="true"` + `data-selected="true"` |
| G3-2 | member card | hover + `:focus-within` で border / shadow / translate を変える |
| G3-3 | profile section | `data-component="profile-section"` + `data-visibility` で公開範囲を可視化 |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/src/styles/globals.css` | OKLch token を消費する scoped CSS（tag pill / member card / profile section） |
| `apps/web/src/components/public/MemberFilters.client.tsx` | active tag pill に `aria-pressed` + `data-selected` を付与 |
| `apps/web/src/components/public/MemberCard.tsx` | `data-component="member-card"` + hover/focus markup |
| `apps/web/src/components/public/MemberDetailSections.tsx` | `SectionVisibility = "public" \| "member" \| "admin"` local type と `data-visibility` 付与 |
| `apps/web/src/components/public/FormPreviewSections.tsx` | profile section と同等の data attribute を保持する preview |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | active tag pill の ARIA / data attribute unit |
| `apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx` | visibility fallback / fixture mutation の component unit |
| `apps/web/src/components/public/__tests__/FormPreviewSections.component.spec.tsx` | preview と本番 markup の parity |
| `apps/web/playwright.config.ts` | task 固有 visual project と outputDir |
| `apps/web/playwright/fixtures/auth.ts` | visibility mutation fixture（member / admin 視点） |
| `apps/web/playwright/tests/visual/visual-feedback.spec.ts` | tag pill / member card / profile section の 5 visual smoke |

## Contract

- token / OKLch 値は変更しない。`apps/web/src/styles/tokens.css` を正本として `globals.css` から消費する。
- `aria-pressed` を active tag pill 削除 button の主契約とし、視覚 selector は `data-selected="true"` に寄せる。通常 button に `aria-selected` は付与しない。
- profile section の scope は `[data-component="profile-section"][data-visibility]` に限定し、global selector に漏らさない。
- member card は `:hover` と `:focus-within` を **両方** 必須化する（keyboard parity）。
- `SectionVisibility` は `MemberDetailSections.tsx` 内の **local type**。public API response shape には出さない。
- `section.visibility` 未定義は `"public"` に fallback。production API は未提供のため `member` / `admin` visibility は component fixture または mock route で証明する。
- `apps/api` / D1 schema / public response shape / OKLch token value は変更しない。

## AC to Runtime Path

| AC | Runtime path | Evidence kind |
| --- | --- | --- |
| G3-1 active fill | `/members` filter row → `MemberFilters.client` active pill | screenshot `tag-pill-selected.png` + unit (`aria-pressed=true`) |
| G3-1 default | 同上 default state | screenshot `tag-pill-default.png` |
| G3-2 hover | `/members` card grid → hover Playwright | screenshot `member-card-hover.png` |
| G3-2 focus-within | 同上 keyboard focus | screenshot `member-card-focus.png` |
| G3-3 public | `/members/[id]` profile sections (fallback) | screenshot `profile-section-public.png` |
| G3-3 member | fixture mutation で visibility=member | screenshot `profile-section-member.png` |
| G3-3 admin | fixture mutation で visibility=admin | screenshot `profile-section-admin.png` |
| Accessibility | axe critical 0 | Playwright + axe report |

## Phase 11 Evidence

| Path | Meaning |
| --- | --- |
| `outputs/phase-11/main.md` | evidence index |
| `outputs/phase-11/evidence/command-contract.md` | 実在 script に合わせた検証コマンド正本 |
| `outputs/phase-11/screenshots/*.png`（7 枚） | G3-1/2/3 視覚証跡 |
| `outputs/phase-11/screenshots/metadata.json` | capture metadata |
| `outputs/phase-11/evidence/playwright-report/results.json` | 5 passed Playwright report（注: outputDir 絶対パスは workflow が completed-tasks 配下に移る前の dir name を含む。runtime 整合のため再生成までは記録として残す） |
| `outputs/phase-11/evidence/monocart/index.json` | 5 passed monocart 集計 |

## Phase 12 Required Files

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present（Part 1 中学生レベル + Part 2 技術者レベル） |
| `outputs/phase-12/system-spec-update-summary.md` | present（System Spec Change 判定: N/A） |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present（0 newly formalized tasks） |
| `outputs/phase-12/skill-feedback-report.md` | present（全 routing は no-op） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present（9-section compliance） |

## Skill Promotion

| 項目 | Owner | 判定 | 根拠 |
| --- | --- | --- | --- |
| Phase 12 strict 7 / 3-state verdict / command drift gate | task-specification-creator | `no-op (existing rule covers)` | `references/phase-12-spec.md`, `references/phase12-compliance-check-template.md` |
| OKLch token + Tailwind 消費契約 | aiworkflow-requirements (this skill) | `applied (artifact-inventory + lessons-learned)` | 本 inventory と `references/lessons-learned-parallel-03-prototype-ux-css-2026-05.md` |
| visual fixture contract | workflow local | `applied` | `phase-11-manual-test.md`, `playwright/fixtures/auth.ts` |

## Open Follow-Ups

| Task / Issue | Reason |
| --- | --- |
| `docs/30-workflows/parallel-06/` 系（仮称） | API 側 section `visibility` field が追加された場合、`SectionVisibility` を server contract へ昇格し UI fallback を廃止する（現在は no-op routing） |
| Phase 13 user gate | commit / push / PR は user approval 後 |

## Rollback Contract

| 種別 | 操作 |
| --- | --- |
| local revert | `git checkout -- apps/web/src/styles/globals.css apps/web/src/components/public/*.tsx apps/web/playwright/**` |
| docs revert | `docs/30-workflows/completed-tasks/parallel-03-prototype-ux-css/` を `git rm -r`（未コミットなら untracked のため delete） |
| skill revert | `.claude/skills/aiworkflow-requirements/{indexes,references,changelog}` 該当行を revert |
| PR revert | Phase 13 で PR が merge 済みの場合のみ `gh pr revert` 系 |

## Related Resources

- `indexes/quick-reference.md`（§parallel-03-prototype-ux-css）
- `indexes/resource-map.md`（parallel-03 行）
- `indexes/topic-map.md`（行範囲インデックス）
- `references/task-workflow-active.md`（§parallel-03-prototype-ux-css 行）
- `references/lessons-learned-parallel-03-prototype-ux-css-2026-05.md`
- `changelog/20260515-parallel-03-prototype-ux-css.md`
- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-prototype-ux-css/spec.md`
- 上位設計 spec: `docs/00-getting-started-manual/specs/09-ui-ux.md`, `docs/00-getting-started-manual/specs/design-tokens.md`
