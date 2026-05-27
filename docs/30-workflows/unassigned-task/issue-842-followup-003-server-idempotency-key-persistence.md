---
issue_number: 913
governance_mutation_user_gate: true
mutation_commands:
  - "bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging"
  - "bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production"
  - "bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging"
  - "bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production"
read_only_evidence_allowed_pre_gate: true
user_approval_marker: outputs/phase-13/user-approval-issue-842-followup-003-server-idempotency-key-persistence-<timestamp>.md
---

# Idempotency-Key を server (apps/api) で永続化し admin mutation を冪等化する - タスク指示書

> **不可逆 mutation 警告**: 本タスクは D1 schema 変更（migration）を伴う。`bash scripts/cf.sh d1 migrations apply` 系および deploy は YAML フロントマター `governance_mutation_user_gate: true` に従い、**ユーザー明示承認後のみ**実行する。read-only evidence（`d1 migrations list` 等）は事前取得可。

## メタ情報

| 項目         | 内容                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Issue        | [#913](https://github.com/daishiman/UBM-Hyogo/issues/913)                                                              |
| タスクID     | issue-842-followup-003-server-idempotency-key-persistence                                                              |
| タスク名     | Idempotency-Key を server (apps/api) で永続化し admin mutation を冪等化する                                            |
| 分類         | 機能拡張                                                                                                               |
| 対象機能     | apps/api admin mutation endpoints（`apps/api/src/routes/admin/` 配下の POST/PATCH/PUT/DELETE 系）                       |
| 優先度       | 中                                                                                                                     |
| 優先度根拠   | retry の安全性を真に担保する基盤。冪等 caller 登場前に整えると望ましい                                                  |
| 見積もり規模 | 中規模                                                                                                                 |
| 規模根拠     | D1 migration 1 本 + Hono middleware 1 本 + repository + contract spec                                                   |
| ステータス   | 未実施                                                                                                                 |
| 発見元       | issue-842-admin-mutation-reliability-policy スコープ外宣言（`index.md` 「スコープ外」§ server 側 idempotency-key 永続化） |
| 発見日       | 2026-05-24                                                                                                             |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- スコープ外宣言箇所: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md` の「## スコープ外（本仕様内では新規バックログ化しない）」内
  - 逐語: 「server 側 idempotency-key の永続化（client 送出と header 設計まで。server 永続化は元 issue でも明示スコープ外）」
- 親 Phase 12 実装ガイド: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/outputs/phase-12/implementation-guide.md`
- client 側実装済み（本タスクの前提）:
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts`
    - `idempotencyKey?: string | (() => string)` option（L46）
    - fetch header 送出: `...(key ? { "Idempotency-Key": key } : {})`（L229）
    - `resolveIdempotencyKey()`（L115-117）で関数/文字列を解決
  - 親 `index.md` AC-1 の通り `timeoutMs` / `retry`（idempotent 限定）/ `idempotencyKey` / `treat404AsSuccess` は client 側で完了
- 本タスクの位置づけ: client は header を送れるが **server (apps/api) は header を読まずに毎回処理している**。retry や二重 submit が起きると同一意図のリクエストが二重実行され得る。この gap を server-side persistence で塞ぐ独立タスク。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-842 で client 側 `useAdminMutation` に reliability policy（timeout / retry / idempotency-key 送出 / 404 relaxation）を実装した。retry は型レベルで idempotent method（`PUT`/`DELETE`）限定・既定オフだが、将来 idempotent な caller が `idempotencyKey` を指定して retry を有効化すると、一過性 5xx / network error 時に同一リクエストが複数回 server へ届く。

`Idempotency-Key` header はまさにこの「同一意図の再送を 1 回として扱う」ための業界標準機構（Stripe 等が採用）だが、それは **server 側が key を記録し、2 回目以降を初回結果の再生で返す**ことで初めて成立する。現状 apps/api 側にはその受け皿が無い。

### 1.2 問題点・課題

- `apps/web/src/features/admin/hooks/useAdminMutation.ts` は `Idempotency-Key` header を送出するが、`apps/api/src/routes/admin/` 配下の handler は header を **一切参照していない**。
- そのため retry / 二重 submit / ブラウザ再送が発生すると、POST/PATCH/PUT/DELETE が二重に実行され得る（例: tag 付与の二重登録、member note の重複追加、attendance の二重登録）。
- 親 issue-842 は client scope（apps/web hooks 限定）であり、server 永続化は明示スコープ外と宣言済み。よって header 送出だけが先行し、**retry の二重書き込みを真には防げていない**状態が構造的に残っている。
- D1 への直接アクセスは apps/api に閉じる不変条件（CLAUDE.md #5）があるため、idempotency の永続化層は apps/api 側に置くしかなく、UI 側 adapter では解決不能。

### 1.3 放置した場合の影響

- 将来 idempotent caller が retry を有効化した瞬間、transient 5xx で二重書き込みが発生し、admin-managed data（tag 割当 / member note / attendance 等。Google Form schema 外データ・不変条件4）の整合が壊れる。
- 二重実行の原因が「client retry なのか / ユーザー二度押しなのか / ブラウザ再送なのか」を後追い切り分けするコストが高い。
- header だけ送って server が無視する状態は「冪等性が担保されている」という誤った前提を生み、運用判断を誤らせる。

---

## 2. 何を達成するか（What）

### 2.1 目的

apps/api 側で `Idempotency-Key` header を受け取り、同一 key の重複リクエストを D1 永続化により dedupe（初回のみ実処理・2 回目以降は初回レスポンスを再生）する server-side idempotency 基盤を整える。

### 2.2 最終ゴール

- admin mutation endpoint（POST/PATCH/PUT/DELETE）が `Idempotency-Key` header を持つリクエストに対し、初回は通常処理 + 結果を D1 に保存、再送は保存済みレスポンスを再生する。
- key を持たないリクエストは従来通り（冪等化なし）処理され、後方互換を壊さない。
- D1 への直接アクセスは apps/api 内に閉じたまま（UI からは header 送出のみ・不変条件5）。
- 既存 admin route の handler ロジックを破壊的に書き換えず、Hono middleware として横断的に適用する。

### 2.3 スコープ

- 含む / 含まないは「## スコープ」セクションを正本とする。

### 2.4 成果物

- D1 migration: `apps/api/migrations/0021_idempotency_keys.sql`（採番は Phase 1 で `d1 migrations list` 実行後に確定。下記 §苦戦箇所の番号衝突対策参照）
- repository: `apps/api/src/repository/idempotency.repository.ts`（D1 binding `DB` 経由の CRUD）
- middleware: `apps/api/src/middleware/idempotency.ts`（Hono middleware。header 検出 → 既存 record 再生 or 通過 → 結果保存）
- 適用配線: `apps/api/src/routes/admin/` 配下の mutating route group への `app.use("*", idempotency)` 追加（既存 `requireAdmin` / `writeTagNoteProviderMiddleware` と同列の middleware として）
- contract spec: `apps/api/src/middleware/__tests__/idempotency.contract.spec.ts`（D1 lane `vitest.d1.config.ts` で実行）
- repository 単体 spec: `apps/api/src/repository/__tests__/idempotency.repository.spec.ts`（D1 が必要なら contract.spec へ寄せる）

---

## 3. どのように実装するか（How）

### 3.1 D1 テーブル設計案

admin-managed data として Google Form schema 外に分離（不変条件4）。binding は既存 `DB`（`apps/api/wrangler.toml` L20 / staging L160 / production L86）。

```sql
-- 0021_idempotency_keys.sql （番号は d1 migrations list 後に確定）
CREATE TABLE IF NOT EXISTS idempotency_keys (
  -- client が送る Idempotency-Key header の生値
  idempotency_key   TEXT NOT NULL,
  -- 衝突分離用: method + path（同一 key を別 endpoint で使い回しても誤再生しない）
  request_method    TEXT NOT NULL,
  request_path      TEXT NOT NULL,
  -- リクエスト body の fingerprint（同 key で body が異なる = client 不正使用を 422 検出する用途）
  request_fingerprint TEXT NOT NULL,
  -- 'in_flight' | 'completed'（並行 race を検出するため初回 INSERT で in_flight を確保）
  status            TEXT NOT NULL DEFAULT 'in_flight',
  -- 初回レスポンスの再生用（status code + body）
  response_status   INTEGER,
  response_body     TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  completed_at      TEXT,
  -- TTL 掃除用
  expires_at        TEXT NOT NULL
);

-- 同一 key + method + path を 1 行に固定（再送の検出 = 主役）
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_key_scope
  ON idempotency_keys(idempotency_key, request_method, request_path);

-- TTL 掃除（expires_at < now() を batch delete）用
CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON idempotency_keys(expires_at);
```

> 参考: 既存 `apps/api/migrations/0009_tag_queue_idempotency_retry.sql` が `idempotency_key TEXT` + partial unique index で同種の dedupe を実装済み。テーブル設計・index の作法はこれに倣う。

### 3.2 Hono middleware の dedupe フロー

`apps/api/src/middleware/idempotency.ts` を新設。`apps/api/src/routes/admin/*.ts` が採る `app.use("*", requireAdmin)`（例: `member-status.ts` L34 / `tags-queue.ts` L45）と同列に配線する。D1 へは `c.env.DB`（binding `DB`）経由のみアクセスし、UI からは触らせない（不変条件5）。

```
1. header から Idempotency-Key を取得。無ければ何もせず next()（後方互換）。
2. method + path + body fingerprint を算出。
3. UNIQUE INDEX 制約付きで in_flight 行を INSERT 試行。
   3a. INSERT 成功（= 初回）:
       - next() で handler 実行 → c.res を読み取り。
       - response_status / response_body を UPDATE、status='completed'、completed_at をセット。
       - handler が throw / 5xx の場合は in_flight 行を DELETE（再送で再試行できるよう、失敗を冪等化しない）。
   3b. INSERT が UNIQUE 衝突（= 再送 or 並行）:
       - 既存行を SELECT。
       - status='completed' → 保存済み response_status / response_body を再生（handler を実行しない）。
       - status='in_flight' → 並行リクエスト。409 Conflict（または 425 Too Early 相当）を返し、client retry に委ねる。
       - request_fingerprint が一致しない → 同 key で別 body = client 不正使用。422 を返す。
```

### 3.3 初回結果の再生

- 初回処理時に `c.res.clone()` で status と body を読み取り D1 に保存する（body を消費せず元レスポンスを返すため clone する）。
- 再送時は保存済み `response_status` / `response_body` から `new Response(body, { status })` 相当を構築して返す。
- `content-type: application/json` の admin route 前提（client は `content-type: application/json` 固定送出）。非 JSON レスポンスは再生対象外（middleware skip）として安全側に倒す。

### 3.4 TTL / 掃除方針

- `expires_at = created_at + IDEMPOTENCY_TTL`（既定 24h 程度。retry window より十分長く、無限肥大を防ぐ短さ）。
- 掃除は「INSERT 前に同 scope の expired 行を遅延 DELETE」する lazy GC を基本とし、テーブル肥大化は §リスクの通り index 付き batch delete で抑える。
- Cloudflare Queues / Cron Triggers は Free plan 制約（`apps/api/wrangler.toml` の Queue binding コメント参照）があるため、cron 前提の掃除は採らず lazy GC を正本とする。

### 3.5 不変条件の反映

- D1 直接アクセスは apps/api に閉じる（CLAUDE.md #5）。middleware / repository は `c.env.DB` 経由のみ。
- Cloudflare CLI は `scripts/cf.sh` 経由（wrangler 直接禁止）。migration apply / list / deploy は全て wrapper。
- Google Form schema 外データとして分離（不変条件4）。`idempotency_keys` は admin-managed infra table であり Form schema に依存しない。
- 新規 test は `*.spec.{ts,tsx}` のみ（不変条件8）。D1 を要する契約検証は `*.contract.spec.ts` とし D1 lane（`vitest.d1.config.ts`）で実行。`*.contract.spec.ts` は unit config（`vitest.config.ts`）から exclude される点に留意。

---

## 苦戦箇所【記入必須】

- 対象: `apps/api/migrations/0021_idempotency_keys.sql`（番号未確定）
- 症状: 並列 worktree で複数タスクが同時に migration を追加すると **migration 番号衝突**が起きる（既存 `0002_*` / `0008_*` / `0014_*` / `0015_*` が同番号で重複している前例あり）。番号衝突は `d1 migrations apply` 時の適用順非決定性につながる。
- 参照: 既存重複 `apps/api/migrations/0014_add_deleted_members_purge_metadata.sql` / `0014_create_cf_audit_log.sql` / `0014_notification_outbox.sql` / `0014_schema_diff_queue_dedupe_failure.sql`。Phase 1 で `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging` を実行し最大番号（現状 `0020_notification_channel_and_opt_out.sql`）を確認してから採番する。

- 対象: `apps/api/src/middleware/idempotency.ts`
- 症状: **同時並行リクエストの race**。同一 key の 2 リクエストがほぼ同時に到達すると、両方が SELECT で「未存在」と判断し二重 INSERT → 二重 handler 実行になり得る。read-then-write ではなく **UNIQUE INDEX 制約付き INSERT の成否で初回/再送を判定**すること（楽観ロック）。SQLite D1 はトランザクション分離が限定的なため、`in_flight` ステータスで「処理中」を表現し、衝突側は handler を実行せず 409 を返す。
- 参照: `apps/api/migrations/0009_tag_queue_idempotency_retry.sql` の partial unique index による dedupe 前例。

- 対象: `apps/api/src/middleware/idempotency.ts`（レスポンス保存部）
- 症状: **レスポンス body の永続化サイズ**。大きな JSON レスポンス（member 一覧等）を D1 TEXT 列に丸ごと保存するとテーブル肥大化と書き込みコスト増。mutation endpoint のレスポンスは通常小さい（作成/更新結果 + status）想定だが、上限（例: 64KB）を超える body は保存をスキップし、再送時は再実行に倒す（= その endpoint は冪等化対象外として安全側）方針を Phase 2 で確定する。
- 参照: D1 binding `DB`（`apps/api/wrangler.toml` L20）。

- 対象: `apps/api/src/middleware/idempotency.ts`（TTL）
- 症状: **idempotency window の TTL 設計**。TTL が短すぎると retry backoff（client `maxDelayMs` 既定 2000ms・`apps/web/src/features/admin/hooks/useAdminMutation.ts` L71）完了前に record が消え二重書き込みを許す。長すぎるとテーブル肥大化。client retry window より十分長く（時間単位）、かつ無限ではない（日単位上限）TTL を選ぶ。
- 参照: client retry backoff 実装 `apps/web/src/features/admin/hooks/useAdminMutation.ts` L109-113。

- 対象: D1 アクセス層全般
- 症状: **D1 binding 経由のみのアクセス制約**。`apps/web` からは header 送出のみで D1 に触れない（不変条件5）。middleware / repository を必ず `c.env.DB` 経由にし、独自 fetch / 直接接続を入れない。
- 参照: CLAUDE.md 不変条件5「D1 への直接アクセスは `apps/api` に閉じる」。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| D1 migration 番号衝突（並列 worktree で同番号） | 高 | Phase 1 で `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging` を実行し最大番号を確認してから採番。`scripts/cf.sh` 経由のみ |
| 同時並行リクエストの race で二重 INSERT | 高 | read-then-write を禁止し、UNIQUE INDEX 制約付き INSERT の成否で初回/再送を判定（楽観ロック）。衝突側は `in_flight` を見て 409 を返す |
| idempotency_keys テーブル肥大化 | 中 | `expires_at` に index を張り lazy GC（INSERT 前に同 scope の expired 行 DELETE）。Free plan のため cron 掃除に依存しない |
| レスポンス body 過大で書き込みコスト増 | 中 | body サイズ上限を設け超過時は保存スキップ（当該 endpoint は冪等化対象外に安全側で倒す） |
| Cloudflare CLI 直接実行（wrangler）で op/esbuild 解決漏れ | 中 | migration apply / list / deploy は `bash scripts/cf.sh` 経由のみ。`wrangler` 直接呼び出し禁止 |
| 失敗レスポンス（5xx）を冪等化して再試行を封じる | 中 | handler throw / 5xx 時は in_flight 行を DELETE し、再送で再実行できるようにする（失敗は冪等化しない） |
| 同一 key を別 body で再利用する client 不正使用 | 低 | `request_fingerprint` 不一致時は 422 を返し誤再生を防ぐ |
| migration apply のロールバック不能（不可逆 mutation） | 高 | `governance_mutation_user_gate: true`。apply 前に staging で検証し、`d1 export` でバックアップ取得。production apply はユーザー明示承認後のみ |

## 検証方法

### 単体検証

```bash
# 型・lint（apps/api 単体）
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint

# unit lane（contract.spec は exclude されるため middleware/repository の純ロジックのみ）
mise exec -- pnpm --filter @repo/api test
```

期待: 全 PASS、0 error / 0 warning。

```bash
# D1 lane（contract.spec を実行。idempotency dedupe の実 D1 挙動を検証）
mise exec -- pnpm --filter @repo/api exec vitest run --root=../.. --config=vitest.d1.config.ts apps/api/src/middleware/__tests__/idempotency.contract.spec.ts
```

期待: 以下 5 ケースが PASS。
- key 無しリクエスト → 従来通り handler 実行（冪等化なし）
- 同一 key 2 回目 → 初回 response を再生し handler は 1 回のみ実行
- 同一 key 並行（in_flight）→ 409 を返す
- 同一 key で body 異なる → 422 を返す
- handler 5xx → in_flight 行が DELETE され再送で再実行可能

### 統合検証

```bash
# 既存 migration の最大番号確認（採番衝突回避・read-only）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging
```

期待: 末尾に `0020_notification_channel_and_opt_out.sql` までが見え、新規 `0021_idempotency_keys.sql` が未適用として把握できる。

```bash
# （ユーザー承認後のみ）staging へ適用 → list で applied 確認
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging
```

期待: `idempotency_keys` を作る migration が `applied` 列で確認できる。

## スコープ

### 含む

- D1 migration による `idempotency_keys` テーブル新設（`apps/api/migrations/00NN_idempotency_keys.sql`）
- `apps/api/src/repository/idempotency.repository.ts`（`DB` binding 経由 CRUD + lazy GC）
- `apps/api/src/middleware/idempotency.ts`（header 検出 → dedupe → 初回結果保存 / 再生）
- `apps/api/src/routes/admin/` 配下の mutating route group への middleware 配線
- `*.contract.spec.ts`（D1 lane）+ 必要に応じ repository 単体 spec の追加
- TTL / 並行 race / body fingerprint / レスポンスサイズ上限の方針確定（Phase 1-2）

### 含まない

- apps/web client 側の変更（→ **既に issue-842 で完了**。`useAdminMutation.ts` の `idempotencyKey` 送出は実装済みのため本タスクでは触らない）
- idempotent method での retry 有効化 / 個別 caller の retry 宣言（→ **issue-842-followup-002** 相当。本タスクは server の受け皿整備のみで、caller の retry 有効化は別関心）
- 新規 API endpoint の追加・既存 endpoint の I/F shape 変更（CLAUDE.md UI prototype alignment 不変条件1。middleware は横断適用で handler shape を変えない）
- Google Form schema の変更（不変条件1・`idempotency_keys` は Form schema 外の admin-managed infra table）
- `apps/web` からの D1 直接アクセス（不変条件5。UI は header 送出のみ）
- 公開 / 会員 mypage の mutation 経路への波及（admin scope 限定）
- Cloudflare Queues / Cron Triggers による掃除（Free plan 制約。lazy GC を正本とする）

## 関連 path / refs

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- スコープ外宣言: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/index.md`「## スコープ外」§ server 側 idempotency-key 永続化
- 親 Phase 12 ガイド: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/outputs/phase-12/implementation-guide.md`
- client 実装（前提・変更しない）: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（`idempotencyKey` option L46 / header 送出 L229）
- 既存 idempotency 前例（テーブル設計の手本）: `apps/api/migrations/0009_tag_queue_idempotency_retry.sql`
- 既存 migration 最大番号（採番基準）: `apps/api/migrations/0020_notification_channel_and_opt_out.sql`
- D1 binding 定義: `apps/api/wrangler.toml`（binding `DB` / staging L160 / production L86）
- 既存 admin middleware 配線の手本: `apps/api/src/routes/admin/member-status.ts` L34（`app.use("*", requireAdmin)`）/ `apps/api/src/routes/admin/tags-queue.ts` L45
- middleware 配置先: `apps/api/src/middleware/`
- D1 lane test config: `vitest.d1.config.ts`（contract.spec はここで実行・unit config から exclude）
- Cloudflare CLI wrapper: `scripts/cf.sh`（wrangler 直接実行禁止）
- CLAUDE.md 不変条件: #4「Google Form schema 外データは admin-managed data として分離」/ #5「D1 直接アクセスは apps/api に閉じる」/ #8「test ファイルは `*.spec.{ts,tsx}` のみ」/ §Cloudflare 系 CLI 実行ルール（`scripts/cf.sh` 経由）
