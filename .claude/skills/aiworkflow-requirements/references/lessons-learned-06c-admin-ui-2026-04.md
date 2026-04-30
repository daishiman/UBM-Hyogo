# lessons-learned: 06c Admin UI 5画面 苦戦箇所（2026-04-29）

> 対象タスク: `docs/30-workflows/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/`
> Wave: 6 / parallel / implementation_visual
> 関連 references: `api-endpoints.md`（§管理バックオフィス API 04c）, `ui-ux-admin-dashboard.md`（並列作成中）, `architecture-admin-api-client.md`（並列作成中）, `architecture-implementation-patterns.md`
> 出典: `outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`

将来同様の admin 画面群（Next.js App Router `(admin)` route group）を最短で正しく実装するための知見をまとめる。

## L-06C-001: Phase 11 の実 screenshot は D1 fixture / staging admin 前提のとき後続 wave に委譲する

**苦戦箇所**: 06c は VISUAL タスクとして Phase 11 で UI 画面の実 screenshot を要求していたが、本セッションでは (a) D1 fixture（members / meetings / tags 行）が未投入、(b) admin Google account（`admin_users.active=1`）の staging 配備未済、(c) wrangler dev / staging 用の `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` が揃っていない、という 3 重欠落で screenshot を撮れなかった。Phase 12 必須成果物の parity を保つために何をどこに退避させるか判断に時間がかかった。

**原因**: VISUAL タスクの screenshot evidence template が「fixture 不足時の代替経路」を持たず、撮れない場合の DEFERRED 形式が曖昧だった（skill-feedback-report § task-specification-creator 行 8）。

**解決方針**: `phase12-task-spec-compliance-check.md` の Phase 11 行を `DEFERRED` で明示し、`unassigned-task-detection.md` で「Phase 11 実スクリーンショット → 08b Playwright E2E / 09a staging smoke へ委譲」と委譲先を 1 行で記録する。コンポーネント単体の Vitest（`MemberDrawer` / `MeetingPanel` / `SchemaDiffPanel` / `lib/admin/api`）と `outputs/phase-11/manual-smoke-evidence.md` のチェックリストを「視覚以外の代替証跡」として明示し、Phase 12 全体は `PASS_WITH_DEFERRED` で close する。

**後続申し送り**: 08b（Playwright E2E）は admin gate redirect / dashboard KPI render / member drawer mutation / meetings duplicate-disabled の 4 シナリオを最低限カバーする。09a（staging smoke）は Auth.js Google OAuth → `/admin` → 5 画面遷移の screenshot を取得して 06c の VISUAL_DEFERRED を解消する。VISUAL タスクの skill template には `VISUAL_DEFERRED` 専用 evidence セクション（fixture 不足理由 / 委譲先 wave / 代替単体テスト一覧）を追加する（`skill-feedback-report.md` 提言）。

## L-06C-002: ESLint no-restricted-imports 正式導入は別 task 扱い、現状は `scripts/lint-boundaries.mjs` を境界の正本にする

**苦戦箇所**: AC-6「apps/web から D1 / apps/api repository 直接 import 禁止」を ESLint `no-restricted-imports` で検出する案を当初検討したが、(a) `pnpm lint` の現状仕様は `tsc --noEmit` であり ESLint 設定が monorepo 全体に未配置、(b) ESLint 導入は web / api / packages の 3 面同時設計が必要で 06c の責務外に膨らむ、という波及リスクがあった。

**原因**: 06c は admin UI 実装が責務であり lint foundation は独立 task。AC-6 の検出機構を ESLint 単一手段に縛ると lint foundation task が完成するまで AC が PASS しない循環依存が発生する。

**解決方針**: AC-6 の正本検出は `scripts/lint-boundaries.mjs`（grep ベースの境界 import 検証）と `apps/web/src/lib/__tests__/boundary.test.ts`（unit boundary test）の 2 段で代替する。ESLint 正式導入は `unassigned-task-detection.md` に「lint foundation task で扱う」と分離記録する。Phase 12 の AC trace は AC-6 を PASS、`implementation-guide.md` の AC 表で AC-6 を `DEFERRED (ESLint)` と注記し、現状検証コマンド `rg -n "from ['\"](@repo/api|.*repository|.*d1)" apps/web` を必ず明示する。

