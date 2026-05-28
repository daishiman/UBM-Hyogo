# Lessons Learned — admin-audit-prototype-alignment (2026-05-27)

## L-AAUDIT-001: root mount regression test は `apps/api/src/index.spec.ts` で再現ラッパを作って 401 期待で固定する

`/admin/audit?limit=50 → 404` の staging 観測は、code path では `requireAdmin` middleware 経由で 401/403 を返すはずだった。実態は staging deploy または env mismatch が主仮説だが、CI で再発検知できるのは「root mount が `app.route("/admin", adminAuditRoute)` で正しく繋がっているか」のみ。

**汎化**: admin route 追加時は `apps/api/src/index.spec.ts` に root mount 経由で `/admin/<path>?<minimal-query>` を request し、**401（404 ではない）** を期待する spec を 1 件追加する。これにより mount 順序ミス / path duplication / handler 配線崩れを CI で検知できる。

## L-AAUDIT-002: `Banner` primitive は `warning` / `danger` の 2 tone のみ。`error` tone は存在しない

`AuditLogPanel` で 404 hint を表示する際、`Banner tone="error"` と書いてしまい typecheck で fail。実 API は `warning` / `danger` の 2 tone。

**汎化**: admin design language で error 表示が必要な場合は `Banner tone="warning"` を使い、致命的エラーは `tone="danger"` を使う。`error` / `info` / `success` は存在しないため、新規追加は別 RFC が必要。

## L-AAUDIT-003: `Button` primitive は polymorphic link rendering を持たない。link button は `buttonVariants` + `<a>` で構成する

`Button asChild` や `<Button href>` パターンを期待してしまったが、本 repo の `Button` は内部 `<button>` 限定。リンクとして描画する場合は `<a className={buttonVariants({ variant: "outline" })}>` で構成する。

**汎化**: admin filter form / pagination で「リンクとして見えるが anchor として動く」要素は `buttonVariants` + `<a>` を採用。`Button` 自体を polymorphic 化しない（design system invariant）。

## L-AAUDIT-004: page-local `<h1>` は `AdminPageHeader` 採用時に必ず撤去する

`/admin/audit` 移行時、`page.tsx` で `AdminPageHeader` を使ったが `AuditLogPanel` 内部に `<h1>監査ログ</h1>` が残っていて二重 h1 を生んだ。Playwright spec の `h1` count assertion で発覚。

**汎化**: `AdminPageHeader` を採用する admin page では、配下 panel component の page-local `<h1>` を grep で全撤去し、`headingId` 譲渡パターン（`AuditLogPanel` 側は `<section aria-labelledby={headingId}>` のみ）にする。`page-head` 二重描画は `admin-shell-topbar-sidebar-integration` の L-ASHELL-001 と同根（admin shell header 撤去契約）。

## L-AAUDIT-005: `safeServerFetch` の 404 reason 展開は staging 観測文字列を入力にした regression test で固定する

`admin api /admin/audit?limit=50 failed: 404` という staging 観測ログ文字列を input にした test ケースを `safe-server-fetch.spec.ts` に追加し、`ADMIN_FETCH_404` reason への展開を固定。

**汎化**: staging 観測 error 文字列は必ず regression test の input として保存する（test fixture コメントに staging 観測 timestamp + URL を残す）。これにより「同じ文字列が再発した場合に確実に reason 展開される」ことを CI で保護できる。`admin-tag-queue-ui-and-404-recovery` の L-ATAGUI-001 と同パターン。

## Note: admin-staging-visual spec 共通テンプレ提案

`/admin/audit`, `/admin/meetings`, `/admin/tags`, `/admin/schema`, `/admin/requests`, `/admin/members`, `/admin/identity-conflicts` の admin-staging-visual spec は構造がほぼ同形（unauthenticated guard 描画 + filter UI parity + page-head primitive 検証）。`apps/web/playwright/tests/visual-staging/_admin-page-template.ts` のような shared fixture を 1 つ作って各 spec から re-export する形にすると、新規 admin page 追加時の spec 重複が減る（次サイクルで検討）。

関連: [[admin-meetings-prototype-alignment]], [[admin-tag-queue-ui-and-404-recovery]], [[admin-shell-topbar-sidebar-integration]], [[admin-requests-prototype-alignment-and-404-fix]]
