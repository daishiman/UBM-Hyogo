# Lessons Learned — issue-1010-auth-view-session-contract-integration-test (2026-05-30)

`docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/`
`implemented_local_evidence_captured / implementation / NON_VISUAL`

親 workflow `public-header-session-aware-auth-view-base`（Task A 基盤）の Phase 12 close-out で formalize した unassigned-task `public-header-auth-view-session-contract-integration-test-001`（FU-001 / Issue #1010）を、独立 workflow として消化した際の知見。Auth.js `buildAuthConfig().callbacks.session`（producer）と `resolveAuthView()` / `getAuthView()`（consumers）の session contract drift を local CI で検出する integration test を、production code 変更ゼロで追加した。

## L-I1010-001 Producer/Consumer Contract Integration Test（実 producer を mock せず consumer へ連鎖）

`buildAuthConfig().callbacks.session` の実出力を mock せず生成し、その session を `resolveAuthView()`（pure consumer）と `getAuthView()`（async adapter consumer）の両方へ直接渡す integration spec を 1 ファイル追加する。producer / consumer がそれぞれ別 unit test で green でも、両者の field 契約（`session.user.memberId` / `session.user.isAdmin`）が drift すると本 spec だけが落ちる。

- **Why:** producer unit（`auth.spec.ts`）と consumer unit（`resolveAuthView.spec.ts` / `getAuthView.spec.ts`）は各々 fixture を自前で組むため、producer が field 名や型を変えても consumer test は古い fixture のまま green を保ち、結合契約の drift が production まで漏れる。
- **How to apply:** producer 側 callback / builder の出力を consumer が読む構造では、「実 producer 出力 → 実 consumer 入力」を 1 本に連鎖する contract spec を default で 1 ファイル用意する。fixture を両側で二重管理せず、producer の実出力を single source of truth にする。

## L-I1010-002 production code 変更ゼロの test-only `implementation` タスク（spec-only で閉じない）

`buildAuthConfig` は既に export 済みのため production code を一切変えず、追加するのは test file 1 本（`authViewSessionContract.integration.spec.ts`）のみ。それでも `taskType=implementation` のまま spec-only で凍結せず、同 cycle で実 test file + focused evidence（4 files / 61 tests PASS）へ昇格させる。

- **Why:** 「テスト追加だけ」のタスクを `spec_created` で止めると、契約 drift 検出という本来の価値が出ないまま放置される。implementation target が test file であっても、実 file を置いて focused vitest を green 化した時点で初めて gate の意味が成立する。
- **How to apply:** test-only タスクは artifacts.json の `implementation_files` / `test_files` に同一 test file を列挙し、`workflow_state=implemented_local_evidence_captured` まで進める。production code を触らないことは scope 文に明記し、不要な production diff を混入させない。

## L-I1010-003 `vi.hoisted()` + spread `importOriginal` で async adapter だけ差し替え（実 builder は維持）

`@/lib/auth` を `vi.mock` で部分置換し、`...actual` を spread した上で `getAuth` のみ hoisted mock に差し替える。`buildAuthConfig` は実物（actual）のまま import して呼ぶ。`getAuthView()` が内部で叩く `getAuth().auth()` だけを `authMock` で session 注入する。

- **Why:** static import 済み module に後段 `vi.doMock()` を当てると mock cache が不安定になる。producer（`buildAuthConfig`）は実物を使いたい一方、consumer adapter（`getAuthView` が依存する `getAuth`）は session を注入したい——この「同一 module 内で実物と mock を共存」を spread + hoisted mock で安定させる。
- **How to apply:** 同一 module から「実物を使う関数」と「mock したい関数」を両取りする場合は、`vi.mock(mod, async (importOriginal) => ({ ...await importOriginal(), targetFn: hoistedMock }))` の形を default にする。hoisted mock は `vi.hoisted()` で巻き上げ、`beforeEach` で `mockReset()` する。

## L-I1010-004 fail-closed 契約（欠落 / whitespace / 型不一致）を contract test で固定

