# attendanceProvider middleware 移行 Cloudflare staging runtime smoke - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | runtime-smoke-attendance-provider-migration |
| タスク名 | Cloudflare staging への runtime smoke 実行（attendanceProvider middleware 移行） |
| 分類 | runtime verification / boundary close-out |
| 対象機能 | `apps/api` の `/admin/members*` および `/me*` read-only GET smoke。Hono ctx 経由 attendanceProvider DI の直接 evidence は issue-531 で `/admin/members/:memberId` と `/me/profile` に限定 |
| 優先度 | medium |
| 見積もり規模 | 小規模 |
| ステータス | consumed / superseded-by issue-531 |
| issue_number | #531（Refs-only、closed 維持） |
| 親タスク | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` |
| 親タスク状態 | `workflow_state: implemented-local` (`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`) |
| 発見元 | issue-371 親タスク Phase 12 close-out |
| 発見日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL（HTTP response / log artifact） |

---

## Current Canonical Pointer（2026-05-07）

この未タスクは `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/` に昇格済み。
重複起票せず、以後の実行・証跡・Phase 12 同期は issue-531 workflow を正本とする。

Runtime smoke は現時点で `pending_user_runtime_credentials`。親タスク state は live staging smoke PASS まで
`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持する。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `issue-371-ut-02a-followup-003-hono-ctx-di-migration` では、attendance フィールドを返すリポジトリビルダーへの依存性注入を、暗黙の builder 引数渡しから **Hono ctx 経由の `attendanceProvider` middleware DI** に置換した。具体的には:

- `apps/api/src/middleware/repository-providers.ts` で `attendanceProviderMiddleware` を定義し、`c.set("attendanceProvider", createAttendanceProvider(dbCtx))` で Hono ctx に bind
- `apps/api/src/routes/admin/members.ts` および `apps/api/src/routes/me/index.ts` の各 sub-app で `app.use("*", attendanceProviderMiddleware)` を結線
- builder (`apps/api/src/repository/_shared/builder.ts`) は `var.attendanceProvider` 不在時に **silent fallback (`attendance: []`) を廃止し `throw new Error("attendanceProvider not bound to context")` に変更**

ローカルでは型・lint・unit test・build すべて PASS。ただし **Cloudflare Workers ランタイム上での実踏（runtime smoke）は未実施**で、親タスク Phase 12 main.md は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として close-out されている。

### 1.2 問題点・課題

- silent fallback を throw に変更したため、middleware 結線漏れがある場合 **本番初回リクエストで即時 500** になるリスク
- 結線漏れを検出する仕組みは現状 grep gate のみで、Workers runtime での DI-bound route 実踏が初回検証として必須
- staging 上で attendance フィールドが正しく hydrate されているか（過去の silent `[]` を本物の配列で上書きできているか）の実測 evidence が無い
- production 切替判断のための observability gate が閉じられない

### 1.3 放置した場合の影響

- production deploy 後の初回 `/admin/members` または `/me` リクエストで結線漏れ → 即 500 → 管理者ダッシュボードと会員マイページが同時に死ぬ
- silent fallback 廃止の意図（fail-fast 化）が、結線漏れを runtime まで通したまま負債化する
- attendance 表示の regression（空配列で UI が表示崩れ）が監視ですり抜ける可能性

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare staging 環境にデプロイ済みの API Worker に対し `/admin/members*` および `/me*` の read-only GET を実行し、DI-bound route（`/admin/members/:memberId`, `/me/profile`）では attendanceProvider middleware が正常結線され、paging route では route-local provider path が期待通り返ることを runtime evidence として記録する。あわせて、結線漏れ時の `throw new Error("attendanceProvider not bound to context")` が想定通り 500 として顕在化することを、artificial 結線漏れ局所テストで確認する。

### 2.2 最終ゴール

- staging 環境の `/admin/members`（list / detail / 派生エンドポイント）が `200` を返し、response の `attendance` フィールドが配列として hydrate されている
- staging 環境の `/me` 系エンドポイント（profile / attendance 関連）が認証済み要求で `200` を返し、attendance フィールドが hydrate されている
- middleware 未結線時の throw 経路が、artificial 局所テスト（unit / integration いずれか）で 500 を返すことを確認
- 上記 evidence を Phase 11 NON_VISUAL evidence 形式で記録（curl response / log抜粋 / route inventory）
- 親タスク `issue-371` の `workflow_state` を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `completed` に更新可能な状態にする

### 2.3 スコープ

#### 含むもの

