# Phase 12: ドキュメント更新

> Refs #913
> 前提: Phase 11 完了。本フェーズで canonical 9 headings を満たす最終ドキュメントを整え、PR 作成（Phase 13）へ進む。

## Part 1: 中学生にも分かる概念説明（必須セクション）

お店のレジで「同じレシート番号で 2 回お会計しても、1 回しか引き落とされない仕組み」を作るのが今回の変更です。

たとえば、管理画面で「タグを 1 個追加する」ボタンを押した瞬間にネットワークが不安定で、ブラウザが「もう 1 回送ったほうがいいかな？」と同じリクエストを 2 回送ってしまうことがあります。何も対策していないと、タグが 2 個できてしまいます。

そこで、ブラウザは送信するときに「このリクエストの整理番号は ABC123 だよ」というラベル（`Idempotency-Key`）を付けます。サーバー側は届いた整理番号をノート（D1 の `idempotency_keys` テーブル）に書き留めて、

- 同じ整理番号が初めて来たら、いつも通り処理して結果をノートに保存する
- 同じ整理番号がもう一度来たら、処理はやり直さずに、ノートに残っている結果をそのまま返す
- ちょうど 1 回目を処理している最中に 2 本目が届いたら「いま処理中だから少し待って」と 409 で返す
- 整理番号は同じなのに中身（注文内容）が違うときは「これは別のお願いに見えるよ」と 422 で返す
- 失敗（5xx）したらノートから消して、次に同じ整理番号で来たらやり直せるようにする
- 古いノートは新しい書き込みの直前にまとめて消す（lazy GC）

この仕組みをサーバーの「入口」（Hono の middleware）に置くことで、既存の処理コードを書き換えずに、管理画面の全ての書き込みに自動でラベル確認が入ります。

## Part 2: 技術者向け詳細

### D1 schema（`apps/api/migrations/0021_idempotency_keys.sql`）

| 列 | 型 | 役割 |
|---|---|---|
| `id` | TEXT PRIMARY KEY | ULID 等の内部 ID |
| `key` | TEXT NOT NULL | client 送出の `Idempotency-Key` header |
| `method` | TEXT NOT NULL | HTTP method（POST/PATCH/PUT/DELETE） |
| `path` | TEXT NOT NULL | route path（例: `/admin/tags`） |
| `fingerprint` | TEXT NOT NULL | method + path + body の hash |
| `status` | TEXT NOT NULL | `in_flight` / `completed` |
| `response_status` | INTEGER NULL | 保存済 HTTP status |
| `response_body` | TEXT NULL | 保存済 body（JSON 文字列） |
| `response_headers` | TEXT NULL | 保存済 header 集合（JSON） |
| `created_at` | INTEGER NOT NULL | epoch ms |
| `expires_at` | INTEGER NOT NULL | TTL（例: 24h 後） |

- `UNIQUE INDEX idempotency_keys_scope ON idempotency_keys(key, method, path)` で同一 scope の重複を防ぐ（既存 `0009_tag_queue_idempotency_retry.sql` の partial unique index と同じ流儀）。
- `INDEX idempotency_keys_expires_at ON idempotency_keys(expires_at)` で lazy GC を効率化。

### middleware（`apps/api/src/middleware/idempotency.ts`）

1. `Idempotency-Key` header が無ければ即 `next()`（pass-through）
2. body を `c.req.raw.clone()` で 1 度だけ読み、`computeFingerprint(method, path, bodyBytes)` を算出
3. `pruneExpired({ now })` を 1 回呼び lazy GC
4. `INSERT ... status='in_flight'`（UNIQUE INDEX で race を SQLite に判定させる）
   - 衝突したら `findExistingByScope` → 既存 row の状態で分岐
     - `status='completed'` かつ fingerprint 一致 → 保存済 response を再生
     - `status='completed'` かつ fingerprint 不一致 → 422
     - `status='in_flight'` → 409
5. INSERT 成功時は `next()` で handler 実行、`try/finally` で
   - 成功時: `saveResult({ id, status, body, headers })` で `status='completed'` 更新
   - 5xx / throw 時: `deleteInFlight({ id })` で行削除（失敗は冪等化しない）

### 配線（`apps/api/src/routes/admin/_shared.ts`）

