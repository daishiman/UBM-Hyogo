# issue-913-server-idempotency-key-persistence

> Source issue: [#913](https://github.com/daishiman/UBM-Hyogo/issues/913)（**CLOSED のまま仕様書化**）
> 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
> 起源: 親 `index.md`「スコープ外」§ server 側 idempotency-key 永続化
> 前身 unassigned spec: `docs/30-workflows/completed-tasks/issue-842-followup-003-server-idempotency-key-persistence.md`
> 実装区分: **実装仕様書**（CONST_004 デフォルト。コード変更を伴う）
> タスク種別: **NON_VISUAL**（apps/api middleware + D1 schema。UI 視覚変更なし）
> 状態: `implemented_local_evidence_captured`（local code + focused tests 完了。D1 apply / deploy / commit / PR はユーザー明示承認後）
> 作成日: 2026-05-25

## 調査サマリ（CLOSED 状態 + 既存実装の検証）

issue #913 は CLOSED 状態だが、本タスクは親 issue-842 で明示的にスコープ外と宣言された後続課題であり、その server 永続化 gap は現コードに依然として存在する。実コードを直接確認した結果:

| 観点 | 対象 | 現状（2026-05-25 時点） | 判定 |
|---|---|---|---|
| client header 送出 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | `idempotencyKey?: string \| (() => string)` option 実装済（L46）、fetch header に `Idempotency-Key` 送出済（L229） | **完了**（前提・本タスクで変更しない） |
| server header 受信 | `apps/api/src/routes/admin/*.ts` の handler | header を一切参照していない（grep 0 件） | **未実装**（本タスクで解決） |
| dedupe 永続化層 | `apps/api/migrations/` / `apps/api/src/repository/` | idempotency_keys テーブル / repository 不在 | **未実装**（本タスクで新設） |
| Hono middleware 配線 | `apps/api/src/middleware/` | admin scope 横断の idempotency middleware 不在 | **未実装**（本タスクで新設） |
| 既存類似前例 | `apps/api/migrations/0009_tag_queue_idempotency_retry.sql` | partial unique index による dedupe を採用済（設計の手本） | **参考** |

**結論**: 親 issue で明示的にスコープ外とされた server 永続化 gap は現存。本タスクで apps/api 内に閉じて Hono middleware として横断適用する。

## 概要

`apps/api` 配下の admin mutation endpoint（POST/PATCH/PUT/DELETE）に対し、`Idempotency-Key` HTTP header を受け取り、D1 永続化された dedupe ストアを介して「同一 key の重複リクエストを初回処理 + 結果再生で冪等化する」server-side idempotency 基盤を実装した。client 側（`apps/web`）の header 送出は親 issue-842 で完了済のため触らず、D1 直接アクセスを apps/api に閉じる不変条件 5 を維持したまま、Hono middleware として既存 handler ロジックを破壊せず横断適用する。

## 実装サマリ（2026-05-25）

| 区分 | 実ファイル | 内容 |
|---|---|---|
| migration | `apps/api/migrations/0021_idempotency_keys.sql` | idempotency scope UNIQUE + expiry index |
| repository | `apps/api/src/repository/idempotency.repository.ts` | insert / replay decision / lazy GC / completed save / rollback delete |
| middleware | `apps/api/src/middleware/idempotency.ts` | `Idempotency-Key` 受信、fingerprint、409/422/replay、5xx rollback、保存失敗時の in-flight 削除 |
| env contract | `apps/api/src/env.ts`, `apps/api/src/routes/admin/_shared.ts` | optional `IDEMPOTENCY_TTL_SECONDS`（未設定・不正値は 24h） |
| route wiring | `apps/api/src/routes/admin/{attendance,identity-conflicts,meetings,member-delete,member-notes,member-notification-pref,member-status,requests,schema,sync-schema,tags-queue}.ts` | `requireAdmin` / `adminGate` 後に middleware 適用 |
| tests | `apps/api/src/middleware/__tests__/idempotency.spec.ts`, `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` | replay / mismatch / 5xx rollback / pure decision |

検証: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS、`mise exec -- pnpm --filter @ubm-hyogo/api lint` PASS、focused Vitest 10 tests PASS（middleware 7 + repository 3）。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義（inventory / AC / 不変条件） |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（D1 schema / middleware / repository / 配線） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー（Gate-A: Phase 4 進行可否） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（contract.spec ケース・期待値） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（変更ファイル・差分方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充（race / TTL / size 上限 / 5xx rollback） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認（middleware / repository 変更行） |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタリング |
| 9 | [phase-9-qa.md](phase-9-qa.md) | 品質保証（typecheck/lint/unit/d1 lane） |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー（AC 判定 / Gate-B） |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（NON_VISUAL 宣言・代替証跡） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明 + 技術詳細 + spec sync） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（Gate-C: ユーザー明示承認後のみ） |

## 変更対象ファイル

| パス | 種別 | 内容 |
|---|---|---|
| `apps/api/migrations/0021_idempotency_keys.sql` | 新規 | `idempotency_keys` テーブル + UNIQUE INDEX(key, method, path) + INDEX(expires_at) |
| `apps/api/src/repository/idempotency.repository.ts` | 新規 | `c.env.DB` 経由 CRUD + lazy GC（INSERT 前 expired 削除）|
| `apps/api/src/middleware/idempotency.ts` | 新規 | Hono middleware：header 検出 → in_flight INSERT → handler → 結果保存 / 再生 / 409 / 422 / 5xx rollback |
| `apps/api/src/routes/admin/*.ts` | 編集 | admin mutation route group への `app.use("*", idempotency())` 配線（既存 `requireAdmin` / `adminGate` 後）|
| `apps/api/src/middleware/__tests__/idempotency.spec.ts` | 新規 | 契約検証（初回 / 再生 / fingerprint 422 / 5xx rollback）|
| `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` | 新規 | repository 単体 spec（純ロジック部分。D1 が必要な部分は contract.spec へ寄せる）|

> `apps/web` 側の `useAdminMutation.ts` は親 issue-842 で完了済のため、本タスクでは触らない。

## スコープ外（本仕様内では新規バックログ化しない）

- `apps/web` client 側の変更（→ 親 issue-842 で完了済）
- idempotent method での retry 有効化 / 個別 caller の retry 宣言（→ issue-842-followup-002 相当の別関心）
- 新規 API endpoint の追加・既存 endpoint の I/F shape 変更（CLAUDE.md UI prototype alignment 不変条件 1）
- Google Form schema の変更（不変条件 1・`idempotency_keys` は Form schema 外 admin-managed infra table）
- `apps/web` からの D1 直接アクセス（不変条件 5）
- 公開 / 会員 mypage の mutation 経路への波及（admin scope 限定）
- Cloudflare Queues / Cron Triggers による掃除（Free plan 制約。lazy GC を正本とする）

## 不変条件

1. **既存 API endpoint surface のみ利用**（新 endpoint・D1 schema 拡張は idempotency_keys テーブル新設のみ、Google Form 変更禁止）
2. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準（CLAUDE.md 不変条件 10。本タスクは server 側で受ける側のみ）
3. **D1 直接アクセスは apps/api に閉じる**（不変条件 5）。middleware / repository は `c.env.DB` 経由のみ
4. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 8）。D1 必須は `*.contract.spec.ts` で D1 lane 実行
5. Cloudflare CLI は `scripts/cf.sh` 経由（wrangler 直接禁止）。migration apply / list / deploy 全て wrapper
6. Google Form schema 外データとして分離（不変条件 4）。`idempotency_keys` は admin-managed infra table
7. handler shape を変えない（middleware は横断適用のみ。既存 admin route の I/F は不変）
8. 失敗（handler throw / 5xx）は冪等化しない（in_flight 行を DELETE し再送で再実行可能に倒す）

## Gate / 承認境界

| Gate | 対象 | 承認者 | 条件 |
|---|---|---|---|
| Gate-A | Phase 1-3 設計レビュー | daishiman | Phase 4 着手前。設計に矛盾・不明点が無いこと |
| Gate-B | Phase 5-11 実装 + ローカル QA | daishiman | typecheck / lint / unit / d1 lane / build 全 PASS。Phase 12 着手前 |
| Gate-C | Phase 13 PR 作成 + migration apply / deploy | daishiman | **不可逆 mutation**（D1 migration apply / deploy）はユーザー明示承認後のみ |

不可逆 mutation: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging|production` および `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging|production`。read-only evidence（`d1 migrations list`）は事前取得可。
