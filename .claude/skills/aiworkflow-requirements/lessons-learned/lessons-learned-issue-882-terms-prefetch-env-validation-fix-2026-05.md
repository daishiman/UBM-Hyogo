# Lessons Learned: issue-882-terms-prefetch-env-validation-fix

## L-TERMSPREFETCH-001: zod throwing env getter は application 経路用、metadata 生成経路は safe accessor を分離する

`getPublicEnv()` のような throwing parser は API call / server action など「失敗したら止めるべき」アプリケーション経路には適切だが、Next.js の `generateMetadata()` は `<Link prefetch>` 経由で隣接 route の RSC fetch を引き起こすため、env 未解決時に throw すると hover した親ページ側まで client error として現れる。実装側で env を直接参照せず `getPublicEnvSafe(): T | undefined` を別出口として用意し、metadata 専用 fallback (local URL + `robots: { index:false }`) を private resolver に閉じ込めることで、env contract（必須項目・throw 仕様）を維持したまま prefetch chain を安全化する。

## L-TERMSPREFETCH-002: prefetch 起因の console error は親ページの manual test では「同一 route の問題」として誤認されやすい

`/` の Phase 11 manual test で `/terms` の env validation throw が `/` の Console error として可視化された事例。RSC prefetch は直接 hover 元 route には属さないため、症状（`/` で error）と原因（`/terms` metadata generation）が乖離する。Phase 11 manual test では Network panel で 4xx を出している route を確認し、`Link` prefetch 由来か router prefetch 由来かを切り分けてから fix scope を決める。Playwright smoke は `/` 表示後に target route への 4xx と console error 0 件を 1 spec で固定すると再発防止になる。

## L-TERMSPREFETCH-003: CLOSED 済み Issue でも未解決経路があれば `Refs #N` 仕様書化して残す

Issue #882 は GitHub 上では CLOSED だが、git log に該当 commit がなくコード経路は残存していた。CLOSED 維持 + `Refs #882` のまま canonical workflow を立てる選択肢は、Issue を re-open するよりも検出根拠（git log 検索）と修正履歴を 1 箇所に集約しやすい。`issue_state: CLOSED` + `issue_policy: keep_closed_refs_only` を artifacts.json に明示し、PR 文脈も `Fixes` ではなく `Refs` を強制する。

## L-TERMSPREFETCH-004: source follow-up は consumed 後に `completed-tasks/` 平置きへ移動する

`docs/30-workflows/unassigned-task/` 配下の follow-up が canonical workflow で吸収された場合、削除ではなく `docs/30-workflows/completed-tasks/` 直下に移動して trace を残す。削除すると artifact inventory の Source follow-up リンクが切れて経緯が追えなくなる。
