# Phase 1: 要件定義

> 関連参照: [non-visual-irreversible-task-rules](../../../.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md)（NON_VISUAL かつ D1 migration 適用・Cloudflare deploy を伴う不可逆 mutation タスクのルール）

## 0. 実装区分とタスク種別の確定

- **実装区分**: `[実装区分: 実装仕様書]`（CONST_004 デフォルト。コード変更を伴う）
- **タスク種別**: **NON_VISUAL**（apps/api middleware + D1 schema。UI 視覚要素・レイアウト・トークンに変更なし）
- **不可逆 mutation**: `governance_mutation_user_gate: true`。`bash scripts/cf.sh d1 migrations apply` および `bash scripts/cf.sh deploy --config apps/api/wrangler.toml` はユーザー明示承認後のみ。read-only evidence（`d1 migrations list` 等）は事前取得可。
- **implementation_mode**: `new`（RED/GREEN サイクルで新規実装。既存 middleware・既存 route handler の I/F は破壊しない横断追加）

## 1. なぜこのタスクが必要か（Why）

- 親 issue-842 で client 側 `useAdminMutation` に `Idempotency-Key` header 送出を実装済（`apps/web/src/features/admin/hooks/useAdminMutation.ts` L46 / L229）。一方 `apps/api/src/routes/admin/*.ts` の handler は header を **一切参照していない**（grep 0 件）。
- 結果として client が retry / 二重 submit / ブラウザ再送を起こすと、POST/PATCH/PUT/DELETE が server で二重実行され得る（tag 付与の二重登録 / member note の重複追加 / attendance の二重登録 等）。header 送出だけが先行し「冪等性が担保されている」という誤前提を生む構造的な gap が現存する。
- 親 issue-842 では server 永続化を**明示的にスコープ外**と宣言済（`docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md` 「## スコープ外」§ server 側 idempotency-key 永続化）。本タスクはその独立後続タスクであり、CLAUDE.md 不変条件 5（D1 直接アクセスは apps/api に閉じる）により UI 側 adapter では解決不能 → apps/api 内で middleware として横断適用する。

## 2. 現状コード inventory（実測・2026-05-25）

| 観点 | ファイル | 現状 | 本タスクでの扱い |
|---|---|---|---|
| client header 送出 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | `idempotencyKey?: string \| (() => string)` option（L46）/ fetch header `Idempotency-Key` 送出（L229）/ `resolveIdempotencyKey()`（L115-117） | **変更なし**（親 issue-842 で完了済の前提） |
| server header 受信 | `apps/api/src/routes/admin/*.ts` | header を一切参照していない（`grep -rni "idempotency" apps/api/src/routes/admin` 0 件） | **本タスクで新設**（middleware で横断受信） |
| D1 dedupe テーブル | `apps/api/migrations/` | `idempotency_keys` 未存在。類似前例として `0009_tag_queue_idempotency_retry.sql` が partial unique index による dedupe を採用済 | **本タスクで新設**（`00NN_idempotency_keys.sql`） |
| repository | `apps/api/src/repository/` | `idempotency.repository.ts` 不在 | **本タスクで新設** |
| Hono middleware | `apps/api/src/middleware/` | admin scope 横断の idempotency middleware 不在。既存 `requireAdmin` は admin route 群に `app.use("*", requireAdmin)` で配線済 | **本タスクで新設**（同列の middleware として配線） |
| D1 binding | `apps/api/wrangler.toml` | binding `DB`（L20 / staging L160 / production L86）existing | **再利用**（追加 binding 不要） |
| 既存 migration 最大番号 | `apps/api/migrations/0020_notification_channel_and_opt_out.sql` | 末尾 `0020_*`。並列 worktree で同番号の重複前例あり（`0014_*` が 4 本重複） | **Phase 1 で `d1 migrations list` 実行して採番確定** |

### 既存 admin route の middleware 配線パターン（手本）

```ts
// apps/api/src/routes/admin/_shared.ts もしくは個別 route file
const app = new Hono<Env>();
app.use("*", requireAdmin); // 既存。本タスクで idempotency を同列に追加する
```

→ 本タスクでは `app.use("*", idempotency)` を `requireAdmin` と同列に admin mutation route group へ配線する。handler 本体（POST/PATCH/PUT/DELETE）には触らない。

## 3. 用語集（ubiquitous language）