`memberId` が欠落・空文字・whitespace-only のとき `resolveAuthView` / `getAuthView` 双方が `{ kind: "guest" }` に倒れること（invariant #11 fail-closed）を assertion で固定する。`isAdmin` も `null` / 文字列 `"true"` は admin 扱いせず `false` に正規化されることを検証する（`isAdmin === true` 厳密一致）。

- **Why:** session augmentation の正規化ロジック（`memberId?.trim()` / `isAdmin === true`）は producer callback 側に集中するため、ここが緩むと guest であるべき session が member/admin 表示に昇格する権限事故になる。型強制の境界（truthy string を admin にしない）は test で固定しないと silent regression を起こす。
- **How to apply:** 権限を決める正規化関数は「欠落 / 空 / whitespace / 型不一致」の各 fail-closed ケースを contract test の独立 `it` として列挙する。最小権限（guest）へ倒れることを期待値として byte 一致 assert する。

## L-I1010-005 `Object.keys(session.user).sort()` で producer 出力 field 集合の drift を検出

producer callback が出力する `session.user` の key 集合を `["email", "isAdmin", "memberId", "name"]` に固定し、`Object.keys(...).sort()` で byte 一致 assert する。token に余分な `ignoredRole` を入れても consumer に漏れないこと（producer が allowlist で field を組み立てること）を contract で保証する。

- **Why:** callback が `session.user` に新 field を足したり既存 field を rename した瞬間、consumer の discriminated union narrowing がずれる。key 集合そのものを固定すると、field 追加/削除/rename を 1 行で検出できる。
- **How to apply:** producer が組み立てる出力 object は、field 名そのものを契約として key 集合 assertion で固定する。余分な入力 field が出力へ漏れないこと（allowlist 構築）も同 spec で確認し、将来の field 追加は意図的な test 更新を強制する。

## L-I1010-006 親 workflow unassigned-task の `consumed` 化（独立 workflow で消化）

親 workflow の Phase 12 で formalize した unassigned-task spec（`public-header-auth-view-session-contract-integration-test-001.md`）を本 workflow が消化する際、元 spec の `ステータス` を `未実施` → `consumed` に更新し、`canonical_workflow` 行で本 workflow root を逆参照する。新規 follow-up は detection 0 件（FU-001 のみ formalize、他は既存 workflow 所有）。

- **Why:** unassigned-task は「未消化の follow-up」を表すため、別 workflow で実装したら status を閉じないと台帳上は永久に未着手のまま残り、再起票や二重実装の温床になる。canonical_workflow の逆リンクで「どこで消化したか」を追跡可能にする。
- **How to apply:** unassigned-task を独立 workflow で消化したら、(1) 元 spec の status を `consumed` 化、(2) `canonical_workflow` に消化先 root を記載、(3) 完了条件チェックリストを全 `[x]`、(4) evidence（focused vitest 件数）を追記する。NON_VISUAL タスクは screenshot 不要・focused vitest を Phase 11 evidence とする。

## Anti-pattern

- producer / consumer を別 fixture の unit test だけで担保 → 両 green のまま結合契約が drift し、session field の rename / 型変更が production まで漏れる
- 「テスト追加だけ」を `spec_created` で凍結 → 契約 drift 検出という価値が出ず、Phase 11 evidence も captured されない
- 同一 module の実物関数まで丸ごと mock 化 → producer の正規化ロジックを test できず、mock fixture が producer の実挙動から乖離する
- fail-closed ケース（欠落 / whitespace / 型不一致）を省略 → guest であるべき session が member/admin に昇格する権限事故を test が見逃す
- 消化済み unassigned-task の status を `未実施` のまま放置 → 台帳上は永久未着手で再起票・二重実装の温床になる

## 参照

- workflow root: `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/`
- artifact inventory: [`workflow-issue-1010-auth-view-session-contract-integration-test-artifact-inventory.md`](../references/workflow-issue-1010-auth-view-session-contract-integration-test-artifact-inventory.md)
- task-spec 汎化: `task-specification-creator/references/patterns-testing-and-implementation.md`（Producer/Consumer Contract Test パターン）
- system spec: `docs/00-getting-started-manual/specs/02-auth.md`（AuthView session contract drift guard）
