# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |
| Source Issue | #297 |

---

## 目的

resolve API 契約の異常系（401 / 403 / 404 / 409 / 422 / 400 / 5xx）を網羅的に列挙し、
各ケースで「HTTP status / レスポンス body / D1 副作用 / audit_logs エントリ / apps/web client UI 表示」を 1:1 で固定する。
特に不変条件 #11（admin が本人本文を編集できない）を主検証として、
audit_logs 経路と member_tags 経路以外への write が起きないことを確認する。

---

## 実行タスク

1. failure cases 表を 7 系統（401/403/404/409/422/400/5xx）で網羅作成
2. 各ケースの audit_logs エントリ期待値を確定
3. apps/web client の toast / UI エラーメッセージ整合性を表で固定
4. idempotent 再投入の同期 race を 2 シナリオで深堀
5. D1 transaction 失敗時の rollback 検証手順を確定
6. 不変条件 #11 / #5 の異常系での再検証

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | C-01〜C-10 / A-01〜A-03 ケース表 |
| 必須 | phase-05.md | ファイル変更マニフェスト / placeholder |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | 正本契約のエラーセマンティクス |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | client エラーハンドリング規約 |
| 参考 | apps/api/src/middleware/ | error formatter 既存実装 |

---

## Failure Cases 網羅表

### 7 系統 × 詳細ケース

| ID | 系統 | シナリオ | リクエスト | 期待 status | レスポンス body | D1 副作用 | audit_logs | client UI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-401-01 | 401 | 未認証 | `Authorization` ヘッダなし | 401 | `{ error: "unauthenticated" }` | なし | 追加なし | toast「ログインが必要です」/ login へ redirect |
| F-403-01 | 403 | 一般会員 session | 非 admin role | 403 | `{ error: "forbidden" }` | なし | 追加なし | toast「権限がありません」 |
| F-403-02 | 403 | admin gate 未通過（role 剥奪直後）| stale admin claim | 403 | 同上 | なし | 追加なし | 同上 |
| F-404-01 | 404 | queueId が存在しない | `:queueId=NOT_EXIST` | 404 | `{ error: "queue_not_found" }` | なし | 追加なし | toast「対象が見つかりません」 |
| F-409-01 | 409 | resolved 後に rejected 投入（逆走）| C-01 後に C-02 body | 409 | `{ error: "conflict", reason: "already_resolved" }` | 状態不変 | 追加なし | toast「既に確定済みのため拒否できません」 |
| F-409-02 | 409 | rejected 後に confirmed 投入（逆走）| C-02 後に C-01 body | 409 | `{ error: "conflict", reason: "already_rejected" }` | 状態不変 | 追加なし | toast「既に拒否済みのため確定できません」 |
| F-409-03 | 409 | 別 payload で confirmed 再投入（race lost）| C-01 後に異なる tagCodes | 409 | `{ error: "conflict", reason: "payload_mismatch" }` | 状態不変 | 追加なし | toast「他の管理者が処理しました」 |
| F-409-04 | 409 | 並行 POST race（同時 2 リクエスト）| 同時 confirmed 2 本 | 1 本 200 / 1 本 409 | 同上 | 1 本のみ反映 | 1 件のみ追加 | 敗者 client は toast「他の管理者が処理しました」|
| F-422-01 | 422 | unknown tagCode | `tagCodes: ["NOT_EXIST"]` | 422 | `{ error: "unknown_tag_code", tagCodes: ["NOT_EXIST"] }` | 状態不変 | 追加なし | toast「未登録のタグコードです」 |
| F-422-02 | 422 | inactive な tagCode（`active=false`）| `tagCodes:["TC_DEPRECATED"]` | 422 | `{ error: "inactive_tag_code" }` | 状態不変 | 追加なし | toast「非アクティブなタグです」 |
| F-422-03 | 422 | member_deleted の queue | M_DELETED 由来 | 422 | `{ error: "member_deleted" }` | 状態不変 | 追加なし | toast「対象会員が削除済みです」 |
| F-400-01 | 400 | body validation（reason 欠落）| `{ action:"rejected" }` | 400 | `{ error: "validation_error", issues: [...] }` | 状態不変 | 追加なし | toast「入力エラー」/ form inline error |
| F-400-02 | 400 | body validation（discriminator 欠落）| `{ tagCodes:["TC_A"] }` | 400 | 同上 | 状態不変 | 追加なし | 同上 |
| F-400-03 | 400 | tagCodes 空配列 | `{ action:"confirmed", tagCodes:[] }` | 400 | 同上 | 状態不変 | 追加なし | 同上 |
| F-400-04 | 400 | reason 空文字 | `{ action:"rejected", reason:"" }` | 400 | 同上 | 状態不変 | 追加なし | 同上 |
| F-400-05 | 400 | unknown action | `{ action:"unknown" }` | 400 | 同上 | 状態不変 | 追加なし | 同上 |
| F-5xx-01 | 5xx | D1 write 中に binding 失敗 | mock D1 throw on `member_tags` insert | 500 | `{ error: "internal" }` | rollback で状態不変 | 追加なし | toast「サーバエラー」/ 再試行ボタン |
| F-5xx-02 | 5xx | audit_logs insert 失敗 | mock throw on `audit_logs` insert | 500 | 同上 | transaction rollback で member_tags / queue.status も巻き戻し | 追加なし | 同上 |

