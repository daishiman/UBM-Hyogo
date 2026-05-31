# Lessons Learned — member-header-admin-link (2026-05-28)

`docs/30-workflows/completed-tasks/member-header-admin-link/`
`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`

親 workflow `public-header-logged-in-nav-cleanup` Task E を独立 workflow として切り出し、`MemberHeader` admin CTA + `auth-view` 最小基盤を同 cycle で実装した際に体系化した知見。

## L-MHAL-001 親 workflow Task の独立 workflow 切り出しと依存最小閉包

親 workflow の単一 Task を独立 workflow に切り出す場合、依存する基盤（本件では `apps/web/src/lib/auth-view/`）を親 workflow 全体の進行を待たずに「対象 Task に必要な最小境界」だけ同 cycle で実装する。`AuthView` discriminated union / `resolveAuthView` pure / `getAuthView` async adapter の 3 層のみを切り出し、`PublicHeader` 側の session-aware 化（親 Task A/B/C）には踏み込まない。

- **Why:** 親 workflow 全体の完了を待つと blocker chain で着手不能。逆に基盤を親側で実装するまで待つと、本 workflow が `spec_created` のまま長期停滞する。
- **How to apply:** 切り出し workflow の Phase 1 で「親 workflow の Task X を独立化」と明示し、依存基盤の最小実装範囲を Phase 5 implementation guide に列挙する。親側 strict 7 と独立 workflow の strict 7 は別レイヤで両立させる（親は集約、独立は単一 close-out）。

## L-MHAL-002 `AuthView` discriminated union literal 固定 + admin-only field の型レベル分離

`AuthView` を `{ kind: "guest" } | { kind: "member"; profileHref: "/profile" } | { kind: "admin"; profileHref: "/profile"; adminHref: "/admin" }` の discriminated union として宣言し、`adminHref` を `admin` variant にのみ存在させる。consumer 側（`MemberHeader`）は `authView?.kind === "admin"` で narrow した後に admin CTA を render する。

- **Why:** `isAdmin: boolean` flat shape にすると admin link href を別 prop で運ばせる必要があり、型レベルで「admin でない時に admin href が undefined」を強制できない。union literal 固定は静的 grep gate（`grep -r 'kind: "admin"'`）にも乗る。
- **How to apply:** session-aware UI で「権限ごとに表示要素が増減する」場合は discriminated union を default 選択肢にする。href リテラルも union の field に持たせ、call site で string concat / template literal を避ける。

## L-MHAL-003 `data-auth-state` 属性で test selector 安定化（DOM attribute contract）

`MemberHeader` に `data-auth-state={isAdmin ? "admin" : "member"}` を付与し、Playwright / Vitest spec が `getByTestId("member-header").getAttribute("data-auth-state")` で session 状態を assertion できるようにする。union literal を export せず、DOM 属性の string value を contract とする。

- **Why:** TypeScript type export を test 側から import すると、type drift で test が型エラーになりやすい。DOM 属性 string は a) UI レンダリング結果として観測でき、b) static grep gate (`rg 'data-auth-state'`) で全 caller を一括検出できる。
- **How to apply:** session/state-aware なら primitive component に `data-<state-key>` 属性を 1 つ用意し、test は属性値で assert する。属性値の string 列は changelog / inventory に明記して将来の rename を回避。

## L-MHAL-004 `(member)/layout.tsx` async 化 + `getAuthView()` 1 回呼び出し配信

`(member)/layout.tsx` を async server component 化し、`getAuthView()` を layout で 1 回だけ呼び、子 component (`MemberHeader`) へ `authView` prop で配信する。page.tsx / 各 child で `getAuthView()` を再度呼ばない。

- **Why:** Server Components で session lookup を child 側で散発的に呼ぶと、同一 request 内で `getSession()` が複数回走り、N+1 的に Workers binding cold path を踏む。layout 単一呼び出しで request-scope cache 相当を実現できる。
- **How to apply:** session を 2 箇所以上で必要とする route group は、route group 直下の `layout.tsx` で async 化し prop drilling で配信する。child component は `authView?: AuthView` optional prop を受ける形にして、test の mock injection も props 経由で完結させる。

## L-MHAL-005 `getAuthView()` fail-closed guest fallback

`getAuthView()` 内部で `getSession()` を try / catch し、throw 時は `{ kind: "guest" }` を返す（fail-closed）。`(member)/layout.tsx` 側では catch せず、layout レベルで render が成立する保証を最小化する。

- **Why:** session lookup の throw を bubble up させると `app/error.tsx` boundary に飛んで member route 全体が 500 化する。member layout で「guest 表示にだけ落とす」のは、middleware 側 `/profile` redirect gate が後段で 401/302 を返すので user 体験が破綻しない（invariant #11 fail-closed と整合）。
- **How to apply:** auth view resolver 系の adapter は「throw を guest（最小権限）に閉じる」を契約として固定。`safeParse` / try-catch のいずれを採用するかは callsite の error boundary 戦略と合わせて Phase 2 で決める。

## L-MHAL-006 focused Vitest spec で `authView` injection / data-auth-state を 1 ファイル分離

`MemberHeader.spec.tsx` に「guest 既定」「member 表示」「admin で `/admin` CTA 出現」「`data-auth-state` 属性切替」を 1 spec ファイルにまとめ、`resolveAuthView.spec.ts` を別ファイルで pure function 単体検証する。`getAuthView.spec.ts` は `getSession()` mock × throw 時の guest fallback を別 spec で検証する。

- **Why:** UI render / pure resolver / async adapter の 3 層分離テストにすることで、回帰時に「型契約 / 純関数 / I/O 境界」のどこで壊れたかが spec name で即座に判別できる。同一 file に詰め込むと mock 設定が重くなり test isolation が低下する。
- **How to apply:** discriminated union × server component prop drilling の test は「resolver pure / adapter async / consumer render」の 3 spec を default 構成にする。1 spec ファイルあたり test 数は 5〜10 に収め、`data-*` 属性 assertion を必ず含める。

## Anti-pattern

- 親 workflow の進行を待って独立 workflow を `spec_created` 凍結 → 並行 wave で blocker chain が長期化、Phase 11 evidence の rot 期間が長くなる
- `isAdmin: boolean` flat prop で admin href を別 prop に切り出す → call site で「admin だが href 未指定」型違反を補足できず、ランタイム undefined deref が混入
- `MemberHeader` 内で直接 `getAuthView()` を呼ぶ → server / client 境界が暗黙化し、Vitest 側で必ず `getSession()` mock が必要になる
- DOM 属性ではなく TypeScript type export を test 側に import → `AuthView` rename 時に test だけ型エラー、UI 契約と test 契約が二重管理に
- `getAuthView()` の throw を layout で try/catch して握り潰し → error boundary が機能不全になり、後段の `middleware.ts` redirect も発火せず空白画面化

## 参照

- workflow root: `docs/30-workflows/completed-tasks/member-header-admin-link/`
- 親 workflow: `docs/30-workflows/public-header-logged-in-nav-cleanup/` Task E 由来
- spec: `docs/00-getting-started-manual/specs/02-auth.md` `AuthView` / `MemberHeader` admin CTA 接続契約
- 関連 lesson: [[lessons-learned-public-header-session-aware-auth-view-base-2026-05]]（`AuthView` 基盤側 5 件）
- task-spec-creator 一般化: `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` 末尾「Parent workflow Task 切り出し + auth-view discriminated union 配信パターン」
