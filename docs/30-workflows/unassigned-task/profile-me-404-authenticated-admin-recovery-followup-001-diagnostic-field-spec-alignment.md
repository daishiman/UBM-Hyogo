# profile-me-404-authenticated-admin-recovery followup 001 / 診断フィールドの仕様整合（T01/T03/T04 観測性フィールドの設計意図復元） - タスク指示書

## メタ情報

```yaml
issue_number: 1247
status: 実装完了_ローカル
```

> **解決状況（2026-06-17 更新）**: 本 followup が記述する T01/T03/T04 の診断フィールド乖離は、親ワークフロー検証セッションでユーザーが「実装を仕様に合わせて修正」を選択したため、**同セッション内でコード実装済み**。T01=`hasAuthorization`/`hasSessionCookie`/`reason` 追加（`accept`/`userAgent`/`dataCause`/`routeMatched` は除去）+ NF-1〜NF-5、T03=`safe-fetch.ts` に `routeNotFound`（404 のみ）+ SF-1/SF-4 guard、T04=`api_route_diff`（healthz×実 `/me` 軸）+ `parity_hint` へ整合。検証: API focused Vitest 5 PASS / web focused Vitest 13 PASS / `bash -n` ×2 PASS / typecheck / lint PASS。Issue #1247 の close、commit / push / PR は user-gated。

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | profile-me-404-authenticated-admin-recovery-followup-001-diagnostic-field-spec-alignment |
| タスク名     | T01/T03/T04 の観測性診断フィールドを Phase-5 仕様の設計意図へ整合させる（404 data-cause 切り分け精度の復元） |
| 分類         | 不具合是正（仕様-実装ギャップ / 観測性忠実度の退行） |
| 対象機能     | apps/api notFound 観測性（`apps/api/src/middleware/error-handler.ts`）/ apps/web route-404 ログ（`apps/web/src/lib/server-fetch/safe-fetch.ts`）/ 診断スクリプト（`scripts/diagnose-profile-session.sh`） |
| 優先度       | 低 |
| 見積もり規模 | 小規模 |
| ステータス   | 実装完了（ローカル・2026-06-17・commit/push/PR/Issue close は user-gated） |
| GitHub Issue | #1247 |
| 発見元       | `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/` の実装後検証（未タスク作成フロー 2026-06-17 の2回検証 + ground truth 照合） |
| 発見日       | 2026-06-17 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親ワークフロー `profile-me-404-authenticated-admin-recovery` は、staging `/profile` で認証済み管理者の `GET /me` が 404（`MEMBER_SESSION_404`）になる障害を多層防御で復旧し、**再発時も staging ログだけで data-cause を即特定できる**ことを正本目的とした（`index.md` 概要 / `_shared-context.md` §2 S1〜S3）。この「ログだけで data-cause を一意化する」観測性が T01/T03/T04 の主目的であり、各タスクの診断フィールドは本バグ固有のシグナル（認証情報を持った request が欠落 route に到達したか／healthz 生存下で `/me` だけ 404 か）を捕捉するよう Phase-5 で具体設計された。

実装は本サイクルで landed したが（`workflow_state=implemented_local_runtime_pending`）、ground truth 照合の結果、T01/T03/T04 の **診断フィールドが Phase-5 仕様の設計意図から乖離**しており、本バグ固有の診断シグナルが仕様より弱い状態で固定化されている。

### 1.2 問題点・課題

実装は機能はする（ログ出力・smoke gate・診断スクリプトは動作する）が、Phase-5 が本バグのために設計した診断シグナルが 3 箇所で欠落している。テストは実装に合わせて書かれているため全 PASS だが、それは仕様の充足ではなく実装の追認である。

#### T01: notFound context の認証情報シグナル欠落

