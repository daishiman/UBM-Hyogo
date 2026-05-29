# lessons-learned — public-header-session-aware-auth-view-base (2026-05)

| 項目 | 値 |
| --- | --- |
| workflow | `public-header-session-aware-auth-view-base` |
| source_issue | n/a (parent `public-header-logged-in-nav-cleanup` Task A base) |
| status | implemented_local_evidence_captured / implementation / VISUAL |
| recorded_at | 2026-05-28 |

## 範囲

`PublicHeader` を async server component 化し、`AuthView` 型 + `resolveAuthView()` 純関数 + `getAuthView()` async helper + `(public)/layout.tsx` 配線で guest / member / admin 出し分け基盤を整備した Task A 単体実装。後続 B/C/E/G が同じ `AuthView` を共有することを前提に、本タスクは pure resolver + fail-closed adapter + auth slot rendering の 3 層構造に切る方針を採った。

## L-PHSAV-001 — discriminated union `AuthView` を `as const` literal + readonly で固定

- **Rule**: `AuthView` のような UI 出し分け契約は `type AuthView = { readonly kind: "guest" } | { readonly kind: "member"; readonly profileHref: "/profile" } | { readonly kind: "admin"; readonly profileHref: "/profile"; readonly adminHref: "/admin" }` の形で literal を型レベルに焼き込む。
- **Why**: `profileHref: string` だと layout 配線時に typo (`"/profle"`) が compile-time に拾えず、staging で初めて 404 になる事故が起きやすい。`PublicHeader` は session を DOM に出さない設計のため、runtime visual だけでは原因切り分けが難しい。
- **How to apply**: 新規 auth-view 契約を追加するときは `kind` 以外の field も literal union (`"/profile"`, `"/admin"`) で固定。`renderAuthSlot` 側で `switch (authView.kind)` の網羅性を `satisfies` で検査するか、関数本体で if/else 全分岐を `return` で閉じる。

## L-PHSAV-002 — `getAuthView()` は try/catch で必ず guest fail-closed に倒す

- **Rule**: Auth.js wrapper (`getAuth().auth()`) を呼ぶ adapter は外側に `try { ... } catch { return { kind: "guest" }; }` を必ず置く。throw を error boundary に伝播させない。
- **Why**: 公開ヘッダーは認証境界ではなくナビゲーション surface。認証取得が失敗したときに `(public)/layout.tsx` の `await` が throw すると公開ページ全体が `error.tsx` に落ちる。安全側の挙動は「ログイン CTA だけ出して残りは正常 render」。
- **How to apply**: 認証境界 (middleware, admin gate) では絶対に握り潰さず invariant #11 を守る。一方で UI 表示用の view-model adapter は明示的に guest に倒す。`02-auth.md` の AuthView 章でこの分担を文書化する。

## L-PHSAV-003 — `(public)/layout.tsx` を async 化したときは `(public)/layout.spec.tsx` も `await Layout(props)` 形式へ追従

- **Rule**: Server Component を async 化する変更は、その component を直接 render している test を `const tree = await Layout({ children })` 形式に書き換える必要がある。React Testing Library 経由でなく `await` で resolve しないと、Promise が children に流れて DOM assertion が一切刺さらず silent PASS する。
- **Why**: child page test を全 async 化すると影響範囲が広く、本タスクでは layout 直下の test だけを async 形式に揃え、child page test は Task B/C 側で順次対応する分担に決めた。今回の test 24 PASS は `await PublicHeader(props)` / `await Layout(props)` の直接呼び出し形式に統一した結果。
- **How to apply**: async server component を導入する PR では「該当 component を直接 render している test ファイル」を grep し、`.spec.tsx` 側を同 wave で `await` 形式へ変更する。child page test の async 化は別タスクに分けて scope を狭める。

## L-PHSAV-004 — pure resolver + async adapter + render slot の 3 層分離

- **Rule**: 認証由来の UI 出し分けは `resolveAuthView(session)` (pure) / `getAuthView()` (async, adapter) / `renderAuthSlot(authView)` (UI) の 3 層に責務分離し、unit test は pure 層に集中、adapter 層は module mock の最小単位だけ test、UI 層は DOM assertion で contract を見る。
- **Why**: 一塊にすると test が module mock 地獄になり、Auth.js session augmentation 変更や OAuth provider 入れ替えのたびに UI test まで巻き添えで壊れる。pure 層に決定論ロジックを集めると 4 分岐 (guest / blank memberId / member / admin) が最小コストで網羅できる。
- **How to apply**: 後続 Task B/C/E/G で同じ `AuthView` を消費するときは、各 UI 側で session を直接読まない。`(member)/layout.tsx` / `(admin)/layout.tsx` も同じ `getAuthView()` を経由するか、専用 view-model adapter を別途切る。

## L-PHSAV-005 — `implementation` 仕様書を `spec_created` のまま閉じない（実装 target 物理存在ゲート）

- **Rule**: 「実装区分: 実装仕様書」かつ `apps/web/src/...` などの具体 target を持つ workflow は `spec_created` で Phase 12 を閉じてはいけない。同 wave で実装 + focused test + Phase 11 local evidence までセットで揃え、`implemented_local_evidence_captured` で閉じる。
- **Why**: 親 workflow (`public-header-logged-in-nav-cleanup`) Task A は spec_created のまま残ると後続 Task B/C/E/G が「基盤がある前提」の test を書いてしまい、commit 時に巻き戻し負債になる。30-method の logical / structural レビューで「`spec_created` + 物理 target」は矛盾と判定された。
- **How to apply**: task-specification-creator の `phase12-skill-feedback-promotion.md` 既存ルールを再確認。`implementation` × `具体 target` × `spec_created` の 3 拍子はワークフロー定義時に gate で弾く。本タスクではこのルールに従い同 wave で実装まで完遂した。

## 補足: 苦戦箇所サマリ

| 局面 | 苦戦内容 | 解決 |
| --- | --- | --- |
| Auth.js wrapper 形状 | `getAuth()` が `{ auth }` を返すか直接 `auth()` を返すかが既存 import から判然としなかった | `apps/web/src/lib/auth.ts` を grep して `const { auth } = await getAuth()` 形式と確定し `getAuthView.ts` に固定 |
| async layout の test | 既存 `(public)/layout.spec.tsx` が同期 render 前提で、async 化で silent PASS のリスクがあった | `await Layout({ children })` 形式に書き換え、`data-auth-state` literal を 3 状態で assertion |
| Phase 12 strict 7 と `implementation` の整合 | 親 workflow が `spec_created` で 7 outputs を持っていたため、子も同じ形で良いと判断しがちだった | 30-method analysis で矛盾と判定し、`implementation_local_evidence_captured` まで進めて strict 7 を埋めた |
| 未タスク FU-001 の境界 | mock-only unit test と実 Auth.js contract 間 drift をどこまで本タスクに含めるか | session contract integration test は別タスク化 (`public-header-auth-view-session-contract-integration-test-001`, Issue #1010) し scope を保った |
