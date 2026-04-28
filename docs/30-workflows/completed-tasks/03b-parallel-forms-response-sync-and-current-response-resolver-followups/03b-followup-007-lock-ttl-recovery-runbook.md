# sync_jobs ロック TTL 超過時の手動解除 runbook 整備 - タスク指示書

## メタ情報

| 項目         | 内容                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| タスクID     | 03b-followup-007-lock-ttl-recovery-runbook                                        |
| タスク名     | sync_jobs ロック TTL 超過時の手動解除 runbook 整備                                |
| 分類         | 運用整備                                                                          |
| 対象機能     | `sync_locks` テーブルの TTL 超過 row 手動 cleanup と再実行手順の runbook 化       |
| 優先度       | 中                                                                                |
| 見積もり規模 | 小規模                                                                            |
| ステータス   | 未実施                                                                            |
| 発見元       | 03b Phase 12 unassigned-task-detection #10                                        |
| 発見日       | 2026-04-28                                                                        |
| 引き取り候補 | infrastructure runbook（`doc/15-infrastructure-runbook` 改訂もしくは 09b cron triggers monitoring 系） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03b では Forms response 同期の二重起動防止のために、`sync_locks` テーブルへ TTL 付きの行を INSERT する機構を `apps/api/src/jobs/sync-lock.ts` の `acquireSyncLock` / `releaseSyncLock` で実装した。TTL は呼び出し側で `ttlMs` として渡され、cron / admin POST 双方で **10 分** を基準に運用する。

`acquireSyncLock` は呼び出し時に `expires_at < now` の expired lock を `DELETE` してから新規 INSERT を試行するため、**正常系では TTL 切れロックは自動で剥がれる**。しかし以下のケースでは手動解除が必要になる:

- Worker が CPU 制限 / OOM / Cloudflare 側障害で release 前に死亡し、TTL も切れていないのに長時間 stuck している（死活確認後の早期解除が必要）
- 異常時に `sync_jobs` 側 row が `status='running'` のまま残り、`sync_locks` row も holder が一致しないため次回 cron 起動でも `acquireSyncLock` が成功するが、`sync_jobs` の running row に対する観測が分断される
- 検証のためテストで意図的に lock を stuck させたあと、再実行可能な状態へ戻したい

### 1.2 問題点・課題

- TTL 10 分を超過した行を **どの SQL で確認するか** が runbook に未記載
- 安全な手動解除（`DELETE FROM sync_locks` / `UPDATE sync_jobs SET status='failed'`）の文法と発行順序が不明確
- 解除前の確認事項（実 Worker が本当に死んでいるか、cron 二重実行になっていないか）が口頭知識に留まっている
- `apps/api/src/routes/admin/responses-sync.ts` の 409 Conflict（`result.status === 'skipped'`）が継続発生している場合の **lock 起因 / job 起因の切り分け手順** が無い
- すべて `bash scripts/cf.sh d1 execute` 経由で実行する必要があるが、コマンド例が runbook に揃っていない

### 1.3 放置した場合の影響

- 本番で TTL 切れロックが残ると、cron 同期が連続 409 を返し response 取り込みが完全に停止する
- 解除手順が標準化されていないため、運用者が `wrangler` を直接叩いて 1Password 経路を逸脱するリスクがある（不変条件: scripts/cf.sh ラッパー必須）
- 03b 実装者の暗黙知に依存しており、手順が文書化されないまま属人化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`sync_locks` / `sync_jobs` の TTL 超過・stuck 状態に対する **状態確認 → 安全な解除 → 再実行 → 検証** までを runbook 化し、`bash scripts/cf.sh d1 execute` 経由で誰でも実行できる状態にする。

### 2.2 最終ゴール

- runbook が `doc/15-infrastructure-runbook/` 配下（または 09b cron triggers monitoring の運用節）に追加されている
- 状態確認 SQL / 解除 SQL / 再実行コマンドが **コピペ可能な形** で揃っている
- 解除前 checklist（Worker 死活・cron 重複・holder 同定）が明記されている
- すべての CLI 実行例が `bash scripts/cf.sh d1 execute` 経由で書かれており、`wrangler` 直接実行が含まれていない