**後続申し送り**: lint foundation task が起動した時点で `scripts/lint-boundaries.mjs` のルールを ESLint `no-restricted-imports` に昇格させる。それまで `lint-boundaries.mjs` を CI で必ず走らせ、grep ガードを退化させない。

## L-06C-003: Server Component（`server-fetch.ts`）と Client Component（`api.ts`）の責務分離を最初に設計する

**苦戦箇所**: 当初 `apps/web/src/lib/admin/api.ts` に GET helper を含めて Server / Client 双方から呼ぶ構成を試したが、(a) Server Component から `/api/admin/*` proxy を経由すると無駄な hop が発生し、(b) Client から `INTERNAL_AUTH_SECRET` を fetch ヘッダに付ける経路がブラウザに secret を露出させかける、という 2 つの落とし穴が出た。fetch caching（`next: { revalidate }`）と Auth.js session cookie の forwarding 経路も Server / Client で異なり、混在させると認証が断続する。

**原因**: 「apps/web から apps/api を呼ぶ」を 1 つの抽象に集約しようとし、Server Component の `INTERNAL_API_BASE_URL` + `INTERNAL_AUTH_SECRET` 直接呼び出しと、Client Component の `/api/admin/*` proxy 経由（Auth.js cookie forwarding）の責務差を区別しなかった。

**解決方針**: helper を 2 ファイルに分離する。`apps/web/src/lib/admin/server-fetch.ts` は Server Component 専用で `INTERNAL_API_BASE_URL` + `INTERNAL_AUTH_SECRET` を内部 header に注入し fetchAdmin として一本化、GET のみを担当する。`apps/web/src/lib/admin/api.ts` は Client mutation 専用で `/api/admin/*` proxy 経由のみ、`AdminMutationResult<T>` 型で `ok: true | false` を返し、GET helper を意図的に持たない。Client から詳細取得が必要な MemberDrawer のみ `/api/admin/members/:id` を直接 fetch する例外を 1 箇所に閉じる。`apps/web/app/api/admin/[...path]/route.ts` proxy が secret 注入と Auth.js cookie 検査を担い、Client は secret を一切持たない。

**後続申し送り**: 新規 admin 画面を追加する際は「Server Component の初期描画は server-fetch、Client mutation は api.ts proxy」を必ず両方使う。GET と mutation を 1 経路で済まそうとしないこと。fetch caching の `next: { revalidate }` 設定は server-fetch 側に集約し、Client の proxy 経由 GET（例外）は no-store で扱う。

## L-06C-004: tag 直接編集 UI と profile 直編集 UI を「作らない」ことを spec で明示拒否する

**苦戦箇所**: admin UI 実装中に「会員タグを drawer から直接付け外しできた方が早い」「自己紹介本文も管理者が代理で直せる方が運用しやすい」という派生要望が複数回浮上した。実装してしまうと不変条件 #4（admin-managed と form-managed の分離）/ #11（profile 本文は本人のみ書き換え）/ #13（タグは queue 経由 resolve のみ）に反するが、UI 設計時点で「作らない」根拠を素早く参照できなかった。

**原因**: 不変条件と UI 制約の対応表が `implementation-guide.md` Part 2 にしかなく、Phase 6/7 の実装中に再参照しにくかった。`MemberDrawer` の責務範囲が曖昧なまま実装に入ると派生要望に揺さぶられる。

**解決方針**: `MemberDrawer` の責務を「status 変更 / 管理メモ作成 / 論理削除 / editResponseUrl リンク / `/admin/tags?memberId=` focus link」の 5 項目に厳密に固定し、profile 本文 input/textarea / タグの mutation UI が「存在しない」ことを Vitest の assertion（`MemberDrawer.test.tsx`）で構造的に保証する。`unassigned-task-detection.md` に「profile 本文の管理者直接編集」「タグ直接編集 UI」を「作成しない」項目として明示記録し、`PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags` API そのものを 04c で作らないことと一対で扱う。本人更新は MVP 上 Google Form 再回答が正式経路（CLAUDE.md 不変条件 #7）。

