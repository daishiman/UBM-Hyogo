# Phase 6: テスト拡充

## メタ情報
正本: `outputs/phase-6/phase-6.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-4/phase-4.md`（I/O 契約・TC-1〜TC-4 期待値表・§3.3 fail パターン表）/ `../phase-5/phase-5.md` + `task-01..03-*.md`（実装手順）/ `../phase-3/phase-3.md`（R3 ログアサート方式・R5 P2 fail-hard 維持）

## 目的
Phase 4 で固定した TC-1〜TC-4 に対し、**回帰 guard（後方互換）と境界ケース**を拡充する。各ケースに RED（実装前に失敗する根拠）→ GREEN（実装後に通る条件）を明示し、TDD のグラウンドトゥルースを揃える。既存 green ケースは期待値を一切変更せず回帰 guard として据え置く（AC-4/AC-8）。

不変条件: 既存 spec の期待値・fixture を変更しない。新規アサーションが memberId / email をログへ出力させない（leak 検査は「含まれないこと」の検証のみ）。新規 test ファイルは `session-guard.spec.ts`（`*.spec.ts`）のみ。

---

## 1. 拡充ケース表（P6-1〜P6-9）

区分: fail（失敗系）/ regression（回帰 guard）/ leak（漏洩検査）/ boundary（境界）。

### 1.1 fail-soft の境界（T01 / TC-3 強化）

| ケースID | 配置 | 区分 | Given / When | Then |
|----------|------|------|--------------|------|
| P6-1 | `index.contract.spec.ts` | boundary | TC-3 と同一（`failingDb(db, /admin_member_notes/)`・`GET /me/profile`） | **`console.error` 呼び出しがちょうど 1 回**（`toHaveBeenCalledTimes(1)`）。fail-soft は rethrow しないため onError 二重ログが発生しない契約の固定 |
| P6-6 | `index.contract.spec.ts` | boundary | 同上 | fail-soft 後の response の**他フィールド完全性**: `MeProfileResponseZ.parse` 成功に加え `profile.sections` 非空・`statusSummary` 完全・`editResponseUrl`/`fallbackResponderUrl` が TC-3 期待値どおり（pendingRequests の欠落が他フィールドへ波及しない） |

### 1.2 一次データ分類の境界（T02 / TC-1・TC-2 強化）

| ケースID | 配置 | 区分 | Given / When | Then |
|----------|------|------|--------------|------|
| P6-2 | `session-guard.spec.ts` | fail | `failingDb(db, /admin_users/)`（identity/status は通過・P2 のみ fail）・`GET /me` | 500・`UBM-5001`・ログ `context.scope:"me-session-guard"`（P2 も P1 と同一 scope。fail-soft 化**しない** — isAdmin は一次属性・Phase 3 R5） |
| P6-9 | `session-guard.spec.ts` | boundary | failing Proxy が **non-Error 値**を throw（`prepare` 内で `throw "simulated D1 failure (string)"`）・`GET /me` | 500・`UBM-5001`・ログに `log.stack` キーが**現れない**（条件付き spread `err instanceof Error && err.stack !== undefined` の false 側）・`log.cause` は文字列のまま sanitize 通過 |

### 1.3 status 優先順位の回帰（既存 200/401/410 回帰・AC-4）

| ケースID | 配置 | 区分 | Given / When | Then |
|----------|------|------|--------------|------|
| P6-7 | `session-guard.spec.ts` | regression | `is_deleted=1` に UPDATE + `failingDb(db, /admin_users/)`・`GET /me` | **410**・`code:"DELETED"`（410 判定は P2 `findAdminByEmail` より前 :95-100 に位置するため分類 catch が発火しない＝意図された status が 5xx 分類より常に優先） |
| P6-8 | `session-guard.spec.ts` | regression | seed しない member（identity/status 不在・D1 正常）・`GET /me` | **401**・`code:"UNAUTHENTICATED"`（「結果が null」は例外ではない — 分類 catch は throw 時のみで、null 判定 401 :89-93 は不変） |
| TC-4 据え置き | `index.contract.spec.ts` 既存全件 | regression | 注入なし | 200/401/410/202/409/422/403/429 全て既存期待値のまま green（§3 一覧） |

### 1.4 problem+json header / leak 検査（AC-5）

| ケースID | 配置 | 区分 | Given / When | Then |
|----------|------|------|--------------|------|
| P6-3 | `session-guard.spec.ts` | boundary | TC-1 と同一注入で、リクエストに `x-request-id: test-req-id-123` header を付与 | `x-request-id` response header が `test-req-id-123` を echo（`error-handler.ts:45`）・`x-trace-id` === body `traceId`・`content-type` が `application/problem+json` |
| P6-4 | `session-guard.spec.ts` + `index.contract.spec.ts` | leak | TC-1 / TC-2 / TC-3 の各ログ捕捉行と 5xx body 全文 | `m_001` / `user1@example.com` 非含有（`not.toContain`）。加えて TC-1/TC-2 の body に `simulated D1 failure`（cause.message）非含有 = cause が client に漏れない |