### 2.3 スコープ

#### 含むもの

- `sync_locks` テーブルの状態確認 SQL（TTL 超過 row 抽出 / holder 確認 / 全件一覧）
- `sync_jobs` テーブルの running row 抽出 SQL
- 安全な手動解除手順（`DELETE FROM sync_locks WHERE id=? AND holder=?` / `UPDATE sync_jobs SET status='failed', finished_at=...`）
- 解除前 checklist（実行中 Worker の死活 / cron 二重起動の有無 / holder 同定）
- 解除後の再実行手順（`POST /admin/sync/responses` を 03b admin endpoint 経由で叩く例）
- 検証手順（再実行後に `result.status` が `succeeded` になるか / 409 が解消したか）

#### 含まないもの

- `acquireSyncLock` 実装の改修（TTL ロジック自体の変更は別タスク）
- 自動 cleanup cron の追加（観測してから設計判断するため別タスク）
- アラート通知の整備（UT-08 / 09b 系の責務）

### 2.4 成果物

- 新規 runbook 1 ファイル（推奨パス: `doc/15-infrastructure-runbook/sync-lock-ttl-recovery.md`）
- 03b implementation-guide からの相互リンク追記
- unassigned-task-detection #10 の引き取りステータス更新（「引き取り済み」へ）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `apps/api/src/jobs/sync-lock.ts` の `acquireSyncLock` / `releaseSyncLock` の挙動を理解している
  - expired lock は次回 acquire 時に自動 DELETE される
  - holder と lockId のペアでのみ release される
- `apps/api/src/routes/admin/responses-sync.ts` の 409 ハンドリング（`result.status === 'skipped'`）を理解している
- `bash scripts/cf.sh d1 execute` の使い方を理解している（wrangler 直接実行禁止）
- `sync_locks` / `sync_jobs` の DDL を確認できる（migration ファイル参照）

### 3.2 実行手順（runbook 本文に書く内容）

#### Step 1: 状態確認

```bash
# 現在のロック row を一覧
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT id, holder, acquired_at, expires_at, trigger_type FROM sync_locks;"

# TTL 超過 row のみ抽出（datetime('now') と比較）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT id, holder, acquired_at, expires_at FROM sync_locks WHERE expires_at < datetime('now');"

# 関連 sync_jobs の running row 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT id, status, started_at, finished_at, holder FROM sync_jobs WHERE status='running' ORDER BY started_at DESC LIMIT 10;"
```

#### Step 2: 解除前 checklist

- [ ] Cloudflare Workers の Logs / Tail で当該 holder の Worker invocation が **既に終了** していることを確認
- [ ] cron trigger の実行履歴（Cloudflare dashboard）で同時刻帯に二重起動が発生していないことを確認
- [ ] `sync_jobs` の `holder` と `sync_locks` の `holder` が一致していること（不一致なら別事象）
- [ ] 直近 10 分以内に admin POST `/admin/sync/responses` が実行されていないこと（409 を踏んでいる側の操作と区別）

すべて確認できた場合のみ Step 3 へ進む。

#### Step 3: 安全な手動解除

```bash
# 1) sync_locks の該当 row を holder 指定で削除（id だけだと他 holder と衝突する可能性）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "DELETE FROM sync_locks WHERE id='sheets-to-d1' AND holder='<HOLDER_ID>';"

# 2) sync_jobs の running row を failed に倒す（observability 用に finished_at を埋める）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "UPDATE sync_jobs SET status='failed', finished_at=datetime('now'), error_message='manual recovery: lock TTL exceeded' WHERE id='<JOB_ID>' AND status='running';"
```

> 注: `<HOLDER_ID>` / `<JOB_ID>` は Step 1 で取得した値を埋める。`DELETE FROM sync_locks` 単独では問題ないが、誤削除防止のため holder 一致条件を必ず付ける。

#### Step 4: 再実行