既存 `requireAdmin` middleware と同列に `app.use("*", idempotency)` を追加。admin scope 内のすべての mutation route group に横断適用される。`apps/api/src/routes/admin/*.ts` の handler は変更しない。

### dedupe アルゴリズム / TTL / race

- **dedupe アルゴリズム**: UNIQUE INDEX(key, method, path) で SQLite に race judge を委譲。アプリ側で SELECT → INSERT の 2 phase を組まないことで TOCTOU を避ける。
- **TTL**: 24h（実装側で定数化。`expires_at = created_at + 24 * 3600 * 1000`）。lazy GC は新規 INSERT 経路の前段で 1 回呼ぶ（Cloudflare Free plan に Cron / Queues 制約があるため）。
- **race**:
  - 並行 2 本のうち先勝ちした方が `in_flight` を取り、もう片方は UNIQUE 衝突 → 409。
  - 先勝ち handler が応答前に二度目の同一 key が来た場合も 409。
  - 完了後の同一 key は再生で 2 回目以降の冪等性を保証。

## 視覚証跡

**NON_VISUAL**（apps/api middleware + D1 schema 追加のため、UI 視覚変更なし）。Playwright visual baseline 不要。

代替証跡は Phase 11 で取得し `outputs/phase-11/` 配下に保存:

- `outputs/phase-11/contract-spec-pass.log`（D1 lane 全ケース PASS）
- `outputs/phase-11/wrangler-tail-dedupe.log`（staging での dedupe ログ）
- `outputs/phase-11/idempotency-keys-snapshot.sql`（テーブル状態 snapshot）
- `outputs/phase-11/curl-1.json` / `curl-2.json` / `curl-parallel.log`（再生 / 409 の挙動）

## システム仕様書同期（Step 1-A / 1-B / 1-C）

実装後に `.claude/skills/aiworkflow-requirements/` 側へ以下の反映を行う（実装完了後に追記）:

| Step | 反映先 | 内容 |
|---|---|---|
| Step 1-A | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` | `idempotency-key` / `server-idempotency` / `admin-mutation-dedupe` keyword 登録（`pnpm indexes:rebuild` で自動再生成） |
| Step 1-B | `.claude/skills/aiworkflow-requirements/lessons-learned/`（該当ファイル末尾） | L-SIDEM-001..00n として「UNIQUE INDEX による race judge 委譲」「lazy GC を Free plan で正本化」「失敗時は冪等化しない原則」「contract.spec は D1 lane 専用」等の学びを汎化登録 |
| Step 1-C | `.claude/skills/task-specification-creator/references/patterns-lessons.md` | server-side idempotency の Phase 配分（schema + middleware + repository を分け、純粋関数は unit lane / I/O は D1 lane へ寄せる）を pattern として登録 |

## 不可逆 mutation 警告

本タスクは以下の **不可逆 mutation** を含む。これらは必ず Gate-C（ユーザー明示承認）後にのみ実行する。

| コマンド | 種別 | 不可逆性 |
|---|---|---|
| `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging` | D1 schema 追加 | 適用後は migration history が前進し、巻き戻しは追加 migration が必要 |
| `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` | D1 schema 追加 | 同上（production） |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | Workers deploy | 過去 version への rollback は version ID 指定が必要 |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | Workers deploy | 同上（production） |

**事前バックアップ手順（apply 前に必ず実施）**:

```bash
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output outputs/phase-11/backup-before-0021.sql
```

production 適用は staging で Phase 11 全 Step 通過後、別オペレーション（Phase 13 ではなく manual op）として切り分ける。`wrangler` 直接実行は禁止（CLAUDE.md `feedback_cloudflare_cli_wrapper`）。

## 完了条件（Phase 12 DoD）

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` 0 error
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api lint` 0 warning / 0 error
- [x] `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/middleware/__tests__/idempotency.spec.ts` 3 PASS
- [x] `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/idempotency.repository.spec.ts` 3 PASS
- [ ] `mise exec -- pnpm build` 0 error
- [ ] Phase 11 staging 適用 + 再生 / 409 確認完了（evidence が `outputs/phase-11/` に揃う）
- [ ] aiworkflow-requirements への Step 1-A/1-B/1-C 反映完了
- [ ] `gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift なし
