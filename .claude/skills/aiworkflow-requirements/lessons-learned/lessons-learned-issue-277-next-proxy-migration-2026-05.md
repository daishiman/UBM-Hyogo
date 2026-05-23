# Lessons learned: Issue #277 Next.js proxy migration

## L-I277-001: Next.js 16 では auth gate convention が `middleware.ts` から `proxy.ts` へ移行

`apps/web/middleware.ts` の named/default export `middleware` は Next.js 16 で deprecated 扱いとなり、auth gate convention は `apps/web/proxy.ts` の named/default export `proxy` に切り替える。`SESSION_COOKIE_NAMES` / `decodeAuthSessionJwt` / `config.matcher` は同値のまま rename のみで挙動を維持する。convention 切替時は `apps/web` 配下に stale `middleware.ts` 残骸が無いことを `rg -n "middleware\\.ts" apps/web --glob '!middleware.ts'` で grep gate 化する。

## L-I277-002: `NextResponse.redirect(url)` の既定 status は 307。仕様・テスト・evidence で必ず統一

302 と 307 が混在すると焦点テストが流動的に fail する。仕様書・自動テスト assertion・Phase 11 manual curl evidence を **307 に統一** して矛盾を消す。`NextResponse.redirect(url, 307)` を明示するか、既定 307 を前提に表に書き残す。302 で書かれた旧仕様が残っていれば Phase 12 で必ず修正する。

## L-I277-003: 認証 gate の自動テストは `it.todo` 不可。matcher 全分岐を実テストにする

未ログイン admin / 未ログイン profile / 認証済 non-admin / 認証済 admin / `/profile/edit?tab=tags` query 保持 / matcher 適用範囲、の最低 7 ケースを `proxy.spec.ts` で実テスト化する。`@ubm-hyogo/shared` の `signSessionJwt` + `asMemberId` で valid session cookie を生成し、`it.todo` で gate close-out しない。task spec の Phase 6/7/10 にも反映済み。

## L-I277-004: file rename 時の coverage include は vitest と package.json の二箇所同期が必須

`vitest.config.ts` の `include:` / `coverage.include:` と `apps/web/package.json` の coverage path 双方を更新しないと、新 `proxy.ts` が coverage report から漏れ false negative を生む。rename PR では「ファイル移動 + 旧パス削除 + 新パス coverage include 追加」を unit にして git status で確認する。

## L-I277-005: strict 7 outputs は flat workflow root と同一 wave で配置

Phase 12 close-out で `outputs/phase-12/{main, implementation-guide, system-spec-update-summary, documentation-changelog, unassigned-task-detection, skill-feedback-report, phase12-task-spec-compliance-check}.md` の 7 file は workflow 着手時に空 placeholder を一括生成し、Phase 進行とともに埋めていく。Phase 12 で初めて作ると aiworkflow indexes / quick-reference / artifact inventory が後追い同期になり drift が出る。

## L-I277-006: admin layout comment の旧名残しが grep noise を生む

`apps/web/app/(admin)/layout.tsx` のコメントで `middleware.ts` を参照しているとリネーム後の grep gate に noise が乗る。convention 名を文章中に書く場合は「route-local proxy（旧 middleware）」のように現行名を主、旧名を括弧書きにする。
