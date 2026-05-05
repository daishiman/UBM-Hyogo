# lessons-learned: 06b-B Profile Pending Banner Sticky 苦戦箇所（2026-05-04）

> 対象タスク: `docs/30-workflows/06b-b-profile-request-pending-banner-sticky/`
> 状態: `implemented-local` / implementation / `VISUAL_ON_EXECUTION` / Phase 11 `blocked_runtime_evidence`
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check}.md`
> 関連 workflow: 06b-B（親 self-service request UI） / 04b（admin queue 投入側） / 06b-A（`/me` session resolver） / 06b-C / 08b / 09a（authenticated runtime visual evidence 委譲先）

06b-B 親タスクから「pending banner の sticky 化」を分離して local 実装した follow-up。`GET /me/profile` レスポンスに `pendingRequests` を追加して reload 後も server-side pending state から banner を表示し、申請ボタンを disabled にする。次回の `/me` 系 read-extension / web mirror type 追加 / pending-state UI gating タスクで同じ判断を短時間で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-06B-B-PBS-001: storage source-of-truth は実装前に grep で確定する

**苦戦箇所**: 初期 draft では「pending リクエスト用テーブルを別途作る」placeholder を引きずっていたが、実コードは既に `admin_member_notes.request_status='pending'` を SoT として運用していた。SoT を grep で確定しないまま Phase 2/5 に進むと、storage contract 全体が実装と乖離し、Phase 12 で大きな書き換えが発生する。

**5分解決カード**: 新規 read-extension タスクは Phase 2/5 着手前に `apps/api/src/repository/` と既存 `note_type` / `request_status` 値を必ず grep し、placeholder スキーマを early-discard する。spec 文中の「storage SoT」行を Phase 12 までに 1 度書き換えた場合は、必ず resource-map / quick-reference / topic-map / artifact-inventory を同一 wave で同期する。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（Phase 2/5 storage SoT grep gate）, `references/database-admin-repository-boundary.md`（§04b member self-service queue の pending predicate）, `references/lessons-learned-issue-106-admin-notes-repository-2026-05.md`

## L-06B-B-PBS-002: wire error code と display vocabulary を分離する

**苦戦箇所**: `DUPLICATE_PENDING_REQUEST`（API wire code）と「もう申請を受け付け中です」のような自然言語 UI 文言が混ざり、自然語 lowercase（`duplicate-pending`）に drift して新 wire code が増殖する事故が起きた。新 code を増やすと client 側 narrow union が壊れる。

**5分解決カード**: 既存 wire code を再利用するルールを spec の最上段に書く。新規 code を作る前に `grep -r '"DUPLICATE_PENDING_REQUEST"' apps/api apps/web` で既存使用箇所を確認し、display 用語（人間文面）は `RequestPendingBanner` / `RequestErrorMessage` 側 i18n key として完全分離する。Phase 12 compliance check で「新 wire code 追加なし」を gate にする。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（wire code vs display vocabulary checklist）, `references/api-endpoints.md`（`/me/visibility-request` / `/me/delete-request` 行の 409 reuse 注記）, `references/lessons-learned-04b-member-self-service.md`

## L-06B-B-PBS-003: API response shape 変更時は `apps/web/src/lib/api/me-types.ts` mirror を必ず同 wave で更新する

**苦戦箇所**: `GET /me/profile` schema に `pendingRequests` を追加した直後、web 側 SSR は any cast で動いてしまい mirror 型 `apps/web/src/lib/api/me-types.ts` の更新が漏れた。型が割れていても build は通り、Phase 7/8 まで気づかない。

**5分解決カード**: spec の affected files に必ず `apps/web/src/lib/api/me-types.ts` を列挙する。実装時は API schema → web mirror の順で commit を分け、`apps/web/src/lib/api/me-types.test-d.ts` で shape match を type-level test として固定する。Phase 12 artifact-inventory の Web mirror 行 unfilled は compliance fail 扱いにする。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（Web/API mirror type checklist）, `references/architecture-implementation-patterns-core.md`（API contract mirror pattern）, `references/workflow-06b-b-profile-request-pending-banner-sticky-artifact-inventory.md`

## L-06B-B-PBS-004: `spec_created` のままコード/テストが存在する状態を Phase 12 で必ず再分類する

**苦戦箇所**: artifacts.json の lifecycle が `spec_created` のままコード・focused tests・mirror 型・Playwright spec が既に存在しており、indexes が「未着手」と「実装済み」で割れた状態が長く続いた。`implemented-local` への昇格漏れで quick-reference / resource-map / task-workflow-active が古い lifecycle を指したまま流通する。

**5分解決カード**: Phase 12 system-spec-update-summary で「コード/テストが merge 済 or local 実装済 → `implemented-local`」「authenticated runtime evidence 待ち → `VISUAL_ON_EXECUTION` / `blocked_runtime_evidence`」を必ず判定し、artifacts.json と indexes を同一 wave で書き換える。lifecycle 再分類は Phase 12 outputs の必須項目とする。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（lifecycle reclassification gate at Phase 12）, `references/task-workflow-active.md`（lifecycle column 規約）, `references/lessons-learned-06b-b-profile-self-service-request-ui-2026-05.md`

## L-06B-B-PBS-005: pending-only predicate を read model と duplicate guard で共有する

**苦戦箇所**: `GET /me/profile.pendingRequests` の read model と POST 側の duplicate 409 guard が別々の WHERE 句で書かれると、片方が `request_status='pending'` を、もう片方が `note_type` だけを見るような drift が発生し「banner は出ているのに 409 が返らない」または「409 は返るが banner が出ない」ケースが出る。

**5分解決カード**: pending 判定は `note_type IN ('visibility_request','delete_request')` AND `request_status='pending'` の単一 predicate に集約し、`apps/api/src/repository/adminNotes.ts` の関数 1 本（read model）と POST handler の preflight 双方が同じ関数を呼ぶ。spec 上では「pending predicate を共有関数に閉じる」を AC に明示し、Phase 12 compliance check で predicate の重複定義がないか grep する。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（pending-only read predicate sharing rule）, `references/database-admin-repository-boundary.md`, `references/api-endpoints.md`（`GET /me/profile.pendingRequests` と 409 duplicate guard が同 predicate を共有）

## 関連 artifact / 参照

- `references/workflow-06b-b-profile-request-pending-banner-sticky-artifact-inventory.md`（同 wave で個別更新）
- `references/workflow-06b-b-profile-self-service-request-ui-artifact-inventory.md`（親 06b-B）
- `references/api-endpoints.md`（`GET /me/profile.pendingRequests` 行 / 409 reuse 注記）
- `references/database-admin-repository-boundary.md`（§04b member self-service queue / pending predicate）
- `references/lessons-learned-04b-member-self-service.md`（admin queue 投入側）
- `references/lessons-learned-06b-b-profile-self-service-request-ui-2026-05.md`（親 06b-B）
- `LOGS/20260504-06b-b-profile-request-pending-banner-sticky-sync.md`