---

## 2. 各ケースの RED → GREEN 方針

| ケースID | RED（実装前に失敗する根拠） | GREEN（実装後に通る条件） |
|----------|------------------------------|----------------------------|
| P6-1 | 改修前は P4 例外が onError に届き `UBM-5000` ログ + Hono 既定 500（fail-soft 不在で status 200 アサートが fail） | T01 の `.catch` が `{}` を返しつつ `logError` を 1 回だけ呼ぶ（rethrow しない） |
| P6-6 | 同上（response 自体が 500 のため parse 不能） | T01 fail-soft 後も body 組み立て（:186-199）は通常どおり進む |
| P6-2 | 改修前は P2 例外が `UBM-5000`（onError fallback・scope 無し）で `code:"UBM-5001"` アサートが fail | T02 の P2 catch が `UBM-5001` + `me-session-guard` で rethrow |
| P6-9 | 改修前は `UBM-5000`。また実装が `err.stack` を無条件参照すると non-Error throw で TypeError になり得る | T02 の条件付き spread が non-Error 入力で `stack` キーを出さない |
| P6-7 | 改修前から 410 は green（純回帰 guard）。T02 実装で catch 位置を誤る（is_deleted 判定より外側を包む等）と fail する canary | catch を P1（Promise.all）/ P2（findAdminByEmail）の**呼び出し単位**に限定（task-02 の diff どおり） |
| P6-8 | 改修前から 401 は green。catch が「null 結果」まで例外扱いすると fail する canary | 分類 catch は reject 時のみ。null 判定分岐（:89-93）に触れない |
| P6-3 | onError 付きハーネス（T03 新設）が無いと検証不能。既存 spec は sub-app 直叩きで problem+json にならない | `buildAppWithErrorHandler` 経由で production マウントを再現 |
| P6-4 | 5xx 経路自体が未テストのため leak 検査も不在 | T01/T02 が literal scope のみを context に入れ、`toClientJSON` が log を含まない（既設） |

---

## 3. 据え置く既存回帰ケース（変更禁止・TC-4 の実体）

`apps/api/src/routes/me/index.contract.spec.ts` の既存 describe 全件。代表:

| describe | 据え置きケース |
|----------|----------------|
| GET /me | 未ログイン 401（memberId 非含有）/ SessionUser 200 / rules_declined / is_deleted 410 |
| GET /me/profile | 200 + editResponseUrl / editResponseUrl null fallback / 401 / pendingRequests={} / visibility・delete 振り分け / resolved 除外 |
| GET /me/attendance | ページング全件（limit/cursor/400/401） |
| POST visibility-request / delete-request | 202/409/422/403 |
| rate limit | 429 |

これらは本サイクル実装後も**期待値無編集**で green であることを Phase 9 で確認する（AC-4/AC-8 回帰ゼロ）。

## 統合テスト連携
本 Phase の P6-1〜P6-9 と TC-1〜TC-4 が T03 の実装対象の全量。Phase 7 でこれらが変更ブロック（catch 4 箇所 + 条件付き spread）の line/branch に到達することを確認し、Phase 9 で focused vitest + typecheck/lint + 非接触 gate を直列実行して締める。staging 実機の `UBM-5001` ログ確認は Phase 11 手動手順（`scripts/cf.sh` 経由・user-gated）。

## 参照資料
- `../../_shared-context.md`（SSOT §3/§4）/ `../phase-4/phase-4.md`（期待値正本）/ `../phase-3/phase-3.md`（R3/R5）
- 実コード: `apps/api/src/middleware/session-guard.ts`（:89-93 null→401 / :95-100 410）/ `apps/api/src/middleware/error-handler.ts:45` / `apps/api/src/routes/me/index.contract.spec.ts`

## 成果物
- `outputs/phase-6/phase-6.md`

## 完了条件
- [x] fail-soft 境界（ログ 1 回だけ・他フィールド完全性: P6-1/P6-6）を定義した。
- [x] 一次データ分類の境界（P2 admin_users・non-Error throw: P6-2/P6-9）を定義した。
- [x] 既存 200/401/410 の status 優先順位回帰（P6-7/P6-8 + TC-4 据え置き一覧）を定義した。
- [x] problem+json header 契約・leak 検査（P6-3/P6-4）を定義した。
- [x] 全ケースに RED→GREEN 方針を対応付けた。
