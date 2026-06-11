# workflow-admin-requests-queue-rename-and-publish-dependency artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging_runtime_pending_user_gate` |
| purpose | `/admin/requests` を「会員からの申請」として平易化し、会員本人発申請の承認フローと `/admin/members` 管理者起点即時トグルの違いを画面上で可視化する |
| implementation | test account pending request seed、`GET /admin/members` `pendingRequestTypes` projection、shared schema、requests page/panel/detail 表示名、members page 説明、members table pending request badge links |
| implementation targets | `apps/api/src/testing/test-accounts/{catalog,build-seed-sql}.ts`, `apps/api/migrations/seed/test-accounts-{seed,cleanup}.sql`, `apps/api/src/routes/admin/members.ts`, `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts`, `packages/contracts/src/admin.mjs`, `apps/web/app/(admin)/admin/{requests,members}/page.tsx`, `apps/web/src/components/admin/{RequestQueuePanel,RequestQueueDetail,RequestConfirmDialog}.tsx`, `apps/web/src/features/admin/components/_members/MembersTable.tsx`, `apps/web/src/components/shell/shell-config.ts` |
| tests | `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`, `apps/api/src/routes/admin/members.contract.spec.ts`, `packages/shared/src/zod/viewmodel.spec.ts`, `apps/web/src/components/admin/__tests__/{RequestQueuePanel.component,RequestQueueDetail}.spec.tsx`, `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` |
| local evidence | focused package test runs PASS: API 86 files / 549 tests, shared 21 files / 257 tests, web 238 files passed, 1 skipped; 1752 tests passed, 1 skipped; API/web/shared typecheck PASS; seed drift guard PASS; lint PASS; HEX token grep PASS; authenticated runtime screenshots remain user-gated |
| invariant | `/admin/requests` route path, admin API paths, component filenames, `id` / `data-*` / test selectors remain unchanged. No new endpoint or D1 schema. apps/web continues to use API/proxy only. Styling uses existing OKLch token classes/variables only |
| user gate | staging seed apply, authenticated staging visual screenshot, commit, push, PR |

## Lessons Learned

- **L-ARQR-001（表示テキスト限定リネーム / 内部識別子不変パターン）**: 「依頼キュー」→「会員からの申請」のような表示名変更は、ルート（`/admin/requests`）・API パス・コンポーネントファイル名・`id` / `data-*` / テストセレクタ・import 名をすべて不変に保ち、「人間可読テキスト + `aria-label` のみ変更」へ限定することで、CSS / Playwright / テストセレクタのリグレッションを完全に回避できる。命名マップ表に「Before/After（表示文言）」列を持たせ、冒頭に「内部識別子は不変」と明記する書式が再利用価値が高い。
- **L-ARQR-002（新 endpoint を増やさず list projection を相関サブクエリで拡張）**: API surface 不変条件を守りつつ UI に新情報を載せたいときは、新 endpoint を足さず既存 `GET /admin/members` の list projection に相関サブクエリ（`json_group_array(DISTINCT note_type)` where `request_status='pending'`）を 1 本追加する。既存 `tags_json` と同型で低コスト・低リグレッション。`pending_request_types_json` → `parsePendingRequestTypes()` → zod → web adapter → バッジ描画のデータフローを一貫させる。
- **L-ARQR-003（冗長に見える 2 画面の依存を交差表示で説明）**: 起点の異なる 2 つの独立経路（会員本人発の承認フロー = `/admin/requests` vs 管理者起点の即時トグル = `/admin/members`）が「冗長に見える」問題は、機能を削除せず、片方の状態（pending 申請の有無）をもう片方の一覧にバッジで載せ相互リンクで往復させることで「2 軸の独立と依存を 1 画面で説明」できる。同種の「冗長に見えるが起点が違う 2 画面」課題へ横展開可能な汎用パターン。
- **L-ARQR-004（shared 直 import なら型自動伝播 / 再宣言なら同期）**: web が `AdminMemberListViewZ` を shared から直 import している場合、shared 側にフィールドを足すだけで web 型が自動伝播し、web 側 zod の二重宣言を避けられる。逆に web が再宣言している場合は両側同期が必要。schema の所在（shared か apps/api か）と web の参照形態を `rg` で先に特定してから実装すると手戻りを防げる。
- **L-ARQR-005（test seed は catalog→build-seed-sql→drift guard pipeline 経由）**: staging で動作確認用の pending 申請データを足すときは、D1 schema を変えず既存 `admin_member_notes` への seed 追加に留める。`catalog.ts` に `TestRequest[]` を宣言 → `build-seed-sql.ts` で `INSERT OR REPLACE` + cleanup `DELETE ... LIKE 'TEST-NOTE-%'` を生成 → committed seed SQL を再生成 → `seed:test-accounts:gen -- --check` の drift guard を PASS させる、という catalog 駆動の経路に乗せる。

anti-pattern:
- ❌ 表示名がわかりにくいからといって route / API パス / コンポーネントファイル名 / テストセレクタまで一緒に rename し、リグレッションを誘発する。
- ❌ 一覧に新情報を載せるために新 endpoint を増やし、API surface 不変条件を破る。
- ❌ 「冗長に見える 2 画面」を機能ごと削除して、片方の入口（会員本人発 vs 管理者起点）を失わせる。
- ❌ seed を committed SQL に直書きし、catalog→build-seed-sql の drift guard pipeline を迂回する。
