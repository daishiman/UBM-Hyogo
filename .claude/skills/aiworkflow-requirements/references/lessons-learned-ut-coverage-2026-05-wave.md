# Lessons Learned — UT Coverage 2026-05 Wave（apps/api precondition + apps/web 4 + apps/api use-case）

## L-UTCOV-001: coverage-summary.json 不在時は coverage-guard が空入力で素通りする

apps/api の 13 件 test 失敗は vitest を vendor 完了させず、`coverage/coverage-summary.json` を生成しなかった。`coverage-guard.sh` は summary 不在時に「対象 0 ファイル」として PASS する性質があるため、CI gate が見かけ上 green になっても実体 <80% を見逃す。precondition タスクを 1 PR に分離して `--no-run --package apps/api` を強制 exit 0 ゲートに据える設計が必要だった。今後 coverage<80% baseline が見えた段階で「test 修復 → coverage-summary.json 生成」を必ず serial wave-1 に切る。

## L-UTCOV-002: D1 binding fake は contract 表面（exec/prepare/dump）を最小再現する

`apps/api/src/jobs/__fixtures__/d1-fake.ts` を直すとき、`prepare().bind().run()` chain と `exec()` の戻り値型を Cloudflare D1 binding と同一にしないと jobs 配下の use-case test がバラバラに落ちる。本 wave では production runtime コードを一切触らず fixture のみで 13 件全て green にした。**fixture 側で binding 契約を仮定するのは production code 修正と同等のリスクなので、対象は test fixture 単独 PR、production code は別 PR** という境界を維持する。

## L-UTCOV-003: 2-layer coverage gate は precondition gate と upgrade gate を別タスク化する

UT-08A-01 の最終目標は Statements/Functions/Lines >=85% / Branches >=80%。だが precondition（apps/api green + summary 生成 + >=80%）が立たないと upgrade gate は判定不能。同一タスク内で両 gate を扱うと AC が肥大化し、Phase 7 の AC マトリクスが「測定不能」項目で塞がる。**precondition gate（>=80%）は wave-1 単独タスクで close、upgrade gate（>=85% / >=80%）は wave-2 の UT-08A-01 が継承** という 2-layer 分割を default にする。

## L-UTCOV-004: serial wave-1 → parallel wave-2 の wave 分割は regression 切り分けを安価にする

apps/web 4 タスクは apps/api test 失敗と論理的には独立だが、同一 PR にまとめると失敗時の二分探索コストが跳ね上がる。**「修復 1 PR + 拡張 N PR」が 1 シーケンスの上限**で、N>=4 のときは README 上で並列性の根拠（ファイル分離 + shared package 不変）を明記する。`wave-1-serial-precondition/` と `wave-2-parallel-coverage/` をディレクトリ階層で分離した結果、依存関係が `README.md` 1 ファイルで自己説明可能になった。

## L-UTCOV-005: Phase 12 main.md は spec_created / implemented-local / completed の 3 状態を明示する

docs-only タスクの main.md を `status: pending` のまま放置すると、Phase 12 strict 7 files rule は formally PASS でも「実装が pending」と読めて handoff 先が曖昧になる。spec_created（wave-2 のような仕様書のみ完了）/ implemented-local（wave-1 のような local 実装完了 / PR 未）/ completed（PR merged）の 3 状態を main.md L3 で必ず宣言し、`handoff:` 行に次フェーズの担当 wave を書く。今 wave で 5 タスクの main.md を全て spec_created に統一した。

## L-UTCOV-006: lessons-learned は wave 単位で 1 ファイル、task 単位は LOGS に集約する

wave-1 / wave-2 で別々に lessons-learned を切ると同一 wave の知見が分散する。**wave 単位で 1 ファイル（本ファイル）+ task 個別の細かい記録は LOGS/_legacy.md** という運用に固定する。fixture 修復 / coverage gate 設計 / wave 分割の 3 トピックは互いに依存するため、同居させた方が将来の再利用時に拾いやすい。

## L-UTCOV-007: admin component coverage は snapshot 回避と「mock 結果の表示反映」検証で `>=85%` を取る

`ut-web-cov-01` で `MembersClient` / `TagQueuePanel` / `AdminSidebar` / `SchemaDiffPanel` / `MemberDrawer` / `MeetingPanel` / `AuditLogPanel` を Statements/Functions/Lines >=85%・Branches >=80% に到達させた際に詰まったポイント:

