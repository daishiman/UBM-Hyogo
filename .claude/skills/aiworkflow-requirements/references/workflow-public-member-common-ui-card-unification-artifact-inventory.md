# workflow-public-member-common-ui-card-unification Artifact Inventory

## Summary

| Item | Value |
| --- | --- |
| workflow | `public-member-common-ui-card-unification` |
| status | `implemented_local_visual_pending / implementation / VISUAL / local_screenshot_pending` |
| workflow root | `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/` |
| surface | public/member/auth user-visible routes |

## Specification Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/index.md` | workflow overview and lane topology |
| `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/artifacts.json` | root workflow ledger |
| `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/outputs/artifacts.json` | output mirror; parity with root ledger |
| `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/phase-1-requirements.md` | AC-1..AC-12 and card-mapping SSOT |
| `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/phase-2-design.md` | props/data-attribute/CSS contract |
| `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/phase-5-implementation.md` | Lane A -> B/C implementation runbook |
| `docs/30-workflows/completed-tasks/public-member-common-ui-card-unification/outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 compliance evidence |

## Implementation Targets

| Area | Local paths |
| --- | --- |
| Layout primitives | `apps/web/src/components/ui/layout/{PageShell,PageHeader,SectionCard,ContentCard,Prose,index}.tsx` |
| Button link | `apps/web/src/components/ui/ButtonLink.tsx` |
| CSS | `apps/web/src/styles/layout-primitives.css`, `apps/web/src/styles/globals.css` |
| Public pages | `apps/web/app/(public)/**`, `apps/web/src/components/public/**`, `apps/web/src/components/legal/LegalProse.tsx` |
| Member/auth pages | `apps/web/app/(member)/profile/**`, `apps/web/app/(auth)/login/**` |

## Evidence Boundary

| Evidence | Status |
| --- | --- |
| Phase 12 strict 7 | present |
| apps/web implementation | present |
| focused apps/web Vitest | PASS: 62 tests / 7 files (ButtonLink 13 + layout 5 files + public.spec.ts 7) |
| typecheck/lint | PASS: root typecheck (7 projects) + apps/web eslint + verify-no-inline-style OK; HEX 0 |
| local visual screenshots | partial (representative PNGs present; full 16-shot plan pending) |
| staging visual baseline | user-gated |

## Invariants

- `apps/api`, D1 migrations, Google Form schema, and public API response surface are unchanged by this spec package.
- Admin screen adoption is outside the current user-facing scope and is recorded as out-of-scope inventory, not as unfinished current work.
- Commit, push, PR, and staging visual capture remain user-gated.

## Lessons Learned

- **L-PMCUC-001 (共通プリミティブ層SSOT化)**: 公開/会員/auth の8画面が個別に持っていたカード・背景・ボタン・本文タイポを、`apps/web/src/components/ui/layout/{PageShell,PageHeader,SectionCard,ContentCard,Prose}` + `ButtonLink` + `layout-primitives.css` の単一プリミティブ層へ集約した。表現の切替は `data-variant`（panel/card/dark/public/member 等）と CSS 変数で行い、HEX 直書きを 0 に保つことで `verify-no-inline-style` / token gate を緑のまま維持できる。改善起点が単一化されたため、以後の見た目調整は primitive 1 箇所で全画面に波及する。
- **L-PMCUC-002 (Lane A 先行の依存順は崩せない)**: Lane A（primitive 層 + CSS）が固まる前に Lane B（公開6画面）/ Lane C（profile/login）の移行へ着手すると、移行先が描画契約（props / data-attribute）を参照できず手戻りになる。Lane A → B/C の依存順は構造上の必然であり、B/C は A 完了後なら並列で進められる。
- **L-PMCUC-003 (既存テストを壊さない pass-through 移行)**: SectionCard / ContentCard は既存の `data-testid` / `aria-*` / `role` を透過（pass-through）させることで、画面移行後も既存 spec を破壊しない。ButtonLink は `Button` と `buttonVariants` を共有して variant(`primary/accent/ghost/soft/danger`)・size(`sm/md/lg`) 体系を統一する。仕様外の `secondary` は `ghost` へフォールバックする上位互換の追加であり AC-2 の「Button と同一体系」要件には違反しない。
- **L-PMCUC-004 (LegalProse は class 等価化で互換維持)**: `/privacy` `/terms` の `LegalProse` は `ui-prose` クラスを当てて `Prose` と CSS 等価にしつつ、既存の `<article>` タグ構造は I-7 互換のため維持した。DOM 構造を変えずクラス契約だけ揃えることで visual を統一しながら既存挙動を保てる。
- **L-PMCUC-005 (状態昇格は同一 wave で全 index 統一)**: spec-readiness close-out 後に apps/web 実装 diff が出現したため Phase 12 で `spec_created` → `implemented_local_visual_pending` へ昇格した。このとき resource-map / SKILL-changelog / LOGS の状態文字列を**同一 wave で実態へ統一しないと4系統 drift（実態系3 vs `spec_created`系3）が残る**。状態昇格を伴う skill-sync では「state を持つ全ファイルを grep で洗い出してから直列編集」を必須手順とする。generate-index は topic-map / keywords のみ再生成し resource-map / quick-reference は手書きのため、後者の状態文字列は rebuild では直らず手動是正が要る。
