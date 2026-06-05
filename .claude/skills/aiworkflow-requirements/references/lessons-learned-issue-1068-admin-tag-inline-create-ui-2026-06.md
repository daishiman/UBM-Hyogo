# Lessons Learned: Issue #1068 admin tag inline-create UI (2026-06)

> Workflow: `docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/`
> Date: 2026-06-03
> State: `implemented_local_visual_pending / implementation / VISUAL_ON_EXECUTION / Phase 1-12 done / Phase 11 staging screenshots + Phase 13 commit/push/PR are user-gated`
> Issue: #1068 CLOSED, use `Refs #1068` only
> Consumes: `docs/30-workflows/completed-tasks/task-issue-1035-followup-001-admin-tag-inline-create-ui.md`（consumed trace）
> Depends on (landed): issue-1035（`POST /admin/tags` write endpoint / #1073）, issue-982（`MemberTagsEditor` + member tag assign / #982）

`/admin/members` drawer の `MemberTagsEditor` に「必要な tag が無ければその場で作成して付与する」inline-create 導線を追加した。真の論点は **tag 作成（master への write）と member への付与（junction への write）が別エンドポイント・別責務であり、UI 上は 1 操作に見せつつ「部分成功（作成だけ成功）」と「409 conflict（重複）」の 2 失敗モードを破綻なく扱う状態機械**。`apps/api` は不変、apps/web の UI 配線のみで完結させた。

## L-I1068-001: API error の「分類」は transport クラスから独立した純関数に置く

create は raw fetch helper（`createTag` → `TagCreateError`）と hook（`useAdminMutation` → `FetchAuthedError`）の 2 経路で発火しうるが、両者の error 表現クラスは異なる一方、判定したい code（`{ ok: false, error: "<code>" }`）は同一。`apps/web/src/features/admin/api/members.ts` で判定ロジックを純関数 `parseTagErrorCode(bodyText: string) => code | null` に集約し（不正 JSON / 未知 code / `error` 欠落 / 非オブジェクトはすべて `null`）、各 transport は error クラスへの packaging のみを担う。component 側は `err instanceof FetchAuthedError ? err.bodyText : (err as { bodyText?: string }).bodyText ?? ""` で安全に `bodyText` を抽出してから純関数へ渡す。

- **Why:** error の「運び手クラス」は経路ごとに増えるが、サーバが返す code 語彙は 1 つ。分類を transport クラスのメソッドに埋めると経路を増やすたびに分類ロジックが重複し drift する。純関数に切り出すと分類は 1 箇所、各 transport は body 文字列を渡すだけになる。
- **How to apply:** API error の判定は `string(bodyText) -> code|null` の純関数を SSOT にし、`TagCreateError` / `FetchAuthedError` 等の transport クラスは「status と bodyText を packaging する」責務に限定する。新しい呼び出し経路を足すときは純関数を再利用する。

## L-I1068-002: 多段 write の「部分成功」は段ごとの state で保持し、retry は失敗段だけを再実行する

create（201）→ assign（付与）の 2 段で 2 段目だけ失敗すると、tag master は作られたまま member 未付与という中途半端状態になる。`MemberDrawer.tsx` の `MemberTagsEditor` では `createdPendingAttach: AdminTagRef | null` を、assign in-flight ロック `pendingTagId` とは **別 state** として持つ。共通 attach 経路 `runAttach(tag, trackPending = true)` は成功で `null` 化・失敗で tag を再保持し、retry 導線（`data-testid="tag-attach-retry"`）は `runAttach` で **attach のみ再実行**（create は再発火しない）＝冪等。

- **Why:** 1 操作に見える UI が裏で複数の独立 write になっている場合、「どこまで成功したか」を 1 つの flag に潰すと、retry が成功済みの段まで巻き戻して二重作成・409 を誘発する。in-flight ロック（UI 連打防止）と「未完了のビジネス状態」（部分成功）は意味が異なるので state を分ける。
- **How to apply:** 多段 write UI は段ごとに「成功済み中間成果物」を表す state を分離し、retry は失敗した段だけを再実行する。in-flight ロックと未完了ビジネス状態を同一 flag に混ぜない。