- staging deploy 済み Worker への `/admin/members*` read-only GET runtime smoke
- staging deploy 済み Worker への `/me*` read-only GET runtime smoke
- attendance フィールドの hydrate 実測（summary-only contract 検査。raw response body は保存しない）
- `attendanceProvider not bound to context` throw 経路の局所検証（既存 unit テストで足りない場合のみ追加）
- middleware 結線対象 route の inventory 作成（`apps/api/src/routes/admin/members.ts` / `apps/api/src/routes/me/index.ts` から抽出）
- Phase 11 NON_VISUAL evidence の作成
- 親タスク `issue-371` の workflow_state 更新 PR

#### 含まないもの

- production 環境への切替および production smoke（別タスク。ユーザー承認ゲートが別途必要）
- 新規エンドポイント追加 / 仕様変更
- attendance 取得ロジック自体の変更（親タスクで完了済み）
- Sentry / Slack 連携の評価（09b 系の別タスクで実施）
- `apps/web` 側の動作検証（attendance は API レスポンス経由で消費されるため API 層 PASS で十分）

### 2.4 成果物

- `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence/runtime-smoke.log`（status / jq contract / count summary。raw body 保存禁止）
- `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-11/route-inventory.md`（middleware 結線対象 route の網羅リスト）
- 親タスク `outputs/phase-12/main.md` の `workflow_state` 更新差分
- artificial 結線漏れテスト追加分（必要時のみ）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- staging Cloudflare Worker (`apps/api`) に親タスク実装が deploy 済みであること（未 deploy なら本タスク冒頭で `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` を実施）
- staging API URL が確認済み
- staging 用 admin セッション cookie / sync admin token が `1Password` より入手可能
- staging 用 一般会員テストアカウント（`manju.manju.03.28@gmail.com`）でログイン可能
- production 環境への変更操作は本タスクでは行わない

### 3.2 実行手順

1. **route inventory 抽出**
   - `apps/api/src/routes/admin/members.ts` および `apps/api/src/routes/me/index.ts` から `app.get/post/patch/delete` 定義を grep し、エンドポイント一覧を `route-inventory.md` に記録
2. **staging deploy 確認**
   - `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` で最新 deploy が親タスク commit を含むかを確認
   - 含まない場合 `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
3. **`/admin/members*` smoke**
   - admin セッションを取得し、各 admin members エンドポイントへ curl
   - 例:
     ```bash
     curl -i "$STAGING_API_URL/admin/members" \
       -H "Cookie: $ADMIN_SESSION"
     ```
   - response status `200` と `attendance: [...]`（少なくとも 1 件、空でも配列型であること）を確認
4. **`/me*` smoke**
   - 一般会員セッションで `/me`, `/me/attendance` 等を curl
   - response status `200` と `attendance` フィールド hydrate を確認
5. **fail-fast 経路確認**
   - 既存 `apps/api/src/middleware/__tests__/repository-providers.test.ts` および `apps/api/src/repository/__tests__/builder.test.ts` を `pnpm vitest run` で実行し、`attendanceProvider not bound to context` throw を assert しているケースが PASS することを確認
   - PASS していれば runtime での artificial 結線剥がしテストは不要（unit で fail-fast を担保）
6. **evidence 記録**
   - status・jq contract・attendance 配列長 summary を `runtime-smoke.log` に記録
   - secret 値（cookie 全文 / token 全文）は記録しない
7. **親タスク state 更新**
   - 全 PASS なら `outputs/phase-12/main.md` の `workflow_state: implemented-local` を `completed` に、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を `PASS_RUNTIME_VERIFIED` に書き換える PR を作成

### 3.3 受入条件 (AC)

- AC-1: route inventory が `apps/api/src/routes/admin/members.ts` と `apps/api/src/routes/me/index.ts` の全 route を網羅
- AC-2: staging で `/admin/members*` 全 route が `200` を返し、`attendance` フィールドが配列で hydrate される
- AC-3: staging で `/me*` 全 route が `200` を返し、`attendance` フィールドが配列で hydrate される
- AC-4: `attendanceProvider not bound to context` throw が unit テストで assert されている
- AC-5: evidence に session cookie / token / secret 実値が含まれない
- AC-6: 親タスク `workflow_state` が `completed` / `PASS_RUNTIME_VERIFIED` に更新できる状態にある

---

## 4. 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/_shared/builder.ts`
- 症状: 親タスクで silent fallback (`attendance: []`) を `throw new Error("attendanceProvider not bound to context")` に変更したため、`apps/api/src/routes/**` のいずれかの sub-app で `app.use("*", attendanceProviderMiddleware)` の結線を入れ忘れると **本番初回リクエストで即 500** になる。grep gate（`grep -rn "attendanceProviderMiddleware" apps/api/src/routes/`）は静的検出のみで、route 増設後の結線抜けを runtime まで通すリスクが残る。runtime smoke は **新 route 追加 PR の都度** 再走させるべき。
- 対象: `apps/api/src/routes/admin/members.ts:204`, `apps/api/src/routes/me/index.ts:61`
- 症状: `app.use("*", attendanceProviderMiddleware)` は sub-app ごとに個別宣言する設計のため、新規 sub-app（例: 将来追加する `/admin/events`）で同じ wire を忘れる可能性が高い。本タスクでは現存 sub-app のみを対象とするが、将来追加 sub-app には wire 検証を必ず含めるルールを skill feedback として残すこと。
- 参照: `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/implementation-guide.md`

