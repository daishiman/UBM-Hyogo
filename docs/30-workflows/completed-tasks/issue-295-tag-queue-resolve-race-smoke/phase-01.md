# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 1 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 1 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-01/main.md

## 完了条件

- [x] Phase 1 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 01 — 要件定義

[実装区分: 実装仕様書]

## 目的

in-memory D1（unit / contract test 環境）では再現できない、実 D1 上の真の同時 POST race を staging smoke として検証する要件を定義する。

## 背景

- `apps/api/src/workflows/tagQueueResolve.ts` の resolve handler は、`UPDATE tag_assignment_queue SET status='resolved'/'rejected' WHERE queue_id=? AND status IN ('queued','reviewing')` 相当の guarded UPDATE を repository 経由で発行し、`changes=0` のとき `TagQueueResolveError({ code: 'race_lost' })` を throw する。
- route layer (`apps/api/src/routes/admin/tags-queue.ts`) は `ERROR_TO_STATUS` で `race_lost -> 409` にマップする。
- in-memory D1（better-sqlite3 driver）は SQLite serialized mode のため、test code レベルでは逐次実行となり、真の並行 race を再現できない。
- 実 D1（Cloudflare）は分散 storage のため、真の同時 INSERT/UPDATE 競合が起こりうる。本タスクはその実環境挙動を smoke で確認する。

## 検証する race 条件

- 同一 `queueId` に対して、N 並行で `POST /admin/tags/queue/:queueId/resolve` を投げる
- 並行 POST 数: 最低 2、推奨 5（default `--concurrency=5`）
- payload は同 `action` で良い（例: 全件 `confirmed` + 同一 `tagCodes`）/ 異なる action 混在も許容

## 終状態の期待値

| 項目 | 期待 |
| --- | --- |
| HTTP 200（`{ok:true}`）件数 | ちょうど 1 |
| HTTP 409（`{ok:false, error:"race_lost"}`）件数 | N - 1 |
| 上記以外（500 / 4xx other / network error）件数 | 0 |
| `member_tags` 増分 | 成功した resolve の `tagCodes` 行数（confirmed のみ。rejected なら 0） |
| `audit_log` 増分 | 1（成功した resolve の `tag_queue.resolve.confirmed` または `.rejected`） |
| queue 行 status | `resolved` または `rejected`（unidirectional） |

## staging で検証する根拠

- 真の同時 D1 排他挙動は Cloudflare D1 実装依存のため、本番相当環境で確認しないと regression を検知できない。
- staging は production と同 D1 stack のため、smoke 結果が production 挙動の代理として有効。

## flakiness 対策の要件

- script は `Promise.all` で N 件並行投げ、全件 settle 後に集計する（timing window に依存しない）。
- network error / timeout は `others` カウントへ。pass 判定は `successes==1 && raceLosts>=1 && others==0`。
- concurrency=1 は race を再現できないため usage error 扱い（exit 2）。operator / CI wrapper が exit code だけを見ても未実行を成功扱いしない。

## 不変条件

- 不変条件 #5: smoke script は HTTP（fetch）経由のみで `apps/api` を叩く。D1 を直接 query しない。副作用確認の SELECT は `scripts/cf.sh d1 execute` を別途人手で実行し、差分 summary JSON を `--side-effect-input` で runner に渡すと AC-4 も exit code に反映できる。
- 認証は session cookie ベース（admin user）。cookie 値は `op://` 経由で取得し、script 引数 `--session-cookie` で渡す。stdout / log には redact して出す。

## 成果物

- `outputs/phase-01/main.md`

## 次 Phase

- [phase-02.md](./phase-02.md): 設計