- 仕様（`outputs/phase-5/task-01-*.md`）: `context: { reason:"route_not_matched", method, path, hasAuthorization:boolean, hasSessionCookie:boolean }`。`hasAuthorization`/`hasSessionCookie` は **「404 された request が認証情報（`authorization` ヘッダ / `__Secure-authjs.session-token` cookie）を携えていたか」** を boolean で捕捉する設計で、これが本バグの核心シグナル（認証済み管理者が欠落 route に到達したか＝deploy drift/route miss なのか、無認証 probe なのかを切り分ける）。フィールド名に `authorization`/`cookie` を含めない理由も「redaction 誤発火回避（AC-9）」として明記されている。
- 実装（`apps/api/src/middleware/error-handler.ts` notFoundHandler）: `log.context: { dataCause:"route_not_matched", routeMatched:false, method, path, accept, userAgent }`。`accept`/`userAgent` を記録し、**`hasAuthorization`/`hasSessionCookie` を一切捕捉しない**。結果として「この 404 は認証情報付きだったか」という本バグの中核質問にログが答えられない。
- テスト（`apps/api/src/middleware/error-handler.spec.ts`）: `dataCause`/`routeMatched`/`accept`/`userAgent` を assert（実装追認）。`hasAuthorization`/`hasSessionCookie` の assert は無い。

#### T03: safe-fetch の routeNotFound フラグ未実装

- 仕様（`outputs/phase-5/task-03-*.md`）: `logServerFetchFailure` で `status === 404` のときのみ `routeNotFound: true` を payload に付与（404 以外はキー自体を出さず既存形状を保つ）。これが T03 の明示的成果物で、SF-1（404 で `routeNotFound:true`）/ SF-2・SF-3（非 404 でキー無し）の回帰 guard を要求。
- 実装（`apps/web/src/lib/server-fetch/safe-fetch.ts` `logServerFetchFailure`）: `console.error("server_fetch_failed", { code, path, status, ...transport })`。**`routeNotFound` を一切付与しない**（仕様の「改修前」コードのまま＝T03 の改修方針が未適用）。
- テスト（`apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`）: 404 ケースで `{ code, status:404, transportKind, baseHost }` を assert し、`routeNotFound:true` を assert しない。SF-2/SF-3 の「非 404 で `routeNotFound` キー無し」回帰 guard も無い。

#### T04: diagnose の route 差分判定軸と parity_hint の乖離

- 仕様（`outputs/phase-5/task-04-*.md`）: `api_me_healthz_status:api_me_status`（healthz と **実 `/me`** の突合）で `api_route_diff` を判定。`200:404 → healthz_alive_me_miss`（S1 強シグナル）/ `200:401|2*|410 → both_alive` / `404:*|000:* → healthz_miss`。加えて `parity_hint` に `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env <ENV>` 等の具体手順文字列を出力。
- 実装（`scripts/diagnose-profile-session.sh`）: `api_root_status:api_me_healthz_status`（root と healthz の突合・**実 `/me` と突合しない**）で `api_route_inventory` を判定（`present`/`me_route_missing` 等）。`parity_hint` ではなく `deployments_hint`（「compare latest web-cd and api-cd workflow runs」という別文言）。結果として **「healthz は 200 だが `/me` は 404」という S1 シグネチャ（本バグの最重要パターン）を検出できない**。

### 1.3 放置した場合の影響

- 親ワークフローが投資した観測性（T01/T03/T04）の中核価値が、本バグ再発時に発揮されない。`/me` 404 が再発しても staging ログだけでは「認証情報付き request が欠落 route に到達した（deploy drift）」のか「healthz 生存下で `/me` だけ missing」なのかを仕様が意図したほど切り分けられず、診断時間が再び長期化する。
- Phase-5 正本仕様（task-01/03/04）と実装の不一致が固定化し、後続タスクが仕様書を信じて誤判断する（spec-over-claim の温存）。
- テストが実装追認のため、3 箇所のフィールド欠落をどのテストも検出しない（部分カバレッジ green の罠）。

なお実害到達性は限定的である: これは**ユーザー向け復旧（T02 の apps/api 自動 CD + `/me` 200 smoke gate）そのものではなく観測性の忠実度**の問題であり、404 を実際に防ぐ仕組み（T02）は仕様準拠で landed 済。よって優先度は低（診断正確性と仕様適合の問題で、即時のユーザー影響回帰ではない）。

---

## 2. 何を達成するか（What）

### 2.1 目的

