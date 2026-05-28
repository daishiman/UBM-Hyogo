# Lessons Learned — admin-shell-topbar-sidebar-integration (2026-05)

`docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/` の実装サイクルで得た苦戦箇所を体系化する。将来「topbar 撤去と page-local owner の境界」「Server layout × Client sidebar 境界」「active 判定の `/` と `/admin` exact-match」「fixture 経路で port 依存を切る」「VISUAL_ON_EXECUTION の Phase 11 を同一 wave で確定させる」を簡潔に解決するための原則を残す。

## L-ASHELL-001: topbar 撤去は「空 header を残さない」契約として明示する

- **苦戦**: topbar の固定文字列「管理」と空 actions slot を撤去した後、空 `<header>` を残すかどうか layout.tsx と Phase 11 screenshot の両方で揺れた。
- **原因**: 「撤去」を「内容空化」と誤読すると、空 element が a11y tree と visual rhythm の両方に残り、page-local `AdminPageHeader` と二重 header になる。
- **対策**: requirements / phase-2-design / phase-12-compliance に「shell header element 自体を render しない（page-local `AdminPageHeader` のみが page chrome を所有する）」と書く。Phase 11 visual evidence に `task-A-topbar-removed-1280.png` を strict 7 と並べ、AC として "no shell-owned header element" を grep / DOM assertion 両方で固定する。

## L-ASHELL-002: Server layout + Client sidebar の boundary は `usePathname` 依存で決める

- **苦戦**: `(admin)/layout.tsx` は auth gating のために Server Component を維持したいが、sidebar の active 判定に `usePathname` が必要で Client 化が要る。両者を 1 ファイルにすると Server 関数 (`getSession`) と Client hook が同居して build fail する。
- **原因**: 「sidebar = 1 file = client」という素直な構造が Server-only auth と衝突する。
- **対策**: layout は Server のまま、`AdminSidebar.tsx` を `'use client'` の薄い shell にし、active 判定が必要な部分だけ `AdminSidebarNavItem.tsx` (client) に分離する。`AdminBrandBlock.tsx` のような pathname 非依存 block は Server 可で残し、Client 境界を最小化する。schemaDiffCount / userDisplayName / userEmail は layout (Server) で resolve して props 注入する。

## L-ASHELL-003: active 判定は `/` と `/admin` の exact-match を純関数 + spec で固定する

- **苦戦**: `pathname.startsWith(itemHref)` だけで判定すると `/` が全 route で active 化し、`/admin` が `/admin/members` でも active 化して 2 行同時にハイライトされた。
- **原因**: prefix-match は root path と segment root に対して必ず誤動作する。consumer 側 spec だけだと回帰時に primitive を疑えない。
- **対策**: `apps/web/src/components/layout/isActive.ts` に純関数として抽出し、`itemHref === "/" → pathname === "/"`、`itemHref === "/admin" → pathname === "/admin"`、それ以外は `pathname === itemHref || pathname.startsWith(itemHref + "/")` の 3 分岐を固定する。`__tests__/isActive.spec.ts` で `/`, `/admin`, `/admin/`, `/admin/members`, `/admin/members/123` の 5 境界を assert し、回帰を pure-function spec で検出する。

## L-ASHELL-004: schema diff badge は既存 endpoint の derive で出し、新 endpoint を生やさない

- **苦戦**: sidebar の schema diff badge 表示数を取得するために `/admin/schema/diff/count` のような新 endpoint を作りたくなった。
- **原因**: UI primitive に対して 1:1 で endpoint を生やすと、UI prototype alignment の「既存 API endpoint surface のみ利用」不変条件を破る。
- **対策**: 既存 `GET /admin/schema/diff` を `safeServerFetch` 経由で取得し、`items.filter(i => i.status === "queued").length` で derive する。fetch 失敗時は `items: []` にフォールバックし、badge を 0 で安全に消す。AC として「derive 経路のみ」「fetch fail で badge=0」「count は server boundary で確定し client に props 注入」の 3 点を spec で固定する。

## L-ASHELL-005: VISUAL_ON_EXECUTION の Phase 11 は同一 wave で fixture screenshot を確定する

- **苦戦**: 「apps/web に local 実装が既にある」状態で Phase 11 を `pending` のまま `spec_created` 扱いにすると、verifier が drift を検出し `implemented_local_evidence_captured` への昇格と Phase 11 fixture screenshot の同時生成が必要になった。
- **原因**: local 実装あり × visualEvidence=VISUAL_ON_EXECUTION の組み合わせを `spec_created` で凍結する誘惑が強いが、これは workflow_state と差分の矛盾になる。
- **対策**: dirty diff に `apps/web/**` が含まれかつ `visualEvidence=VISUAL_ON_EXECUTION` の場合、`workflow_state=implemented_local_evidence_captured` に promote し、同一 cycle で `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` などの env-gated fixture を立て、`outputs/phase-11/*.png` を生成する。fixture は mock API port の起動順に依存せず、`server-fetch.ts` 側で env-gated に分岐させて Phase 11 を deterministic にする。staging baseline / commit / push / PR は引き続き user-gated とし、local fixture と staging baseline の二段構成を明示する。

## 関連リソース

- workflow root: `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/`
- artifact inventory: [[workflow-admin-shell-topbar-sidebar-integration-artifact-inventory]]
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260526-admin-shell-topbar-sidebar-integration.md`
- parent: `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-A-admin-shell-integration.md`
- prior lessons: [[lessons-learned-issue-894-admin-topbar-breadcrumb-integration-2026-05]] / [[lessons-learned-issue-895-admin-topbar-actions-client-island-2026-05]]
