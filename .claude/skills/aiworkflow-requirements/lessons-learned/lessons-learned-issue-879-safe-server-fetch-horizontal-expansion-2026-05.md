# Lessons Learned: issue-879 safeServerFetch member/public horizontal expansion

## L-ISSUE-879-001: layer-specific helper を横展開する時は「common 昇格 + 既存 adapter 縮小」（Option B）が破壊変更ゼロで進む

`apps/web/src/lib/admin/safe-server-fetch.ts` を public/member layer から再利用したい場合、
new shared helper を別 path に切り、admin 側は signature を維持した thin adapter に縮小する。
admin の既存 spec の `ADMIN_FETCH_401` などの error code 文字列を一切変えずに横展開できる。

5-minute resolution:

1. `apps/web/src/lib/server-fetch/safe-fetch.ts` のような layer 中立な path に common 関数を置く。
2. layer-specific の既存ファイルは signature 維持の re-export adapter にする（`codePrefix` だけ注入）。
3. 既存 admin spec は touch せず PASS することを最初に verify。
4. 新 layer (public/member) はこの new path から import する（admin path は admin 専用と読み取れる名前を保つ）。
5. Option A（admin path を共用）は admin/member 双方の codePrefix を引数化する破壊変更になるため避ける。

## L-ISSUE-879-002: page-fatal error（auth redirect / notFound）は SafeResult に閉じ込めない

server component の `redirect()` / `notFound()` は framework が throw する制御フロー signal。
これを SafeResult で `{ok: false}` に変換すると Next.js の redirect/404 が抑止され、UX が壊れる。

5-minute resolution:

1. `safeServerFetch` に `rethrowOn: [AuthError, NotFoundError]` のような pass-through 指定を持たせる。
2. 該当 error class を `instanceof` で判定し、その時だけ re-throw。
3. `redirect()` / `notFound()` の native error も対象に含める場合は Next.js の `isRedirectError` / `isNotFoundError` を併用する。
4. spec で「fatal は throw / transient は SafeResultError」の2系統を明示テストする（fatal の spec は throw を expect、transient は SafeResultError shape を assert）。

## L-ISSUE-879-003: section degrade は `SectionError` primitive 1つに寄せる

profile / public members / member detail で「fetch 失敗時 page 全体を 500 にせず該当 section だけ degrade」を導入する場合、
section ごとに inline error UI を散らさず、`role="alert" aria-live="polite"` 付きの primitive を 1つだけ作る。

5-minute resolution:

1. `apps/web/src/components/public/SectionError.tsx` のような共通 primitive を `props: {title?, detail?, retryHref?}` で1つ作る。
2. tokens.css に従う class 名のみで配色（HEX 直書き禁止、design-token gate に通る）。
3. retryHref を持つかどうかで「再読み込み」リンクを出し分け。
4. component spec で role/aria-live/3 props の組み合わせを最小 fixture で固定。

## L-ISSUE-879-004: docs-only spec_created / implementation_local_evidence_captured の2層分離が CLOSED 維持時に必要

既存 CLOSED issue (#879) に対する横展開 spec は、`docs-only spec_created` で artifacts.json Gate-A を passed にし、
実装後は `implementation_local_evidence_captured / NON_VISUAL` に昇格させる。CLOSED は維持。

5-minute resolution:

1. Phase-1 で issue が CLOSED か確認し、`spec_from_closed_issue: true` を artifacts.json に明記。
2. 実装 commit/push/PR は user-gated。spec 作成と実装は同じ branch で良いが PR base は dev。
3. completed-tasks への移動は実装後の closeout で実施。移動時は stale 参照を全 docs/.claude 横断 grep で補修。
4. `pnpm indexes:rebuild` で keywords.json / topic-map.md が drift しなくなることを最終 verify。

## L-ISSUE-879-005: artifact-inventory は changelog と同 wave で記載する

`workflow-<id>-artifact-inventory.md` を作らないと keywords.json/topic-map.md の自動索引化が走らず、
将来の cross-workflow 検索で hit しない。

5-minute resolution:

1. changelog (`.claude/skills/aiworkflow-requirements/changelog/<date>-<id>.md`) と一緒に artifact-inventory を必ず書く。
2. artifact-inventory の semantic filename には `member-public-horizontal-expansion` のように layer scope と pattern 名を入れる。
3. `pnpm indexes:rebuild` 後の git diff で keywords.json / topic-map.md の差分が新 inventory を取り込んでいるかを確認。