T01/T03/T04 の診断フィールドを Phase-5 仕様の設計意図へ整合させ、`/me` 404 再発時に staging ログだけで data-cause（S1〜S3）を仕様どおり切り分けられる観測性忠実度を復元する。

### 2.2 最終ゴール

- T01: notFoundHandler の context が、404 された request が認証情報を携えていたかを boolean で捕捉する（`hasAuthorization`/`hasSessionCookie` 相当・redaction 誤発火回避のためキー名に `authorization`/`cookie` を含めない）。`reason:"route_not_matched"` を含める。`accept`/`userAgent` は維持してよい（追加情報として両立可）。レスポンス body/status は不変（AC-6）。
- T03: `logServerFetchFailure` が `status === 404` のときのみ `routeNotFound: true` を付与し、404 以外ではキーを出さない。`transportKind`/`baseHost` と両立する（S2 切り分け）。
- T04: `api_route_diff` 相当の判定が healthz と **実 `/me`** の突合軸になり、`healthz_alive_me_miss`（S1 強シグナル）を検出できる。route 確認/parity の手順文字列（`parity_hint` 相当）を read-only で出力する（`scripts/cf.sh` を実行しない）。
- 上記 3 点の **否定形/分岐の回帰テスト**を追加する（T01: 認証情報なし request で false / 認証情報あり request で true。T03: SF-2/SF-3 の非 404 キー無し guard。T04: bash -n + 判定ラベルの分岐確認）。
- focused Vitest（api error-handler / web safe-fetch）/ typecheck / lint / `bash -n` が green。
- 親ワークフロー phase-12 文書（implementation-guide / system-spec-update-summary 等）の記載と実装が整合する（実装で充足させ、乖離が残る場合のみ最小修正）。

### 2.3 スコープ

#### 含むもの

- `apps/api/src/middleware/error-handler.ts` notFoundHandler の context フィールド整合（`hasAuthorization`/`hasSessionCookie` 相当の追加 + `reason` 整合）と `apps/api/src/middleware/error-handler.spec.ts` の否定形/分岐テスト追加
- `apps/web/src/lib/server-fetch/safe-fetch.ts` `logServerFetchFailure` への `routeNotFound`（404 のみ）付与と `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` の SF-1/SF-2/SF-3 guard 追加
- `scripts/diagnose-profile-session.sh` の route 差分判定軸を healthz×実 `/me` へ整合 + parity 手順文字列の出力（read-only）
- 親ワークフロー phase-12 文書と実装の整合確認（必要時のみ最小修正）

#### 含まないもの

- `/me` の path/shape/status 体系、`apps/api` 既存 endpoint surface、D1 schema、Google Form 仕様、`/profile` UI 文言・分岐の変更（AC-6）
- T02（apps/api 自動 CD + smoke gate）の再実装・変更（仕様準拠で landed 済）
- D1 直接アクセス（不変条件 #5）／`process.env` 直接参照／`wrangler` 直叩き
- commit / push / PR 作成 / deploy（user-gated）

### 2.4 成果物

- error-handler.ts / safe-fetch.ts / diagnose-profile-session.sh の実装差分
- error-handler.spec.ts / safe-fetch.spec.ts の否定形/分岐回帰テスト差分
- focused Vitest（api / web）/ typecheck / lint / `bash -n` green の NON_VISUAL 証跡

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親ワークフロー `profile-me-404-authenticated-admin-recovery` の実装（T01〜T04）が work branch に landed 済であること（`workflow_state=implemented_local_runtime_pending`）
- Phase-5 タスク仕様書（task-01/03/04）が参照可能であること

### 3.2 依存タスク

- 親: `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/`
- 関連（領域非交差・委譲済）: Issue #1192（admin `/profile` UX）/ Issue #1234（environmentExplicit fail-closed）。本タスクは観測層のフィールド整合のみで #1192/#1234 とは重ならない。

### 3.3 必要な知識