---

## 5. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| middleware 結線漏れが staging で 500 として顕在化 | 高 | 全 route inventory を作成し 1 件ずつ curl。最初の 500 で即停止し原因 sub-app を特定 |
| session cookie / sync admin token が evidence に混入 | 高 | curl 出力を redact してから記録。`grep -E "Cookie|Authorization"` で 0 hit を確認 |
| staging deploy が親タスク commit を含まない | 中 | 手順 2 で `deployments list` を確認し、未反映なら deploy をやり直す |
| attendance 配列が空 `[]` を返した場合、silent fallback の残骸か正規の空かを判別できない | 中 | テストデータに少なくとも 1 件 attendance がある会員を予め選定し、該当 ID で smoke 実施 |
| 新 sub-app 追加 PR が wire 抜けで作られる | 中 | skill feedback report に「sub-app 追加時は `attendanceProviderMiddleware` 結線を必須化」を追記 |
| production への誤実行 | 高 | `--env staging` を全コマンドで明示。production URL を環境変数に**入れない** |

---

## 6. 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm exec vitest run \
  apps/api/src/middleware/__tests__/repository-providers.test.ts \
  apps/api/src/repository/__tests__/builder.test.ts \
  apps/api/src/routes/admin/members.test.ts \
  apps/api/src/routes/me/index.test.ts
```

期待: 全 PASS、`attendanceProvider not bound to context` throw を assert する unit ケースが緑

### 統合検証（staging runtime）

```bash
# deploy 状態確認
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging

# admin members
curl -sS -o /tmp/admin-members.json -w "%{http_code}\n" \
  "$STAGING_API_URL/admin/members" -H "Cookie: $ADMIN_SESSION"
jq '.[0] | {id, attendance}' /tmp/admin-members.json

# me
curl -sS -o /tmp/me.json -w "%{http_code}\n" \
  "$STAGING_API_URL/me" -H "Cookie: $MEMBER_SESSION"
jq '{attendance}' /tmp/me.json

# redaction grep
grep -E "Cookie:|Authorization:" docs/30-workflows/issue-371-*/outputs/phase-11/runtime-smoke-log.md && echo "FAIL: secret leak" || echo "OK"
```

期待:
- 全 curl が `200`
- `attendance` フィールドが JSON array 型
- redaction grep が 0 hit
- evidence に curl コマンドと response status / attendance 件数のみが記録されている

---

## 7. スコープ

### 含む

- `apps/api/src/routes/admin/members.ts` の read-only GET runtime smoke (staging)
- `apps/api/src/routes/me/index.ts` の read-only GET runtime smoke (staging)
- `attendanceProvider not bound to context` throw 経路の unit 検証
- Phase 11 NON_VISUAL evidence 作成
- 親タスク `workflow_state` 更新 PR

### 含まない

- production 環境への deploy / smoke（別タスク。ユーザー承認ゲートが必要）
- 新規エンドポイント追加 / 仕様変更
- attendance 取得ロジックの再実装（親タスクで完了済み）
- `apps/web` 側 UI の表示確認
- Sentry / Slack 通知連携の検証（09b 系タスクの責務）

---

## 8. 依存関係

| 種別 | 対象 | 関係性 |
| --- | --- | --- |
| depends-on | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` | 本タスクは親タスク実装の runtime 検証 |
| depends-on | staging Cloudflare Worker (`apps/api`) | 親タスク commit が deploy 済みであること |
| blocks | issue-371 `workflow_state` の `completed` 化 | 本タスク PASS で workflow_state 更新可能 |
| blocks | issue-371 を前提とする production 切替タスク | runtime PASS が production 切替判断の前提 |
| related | `apps/api/src/middleware/repository-providers.ts` | wire 主体 |
| related | `apps/api/src/repository/_shared/builder.ts` | fail-fast throw 実装箇所 |
