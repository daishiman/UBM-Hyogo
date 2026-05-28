# Lessons Learned — admin-ui Task C (AdminPageHeader 統一 + token 整流化) 2026-05

`docs/30-workflows/completed-tasks/admin-ui-task-c-pageheader-token-conformance/` の実装サイクルで得た苦戦箇所を体系化する。将来「page-head と panel の h1 二重所有」「page-local `<main>` 残骸」「palette literal 残り」「token spec 同期漏れ」を簡潔に解決するための原則を残す。

## L-TASKC-001: AdminPageHeader 採用と panel 保有 h1 の二重所有を一気に解消する

- **苦戦**: 9 page に `AdminPageHeader` を載せたが、`MeetingPanel` / `RequestQueuePanel` / `AuditLogPanel` / `SchemaDiffHistoryPanel` / `MeetingAttendancePanel` が legacy で `<h1 id="...-h">` を保有しており、page-head と二重に h1 が出力された。Phase 11 の axe / a11y 観察で初めて顕在化した。
- **原因**: 「page header 統一」を page.tsx の追加だけで完結すると見積もり、既存 panel の chrome 所有権を contract レベルで再設計しなかった。
- **対策**: `showHeading?: boolean` / `showChrome?: boolean` の **後方互換 prop**（default `true`）を panel 側に追加し、Task C pages から `false` で抑止する。既存 caller の振る舞いを破壊しないこと。Phase 4 test plan に「page-head h1 と panel h1 の同時 render 0 件」を grep / DOM 双方で gate に含める。

## L-TASKC-002: page-local `<main>` は layout の `<main>` 所有と二重 landmark になる

- **苦戦**: `identity-conflicts/page.tsx` だけ独自 `<main className="mx-auto max-w-5xl px-6 py-8">` を保持していて、`(admin)/layout.tsx` の `<main>` と二重 landmark になっていた。Tailwind palette literals (`text-zinc-600` / `text-blue-600` / `divide-zinc-200` / `border-zinc-200`) も同 page に固有で残存。
- **原因**: layout を後追いで導入した経緯で、先行 page だけが旧 chrome / palette を保持していた。
- **対策**: admin segment では「page.tsx は `<section>` 直返し」をルールとし、`<main>` 所有は `(admin)/layout.tsx` 一系へ集約する。Phase 9 grep gate に `grep -rn "<main" apps/web/app/\(admin\)/admin` を入れて 0 件を強制する。palette literals は `var(--ubm-color-*)` トークン経由のみ許可（Tailwind 直書き禁止）。

## L-TASKC-003: `headingId` props で h1 所有権を譲渡する契約を明示する

- **苦戦**: `AdminPageHeader` に h1 を移譲したいが、既存 section が `aria-labelledby="meetings-h"` 等で panel h1 を参照していたため、id 解決を壊さず移管する必要があった。
- **原因**: aria リンクは生 DOM id を経由するため、component の責務再配置に追従できない。
- **対策**: `AdminPageHeader` に `headingId?: string` props を追加し、外部からの id 注入を受け付ける。panel 側は `showHeading={false}` の場合に `aria-labelledby` を `aria-label` に切替えて a11y を保つ（h1 が外部にある場合の duplicate アンカー回避）。spec に「page-head が h1 を所有しつつ section の labeling は壊れない」ことを明示する。

## L-TASKC-004: eyebrow / link token は globals.css ではなく tokens.css と spec を同一 wave で同期

- **苦戦**: `--ubm-color-link-default` と `--ubm-eyebrow-tracking` を `tokens.css` だけに足して、`docs/00-getting-started-manual/specs/09b-design-tokens.md` への反映が後追いになった。`verify-design-tokens` は token 名の存在だけ見るため green になるが、spec 側に SSOT が無いと将来別命名で重複定義されるリスクがある。
- **原因**: token 追加を「実装の最小差分」と捉え、spec 側を後回しにした。
- **対策**: token 追加 PR は `tokens.css` と `specs/09b-design-tokens.md` を**同一 commit**で更新する。Phase 12 `system-spec-update-summary.md` に新規 token を必ず列挙し、spec 側で「いつ・なぜ・どこで使う」の 3 点を明示する。

## L-TASKC-005: primitive-adoption.spec のような構造 gate は新 page を追加した瞬間に enumeration を更新する

- **苦戦**: 9 page を一括で `AdminPageHeader` 採用に切替えた際、既存の `primitive-adoption.spec.ts` は古い enumeration（採用済み 2 page だけ）を期待していて、grep 0 件 / 全件採用 を broad に gate していなかった。
- **原因**: structure gate を「個別ファイル列挙」で書いており、列挙更新を spec 同期から漏らした。
- **対策**: structure gate は (a) `apps/web/app/(admin)/admin/**/page.tsx` 全件 enumerate + (b) 各 page が `AdminPageHeader` を import している、の 2 段で書く。新 page 追加で自動的に gate 対象に含まれるよう glob を spec 側で展開する。`apps/web/src/__tests__/admin-page-header-adoption.spec.ts` がその正本実装。

## 関連リソース

- workflow root: `docs/30-workflows/completed-tasks/admin-ui-task-c-pageheader-token-conformance/`
- artifact inventory: [[workflow-admin-ui-task-c-pageheader-token-conformance-artifact-inventory]]
- parent: `docs/30-workflows/admin-ui-prototype-alignment/` Task C
- 関連 lessons:
  - [[lessons-learned-issue-894-admin-topbar-breadcrumb-integration-2026-05]]（topbar / page-local の二重表示 → 本 lesson の panel / page-head 二重所有と同根）
  - [[lessons-learned-admin-ui-prototype-alignment-2026-05]]（admin segment の primitive 統一方針）