| 用語 | 意味 |
|---|---|
| `Idempotency-Key` | client が送る HTTP request header。同一意図の再送を 1 回として扱う key の生値 |
| `idempotency_keys` | D1 のテーブル名（admin-managed infra table。Google Form schema 外） |
| `request_fingerprint` | リクエスト body の hash。同 key で body が異なる client 不正使用を 422 検出するため |
| `request_scope` | `(idempotency_key, request_method, request_path)` の組。UNIQUE 制約の対象 |
| `in_flight` | 初回処理中ステータス。INSERT 直後・handler 実行中 |
| `completed` | 初回処理完了ステータス。response_status / response_body が保存済で再生対象 |
| `lazy GC` | INSERT 前に同 scope の expired 行を削除する遅延掃除（Cron 不在のため） |
| `replay` / 再生 | 保存済 response_status / response_body から `new Response` を構築して返す動作 |

## 4. 命名規則（既存コードに整合）

- middleware 名: `idempotency`（ファイル `apps/api/src/middleware/idempotency.ts` / 関数名は default export または named `idempotency`）。既存 `requireAdmin` / `writeTagNoteProviderMiddleware` と並ぶ
- repository 名: `idempotency.repository.ts`（既存 `apps/api/src/repository/*.repository.ts` の命名規則と整合）
- migration: `00NN_idempotency_keys.sql`（NN は `d1 migrations list` 後に確定）
- テストファイル: `*.spec.ts(x)`（不変条件 8）。D1 を要するものは `*.contract.spec.ts`（D1 lane で実行・unit config から exclude）
- 型名: PascalCase（`IdempotencyRecord` / `IdempotencyStatus = "in_flight" | "completed"` / `IdempotencyScope`）
- カラム名: snake_case（既存 D1 schema と整合: `request_method` / `response_status` / `expires_at` 等）

## 5. 受入条件（AC）

### コア機能

- **AC-1**: `Idempotency-Key` header を持たないリクエストは middleware が **何もせず next() で通過**し、handler が従来通り実行される（**後方互換**）
- **AC-2**: `Idempotency-Key` header を持つ初回リクエストは、middleware が D1 に `(key, method, path, fingerprint, status='in_flight')` を INSERT した上で handler を実行し、handler 終了後に `response_status` / `response_body` / `status='completed'` / `completed_at` を UPDATE する
- **AC-3**: 同一 `(key, method, path)` の 2 回目以降で `status='completed'` の record があれば、handler を実行せず保存済 `response_status` / `response_body` を再生して返す（再生レスポンスの `content-type` は `application/json` を維持）
- **AC-4**: 同一 `(key, method, path)` の並行リクエスト（既存 record が `status='in_flight'`）に対しては、middleware が `409 Conflict` を返し client retry に委ねる
- **AC-5**: 同一 `(key, method, path)` で `request_fingerprint` が既存 record と一致しない場合は `422 Unprocessable Entity` を返す（client 不正使用の検出）
- **AC-6**: handler が throw または 5xx を返した場合は middleware が in_flight 行を **DELETE** し、再送で再実行できるようにする（失敗は冪等化しない）

### TTL / 掃除

- **AC-7**: `expires_at = created_at + IDEMPOTENCY_TTL`（既定 **24h**。client retry backoff window より十分長く、無限肥大を防ぐ短さ）
- **AC-8**: 掃除は **lazy GC**（INSERT 前に同 scope の expired 行を遅延 DELETE）を正本とする。Cloudflare Queues / Cron Triggers は Free plan 制約のため採らない

### サイズ / レスポンス再生

- **AC-9**: レスポンス body サイズが上限（**64KB**）を超える場合は保存をスキップし、当該 endpoint は冪等化対象外として安全側に倒す（再送時は再実行）
- **AC-10**: 非 JSON レスポンス（`content-type` が `application/json` 以外）は保存対象外として middleware skip（再送時は再実行）

### 不変条件・契約

- **AC-11**: D1 直接アクセスは apps/api に閉じる（CLAUDE.md 不変条件 5）。middleware / repository は `c.env.DB` 経由のみ
- **AC-12**: 既存 admin route handler の I/F shape を変更しない（middleware は横断適用のみ。Hono ctx は不変）
- **AC-13**: 新規 API endpoint 追加なし / Google Form schema 変更なし（CLAUDE.md UI prototype alignment 不変条件 1・不変条件 4）

### 品質ゲート