**後続申し送り**: admin UI に派生要望が来たら、`unassigned-task-detection.md` の「作成しない」表と Vitest の存在しない assertion を root cause として返す。要望が運用上どうしても必要になった場合は、不変条件 #4 / #11 / #13 そのものを変更する task を別 wave で起こす（UI だけ局所追加しない）。

## L-06C-005: nested resource の 404（不在）と 409（重複・所有関係不整合）を UX feedback で別 toast に分ける

**苦戦箇所**: `MeetingPanel` で attendance 追加時の API レスポンスを 404 / 409 / 422 で個別に出し分ける必要があったが、当初は「失敗 toast」1 種で扱い、(a) sessionId が存在しない（404）、(b) 同じ会員が同じ会に既に登録されている（409 / duplicate attendance）、(c) 削除済み会員（422 / soft-deleted member）の 3 ケースをユーザーが区別できなかった。tag queue の resolve 競合（409）も SchemaDiffPanel の alias 対象なし（404）と同じ toast 文言で出していた。

**原因**: 04c API の REST status 設計（L-04C-002 の 404 vs 409 分離 / `unassigned-task-detection.md` の attendance 削除済み 422 ガード）が UI 側の toast 設計に翻訳されておらず、API 契約と UI feedback の対応表が抜けていた。

**解決方針**: `MeetingPanel.filterCandidates` で削除済み会員を server / client 両側で除外（option を表示しない）、`GET /admin/meetings` の attendance summary を使って既存 attendance の option を `disabled` 化（重複入力を構造的に不能化）、それでも race で 409 / 422 が返ったときは「重複登録のためスキップしました」「削除済み会員のため登録できません」と文言を分けた toast を出す。`SchemaDiffPanel` の alias 解消失敗、`TagQueuePanel` の resolve 競合も同様に「対象が見つかりません（404）」「他の管理者が既に処理しました（409）」を別 toast にする。実装ガイド `implementation-guide.md` のエッジケース表に 404 / 409 / 422 と UI 動作を 1:1 で対応付けて記録する。

**後続申し送り**: 新規 admin UI を追加する際は、API 契約（04c の status 設計）から UI feedback テキストへの翻訳表を Phase 6 の time に必ず作り、`implementation-guide.md` のエッジケース表と Vitest（`MeetingPanel.tsx` 系）の両方に固定する。新規 nested mutation を作るときは 404 / 409 / 422 のいずれを使うかを REST テンプレ（L-04C-002）に従って先に決める。

## 関連未タスク・後続 wave 連携

- 08a（contract test）: client mutation `AdminMutationResult` 型と 04c API status 契約の往復をテストする。
- 08b（Playwright E2E）: admin gate redirect / dashboard KPI render / member drawer mutation / meetings duplicate-disabled の 4 シナリオを最低限カバー。L-06C-001 の VISUAL_DEFERRED を解消する一次経路。
- 09a（staging smoke）: Auth.js Google OAuth → `/admin` → 5 画面遷移の実 screenshot 取得で 06c VISUAL を最終 close。
- lint foundation task: `scripts/lint-boundaries.mjs` のルールを ESLint `no-restricted-imports` に昇格（L-06C-002）。
- 07a / 07b / 07c（admin workflow series）: tag resolve / schema alias / attendance audit の運用ワークフロー側を 06c UI に乗せる。

## 参照

- 実装: `apps/web/app/(admin)/`（layout / admin / members / tags / schema / meetings / loading / error / not-found）, `apps/web/src/components/layout/AdminSidebar.tsx`, `apps/web/src/lib/admin/{api.ts, server-fetch.ts}`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/api/src/routes/admin/meetings.ts`（attendance summary 同梱）
- AC × verify: `outputs/phase-12/phase12-task-spec-compliance-check.md`（AC-1〜10 + Phase 11 DEFERRED）
- 不変条件: CLAUDE.md #4 / #5 / #11 / #12 / #13 / #14 / #15、04c admin gate（05a 差し替え後）
- 関連教訓: `lessons-learned-04c-admin-backoffice-2026-04.md`（API 側 status 設計）, `lessons-learned-05a-authjs-admin-gate-2026-04.md`（admin gate / session forwarding）