- `@ubm-hyogo/shared/logging` の `SENSITIVE_KEY_SUBSTRINGS`（`authorization`/`cookie`/`token`/`secret`）による redaction 仕様。boolean フィールド名に `authorization`/`cookie` を含めると `[REDACTED]` 化されるため `hasAuthorization`/`hasSessionCookie` 命名で回避する（AC-9）
- `ApiError` の `context`/`log.context` 受理経路（`errorHandler` の `if (apiError.log.context !== undefined) payload.context = ...`）
- safe-fetch の `error.code` 末尾 3 桁から `status` を抽出するロジック（`*_404` prefix 非依存）
- `_shared-context.md` §2 の S1〜S3 切り分けと、各診断フィールドがどの S を一意化するか

### 3.4 推奨アプローチ

各タスクの Phase-5 仕様（task-01/03/04 の「改修方針」コードブロック）を正として、現実装に最小差分で整合させる。**テストを実装追認にしないため、否定形/分岐テスト（red）を先に書いてから実装を入れる**:

1. T01: notFoundHandler に `hasAuthorization`/`hasSessionCookie`（boolean）と `reason:"route_not_matched"` を追加。`dataCause`/`routeMatched`/`accept`/`userAgent` は残してよい（仕様の最小集合に追加情報を足す形）。spec に「authorization/cookie 無し → false」「あり → true」の分岐 assert を追加し、redaction されないこと（キー名検証）も確認。
2. T03: `logServerFetchFailure` に `...(status === 404 ? { routeNotFound: true } : {})` を追加。spec に SF-1（404 で true）/ SF-2（410 でキー無し）/ SF-3（FAILED で status:null・キー無し）を追加。
3. T04: 判定 case を `api_me_healthz_status:api_me_status` 軸へ整合し `healthz_alive_me_miss`/`both_alive`/`healthz_miss`/`indeterminate` を出力。parity 手順文字列を read-only 出力。`bash -n` で構文確認。

### 3.4 への注記

仕様のフィールド名（`api_route_diff` / `parity_hint`）と実装の現名（`api_route_inventory` / `deployments_hint`）が異なる。**意味論（healthz×実 `/me` 突合で S1 検出・read-only parity 手順）を等価にすることが本質**であり、最終フィールド名は仕様名に寄せるか実装名を維持するかを実装着手時に判断する（diagnose の出力を消費する側の有無を grep で確認してから決める）。

---

## 4. 実行手順

### Phase 1: T01 notFound 認証情報シグナルの整合

#### 目的

404 された request が認証情報を携えていたかを boolean で捕捉し、本バグ固有の data-cause 切り分けを可能にする。

#### 手順

1. `apps/api/src/middleware/error-handler.ts` notFoundHandler に `hasAuthorization = c.req.header("authorization") !== undefined`、`hasSessionCookie = (c.req.header("cookie") ?? "").includes("__Secure-authjs.session-token")` を追加し context に載せる。`reason:"route_not_matched"` を含める（既存 `dataCause`/`routeMatched`/`accept`/`userAgent` は維持してよい）
2. context が `ApiError` の `log.context` 経由で `errorHandler` のログ payload に伝播することを確認する
3. `apps/api/src/middleware/error-handler.spec.ts` に「authorization/cookie 無し → false」「あり → true」の分岐 assert と、キー名に `authorization`/`cookie` を含めず redaction されないことの確認を追加（実装前に red を確認）

#### 完了条件

- notFoundHandler の context に boolean の認証情報シグナルが載り、レスポンス body/status は不変（AC-6）
- 否定形/肯定形両方の分岐テストが追加され red → green を確認済み

### Phase 2: T03 routeNotFound フラグの整合

#### 目的

route-404 を transport descriptor と共に明示記録する T03 の主目的を実装する。

#### 手順

1. `apps/web/src/lib/server-fetch/safe-fetch.ts` `logServerFetchFailure` に `...(status === 404 ? { routeNotFound: true } : {})` を追加（`transportKind`/`baseHost` spread と両立）
2. `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` に SF-1（404 で `routeNotFound:true`）/ SF-2（410 でキー無し）/ SF-3（FAILED で status:null・キー無し）/ SF-4（404 + transport で両方出る）を追加（実装前に red を確認）

#### 完了条件

- 404 のみ `routeNotFound:true` が付与され、非 404 ではキーが出ない回帰 guard が green

### Phase 3: T04 route 差分軸と parity_hint の整合