- **AC-14**: `mise exec -- pnpm typecheck` 0 error
- **AC-15**: `mise exec -- pnpm lint` 0 error / 0 warning（baseline 維持）
- **AC-16**: focused middleware / repository specs で `idempotency.spec.ts` と `idempotency.repository.spec.ts` が PASS（key 無し通過 / 再生 / fingerprint 422 / 5xx rollback / replay decision を網羅）
- **AC-17**: `apps/api/src/repository/__tests__/idempotency.repository.spec.ts` の純ロジック単体 spec が unit lane で PASS

## 6. 不変条件

1. **既存 API endpoint surface のみ利用**。新 endpoint 追加なし。D1 schema 拡張は `idempotency_keys` 1 テーブル新設のみ。Google Form 変更禁止（CLAUDE.md 不変条件 1）
2. **D1 直接アクセスは apps/api に閉じる**（CLAUDE.md 不変条件 5）。middleware / repository は `c.env.DB` 経由のみ
3. **Cloudflare CLI は `scripts/cf.sh` 経由**（CLAUDE.md §Cloudflare 系 CLI 実行ルール）。`wrangler` 直接呼び出し禁止
4. **Google Form schema 外データとして分離**（CLAUDE.md 不変条件 4）。`idempotency_keys` は admin-managed infra table
5. **handler shape を変えない**（middleware は横断適用のみ。既存 admin route の I/F・レスポンス契約は不変）
6. **新規 test は `*.spec.{ts,tsx}` のみ**（CLAUDE.md 不変条件 8）。D1 必須は `*.contract.spec.ts` で D1 lane 実行（unit config から exclude される）
7. **失敗（handler throw / 5xx）は冪等化しない**。in_flight 行を DELETE し再送で再実行可能に倒す
8. **不可逆 mutation のユーザー承認境界**（`non-visual-irreversible-task-rules.md` 準拠）。`d1 migrations apply` / `cf.sh deploy` はユーザー明示承認後のみ

## 7. carry-over 確認

- 親 workflow `issue-842-admin-mutation-reliability-policy` は CLOSED。本タスクは server 永続化に独立スコープ。重複なし。
- 前身 unassigned one-pager `docs/30-workflows/completed-tasks/issue-842-followup-003-server-idempotency-key-persistence.md` を本仕様の inventory / AC / 不変条件 / 用語に再構築した。Phase 13 で当該 unassigned ファイルを `completed-tasks/` への移送 or 削除を判断する（本仕様化により役割終了）。
- 関連別関心: `issue-842-followup-002`（idempotent caller の retry 有効化）は **本タスク外**。server 受け皿が整った後の独立タスク。

## 8. 参照リンク

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- 親スコープ外宣言: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md` §スコープ外
- 親 Phase 12 ガイド: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/outputs/phase-12/implementation-guide.md`
- 前身 unassigned spec: `docs/30-workflows/completed-tasks/issue-842-followup-003-server-idempotency-key-persistence.md`
- 既存 idempotency 前例: `apps/api/migrations/0009_tag_queue_idempotency_retry.sql`
- 既存 migration 最大番号: `apps/api/migrations/0020_notification_channel_and_opt_out.sql`
- D1 binding: `apps/api/wrangler.toml`（L20 / staging L160 / production L86）
- 既存 admin middleware 配線手本: `apps/api/src/routes/admin/member-status.ts` L34 / `apps/api/src/routes/admin/tags-queue.ts` L45
- Cloudflare CLI wrapper: `scripts/cf.sh`
- D1 lane test config: `apps/api/vitest.d1.config.ts`
- NON_VISUAL 不可逆操作タスクルール: `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
- CLAUDE.md 不変条件: #1（既存 endpoint surface）/ #4（Form schema 外データ分離）/ #5（D1 apps/api に閉じる）/ #8（test 命名）/ §Cloudflare CLI 実行ルール

## 9. 完了条件（Phase 1）

- [ ] 実装区分・タスク種別・implementation_mode を確定（NON_VISUAL / `new` / 不可逆 mutation 警告）
- [ ] 現状コード inventory を実測で記録（grep 0 件 / 既存類似前例 0009 の確認）
- [ ] AC-1〜AC-17 を確定（後方互換 / 並行 race / fingerprint 不一致 / 5xx rollback / TTL / lazy GC / size 上限 / 不変条件 / 品質ゲート）
- [ ] 用語集・命名規則を既存コードと整合
- [ ] `non-visual-irreversible-task-rules.md` を参照リンクに含めた
- [ ] 不変条件 1〜8 を確定
