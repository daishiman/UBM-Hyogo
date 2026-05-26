# Phase 3: 設計レビュー

> Phase 2 設計が Phase 4（テスト計画）へ進める品質かを判定するゲート（**Gate-A**）。

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
|---|---|---|
| 価値性 | ✅ | client header だけ送って server が無視している構造的 gap を 1 middleware で塞ぐ。retry 二重書き込み / 二重 submit / ブラウザ再送の全パターンに対応。admin 全 mutation route に横断適用できる |
| 実現性 | ✅ | migration 1 本 + middleware 1 本 + repository 5 関数 + 配線 1 行追加。既存 `0009_tag_queue_idempotency_retry.sql` の partial unique index 前例があり、設計の手本が手元にある。1 実装サイクルで完了する厚み |
| 整合性 | ✅ | 責務境界（middleware=横断 dedupe / repository=純 CRUD / handler=resource ロジック不変）が矛盾なく閉じる。CLAUDE.md 不変条件 5（D1 apps/api 内）/ 不変条件 1（endpoint surface 不変）/ 不変条件 4（Form schema 外データ分離）を全て満たす |
| 運用性 | ✅ | 後方互換（header なしは next() 通過）。失敗は冪等化しない（5xx で in_flight DELETE）方針により retry 安全性と失敗復旧の両立。lazy GC で Cron 不要・Free plan に整合 |

## 2. 真の論点と切り分け

- **真の論点**: 「同一意図の再送をどこで 1 回として扱うか」→ middleware に集約（handler 群を破壊せず横断適用）
- **複数案件の混在チェック**: 起源 spec には「idempotent caller の retry 有効化」が暗黙に混ざっていたが、本仕様では **server 受け皿整備のみ**にスコープを切り、caller の retry 宣言は `issue-842-followup-002` 相当の別タスクとして分離。先送りではなく「別関心の正当な分離」（caller 側 retry 有効化は server 受け皿が green になってから初めて意味を持つため、依存順序的にも正しい）

## 3. レビュー観点（7 観点）

### 3.1 schema 妥当性

| チェック項目 | 判定 | 根拠 |
|---|---|---|
| 主キー設計が dedupe 用途に最適か | ✅ | `(idempotency_key, request_method, request_path)` UNIQUE で同一 key の別 endpoint 流用を分離。method と path を独立列にしたことで `EXPLAIN QUERY PLAN` でも index ヒット可能 |
| 列の型が D1 / SQLite と整合 | ✅ | TEXT / INTEGER のみ。BLOB を避け再生時の構築コストを下げる。`expires_at` の TEXT ISO8601 は既存 D1 schema と一貫 |
| `response_body` を TEXT 列で持つ妥当性 | ✅ | 64KB 上限ガードがあり、TEXT 列で十分。BLOB 化のオーバーヘッドを避ける |
| GC 用 index | ✅ | `idx_idempotency_expires` 単独で `DELETE WHERE expires_at < ?` の lazy GC が O(log N) |
| migration 番号衝突リスク | ✅ | Phase 1 で `d1 migrations list` 実行 → 採番確定の手順を明文化。並列 worktree の `0014_*` 4 本重複前例の再発防止 |

### 3.2 race 楽観ロック

| チェック項目 | 判定 | 根拠 |
|---|---|---|
| read-then-write を避けているか | ✅ | `getByScope` を先に呼ばず、まず `INSERT ... ON CONFLICT DO NOTHING` を実行し `meta.changes` で挿入有無を判定 |
| UNIQUE 衝突後の race window 対応 | ✅ | INSERT 失敗 → `getByScope` で record 取得 → null の場合（他リクエストの DELETE と同時発生）は安全側で next() に倒す方針が Phase 2 §3.2 / §8 に明記 |
| 並行リクエストの 409 返却 | ✅ | `status='in_flight'` を「処理中」シグナルとして利用。Phase 2 §3.2 / 起源 spec §苦戦箇所の前例 (`0009_tag_queue_idempotency_retry.sql`) に整合 |
| transaction 不在で integrity が保てるか | ✅ | 全ての mutation が単一 SQL（UNIQUE INDEX による原子性に依拠）。明示 BEGIN/COMMIT は D1 で必須ではない |

### 3.3 TTL 妥当性

| チェック項目 | 判定 | 根拠 |
|---|---|---|
| client retry window をカバー | ✅ | 24h ≫ `useAdminMutation.maxDelayMs=2000ms` × 最大 attempt（秒オーダー） |
| テーブル無限肥大の防止 | ✅ | 24h × admin mutation 頻度（実測小）で D1 quota 内。`gcExpired` を INSERT 直前に毎回呼ぶ lazy GC で連続増加を抑制 |
| Cron 不在運用との整合 | ✅ | Free plan 制約に整合（CLAUDE.md / 起源 spec §3.4） |
| 環境変数化の必要性 | ⚠️→GO | 現状は定数 `IDEMPOTENCY_TTL_MS` で固定。将来 `getEnv()` 経由化の余地はあるが MVP 範囲では不要（追加すると invariant `getEnv()` の zod schema 拡張が必要・本タスクの scope を膨らませる）。Phase 12 で「将来拡張点」として明記 |

### 3.4 レスポンス再生整合

| チェック項目 | 判定 | 根拠 |
|---|---|---|
| body を消費せず元レスポンスを返せるか | ✅ | `c.res.clone()` で読み取り、元の `c.res` は維持 |
| content-type の一致 | ✅ | 非 JSON は保存対象外（AC-10）。再生時 `application/json` 固定で問題なし |
| size 上限（64KB） | ✅ | admin mutation の応答は通常作成/更新結果 + status で小さく、64KB 上限は安全側で十分 |
| `x-idempotent-replay` header の副作用 | ✅ | client は依存しない hint。観測時の debug 用途のみ。後方互換破壊なし |
| status / headers の透過性 | ✅ | raw text 保存により完全に同一バイト列を返す。client から見て再生か初回かは header の hint のみで識別 |

