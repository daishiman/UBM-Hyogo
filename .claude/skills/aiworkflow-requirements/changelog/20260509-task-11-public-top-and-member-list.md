# 2026-05-09 task-11 public top and member list

## サマリ

- workflow root: `docs/30-workflows/task-11-public-top-and-member-list/`
- state: `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- scope: public top `/` and member list `/members` implementation specification
- synced artifacts: Phase 1-13, Phase 12 strict 7 files, root/output `artifacts.json` parity
- canonical contract: existing `/public/stats` and `/public/members` consumption only, no `apps/api/**` changes, `apps/web` D1 import forbidden, OKLch token-only styling, `router.replace` URL canonical search state, stats revalidate 60s and members revalidate 30s
- dependencies: task-02, task-04, task-05, task-08, task-09, task-10
- downstream: task-18 regression smoke / verify-design-tokens
- boundary: apps/web implementation is reflected locally; runtime screenshot / axe / coverage, commit, push, and PR remain user-gated

## 実装上の主要な再構成

| 領域 | 変更 |
|------|------|
| route segment colocation | `app/(public)/members/_components/{MemberList,MembersFilterBar.client}.tsx` を削除し `apps/web/src/components/public/` へ集約（`MemberFilters.client` / `MemberGrid` / `MemberTable` / `DensityToggle.client`） |
| 公開トップ section 構成 | Hero / StatCard / Timeline 3 階層 → Hero / Stats / ZoneIntro / Timeline の 4 セクション集約構造へ置換。`StatCard` 削除、`Stats.tsx` / `ZoneIntro.tsx` 新設 |
| 共通レイアウト | `apps/web/src/components/public/{PublicHeader,PublicFooter}.tsx` 新設、`app/(public)/layout.tsx` 更新 |
| API adapter 層 | `apps/web/src/lib/api/public.ts` 新設（fetch wrapper + zod parse + revalidate 集約）、`__tests__/public.test.ts` で contract test |
| rendering 戦略 | `force-dynamic` 撤去 → React canary `connection()` + `revalidate` 二段構成へ移行 |
| Playwright | `playwright.config.ts` を `desktop-chromium` 単独 project に絞り込み、`playwright/tests/public-top-and-list.spec.ts` 新設 |

## Lessons / 苦戦箇所

詳細は `references/lessons-learned-task-11-public-top-and-member-list-2026-05.md` 参照（L-T11-001〜006）:

- **L-T11-001**: route segment colocation `_components/` 廃止 → `src/components/public/` 一元集約
- **L-T11-002**: Hero / StatCard / Timeline 単体構成 → 4 セクション集約構造への置換（StatCard 削除、Stats / ZoneIntro 新設）
- **L-T11-003**: `apps/web/src/lib/api/public.ts` API adapter 層新設で不変条件 #5（D1 直接アクセス禁止）を fetch wrapper + zod parse で強制
- **L-T11-004**: `force-dynamic` 撤去 → `connection()` 移行（OpenNext + Cloudflare Workers での build-time fetch 回避）
- **L-T11-005**: local D1 に `member_identities` 不在で screenshot / axe 未取得（`PENDING_RUNTIME_EVIDENCE`）→ task-ut-04 seed-data-runbook follow-up 起票
- **L-T11-006**: `playwright.config.ts` を `desktop-chromium` 単独 project へ絞り込み（task-08b firefox / mobile follow-up と関連）

## Promotion path

- 現在: `docs/30-workflows/task-11-public-top-and-member-list/`（current canonical / implementation）
- runtime evidence 取得（screenshot / axe / coverage）+ commit / push / PR 完了後 → `docs/30-workflows/completed-tasks/task-11-public-top-and-member-list/` へ promote
- promote 条件: Phase 11 outputs から `PENDING_RUNTIME_EVIDENCE` を解消（task-ut-04 seed-data-runbook 完了後の再撮影）+ task-18 regression smoke 緑

## 関連 references

- `references/task-workflow-active.md` L685 付近（task-11 current canonical entry）
- `references/lessons-learned-task-11-public-top-and-member-list-2026-05.md`（L-T11-001..006）
- `references/lessons-learned-06a-public-web-2026-04.md`（L-06A-001..005、route group / searchParams Promise 化など先行教訓）
- `references/lessons-learned-task-10-ui-primitives-2026-05.md`（L-T10-001..004、task-10 ui primitives 統合）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/claude-design-prototype/`

## Follow-ups

- **task-ut-04 seed-data-runbook**: local D1 に `member_identities` 等の seed data を投入する runbook 整備（L-T11-005 起因）
- **task-08b cross-browser smoke 復活**: firefox / mobile-chrome project を baseline 緑固定後に追加（L-T11-006 起因）
- **task-18 regression smoke / verify-design-tokens**: OKLch token gate / `force-dynamic` grep gate / D1 直接 import grep gate を CI に組み込み
