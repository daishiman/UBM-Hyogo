# Lessons Learned: Issue #371 UT-02A Hono ctx Repository Provider DI Migration（2026-05）

UT-02A follow-up 003。02a で導入した optional `deps?` provider 注入を撤去し、
`attendanceProviderMiddleware` + Hono `c.var.attendanceProvider` 経由の DI へ
移行した実装で得た苦戦箇所。`provider-context.ts` の ownership 配置、
`DbCtx` 不変保持、canonical assertion `/attendanceProvider not bound/i`、
builder signature shrink の grep gate、Phase 11 runtime smoke 委譲境界を扱う。

## L-I371-001: DI 戦略 ADR は引数注入 / Hono ctx / DI container の三択を明示比較する

`outputs/phase-03/adr-di-strategy.md` で 3 案を以下基準で評価し、Hono ctx 採択を決定した。

| 案 | テスト容易性 | route 側 boilerplate | Hono 親和性 | コスト |
|----|------------|-------------------|------------|------|
| 引数注入（builder `deps?`） | ◯（直接渡せる） | ✕（route 毎に provider 解決） | △（Hono 流儀外） | 低 |
| Hono ctx (`c.set` + middleware) | ◯（test で `c.set` 可） | ◯（middleware で集中） | ◎（Honoカノニカル） | 中 |
| DI container（tsyringe 等） | ◯ | ◯ | ✕（依存追加 + Workers相性課題） | 高 |

採択理由: Workers + Hono 環境で依存追加なしに集中配線でき、test では route handler レベルで `c.var` を mock 可能。引数注入案は 06c-E 以降の admin route 拡張で provider 解決ボイラープレートが線形増加するため不採用。container 案は Workers cold start と bundle size を悪化させるため不採用。

## L-I371-002: provider 合成型は repository 配下に置き middleware 依存逆転を避ける

最初 `apps/api/src/middleware/provider-context.ts` に `RepositoryProviderCtx` を置いたところ、repository builder が middleware を import する依存逆転が発生した（middleware は repository を import すべきで、repository が middleware を import してはならない）。修正後は `apps/api/src/repository/_shared/provider-context.ts` を ownership とし、middleware 側は同型を import する。教訓: 「合成型は最も内側のレイヤ（repository / domain）に置き、外側（middleware / route）から import する」。

## L-I371-003: 既存 `DbCtx` の `readonly db` 契約を破らず provider を増設する

02a で確定した `type DbCtx = { var: { readonly db: D1Database } }` は他 route が依存しているため変更不可。新規 provider は `RepositoryProviderVariables` を別宣言し、`type RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }` の交差型で合成する。`readonly` 修飾は維持し provider 追加で外部互換が壊れないことを確認。Hono の `Variables` 型を直接拡張するのではなく交差型で限定スコープに留めるのが要点。

## L-I371-004: missing provider 検知の canonical assertion を文字列契約として固定する

middleware 未装着 route で builder が呼ばれた場合は throw するが、test 側 assertion 文字列が複数表現に発散すると regression check が壊れる。canonical assertion は **`/attendanceProvider not bound/i`** に固定し、builder 側エラーメッセージは `"attendanceProvider not bound: attendanceProviderMiddleware must run before this builder"` とする。`apps/api/src/repository/__tests__/builder.test.ts` および route 側 missing provider negative test の双方が同 regex を共有することで、メッセージ drift 検出を grep gate 化できる。

## L-I371-005: builder signature shrink の grep gate と test 移行手順

旧 `createAttendanceRepository(db, deps?)` を `createAttendanceRepository(c)` へ縮小する際、optional `deps?` が他箇所で残ると silent fallback が発生する。撤去確認は `grep -rn "deps?:" apps/api/src/repository` が 0 件であること、および `grep -rn "createAttendanceRepository(.*,.*)" apps/api/src` が builder migration 完了で 0 件になることを Phase 11 evidence に固定する。test 移行は (1) 既存 deps 注入 test を `c.set('attendanceProvider', ...)` に書き換え、(2) builder.test.ts に missing provider throw 確認を追加、(3) route 側 me/admin の middleware 装着順 test を追加、の 3 ステップ。

## L-I371-006: runtime smoke を 09a/09b 系へ委譲し Phase 11 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で閉じる

middleware DI 経路の正しさは local typecheck / lint / focused vitest / build / grep の 5 点で boundary 確認できるが、Cloudflare Workers cold start での `c.set` 経路は staging deploy + curl で初めて runtime 確認できる。Issue #371 単独 wave で staging 実 deploy を行うと 09a 系の cron / smoke と二重実行になるため、Phase 11 状態は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とし、runtime smoke は 09a-A staging deploy smoke / 09b cron monitoring に委譲する。Issue #371 は CLOSED 維持で Phase 13 は `Refs #371` のみ。

## 関連リソース

- `apps/api/src/middleware/repository-providers.ts`（attendanceProviderMiddleware 正本）
- `apps/api/src/repository/_shared/provider-context.ts`（RepositoryProviderCtx ownership）
- `apps/api/src/repository/_shared/builder.ts`（builder signature shrink）
- `apps/api/src/repository/__tests__/builder.test.ts`（missing provider canonical assertion）
- `apps/api/src/routes/me/index.ts` / `apps/api/src/routes/admin/members.ts`（middleware 装着）
- `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md`
- `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-11/evidence/test.log`
- `changelog/20260506-issue371-hono-ctx-di-migration-spec.md`

## 検索キーワード（indexes rebuild 用）

issue-371, hono-ctx-di, attendanceProviderMiddleware, RepositoryProviderCtx,
repository-providers, provider-context, c.var.attendanceProvider, DI strategy,
builder signature shrink, missing provider assertion, Hono Variables 交差型,
PASS_BOUNDARY_SYNCED_RUNTIME_PENDING, UT-02A follow-up 003.