---

## audit_logs エントリ確認

| シナリオ | action | actor_id | target_type | target_id | extra_json |
| --- | --- | --- | --- | --- | --- |
| C-01 成功時 | `admin.tag.queue_resolved` | admin user id | `tag_assignment_queue` | `Q1` | `{ tagCodes: ["TC_A"] }` |
| C-02 成功時 | `admin.tag.queue_rejected` | admin user id | `tag_assignment_queue` | `Q2` | `{ reason: "duplicate" }` |
| C-03 / C-04 idempotent | （追加なし） | — | — | — | — |
| F-401 / F-403 / F-404 / F-409 / F-422 / F-400 / F-5xx | （追加なし） | — | — | — | — |

> 異常系で audit_logs にエントリが残らないことを「成功時のみ追加」原則として contract test で assert する。

---

## apps/web client UI エラーメッセージ整合性

| API error | client mapping | toast | inline form error | side effect |
| --- | --- | --- | --- | --- |
| 401 unauthenticated | `redirect to /login` | 「ログインが必要です」 | — | session clear |
| 403 forbidden | `throw ForbiddenError` | 「権限がありません」 | — | — |
| 404 queue_not_found | `throw NotFoundError` | 「対象が見つかりません」 | — | queue list refetch |
| 409 conflict (`reason` 別) | `throw ConflictError` | reason ごとに分岐 | — | queue list refetch |
| 422 unknown_tag_code | `throw ValidationError` | 「未登録のタグコードです」 | tagCode 入力欄に inline | — |
| 422 inactive_tag_code | 同上 | 「非アクティブなタグです」 | 同上 | — |
| 422 member_deleted | 同上 | 「対象会員が削除済みです」 | — | queue list refetch |
| 400 validation_error | client zod も先に阻止 | 「入力エラー」 | issues を field 単位に展開 | submit button 再有効化 |
| 500 internal | `throw ServerError` | 「サーバエラー」+ 再試行 | — | — |

> client 側 zod parse は API 呼び出し前に実行し、F-400-01〜F-400-05 は基本的にクライアントで阻止する（多層防御）。
> ただし API 側でも 400 を返す経路を維持し、外部からの直接 POST にも防御する。

---

## Idempotent 再投入の同期 race 検証

### シナリオ 1: 同 payload 連続投入（idempotent path）

```
T+0   admin A: POST resolve { action:"confirmed", tagCodes:["TC_A"] }   → 200 idempotent:false
T+0.5 admin A: POST resolve { action:"confirmed", tagCodes:["TC_A"] }   → 200 idempotent:true（副作用なし）
```

検証ポイント:
- 2 回目で `member_tags` 行数が増えないこと（unique index または service 層 idempotent 判定）
- 2 回目で `audit_logs` エントリが増えないこと
- response body の `idempotent` フラグが `true` であること

### シナリオ 2: 並行 POST race（敗者 409）

```
T+0   admin A: POST resolve { action:"confirmed", tagCodes:["TC_A"] }
T+0   admin B: POST resolve { action:"confirmed", tagCodes:["TC_B"] }   ← 別 payload で同時
```

検証ポイント:
- 1 本が 200 / もう 1 本が 409 (`payload_mismatch`)
- D1 への二重 write が起きない（transaction の serialize に依存）
- 敗者 client は queue list を refetch して最新 status を反映

> 検証は contract test で D1 binding を擬似的に直列化し、F-409-04 として再現する。

---

## D1 Transaction 失敗時の rollback 検証

### 検証手順

| 手順 | 内容 |
| --- | --- |
| R-1 | mock D1 で `member_tags` insert を throw させる |
| R-2 | confirmed body で resolve POST |
| R-3 | response が 500 であること |
| R-4 | `tag_assignment_queue.status` が `pending` に巻き戻っていること |
| R-5 | `member_tags` に該当行が無いこと |
| R-6 | `audit_logs` に `admin.tag.queue_resolved` が無いこと |