#### 目的

healthz×実 `/me` 突合で S1 シグネチャ（`healthz_alive_me_miss`）を検出し、read-only な parity 手順を出力する。

#### 手順

1. `scripts/diagnose-profile-session.sh` の route 差分 case を `api_me_healthz_status:api_me_status` 軸へ整合（`200:404 → healthz_alive_me_miss` 等）
2. parity 確認手順文字列を read-only 出力する（`scripts/cf.sh` を実行しない）。サブコマンド名は `bash scripts/cf.sh --help` で確認し、未対応なら dashboard 目視比較の文言へ調整
3. 出力フィールド名（`api_route_diff` へ寄せるか現 `api_route_inventory` 維持か）は消費側を grep で確認してから決める
4. `bash -n scripts/diagnose-profile-session.sh` で構文確認

#### 完了条件

- healthz×実 `/me` 突合で S1 を検出する判定ロジックと read-only parity 手順が出力され、`bash -n` PASS

### Phase 4: 検証と文書整合

#### 目的

focused 検証を green に締め、親ワークフロー文書の記載と実装を整合させる。

#### 手順

1. focused Vitest（`apps/api/src/middleware/error-handler.spec.ts` / `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`）を実走し全 green を確認
2. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` を green に締める
3. 親 phase-12 文書（implementation-guide / system-spec-update-summary）の T01/T03/T04 記載が本実装により整合したことを確認（乖離が残る場合のみ最小修正）

#### 完了条件

- focused Vitest（api/web）+ typecheck + lint + `bash -n` green・親文書と実装が整合

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] T01: notFound context に `hasAuthorization`/`hasSessionCookie` 相当の boolean と `reason` が載り、認証情報なし/あり request で false/true に分岐する
- [ ] T03: `status === 404` のみ `routeNotFound:true` が付与され、非 404 ではキーが出ない
- [ ] T04: healthz×実 `/me` 突合で `healthz_alive_me_miss`（S1 強シグナル）を検出し、read-only parity 手順を出力する

### 品質要件

- [ ] T01/T03/T04 それぞれの否定形/分岐回帰テストが追加され、実装前 red → 実装後 green を確認済み
- [ ] focused Vitest（api error-handler / web safe-fetch）/ typecheck / lint / `bash -n` が green
- [ ] レスポンス body/status・`/me` path/shape・既存 endpoint surface を変更していない（AC-6）
- [ ] secret/cookie/JWT 生値を出力に転記していない・redaction 誤発火しない（AC-9）
- [ ] apps/api / D1 schema / Google Form 仕様に変更がない・`process.env` 直接参照や `wrangler` 直叩きが無い

### ドキュメント要件

- [ ] 親 phase-12 文書（implementation-guide / system-spec-update-summary）の T01/T03/T04 記載と実装が整合している
- [ ] NON_VISUAL 証跡（focused Vitest / typecheck / lint / bash -n）が残っている

---

## 6. 検証方法

```bash
mise exec -- pnpm vitest run apps/api/src/middleware/error-handler.spec.ts apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash -n scripts/diagnose-profile-session.sh
```

期待: focused Vitest（api error-handler + web safe-fetch）全 PASS。typecheck / lint exit 0。`bash -n` PASS。404 ケースで `routeNotFound:true`、非 404 でキー無し、認証情報なし request で `hasSessionCookie:false`、healthz=200∧/me=404 で `healthz_alive_me_miss` が確認できる。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| context フィールド名に `authorization`/`cookie` を含め redaction 誤発火する | 中 | 中 | `hasAuthorization`/`hasSessionCookie` 命名を厳守し、spec でキー名と非 `[REDACTED]` を assert する（AC-9） |
| T04 の `api_route_diff` への改名で diagnose 出力の消費側が壊れる | 低 | 低 | 改名前に消費側を grep で確認し、消費が無ければ仕様名へ寄せる／あれば現名維持で意味論のみ整合する |
| テストを後から書くと実装追認になり退行検出力が出ない | 中 | 中 | 各 Phase の否定形/分岐テストを実装前に red 確認してから実装を入れる（red → green） |
| `accept`/`userAgent` を削ると既存テストが壊れる | 低 | 中 | 削除せず追加方式（仕様の最小集合 + 追加情報の両立）で整合させる |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/_shared-context.md`（§2 S1〜S3 / AC-6 / AC-9 / T01〜T04）
- `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/outputs/phase-5/task-01-*.md`（notFound context 設計：`hasAuthorization`/`hasSessionCookie`/`reason`）
- `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/outputs/phase-5/task-03-*.md`（`routeNotFound`：404 のみ true / SF-1〜SF-5）
- `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/outputs/phase-5/task-04-*.md`（`api_route_diff`：healthz×実 `/me` 軸 / `parity_hint`）
- `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md`
- CLAUDE.md「`apps/web` env アクセス不変条件」/ 不変条件 #5（D1 直アクセス禁止）/ #8（`*.spec.ts` のみ）

