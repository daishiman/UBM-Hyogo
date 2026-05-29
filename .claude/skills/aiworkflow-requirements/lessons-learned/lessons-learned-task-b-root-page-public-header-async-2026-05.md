# Lessons Learned — task-b-root-page-public-header-async (2026-05)

| 項目        | 値                                                            |
| ----------- | ------------------------------------------------------------- |
| Workflow    | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/` |
| Parent      | `docs/30-workflows/public-header-logged-in-nav-cleanup/`      |
| Task type   | implementation / NON_VISUAL                                   |
| Phase 状態   | Phase 1-12 completed / Phase 13 pending_user_approval         |
| 作成日       | 2026-05-28                                                    |

## 背景

Task A で `apps/web/src/components/public/PublicHeader.tsx` が `async function PublicHeader({ authView }: { authView: AuthView })` に変わったため、`(public)` route group 外で `<PublicHeader />` を直接 mount する root page (`apps/web/app/page.tsx`) は型・実行両面で破綻する。`(public)/layout.tsx` 経由の wiring を踏襲し、root page も `await getAuthView()` を実行して `<PublicHeader authView={authView} />` に切り替えた。

## Lessons

### L-TBPHA-001: AuthView source の集約

- **要点**: session 由来の出し分けは `apps/web/src/lib/auth-view/getAuthView()` 経由で取得した `AuthView` (`guest | member | admin`) を props として渡す。auth-aware component は async server component かつ純粋に props 配線のみで mount する。
- **適用**: `PublicHeader` / `(public)/layout.tsx` / `app/page.tsx` / 今後の Task C/E/G 等で公開層の session 出し分けを行う component に適用。
- **反例**: 各 layout/page で個別に `getSession()` を呼ぶと auth state の解釈ロジック (admin 判定 / profileHref など) が散らばり、後続の認可ルール変更で全箇所を再編集する hidden coupling が発生する。

### L-TBPHA-002: async PublicHeader と root page の同期境界

- **要点**: Task A の async 化は `(public)` route group の layout だけでなく、route group 外で直接 mount している root `/` にも波及する。route 移動 (`app/page.tsx` → `app/(public)/page.tsx`) は SEO/metadata/revalidate 影響があるため不採用。同 server cycle に `getAuthView()` を 1 await 追加する最小差分が正。
- **適用**: 公開 component を async server component 化する際は、その component を mount している全ての server entry を grep (`rg "<PublicHeader" apps/web/app`) で洗い出し、route group 内外で wiring を統一する。
- **反例**: route group 外の page を route group 内に移すと、`generateMetadata` の path / OG image / canonical URL の再評価が必要になり、本来不要だった追加 risk を背負う。

### L-TBPHA-003: NON_VISUAL workflow の evidence 代替契約

- **要点**: visual evidence (Playwright screenshot) を取らない代わりに、`apps/web/playwright/tests/visual/*` ではなく **vitest + 静的 grep** を代替証跡とする。具体的には:
  1. `apps/web/app/__tests__/page.spec.tsx` で `getAuthView` を guest / member 2 ケース mock し `<PublicHeader />` への `authView` prop 配線を assert
  2. Phase 11 `static-source-guard.log` で `app/page.tsx` から `<PublicHeader />` の **無 props mount** が消えていることを grep で固定
  3. `data-auth-state="guest|member|admin"` 属性を `PublicHeader` の root に焼き込み、staging 実機での目視確認手段とする
- **適用**: NON_VISUAL implementation workflow で SCR / SSR 境界の DOM 差分を保証する場合の標準セット。

### L-TBPHA-004: `getAuthView()` の fail-closed = guest fallback

- **要点**: `getAuthView()` 内部の `getSession()` throw は `try/catch` で `{ kind: "guest" }` に閉じる。auth 境界は **未認証 fallback** を default とし、guard 失敗時に SSR 全体を 500 に巻き込まない。CLAUDE.md invariant #11 (`getAuthEnv()` safeParse fail-closed) と同じ思想。
- **適用**: 認証取得 helper を新設する際は throw を再 throw せず unauth state へ降格する fallback を default とする。例外を抑えるのは認証境界に限定し、データ fetch 等の business path では fail-fast を維持する。

### L-TBPHA-005: parent workflow と standalone workflow の同期境界

- **要点**: 親 workflow `public-header-logged-in-nav-cleanup` (Task A-G + 横断 Playwright) はまだ `spec_created`。Task B standalone workflow が `implemented_local_evidence_captured` に昇格しても、親 index.md は **Task B 行のみ** を更新し、親全体の workflow_state は触らない。
- **適用**: parent + sub-task split で sub-task 単体を先行 close-out する際の `Step 1-A` 同期範囲。`system-spec-update-summary.md` 末尾の「親 workflow 境界」節に境界宣言を明記しておくと、後続 task の close-out で同じ判断を再現できる。

## 参照

- [[workflow-task-b-root-page-public-header-async-artifact-inventory]] (L-TBPHA-001..005)
- [[lessons-learned-06b-member-login-profile-pages-2026-04]] (session gate / fail-closed parity)
- task-specification-creator `patterns-lessons-and-pitfalls.md` の「async server component prop 配線パターン」節（L-ASCPROP-001..005 として汎化）
