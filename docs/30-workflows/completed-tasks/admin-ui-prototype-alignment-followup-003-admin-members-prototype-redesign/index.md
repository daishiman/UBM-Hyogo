---
workflow_id: admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-27
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: rewrite
parent_workflow: admin-ui-prototype-alignment
source_issue: null
source_issue_state: null
branch: feat/admin-members-prototype-redesign
base_branch: dev
---

# admin-ui-prototype-alignment-followup-003 — /admin/members プロトタイプ準拠再構成 + staging 404 復旧

> Branch: `feat/admin-members-prototype-redesign` / Base: `dev`
> 実装区分: **実装仕様書** (CONST_004 デフォルト)
> 状態: `implemented_local_evidence_captured`
> 作成日: 2026-05-27
> task type: `UI task` / `VISUAL_ON_EXECUTION`
> implementation_mode: `rewrite` (in-place / 既存4ファイル書き換え)
> 並列実行: Lane A〜D は独立。Phase 5 内で並列実行可

## 背景

staging (`https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/members`) で:

1. **404 fetch failure**: 画面が `admin api /admin/members failed: 404 / code ADMIN_FETCH_404` の section-error カードに degrade している（route 自体は描画されているが、データが空）
2. **UI/UX prototype 乖離**: 既存 `MembersTable` / `MembersFilters` / `MemberDrawer` がプロトタイプ正本 `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366 と視覚言語が大きく乖離している（avatar / zone-status chip / tag chip / 公開 Switch / edit pencil / Drawer の VISIBILITY+TAGS+FORM RESPONSE+DELETED 4セクション構成が未実装）

親 workflow `admin-ui-prototype-alignment` の Task A〜E は完了済（admin shell・dashboard・page header・attendance・visual baseline）。本 followup-003 は `/admin/members` 単体ページの **プロトタイプ視覚言語整合**と **fetch 404 根因復旧** を 1 サイクル内で完了させる。

## スコープ

### スコープ内

| 項目 | 内容 |
| --- | --- |
| 404 復旧 | staging `/admin/members` 404 根因切り分け＋最小修正（auth middleware notFound 経路 / `INTERNAL_API_BASE_URL` 解決 / `safeServerFetch` error 分類 のいずれかに帰着） |
| UI 再構成 | `MembersFilters` / `MembersTable` / `MemberDrawer` / `MembersClientShell` を**プロトタイプ準拠で in-place 書き換え**。既存 props は呼び出し側互換を保つ（page.tsx の変更は最小） |
| 共有 primitive 追加 | `_shared/` に `MemberAvatar`（hue 派生）, `MemberPublishSwitch`, `MemberStateChip`, `TagPill`, `PillNav`, `KVList`（既存活用）を整備 |
| Drawer 操作配線 | 公開 Switch → `PATCH /admin/members/:id/status`、論理削除 → `POST /admin/members/:id/delete`、復元 → 同 endpoint （既存 `useAdminMutation` 経由）。公開 Switch は table / drawer 共通 primitive として実装する |
| Playwright visual baseline | 4 viewport × 4 state（loaded / empty / error / drawer-open）= 16 PNG を staging-visual baseline として追加 |
| design token | HEX 直書き 0 件。`tokens.css` の既存 OKLch トークンのみ使用 |

### スコープ外（本サイクル内で対応しない）

| 項目 | 理由 |
| ---- | ---- |
| `/admin/members` API list response への `zone` / `tags` / `occupation` / `hue` 追加 | CLAUDE.md 不変条件 #1（既存 API のみ）/ 親 workflow invariant #1。**UI 側 adapter** で対応（hue は memberId hash、zone/occupation は Drawer detail fetch、tags は Drawer のみ表示で list 列からは除外） |
| `/admin/members` 一覧での tag chip 表示 | list response が tags を返さないため**今回非表示**。実装後 followup として list 拡張案を別 issue 化（Phase 12 で記載） |
| Drawer 内タグ編集の永続化（タグ pill 選択） | tags-queue endpoint の write surface 整備が別タスク。**UI のみ実装し toast で「未保存」扱い**にするか、disabled で出す。本仕様では disabled + tooltip 案を採用 |
| Avatar の画像ストレージ参照 | API list は photo URL を返さない。**initial+hue でレンダ**し、画像対応は後続 issue |
| 新規 API endpoint / D1 schema 変更 | CLAUDE.md 不変条件 #5 |
| 認証ロジック変更 | 404 の根因が auth middleware であった場合も、**response code を 401 に整流するのみ**で auth 仕様自体は変更しない |
| `/admin/members` 以外の admin route | 別 followup で扱う |

## 不変条件（本ワークフロー固有）

1. **既存 API のみ接続**: `apps/api/src/routes/admin/{members,member-status,member-delete,member-notes,member-notification-pref}.ts` の現行 endpoint surface のみ。新 endpoint・schema 変更禁止。
2. **OKLch トークン正本**: `apps/web/src/styles/tokens.css` 既存トークンのみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。CI gate `verify-design-tokens` で fail 判定。
3. **プロトタイプ正本順位**: `docs/00-getting-started-manual/claude-design-prototype/{pages-admin.jsx, primitives.jsx, styles.css}` の primitive + token + spacing をデザイン言語の正本とする。
4. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止 (CLAUDE.md #5)。
5. **FormField 経由必須**: admin form input は `FormField` 経由 (CLAUDE.md #9)。Drawer 内 input/textarea/select も `FormField` 経由。
6. **useAdminMutation 経由必須**: Drawer の Switch / 削除 / 復元 mutation は `@/features/admin/hooks/useAdminMutation` のみ (CLAUDE.md #10)。
7. **テスト命名**: `*.spec.{ts,tsx}` のみ (CLAUDE.md #8)。`*.test.*` は CI で reject。
8. **error boundary 方針**: 親 workflow の `AdminSectionErrorClient` を継続採用（per-section degrade + retry CTA）。本 followup で boundary 戦略は変更しない。
9. **in-place rewrite**: 既存 `_members/*.tsx` を**書き換え**る。新規 `V2` ファイル並走禁止（呼び出し側 page.tsx の互換維持で吸収）。
10. **CONST_007**: 1 サイクル内で全 Lane A〜D 完了が原則。「分量が多い」「念のため切り出し」は禁止。

## 正本順位（衝突時）

1. このワークフローの `phase-1-requirements.md` / `phase-2-design.md`
2. 親 workflow `docs/30-workflows/admin-ui-prototype-alignment/{phase-1,2}.md`
3. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
4. `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
5. プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/`)
6. `apps/web/src/styles/tokens.css`

## Phase 一覧

| Phase | File | 内容 |
| ----- | ---- | ---- |
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 (AC・スコープ・不変条件・404 根因仮説) |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 (UI ツリー・コンポーネント表・404 復旧戦略・data adapter) |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー (gate) |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 (vitest + Playwright マトリクス) |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 (Lane A: 404 fix / B: shared primitive / C: members in-place rewrite / D: util) |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充 (a11y / role assertion / mutation flow) |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認 (`pnpm test:coverage:changed`) |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ (重複削除・dead export 除去) |
| 9 | [phase-9-qa.md](phase-9-qa.md) | 品質保証 (typecheck / lint / build / verify-design-tokens) |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト + Playwright visual capture |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント更新 (strict 7 outputs) |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 明示承認後） |

## 変更対象ファイル（overview）

### 新規

- `apps/web/src/features/admin/components/_members/MemberAvatar.tsx`（hue 派生）
- `apps/web/src/features/admin/components/_members/MemberStateChip.tsx`
- `apps/web/src/features/admin/components/_members/MemberPublishSwitch.tsx`
- `apps/web/src/features/admin/components/_shared/TagPill.tsx`
- `apps/web/src/features/admin/components/_shared/PillNav.tsx`
- `apps/web/src/lib/admin/member-hue.ts`（pure util: memberId hash → 0..7）
- 上記すべての `*.spec.tsx` / `*.spec.ts`
- `apps/web/tests/playwright/admin-members-visual.spec.ts`（4 viewport × 4 state）

### 修正（in-place rewrite）

- `apps/web/src/features/admin/components/_members/MembersClientShell.tsx`
- `apps/web/src/features/admin/components/_members/MembersTable.tsx`
- `apps/web/src/features/admin/components/_members/MembersFilters.tsx`
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`
- `apps/web/src/features/admin/components/_members/BulkActionBar.tsx`（必要に応じて軽微）
- `apps/web/app/(admin)/admin/members/page.tsx`（page-head 文言整合・description 表現の見直しのみ）
- 404 復旧確定箇所のうち 1 ファイル（Phase 2 で決定。候補: `apps/api/src/routes/admin/_shared.ts` / `apps/api/src/index.ts` / `apps/web/src/lib/admin/server-fetch.ts` / `apps/web/src/lib/server-fetch/safe-fetch.ts`）
- `apps/web/src/features/admin/components/_shared/index.ts`（barrel に TagPill / PillNav 追加）

### 影響範囲（変更禁止だが参照する）

- `apps/web/src/components/ui/{Avatar,Switch,Chip,Drawer,KVList,Button,Card}.tsx`（流用のみ）
- `apps/web/src/styles/tokens.css`（参照のみ・既存トークンで充足）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（Drawer mutation で利用）
- `@ubm-hyogo/shared` の `AdminMemberListView` / `AdminMemberDetailView` 型（list shape は変更しない）

## 完了条件（DoD overview）

1. staging `/admin/members` が認証済 cookie 経由で 200 を返し、データを描画する（section-error は disable 状態などの正常分岐のみ）
2. プロトタイプ `pages-admin.jsx` L162-366 と視覚的に整合（Phase 11 で 4 viewport × 4 state = 16 PNG が parity check 済）
3. `pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm --filter @ubm-hyogo/web test` 全 PASS
4. `verify-design-tokens` (CI gate) PASS（HEX 直書き 0 件）
5. `gate-metadata:validate` ERROR=0、`verify:phase12-compliance` PASS
6. Phase 12 strict 7 成果物（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）が揃う
7. `outputs/phase-11/screenshots/` 配下に 16 PNG（loaded / empty / published / hidden × mobile / tablet / laptop / desktop）と `screenshot-inventory.json`

## 関連タスク

| Task | 状態 | 関連性 |
| ---- | ---- | ------ |
| `docs/30-workflows/admin-ui-prototype-alignment/` | implemented_local_runtime_pending | 親 workflow（admin shell・dashboard・page header・attendance・visual baseline） |
| `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/` | completed | `AdminSectionErrorClient` retry CTA を本ページが採用 |
| `docs/30-workflows/completed-tasks/members-page-prototype-alignment/` | completed | `/(public)/members` の公開層整合（admin と primitive を共有する一部 token） |
| `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/` | completed | members 公開層の visual baseline。本タスクは admin 層を同 baseline 形式で追加 |
| `docs/30-workflows/completed-tasks/06c-B-admin-members/` | completed | 旧 admin members 初期実装（参考） |

## メモ

- 本ワークフローはコード実装を含む（**実装区分: 実装仕様書**）。docs-only 例外なし。
- commit / push / PR / staging deploy / Playwright baseline の bot push 後の空 commit はすべて **user-gated**。本仕様書本文は実行手順を定義するのみ。
- ローカル実装では 404 根因となる API / D1 変更は行わず、既存同一 origin proxy + mock API で `/admin/members` 200 描画を確認した。staging cookie ありの実走確認は deploy 後 user-gated。