1. **snapshot に逃げると Branches が 80% 未満で止まる**: 表示テキストの一致だけでは disabled 状態・空表示・ロード分岐・authz 拒否の 4 分岐がカバーされず Branches が 60% 台で停滞する。`screen.getByRole('button', { name }).toBeDisabled()` / `expect(getAllByRole('row')).toHaveLength(0)` のような「分岐ごとの DOM 状態」を直接 assert する。
2. **callback invocation を `vi.fn()` で確認するだけでは Functions が伸びない**: mutation handler 内の Promise 経路（success / error）を両方走らせる必要があり、`fetch` mock を `mockResolvedValueOnce` / `mockRejectedValueOnce` で 2 回呼びに分けて両分岐を踏ませる。
3. **authz 不足時の表示は admin client mock に「`authError: true`」を返させて確認する**: 実際の Auth.js session を立てずに、`useAdminClient` 等の hook を `vi.mock` で差し替え、403 相当のレスポンスを返したときの「権限不足表示」DOM を確認する方が安定する。
4. **D1 直接アクセスは絶対しない**: apps/web component test では `apps/api` の admin proxy 越しにしか D1 を見ない原則を維持。component test 内で D1 fixture を立てる誘惑が出るが、admin client の mock で十分。
5. **scope-out ファイルは `vitest-run.log` に出ても unassigned-task 化しない**: `RequestQueuePanel.tsx` のように本タスク 7 ファイル外の component が同 run でカバレッジ不足を出しても、本タスクの AC は対象 7 ファイル限定。残ギャップは `unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` 側で wave-3 として追跡し、本タスク Phase 12 の `unassigned-task-detection.md` には scope-out 分類として明記する。

## L-UTCOV-008: public use-case focused test は D1 mock を SQL fragment dispatch + `failOnSql` で集約する

`ut-08a-01-public-use-case-coverage-hardening` で public use-case 4本（`getFormPreview` / `getPublicMemberProfile` / `getPublicStats` / `listPublicMembers`）と public route handler を focused test 化する際に詰まったポイント:

1. **`D1Database` 互換 mock は SQL fragment match で dispatch する**: `prepare(sql)` を呼ぶ側は repository 層でしかなく、test 側で SQL 文字列を完全再現すると repository 改修ごとに mock が割れる。`PublicD1MockOptions` を 1 オプションにまとめ、`FROM schema_versions ... state = 'active'` / `SELECT 1 AS hit FROM member_status s` 等の fragment 部分一致で fixture を返す方式に統一する。`queryLog` で実行 SQL 断片を記録し、公開条件 query drift（`public_consent='consented'` / `publish_state='public'` / `is_deleted=0`）が落ちていないかを test 側から後検証できる。
2. **D1 失敗系は `failOnSql: RegExp | string` 1 オプションで網羅する**: use-case ごとに 3 種（happy / null-or-empty / D1-fail）の最低ケースを揃える際、D1 失敗を専用 mock に切り替えると helper が肥大化する。`failOnSql=/FROM schema_questions/` のように regex を仕込めるようにすると、同一 mock 上で repository 層の throw 経路を 1 行で再現でき、public use-case の error contract（`UBM-5500` / `UBM-1404` / 5xx）が一貫して検証可能になる。
3. **公開不適格判定は `memberStatusById` の `public_consent` / `publish_state` / `is_deleted` で eligible を返す**: `existsPublicMember` の判定軸は member_status 行の 3 列。`identity_aliases` は public mock の射程外として明示し、admin-managed data との分離（不変条件 #5 public/member/admin boundary）を mock 内でも保持する。
4. **public route handler test は本番と同じ `errorHandler` を親 Hono に装着して直叩きする**: `createPublicRouter()` を `/public` で mount し、`app.onError(errorHandler)` を組み合わせないと `ApiError(UBM-1404)` が生 throw として観測されて 404 として assert できない。Cache-Control（`public, max-age=60` / `no-store`）と auth middleware 非依存（session guard なしで `/public/healthz` 到達）も同じ装着で確認する。
5. **`apps/api` 全件 coverage 実行は pre-existing `schemaAliasAssign` timeout を含む**: focused test 17/17 green と全件 coverage PASS は別ゲートとして扱う。focused test 健全性を `pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/use-cases/public/__tests__ apps/api/src/routes/public/index.test.ts` で個別に評価し、全件 run の timeout は upgrade gate 判定から分離する（`workflow-ut-coverage-2026-05-wave-artifact-inventory.md` Gate Boundary §Upgrade gate と一致）。