### 検証手順（audit_logs 側失敗）

| 手順 | 内容 |
| --- | --- |
| R-7 | mock D1 で `audit_logs` insert を throw |
| R-8 | confirmed body で resolve POST |
| R-9 | response が 500 |
| R-10 | `member_tags` も rollback されている（先に成功していても巻き戻る）|
| R-11 | `tag_assignment_queue.status` が `pending` に巻き戻る |

> Cloudflare D1 の transaction セマンティクスに依存するため、service 層で明示的に batch / transaction を組む実装が前提。
> 該当実装が無い場合は Phase 5 の F-4 で transaction 化を組み込む（Phase 5 ランブック S-5 のサブタスクとして再エントリ）。

---

## 不変条件 #11 / #5 異常系再検証

### 不変条件 #11（admin は本人本文を直接編集できない・**主検証**）

| 検証ポイント | 異常系での確認 |
| --- | --- |
| `members` 本文への write が無い | F-401〜F-5xx 全ケースで `members` 列に変更が無いこと |
| consent 系列への write が無い | 同上 |
| `member_tags` への追加のみ許可 | F-422 / F-400 / F-409 で `member_tags` 行数不変 |
| `tag_assignment_queue.reject_reason` 以外の queue 列が変更されない | 同上 |

### 不変条件 #5（apps/web → D1 直接禁止・副検証）

- F-5xx 発生時に apps/web 側が D1 へ retry 接続する経路が無いこと（client は API 経由でのみ retry）
- typecheck / lint で apps/web 側に D1 binding import が無いことを Phase 9 で機械検出

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure cases 全件を AC マトリクスの異常系列に紐付け |
| Phase 9 | rollback 検証 R-1〜R-11 を contract test で実走 |
| Phase 11 | client UI エラーメッセージ整合性表を Playwright E2E で再確認（任意） |
| Phase 12 | failure cases 表を `12-search-tags.md` のエラーセマンティクス節に同期 |

---

## 多角的チェック観点（不変条件）

- 不変条件 #11（**主検証**）: 全異常系で `members` / consent 列が一切変更されないことを D1 副作用列で確認
- 不変条件 #5（**副検証**）: client UI エラー表で D1 binding 経由の retry が無いこと
- 不変条件 #2（consent キー統一）: 異常系で consent 列を触らないこと（影響なし宣言）
- 不変条件 #10（無料枠制約）: F-5xx の retry が無限ループしないこと（client retry 上限を明記）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure cases 表 7 系統作成 | 6 | pending | 18 ケース以上 |
| 2 | audit_logs エントリ期待値確定 | 6 | pending | 成功時のみ追加 |
| 3 | client UI エラーメッセージ表確定 | 6 | pending | 9 mapping 以上 |
| 4 | idempotent race 2 シナリオ深堀 | 6 | pending | 同 payload / 並行 POST |
| 5 | D1 rollback 検証手順 R-1〜R-11 確定 | 6 | pending | transaction 必須化と紐付け |
| 6 | 不変条件 #11 主検証列の網羅 | 6 | pending | 全異常系で members 列不変 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases 表 / audit_logs / UI mapping / idempotent race / rollback 検証 / 不変条件再検証 |
| メタ | artifacts.json | Phase 6 を completed に更新 |

---

## 完了条件

- [ ] failure cases 表が 7 系統（401/403/404/409/422/400/5xx）×合計 18 ケース以上で記述されている
- [ ] 各ケースで `HTTP status / response body / D1 副作用 / audit_logs / client UI` の 5 列が埋まっている
- [ ] audit_logs エントリ表が成功時 2 行 + 異常系全件「追加なし」で確定
- [ ] client UI エラーメッセージ整合性表が 9 mapping 以上で完成
- [ ] idempotent race 検証が 2 シナリオで深堀済み
- [ ] D1 transaction rollback 検証手順 R-1〜R-11 が確定
- [ ] 不変条件 #11 主検証 / #5 副検証が異常系全件で再確認済み

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-06/main.md` が指定パスに配置済み
- 完了条件 7 件すべてにチェック
- transaction 化が apps/api 既存実装に無い場合、Phase 5 ランブック S-5 へ追記が反映済み
- artifacts.json の phase 6 を completed に更新

---

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: failure cases 表 / audit_logs エントリ / client UI mapping / race 検証 / rollback 検証 / 不変条件再検証
- ブロック条件: failure cases が 18 件未満、または D1 rollback 検証手順が未確定の場合は Phase 7 に進まない