```bash
# admin endpoint 経由で同期を再実行（SYNC_ADMIN_TOKEN は 1Password 参照）
curl -X POST "https://api.<env>.example.com/admin/sync/responses" \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"
```

`SYNC_ADMIN_TOKEN` は `.env` の op 参照経由で取得する（実値を CLI 履歴に残さない）。

#### Step 5: 検証

- レスポンス JSON が `{ ok: true, result: { status: "succeeded", ... } }` になることを確認
- 直後に Step 1 の SQL を再実行し、新しい lock row が holder を更新して INSERT されている / または release 済みで row が消えていることを確認
- `sync_jobs` 最新 row の status が `succeeded` であることを確認

### 3.3 受入条件 (AC)

- AC-1: runbook が指定パスに存在し、Step 1〜5 のコマンドがコピペで実行可能
- AC-2: すべての CLI 例が `bash scripts/cf.sh d1 execute` 経由で記載され、`wrangler` 直接実行が登場しない
- AC-3: 解除前 checklist 4 項目（Worker 死活 / cron 二重起動 / holder 一致 / admin POST 非実行）が明記されている
- AC-4: `acquireSyncLock` が expired lock を自動 DELETE する仕様が前提として明記されている（runbook が必要になるのは Worker 死亡など異常系のみ、と読み手が判断できる）
- AC-5: 03b implementation-guide.md（または 03b 完了報告）から本 runbook への相互リンクが張られている
- AC-6: unassigned-task-detection.md #10 の status が「引き取り済み」に更新され、引き取り先として本 runbook パスが記載されている

---

## 4. 苦戦箇所 / 学んだこと（03b で得た知見）

### 4.1 expired lock 自動剥がれの誤解

`acquireSyncLock` は呼び出し時に `DELETE FROM sync_locks WHERE id=? AND expires_at < ?` を実行するため、**次回 acquire を誰かが叩けば** TTL 切れロックは自動で剥がれる。runbook 利用が必要になるのは:

- Worker が死んでいて誰も次回 acquire を叩かない
- cron が次回 tick まで来ない（10 分間 409 を返し続ける）
- 検証で意図的に再実行可能な状態へ戻したい

の 3 ケースに限定される。runbook 冒頭にこの前提を書いておかないと、運用者が自動剥がれするケースで余計な手動 DELETE を実行してしまう。

### 4.2 holder 一致条件の重要性

`releaseSyncLock` は `WHERE id=? AND holder=?` で削除するため、運用 SQL も同じ holder 一致条件を必ず付けるべき。`DELETE FROM sync_locks WHERE id='sheets-to-d1'` 単独だと、同タイミングで別 Worker が新規取得した row を巻き込む競合の可能性がある（Step 3 の SQL を実行する瞬間に別 invocation が走るレース）。

### 4.3 sync_jobs と sync_locks の二重整合

03b は `sync_locks`（TTL 二重起動防止）と `sync_jobs`（実行履歴・観測）を分離している。lock を消しても `sync_jobs` の `running` row は残り続けるため、observability 上 false running として残る。runbook で `UPDATE sync_jobs SET status='failed'` を必須にしないと、失敗履歴が観測に乗らない。

### 4.4 検証用 stuck 再現の手段不足

03b 実装中、TTL 切れ判定とロック row の cleanup を検証したかったが、本 runbook が無かったため毎回 D1 を直接叩いて手探りで cleanup していた。本 runbook が早期に整備されていれば、テストでの stuck → recovery flow の再現コストを大幅に下げられた。

---

## 5. 関連リソース

- `apps/api/src/jobs/sync-lock.ts` - `acquireSyncLock` / `releaseSyncLock` 実装
- `apps/api/src/routes/admin/responses-sync.ts` - 409 Conflict 応答ロジック
- `apps/api/src/jobs/sync-forms-responses.ts` - `runResponseSync` 本体
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` #10
- `CLAUDE.md` - Cloudflare CLI ラッパー方針（`bash scripts/cf.sh` 必須）
- `doc/15-infrastructure-runbook/` - runbook 配置先候補
- 09b cron triggers monitoring 関連タスク（引き取り候補）