### 3.5 不変条件 5 遵守（D1 直接アクセスは apps/api）

| チェック項目 | 判定 | 根拠 |
|---|---|---|
| middleware の D1 アクセス経路 | ✅ | `c.env.DB` 経由のみ。`apps/web` から idempotency_keys テーブルに触らない |
| repository の引数 | ✅ | `D1Database` を引数で受け取る pure functions。fetch / 直接接続なし |
| 配線層（_shared.ts） | ✅ | admin Hono app に middleware を `app.use` するのみ。apps/web 側に dispatcher を作らない |

### 3.6 既存 admin route への影響範囲

| チェック項目 | 判定 | 根拠 |
|---|---|---|
| handler の I/F 変更 | ✅ なし | middleware は ctx に書き込まない（hidden state を残さない）。handler は body を従来通り `c.req.json()` で読める（middleware が再構築） |
| middleware 順序の衝突 | ✅ | `requireAdmin` → `idempotency` の順。認可失敗時に idempotency record を作らない設計 |
| 既存 `writeTagNoteProviderMiddleware` 等との共存 | ✅ | `idempotency` は早期 next() / 早期 return のみで他 middleware の chain に副作用なし |
| 既存 contract.spec / integration spec の retest 範囲 | ✅ | admin route の handler shape 不変のため既存 spec は通る前提（Phase 4 で実証） |

### 3.7 contract.spec lane 整合

| チェック項目 | 判定 | 根拠 |
|---|---|---|
| D1 lane 設定の存在 | ✅ | `apps/api/vitest.d1.config.ts` 既存。本タスクの `*.contract.spec.ts` はこの lane で実行 |
| unit config からの exclude | ✅ | CLAUDE.md MEMORY 既知事項として `*.contract.spec.ts` は unit config から exclude。新規ファイルも同名規則 |
| 純ロジック spec の lane 分離 | ✅ | repository の `getByScope` 等のクエリ組み立てなど純ロジックは `idempotency.repository.spec.ts`（unit lane）で取り扱い、D1 が必要なケースは contract.spec に寄せる |
| migration 適用前のテスト fixture | ✅ | D1 lane setup が migration を順次適用する既存仕組みを利用（既存 contract.spec の慣行に整合） |

## 4. リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| migration 番号衝突（並列 worktree） | 高 | Phase 1 で `bash scripts/cf.sh d1 migrations list --env staging` を read-only evidence として取得 → 採番確定 |
| 同時並行リクエスト二重 INSERT | 高 | UNIQUE INDEX + `INSERT ... ON CONFLICT DO NOTHING` で楽観ロック。read-then-write 禁止 |
| `c.req.text()` 後の body 再消費不能 | 中 | `c.req.raw = new Request(url, { ...init, body, duplex: "half" })` で書き戻し |
| AbortController と middleware の干渉 | 低 | client side AbortError は network 上の reject。server middleware は完了済みリクエストのみ扱うため影響なし |
| 失敗（5xx）冪等化による retry 封じ | 高 | in_flight DELETE で再送可能に倒す。AC-6 / Phase 2 §8 に明記 |
| size 超過 / 非 JSON で意図せず再生される | 中 | size 超過 / 非 JSON は保存スキップ + in_flight DELETE で「冪等化対象外」に倒す（AC-9 / AC-10） |
| migration apply のロールバック不能 | 高 | `governance_mutation_user_gate: true`。Phase 13 で staging → production の段階適用。`d1 export` で backup |
| Cloudflare CLI 直接実行 | 中 | `scripts/cf.sh` 経由を不変条件として明記。Phase 5 / Phase 13 の手順に wrapper コマンドのみ書く |
| 既存 admin route の middleware chain 順序破壊 | 中 | `_shared.ts` で helper 集約 + Phase 5 で chain 適用箇所を grep 確認 |

## 5. Phase 4 進行条件

- [x] 4 条件評価が全て ✅
- [x] 真の論点とスコープ分離の妥当性を確認（caller retry 有効化は別タスク）
- [x] 7 観点（schema / race / TTL / replay / 不変条件 5 / 既存 route 影響 / contract.spec lane）を網羅レビュー
- [x] リスクと対処を 9 件列挙
- [x] AC-1〜AC-17 全てに対応する設計の存在を Phase 2 §2〜§8 で確認

## 6. 判定

**GO（Phase 4 へ進行可）**。

- D1 schema・middleware フロー・repository signature・配線方針・エラーハンドリング 9 ケースが確定
- AC-1〜AC-17 全てに対応する設計が Phase 2 内に存在
- 1 実装サイクル内で完了するスコープに収まっている（CONST_007 充足）
- CLAUDE.md 不変条件 1 / 4 / 5 / 8 および §Cloudflare CLI 実行ルールを全て満たす
- 不可逆 mutation（`d1 migrations apply` / `cf.sh deploy`）はユーザー明示承認後のみという user-gate を artifacts.json / index.md / Phase 1 で多重に明記済

## 7. 完了条件（Phase 3）

- [ ] 4 条件評価が全て ✅
- [ ] 真の論点とスコープ分離の妥当性を確認
- [ ] レビュー観点 7 件を網羅
- [ ] リスクと対処を列挙
- [ ] GO/NO-GO 判定を記録
- [ ] Phase 4 進行条件のチェックリストを残す