### 参考資料

- 実装の該当箇所: `apps/api/src/middleware/error-handler.ts`（notFoundHandler）/ `apps/web/src/lib/server-fetch/safe-fetch.ts`（`logServerFetchFailure`）/ `scripts/diagnose-profile-session.sh`（route 差分 case）
- redaction 仕様: `@ubm-hyogo/shared/logging` の `SENSITIVE_KEY_SUBSTRINGS`（`logging.spec.ts`）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | focused Vitest が全 PASS で landed 済にもかかわらず、T01（`hasAuthorization`/`hasSessionCookie`）/ T03（`routeNotFound`）/ T04（healthz×実 `/me` 軸・`parity_hint`）の診断フィールドが Phase-5 仕様の設計意図から乖離。親 Phase-12 の `unassigned-task-detection.md` は「current 0 件」と結論し、検証 Agent の片方は誤って `hasAuthorization`/`hasSessionCookie` が存在すると報告した |
| 原因 | (1) テストが実装追認: spec が実装の出力フィールド（`accept`/`userAgent` 等）を assert していたため、仕様フィールドの欠落をどのテストも検出しなかった（部分カバレッジ green の罠）。(2) Phase-12 未タスク検出がフィールドレベルで spec↔impl を照合せず「T01〜T04 で完結」と結論した。(3) 検証 Agent の一方が実 diff を読まず仕様記述を実装と取り違えて事実誤認（`hasAuthorization` が存在すると報告） |
| 対応 | 2 回検証の不一致（パス1=3件 / パス2=0件）を、`git diff` の実コードと Phase-5 task-01/03/04 の「改修方針」コードブロックを 1 行ずつ突き合わせる ground truth 照合で決着させた。3 件いずれも実装が仕様の改修前状態または別フィールドに留まることを確認。ユーザー判断で 3 件を同性質（観測性忠実度）として 1 件の follow-up に統合起票 |
| 再発防止（future-self への観点） | (1) テスト green は「仕様の充足」ではなく「実装の追認」のことがある。N/M green は定義済みケースの green であって仕様の全フィールド/全分岐カバーの証明ではない。(2) 検証 Agent が対立したら、仕様記述でも Agent 報告でもなく **実コード（`git diff`/該当ファイル）と仕様の改修方針コードブロックの 1 行照合**で決着させる。Agent は実 diff を読まず仕様を実装と取り違えることがある。(3) AC に紐づく診断フィールドは、フィールド名と「何を一意化するためのフィールドか」（意味論）の両方を仕様と突き合わせる。フィールドが存在しても意味論が違えば未タスク |

### 補足事項

本タスクは親ワークフロー T01/T03/T04 の観測性忠実度の整合であり、新規設計は不要（Phase-5 task-01/03/04 に動作する参照設計が存在する）。ユーザー向け復旧（T02 の apps/api 自動 CD + `/me` 200 smoke gate）は仕様準拠で landed 済のため、本タスクは即時の実害到達性が低く優先度は低。親ワークフロー dir は未タスク作成フロー後に completed-tasks へ移動されるため、本書のパス参照は移動後の現行パス（`docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/`）で記載している。GitHub Issue は起票後に番号を `issue_number` / `GitHub Issue` 欄へ反映する。commit / push / PR 作成はスコープ外（user-gated）。