## L-I1068-003: 409 conflict 回収は「ローカルキャッシュ探索」でなく権威ソース再取得を基準にする

同 code の tag が既存だと作成不能（409 `tag_code_conflict`）。ユーザーを「既存 tag を選んで付与」へ案内したいが、その既存 tag は drawer 手元の `available`（member 文脈の部分集合）に無いことがある。`handleConflict` は 409 で `fetchMemberTags(memberId)` を再取得して assigned/available を更新し、子コンポーネントは更新後の `available` から `code` 一致で引き当てる。再取得が間に合うまでは「読み込んでいます…」プレースホルダで破綻を回避する。

- **Why:** conflict は「サーバ側に既に存在する」ことの通知であり、ローカル `available` は最新の master 全体ではないため探索しても見つからないことがある。権威ソースを再取得しないと「重複なのに既存が選べない」デッドロックになる。
- **How to apply:** conflict 回収（サーバに既存）は、ローカルキャッシュ探索でなく権威ソースの再取得を基準にし、UI は「未到着」相（placeholder）を明示的に持つ。

## L-I1068-004: server が field 粒度を返さない制約下では client validation をミラーし、400 は粒度を詐称しない包括フォールバックにする

`POST /admin/tags` の 400 は `{ error: "invalid_body" }` のみで、どの欄が不正かを返さない。既存 endpoint surface は変更禁止（不変条件 #7）。そこで server と同一規則の `validateTagFields`（`code` regex `/^[a-z0-9][a-z0-9_]*$/` 1-64 / `label` 1-120 / `category` 1-64）を client に置き、送信前に field error を表示して mutation 発火を抑止する。それでも漏れた 400 は固定文言の包括 error にフォールバックし、field 推測（どの欄が悪いかの捏造）はしない。

- **Why:** API を触れない制約下で field 粒度 UX を出すには client validation ミラーが唯一の手段。一方 server が粒度を返さない 400 を client で「たぶん label が悪い」等と推測表示すると、実際と食い違う誤誘導になる。
- **How to apply:** API 不変制約下で validation UX を上げるなら、規則（regex / 長さ）を client にミラーしつつ「server error は粒度を詐称せず包括表示」をルール化する。規則の二重管理が drift しないよう、guide の定数表と client 定数を同 wave で同期する。

## L-I1068-005: 共有 mutation mock は method だけでなく endpoint まで見て slot を分岐する

既存 `MemberDrawer.tags.spec.tsx` の `useAdminMutation` mock は HTTP method（POST/DELETE）だけで slot を振り分けていたが、inline-create の create も POST（`/api/admin/tags`）のため assign POST（`/members/:id/tags`）と衝突する。回帰 spec 側は mock 捕捉条件を `endpoint !== "/api/admin/tags"` に**狭めて** member-tags POST のみ捕捉し、create POST は generic stub にした。新 spec 側は `endpoint === "/api/admin/tags"` で create slot を別取得する。

- **Why:** 同 method・別 endpoint の mutation を共有 mock が method だけで振り分けると、新経路追加で既存 spec の slot が誤マッチして壊れる。
- **How to apply:** 共有 hook mock は method + endpoint で slot 分岐する。既存 regression spec を壊さず新経路を足すときは「既存 mock の捕捉条件を狭める（exclude を足す）」方向で対応する。

## L-I1068-006: hook mock の失敗注入は promise の settle と callback 呼び出しの双方を実装と同じ順序で再現する

