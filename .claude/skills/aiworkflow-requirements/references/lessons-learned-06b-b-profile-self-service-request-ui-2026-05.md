# lessons-learned: 06b-B Profile Self-Service Request UI 苦戦箇所（2026-05-02）

> 対象タスク: `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/`
> 状態: `implemented-local` / implementation / `VISUAL_ON_EXECUTION` / runtime-evidence-blocked（logged-in visual evidence は 06b-C / 08b / 09a へ委譲）
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check}.md`
> 関連 workflow: 06b-A (`/me` API Auth.js session resolver) / 04b (member self-service queue) / 05b (auth-gate-state) / 06b-C (logged-in visual evidence) / 09a (staging smoke)

06b-B は `/profile` 画面に `RequestActionPanel` / `VisibilityRequestDialog` / `DeleteRequestDialog` を実装し、runtime cookie session 解決は 06b-A、本番 visual evidence は 06b-C / 08b / 09a に委譲した。次回の `/me` 系 self-service / browser proxy / authGateState UI gating タスクで同じ判断を短時間で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-06B-B-001: 重複申請は 409 + `SelfRequestError(code:'duplicate-pending')` で表現する

**苦戦箇所**: 04b で `admin_member_notes.request_status='pending'` 行が残っている間、`/me/visibility-request` / `/me/delete-request` の二重投入を「投入成功」「無言サイレント上書き」「500 internal」のどれにすべきか分岐しがちで、UI トースト文言と API contract が同 wave で噛み合わなくなる。

**5分解決カード**: backend は `request_status='pending'` を WHERE 条件に preflight して、存在時は `409 Conflict`（body は既存 `note_type` / `created_at` のみ）で返す。クライアント側 `me-requests-client` は `SelfRequestError(code:'duplicate-pending')` を throw し、`/profile` UI は「もう申請を受け付け中です。管理者が確認してから再度申請できます」と人間表現で reflect する。422（バリデーション）/ 401（未認証）/ 403（gate 非 active）と語彙を分離する。

**promoted-to**: `references/api-endpoints.md`（`/me/visibility-request` / `/me/delete-request` 行に 409 contract を追記）, `references/architecture-admin-api-client.md`, `references/lessons-learned-04b-member-self-service.md`

## L-06B-B-002: VisibilityRequest / DeleteRequest は `authGateState !== 'active'` で disabled

**苦戦箇所**: 05b で確定した 5 状態モデル（`active` / `pending_consent` / `rules_declined` / `delete_requested` / `deleted`）を `/profile` UI で再宣言したくなるが、UI 側で独自 enum を持つと 05b と語彙が割れて再申請可否の判断がずれる。

**5分解決カード**: UI は `/me` レスポンスの `authGateState` を読み取り、`active` のときだけ申請ボタンを enabled にする。`active` 以外（`rules_declined` / `delete_requested` / `deleted` / `pending_consent`）は disabled + tooltip で理由を出す。enum の正本は 05b 側 `references/auth-gate-state.md` に残し、06b-B 側は UI gating ルールのみ書く。

**promoted-to**: `references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`, `references/architecture-app-router.md`

## L-06B-B-003: BFF proxy は `apps/web/app/api/me/[...path]/route.ts` パススルーで memberId を path に出さない

**苦戦箇所**: `/api/me/visibility-request` を `/api/me/:memberId/visibility-request` に展開したくなるが、不変条件 #11（memberId は backend session で解決し path に出さない）と #5（D1 直接アクセスは `apps/api` に閉じる）に同時に違反するリスクがある。

**5分解決カード**: `apps/web/app/api/me/[...path]/route.ts` で `[...path]` をそのまま `apps/api` `/me/...` にプロキシし、Cookie / Authorization header だけ転送する。memberId は backend で session resolve（06b-A）から取り出す。Server Component 側でも fetch URL に member 識別子を含めない。

**promoted-to**: `references/architecture-bff-proxy.md`, `references/api-endpoints.md`（browser proxy 小節を新設）, `references/lessons-learned-06a-public-web-2026-04.md`

## L-06B-B-004: static-invariants S-04 に `<button type="submit">` 検出を追加して本文編集 UI 不在を構造保証する

**苦戦箇所**: 不変条件 #4（プロフィール本文は Google Form 再回答を本人更新の正式経路とし、`/profile` 上で textarea / form を作らない）は文面で書いても、画面追加で `<form>` / `<button type="submit">` が紛れ込むと grep ベースの S-04 invariant をすり抜ける。

**5分解決カード**: S-04 read-only invariant scanner に `apps/web/app/profile/**` 配下の `<button type="submit">` / `<form ` / `<textarea` 検出を追加し、許可リストは VisibilityRequest / DeleteRequest 申請ダイアログの button のみとする。dialog 内の submit は `confirm` action ラベルを必須化し、profile 本文編集との誤検出を避ける。

**promoted-to**: `references/static-invariants.md`, `references/lessons-learned-06c-admin-ui-2026-04.md`（L-06C-004 と pair で参照）

## L-06B-B-005: production runtime evidence は 06b-A session resolver evidence 待ちで Phase 11 placeholder を PASS と扱わない

**苦戦箇所**: 06b-B は UI 実装済みタスクだが、Phase 11 を「PASS」と書きたくなる。06b-A の cookie session resolver の staging smoke が未済の段階では、`/me/visibility-request` の end-to-end は production で確認できない。logged-in visual evidence も別 wave。

**5分解決カード**: Phase 11 には `main.md` と capture contract を置き、ステータスは `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` または `blocked_runtime_evidence` で固定する。「PASS」と表現しない。06b-A の session resolver staging evidence 完了後に 06b-C / 08b / 09a 側で logged-in visual evidence を取得し、boundary を明示してリンクする。

**promoted-to**: `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md`, `references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md`

## 関連 artifact / 参照

- `references/workflow-task-06b-b-profile-self-service-request-ui-artifact-inventory.md`（同 wave で個別更新）
- `references/api-endpoints.md` `/me/visibility-request` / `/me/delete-request` 行の 409 contract 追記
- `references/lessons-learned-04b-member-self-service.md`（admin queue 投入側の lessons）
- `references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md`（visual evidence 委譲先）
- `references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`（authGateState 5 状態正本）
- `LOGS/20260502-06b-b-profile-self-service-request-ui-sync.md`（本 wave の同期記録）