部分成功テスト（attach 失敗）を正しく再現するには、`assign.trigger` の `Promise.reject` だけでは親の楽観 rollback / state 遷移を完全には駆動できない。実 `useAdminMutation` は失敗時に `options.onError` を呼びつつ promise も reject する 2 系統の副作用を持つため、mock trigger 内で `assign.options?.onError?.(...)` を呼んでから `Promise.reject(...)` を返す。成功側も同様に `onSuccess?.({ assigned, available })` を呼ぶ。

- **Why:** 実 hook の副作用が「callback 呼び出し」と「promise settle」の 2 系統あるとき、片方だけ再現した mock は component の一部分岐（rollback・state 遷移）を駆動せず、テストが実挙動と乖離する。
- **How to apply:** hook mock の成功/失敗注入は、実装が呼ぶ callback（`onSuccess` / `onError`）と promise の settle を、実装と同じ順序で両方再現する。

## L-I1068-007: 認証必須 visual は env-gate + skip で同梱し、レイアウト不変は構造で担保、screenshot は user-gated に切り出す

AC-6「desktop/mobile で操作部品と pill が重ならない」を保証したいが、drawer は実 member 文脈（`PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID`）が無いと開けず、screenshot baseline は staging 認証要で CI では撮れない。レイアウトは `border-t ... pt-3` の独立ブロックで pill 群と inline-create を縦分離して**重なりを構造的に回避**し、Playwright spec は `test.skip(!DETAIL_SEEDS.memberId)` で env 未設定時 skip、baseline 撮影は Phase 11 / user-gated に切り出した。

- **Why:** 認証必須 / seed 依存の visual を CI 必須にすると常に赤くなる。レイアウト不変は「重ならないように配置する構造（flex/border 分離）」で担保すれば screenshot 無しでも回帰耐性を持てる。
- **How to apply:** 認証必須 visual spec は env-gate + skip で安全に同梱し、レイアウト不変は構造（縦分離ブロック）で担保し、screenshot baseline は user-gated に切り出す。

## L-I1068-008: apps/web の Vitest 正経路はリポジトリルート config（`apps/web/vitest.config.ts` は不在）

`apps/web/vitest.config.ts` が存在しないため、誤った root 指定だと focused spec が拾われない。正規経路は `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts <paths>`（リポジトリルートの `vitest.config.ts` を使う）。issue-1068 の focused set は 3 files / 20 tests（`members.tagCreate.spec.ts` 4 + `MemberDrawer.tagInlineCreate.spec.tsx` 8 + `MemberDrawer.tags.spec.tsx` 8）で全 PASS。

- **Why:** phase テンプレに `apps/web/vitest.config.ts` 前提の誤記が残っており、それに引きずられると test が 0 件 collect されて「緑」と誤認する。MEMORY 既知（IME / sidebar 系で再発）。
- **How to apply:** apps/web の Vitest は常にリポジトリルート config で起動する。focused 件数は「対象 spec を明示列挙した直実行」を正本とし、dir 全体の件数（無関係 spec を含む）と混同しない。

---

## 横断教訓

- API error の分類は transport クラスから独立した純関数（`bodyText -> code|null`）に置き、複数経路で共用する。
- 多段 write の「部分成功」は段ごとの state で保持し、retry は失敗段だけを冪等に再実行する。in-flight ロックと未完了ビジネス状態を 1 flag に混ぜない。
- 409 conflict 回収は権威ソース再取得を基準にし、UI は「未到着」相を明示的に持つ。
- API 不変制約下の validation UX は client ミラー + 「server error は粒度を詐称しない包括表示」をルール化する。
- 共有 hook mock は method + endpoint で slot 分岐し、新経路追加時は既存捕捉条件を狭める方向で壊さない。hook mock の失敗注入は callback と promise settle の双方を再現する。
- 認証必須 visual は env-gate + skip で同梱、レイアウト不変は構造で担保、screenshot は user-gated。
- apps/web Vitest はルート config で起動し、focused 件数は明示列挙の直実行を正本とする。
